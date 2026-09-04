import { Git, git } from '@roka/git'
import { parseArgs } from '@std/cli/parse-args'
import { IniMap } from '@std/ini/ini-map'
import { buildDataset,
         importDataset,
         isDatasetFresh } from './build.ts'
import { Dataset, Updates } from './dataset.ts'
import { DataPaths,
         Paths,
         byNumericLowest,
         entityTypeFromFileName,
         existsFileSync,
         firstCommit,
         reviveNode } from './shared.ts'

const helpMessage = `
Usage:
  deno task manage <subcommand> [arguments]

Manage the contents of the redpanda-lineage flat file database. Each of the
subcommands may generate a commit to the redpanda-lineage current branch.

Subcommands:
  --deduplicate-photo-uris
        Alert to, and remove, any references to photo URLs that appear twice.
        When resolving duplicates, photo tag lists are merged, and the oldest
        commitdate takes precedence.
  --remove-author <author> [commitish]
        Remove all photos by this author from the dataset. With [commitish],
        only remove photos that were added by in that specific Git commit.
  --remove-duplicate <path> <index>
        Remove the photo <index> from .txt <path>, and delete the referenced
        file from the image_hosting_server defineed in 'contributions.conf'.
  --remove-photo <path> <index>
        Remove the photo <index> from .txt <path>, but keep the photo file.
  --restore-author <author> [commitish]
        Restore all references to <author>'s removed photos, sorted by the
        "photo hash" of the photo file name. With [commitish], only restore
        <author>'s photos removed in that specific Git commit.
  --sort-entities
        Sort image locators, and other keys, for any .txt file in the dataset.
        For images locators, use the "timestamp hash" in each photo URL and
        sort them in order of oldest-published to newest-published.
  --sort-updates
        Sort image locators for all .txt files changed in the last week.
`

interface PhotoAndPath extends Photo {
  _id: number | string,
  index: number,
  path: string
}

/**
 * When an author's photos are removed (or restored) to redpandafinder, the
 * commit message follows a standard format.
 * 
 * When restoring photos, one of your options for determining which commit to
 * restore data from, is finding the commit corresponding to a
 * _remove all photos for -author-_ message, formatted as per this function.
 */
function commitMessageForAuthor(
  mode: "remove" | "restore",
  author: string,
  commit?: string
) {
  // For finding a message in the git logs where we don't know the commit
  // ahead of time, return just the start of the message
  const message = (!commit)
    ? `[author] ${mode} photos for ${author}`
    : `[author] ${mode} photos for ${author} from commit: ${commit}`
  switch(mode) {
    case "remove":
    case "restore":
      return message
    default:
      throw new Error(`[manage] author-related commit messages are one of: remove, restore`)
  }
}

/**
 * Using the `contributions.conf` configuration for where RPF hosts its files,
 * log into that system over SSH and delete duplicate photos from a single
 * entity file (media/panda/wild/zoo).
 */
function deletePhotosFromServer(photoFilenames: string[]) {
  if (!photoFilenames || photoFilenames.length == 0) return   // no-op
  const ini = new IniMap({assignment: ": "})
  const input = Deno.readTextFileSync(Paths.contributions)
  const config =
    ini.parse(input).toObject() as Record<string, Record<string, string>>
  const server = config.submissions.image_hosting_server
  const imageFolder = config.submissions.image_hosting_server_folder
  const userAccount = config.submissions.image_hosting_user
  const filesToRemove = photoFilenames.map(file => `${imageFolder}/${file}`)
  const args = [
    `${userAccount}@${server}`,
    "rm"
  ].concat(filesToRemove)
  const sshCommand = new Deno.Command("/usr/bin/ssh", {
    "args": args,
    "stdout": "piped",
    "stderr": "piped"
  })
  const runStatus = sshCommand.outputSync().code
  if (runStatus != 0)
    console.log(`[manage] WARN: problem: ssh ${args.join(" ")}`)
}

/** 
 * Return the commit hash corresponding to a given message. Since the commit
 * messages we are looking for refer to other commit hashes (which we might
 * not know yet), do a prefix-match rather than a full equals-match.
 */
async function findCommitWithMessage(repo: Git, message: string) {
  const commit = (await repo.commit.log())
    .filter(commit => commit.subject.startsWith(message))
    .shift()   // Off the top of the stack
  if (commit)
    return commit.hash
}

/** Remove all photos committed by a particular author */
async function removeAuthorFromLineage(dataset: Dataset, author: string) {
  // Only links entities are incapable of having photos
  const entities = dataset.graph.vertices.filter(vertex => vertex.type != "links")
  // Collect all photo URLs and record each .txt file path and photo index
  // where they are found
  const idToPhotos: Record<string | number, PhotoAndPath[]> = {}
  entities
    .filter(vertex => vertex.photos && vertex.photos.length > 0)
    .flatMap(vertex => vertex.photos.map((photo: PhotoAndPath, index: number) => {
      photo._id = vertex._id
      photo.index = index
      photo.path = vertex.path
      return photo
    }))
    .filter(photo => photo.author == author)
    .forEach(photo => {
      if (!(photo._id in idToPhotos))
        idToPhotos[photo._id] = [photo]
      else
        idToPhotos[photo._id].push(photo)
    })
  let removedPhotos: string[] = []
  Object.keys(idToPhotos).forEach(id => {
    const path = idToPhotos[id][0].path
    // Natural indexes, not array indexes
    const indexes = idToPhotos[id].map(photo => photo.index + 1)
    const removedForThisEntity = removePhotosFromEntity(dataset, path, indexes)
    removedPhotos = removedPhotos.concat(removedForThisEntity)
  })
  // Do a git commit tracking the author removal. This is the checkpoint if we
  // decide to restore the photos at a later point.
  const repo = git()
  const hash = (await repo.commit.head()).short
  repo.commit.create({
    all: true, 
    subject: commitMessageForAuthor("remove", author, hash)
  })
  console.log(`[manage]: ${removedPhotos.length} removed for author: ${author}`)
  return removedPhotos.length
}

/**
 * When removing duplicate photos from the server, only do one input photo at a
 * time, to prevent any events that are difficult to audit or recover from. If
 * an entity has multiple duplicates of the same photo, this can still return a
 * list of photos to remove.
 */
function removePhotoFromEntity(dataset: Dataset, path: string, index: any) {
  return removePhotosFromEntity(dataset, path, [index])
}

/** 
 * Given a file path and a photo index ID, remove the photo and renumber all
 * photos inside the file. Determine which of the argument inputs are valid
 * photo indices, and then delete them from highest-index to lowest-index, so
 * that deleting the higher indexes doesn't cause the lower ones to be shifted.
 * 
 * Returns a map of _id to the list of photo indexes that were removed, in case
 * we want to not just remove these photos from our listing, but also wish to
 * delete them from the server they're stored on.
 */
function removePhotosFromEntity(
  dataset: Dataset,
  path: string,
  indexes: any[]
): string[] {
  if (!existsFileSync(path))
    throw new Error(`[manage] ${path}: file doesn't exist`)
  const targetIndices: number[] = indexes.map((index: any) => {
    if (isNaN(parseInt(index)) || index < 1)
      throw new Error(`[manage] index ${index}: must be a natural number.`)
    else
      return index
  })
  .map((index: number) => index - 1)   // Array indexing instead of natural number
  .sort((a: number, b: number) => b - a)   // Highest to lowest
  // Open the file with an ini mapper. The section is the file type, and the _id
  // value is going to be the value in the graph (times -1 if a zoo).
  const ingest = dataset.ingest(path, reviveNode)
  const type = Object.keys(ingest)[0] as NodeType
  const node = ingest[type] as GraphNode
  const entity = dataset.processNode(path, node, type)
  if (!("photos" in entity))
    throw new Error(`[manage] ERR: ${path}: no photos to remove`)
  // Remove photos by index if they are present in the photos list
  let removedPhotos: Photo[] = []
  const removedIndices = targetIndices
    .filter(index => index > -1 && index < entity.photos.length)
  // Remove photos from the entity, and put them in a list so we can get the
  // filenames for later deletion if we want.
  removedIndices.forEach(index =>
    removedPhotos = removedPhotos.concat(entity.photos.splice(index, 1)))
  // Rewrite the file to disk
  dataset.writeEntityToDisk(entity)
  // Return the list of entities removed
  const removedPerId: Record<string, number[]> = {}
  removedPerId[entity._id] = removedIndices.sort()
  // Natural numbers for the indexes in the files
  const displayIndices = removedIndices.map((index: number) => index + 1)
  console.log(
    `[manage] ${entity._id}: removed photos: ` +
    `${displayIndices.sort(byNumericLowest).join(", ")}`
  )
  // HACK: Only works with cwdc:// URLs with the protocol removed
  return removedPhotos
    .map(photo => photo.url)
    .filter(url => url.startsWith("cwdc://"))
    .map(url => url.replace("cwdc://", ""))
}

/**
 * If a file has the same photo URI multiple times, make a new photo entry with
 * a union of the tags for each one, and the earlier commitdate. We track
 * duplicates across the entire dataset now, but if a photos is in two or more
 * distinct entity files, it will require manual review.
 */
function resolveDuplicatePhotoUris(dataset: Dataset): number {
  let removedDuplicatesCount = 0
  const urlToPhotos: Record<string, PhotoAndPath[]> = {}
  const idToVertex: Record<number | string, any> = {}
  // Only links entities are incapable of having photos
  const entities = dataset.graph.vertices.filter(vertex => vertex.type != "links")
  // Lookup list for vertexes by id, for writing these entities back to disk
  entities.map(vertex => idToVertex[vertex._id] = vertex)
  // Collect all photo URLs and record each .txt file path and photo index
  // where they are found
  entities
    .filter(vertex => vertex.photos && vertex.photos.length > 0)
    .flatMap(vertex => vertex.photos.map((photo: PhotoAndPath, index: number) => {
      photo._id = vertex._id
      photo.index = index
      photo.path = vertex.path
      return photo
    }))
    .map((photo: PhotoAndPath) => {
      if (photo.url in urlToPhotos)
        urlToPhotos[photo.url].push(photo)
      else
        urlToPhotos[photo.url] = [photo]
    })
  // If a given url has multiple photo definitions, urlToPhotos[url] will point
  // at multiple items. Delete anything that points at single items
  Object.keys(urlToPhotos)
    .filter(url => urlToPhotos[url] && urlToPhotos[url].length == 1)
    .forEach(url => delete urlToPhotos[url])
  // Now urlToPhotos points at any photo that is a duplicate
  Object.keys(urlToPhotos).forEach(url => {
    const dupes = urlToPhotos[url]
    const tagList = [...new Set(dupes.flatMap(photo => photo.tags).sort())]
    const pathList = [...new Set(dupes.map(photo => photo.path).sort())]
    if (pathList.length > 1) {
      console.log(
        `[manage] WARN: manually review: multiple paths for photo: ${url}\n` +
        pathList.map(path => `\t${path}`).join("\n")
      )
    } else {
      // Find the lowest index and update the photo info
      const duplicateIndexes = dupes.map(photo => photo.index).sort()
      const newIndex = duplicateIndexes.shift() as number
      const resolvedPhoto =
        dupes.filter(photo => photo.index == newIndex).pop() as PhotoAndPath
      const entityId = resolvedPhoto._id
      // Pick the lowest commitdate for the duplicate photo
      resolvedPhoto.commitdate = dupes
        .map(photo => photo.commitdate)
        .reduce((earliestDate: string, commitDate: string) => {
          const earliestTime = new Date(earliestDate).getTime()
          const commitTime = new Date(commitDate).getTime()
          return (commitTime < earliestTime)
            ? commitDate : earliestDate
        }, "9999/9/9")
      // Unify the tags for all the photos we deduplicated
      resolvedPhoto.tags = tagList
      // Delete the photo entries not matching this index
      const entity = idToVertex[entityId]
      duplicateIndexes.forEach(index => entity.photos.splice(index, 1))
      // Take the updated entity and put it back on disk
      dataset.writeEntityToDisk(entity)
      // Clear out the ini map in case we need to use it again for processing
      dataset.ini.clear()
      // Increment the duplicated count
      removedDuplicatesCount = removedDuplicatesCount + duplicateIndexes.length
      console.log(
        `[manage]: ${entityId}: ${url} resolved to single index: ${newIndex}\n` +
        `\tRemoved indexes: ${duplicateIndexes.join(', ')}\n`
      )
    }
  })
  console.log(
    `[manage] ${removedDuplicatesCount} auto-resolved ` +
    `out of ${Object.keys(urlToPhotos).length} duplicates.`
  )
  return removedDuplicatesCount
}

/** 
 * Given an author string (and a commit), find all removed photos attributed to
 * the author, and restore them to _redpanda-lineage_ data.
 * 
 * If the commit is not provided, find the most recent `commitMessageForAuthor`
 * message in the commit history, and use that as the commitish.
 */
async function restoreAuthorToLineage(dataset: Dataset, author: string, commitish?: any) {
  const repo = git()
  if (typeof commitish !== "string")
    commitish = undefined
  const removeCommitish = commitish ?? 
    await findCommitWithMessage(repo, commitMessageForAuthor("remove", author))
  if (!removeCommitish)
    throw new Error(`[manage] no commit found with removed photos for: ${author}`)
  const restoreCommitish =
    await findCommitWithMessage(repo, commitMessageForAuthor("restore", author))
  // If a restore commit exists, make sure it didn't occur after the existing
  // removal commit. If it did, restoring this author's data is a no-op.
  if (restoreCommitish) {
    const log = await repo.commit.log({from: removeCommitish, to: restoreCommitish})
    if (log.length != 0)
      throw new Error(`[manage] restore commit ${restoreCommitish} already exists`)
    else
      console.debug(
        `[manage] restore ${restoreCommitish} predates removal ${removeCommitish}`)
  }
  // OK, we have a removal commit. Get all the photos out of it and restore
  const removalCommit = await repo.commit.get(removeCommitish)
  const startCommitish = (removalCommit)
    ? removalCommit.parents?.shift() ?? firstCommit
    : firstCommit
  if (startCommitish == firstCommit)
    throw new Error(`[manage] removal commit ${removeCommitish} has no parent`)
  const startCommit = await repo.commit.get(startCommitish)
  const endCommit = await repo.commit.get("HEAD")
  const patches = await repo.diff.patch({
    from: startCommit, to: endCommit, path: DataPaths})
  // Don't care about patches without content or pointing at removed files
  const dataPatches = patches
    .filter(change => change.path.endsWith(".txt"))
    .filter(change => change.stats && change.stats.deleted > 0)
    .filter(change => existsFileSync(change.path))
  const patchPaths = dataPatches.map(change => change.path)
  const updatedPatchPaths: string[] = []
  let updatedPhotoCounts = 0
  for (const change of dataPatches) {
    // Read latest entity from disk, rather than from the dataset
    const ingest = dataset.ingest(change.path, reviveNode) as GraphNode
    const type = Object.keys(ingest)[0] as NodeType
    const node = ingest[type] as GraphNode
    const entity = dataset.processNode(change.path, node, type)
    // Hunks are just changed text between the start and end commit. Hunks may
    // not map to a specific photo, so process the hunks into per-photo objects
    // that (with minor enrichment from the dataset) can be turned into
    // PhotoEntry objects.
    const indexToPhoto: Record<string, PhotoAndPath> = {}
    change.hunks && change.hunks.forEach(hunk => {
      hunk.lines
        .filter(line => line.type == "deleted")
        .map(line => line.content)
        .filter(raw => raw.match(/^photo\.\d+/))
        .map(raw => raw.trim())
        .forEach(raw => {
          // Let's pray: no colon-space outside of the delimiter
          const [key, value] = raw.split(": ")
          const index = key.split(".")[1]
          if (!(index in indexToPhoto))
            indexToPhoto[index] = <PhotoAndPath>{}
          indexToPhoto[index]._id = entity._id
          indexToPhoto[index].index = parseInt(index)
          switch(key.split(".")[2]) {
            case undefined:
              indexToPhoto[index].url = value
              break
            case "author":
              indexToPhoto[index].author = value
              break
            case "commitdate":
              indexToPhoto[index].commitdate = value
              break
            case "link":
              indexToPhoto[index].source = value
              break
            case "tags": {
              if (entity.type == "media") {
                indexToPhoto[index].locations = {}
                entity["panda.tags"].forEach((pandaId: string) => {
                  const field = `photo.${index}.tags.${pandaId}.location`
                  //@ts-ignore how to better guarantee this
                  const coordinates = value.split(", ") as [number, number]
                  if (key == field)
                    indexToPhoto[index].locations[pandaId] = coordinates
                })
              } else {
                indexToPhoto[index].tags = value.split(", ")
              }
              break
            }
          }
        })
    })
    // Add the existing photos back to the entity, and render it back to disk
    Object.keys(indexToPhoto).map(index => {
      entity.photos.push(indexToPhoto[index])
    })
    const input = Deno.readTextFileSync(change.path)
    const output = dataset.writeEntityToDisk(entity)
    if (input != output) {
      updatedPatchPaths.push(change.path)
      updatedPhotoCounts = updatedPhotoCounts + Object.keys(indexToPhoto).length
    }
  }
  console.log(
    `[manage] author ${author}: restored ${updatedPhotoCounts} photos across ` +
    `${updatedPatchPaths.length}/${patchPaths.length} changed files`
  )
  return updatedPatchPaths.length
}

/**
 * Sorting image locators is just a matter of tracking changes to text files,
 * and making sure they get reserialized to reorder the photo indexes.
 * 
 * Use the same time window as the Updates object uses (one week). We need to
 * build the dataset every time the manage tools are run, so you can't rely on
 * `dataset.commit` for anything other than freshness of the dataset.
 */
async function sortEntities(dataset: Dataset, mode: "all" | "updates"): Promise<number> {
  const repo = git()
  const currentCommit = await repo.commit.get("HEAD")
  const previousCommit = (mode == "all")
    ? await repo.commit.get(firstCommit)
    : await new Updates().startingCommit(repo)
  const patches = await repo.diff.patch({
    from: previousCommit, to: currentCommit, path: DataPaths})
  // If any unique `.txt` files get resorted, rebuild the dataset 
  const pathsUpdated = patches
    .map(change => change.path)
    .filter((value: string, index: number, array: string[]) =>
      array.indexOf(value) === index)
    .filter(path => path.endsWith(".txt"))
  if (pathsUpdated.length == 0) {
    console.log(`[manage] No dataset files were updated, so none sorted.\n`)
    return 0   // No changes needed
  }
  const pathsResorted: string[] = []
  pathsUpdated.forEach(path => {
    // Open the file with an ini mapper. The section is the file type, and the
    // _id value is going to be the value in the graph (times -1 if a zoo).
    const ingest = dataset.ingest(path, reviveNode)
    const type = Object.keys(ingest)[0] as NodeType
    const node = ingest[type] as GraphNode
    const entity = dataset.processNode(path, node, type)
    // Take the updated entity and put it back on disk
    const input = Deno.readTextFileSync(path)
    const output = dataset.writeEntityToDisk(entity)
    if (input != output)
      pathsResorted.push(path)
  })
  if (pathsResorted.length > 0)
    console.log(
      `[manage] ${pathsResorted.length}/${pathsUpdated.length} updated dataset(s) needed sorting:\n` +
      pathsResorted.map(path => `\t${path}`).join("\n")
    )
  else
    console.log(`[manage] No updated dataset files required sorting.\n`)
  return pathsResorted.length
}

/** 
 * `deno task` runs this script relative from the root of the
 * `redpanda-lineage` project source code, where `deno.json` is found.
 */
if (import.meta.main) {
  // TODO: check CLI arguments with options that enforce data types
  const { _: args, ...flags } = parseArgs(Deno.args, {
    boolean: ["deduplicate-photo-uris", "sort-all", "sort-updates"],
    string: ["remove-author", "remove-duplicate", "remove-photo", "restore-author"]
  })
  // If no arguments, don't try and build the dataset
  if (Deno.args.length == 0) {
    console.log(helpMessage)
    Deno.exit(0)
  }
  // Either build a new dataset, or import an existing one
  const fresh = await isDatasetFresh()
  const dataset = (fresh == true)
    ? importDataset()
    : await buildDataset(false, false)
  /* 
   * Now we can assume `export/redpanda.json` exactly represents the underlying
   * data, and our other checks can make decisions about processing entirely on
   * the JSON file, rather than reading all the `.txt` files one by one.
   * 
   * Since switch cases are all one scope, you can't redeclare const in these,
   * so I just avoid variable definitions.
   */
  switch (true) {
    case (flags["deduplicate-photo-uris"] == true):
      if (resolveDuplicatePhotoUris(dataset) > 0)
        await buildDataset(true, true)   // build and commit if the dataset changed
      break
    case (typeof flags["remove-author"] === "string"):
      if (await removeAuthorFromLineage(dataset, flags["remove-author"]) > 0)
        await buildDataset(true, true)   // build and commit again if photos were removed
      break
    case (typeof flags["remove-duplicate"] === "string"):
      const removed =
        removePhotoFromEntity(dataset, flags["remove-duplicate"], args[0])
      deletePhotosFromServer(removed)
      if (removed.length > 0)
        await buildDataset(true, true)   // build and commit again if photos were removed
      break
    case (typeof flags["remove-photo"] === "string"):
      removePhotosFromEntity(dataset, flags["remove-photo"], args)
      await buildDataset(true, true)   // ready to publish
      break
    case (typeof flags["restore-author"] === "string"): {
      if (await restoreAuthorToLineage(dataset, flags["restore-author"], args[0]) > 0)
        await buildDataset(true, true)   // build and commit again if photos were restored
      break
    }
    case (flags["sort-all"] == true):
      if (await sortEntities(dataset, "all") > 0)
        await buildDataset(true, true)   // ready to publish
      break
    case (flags["sort-updates"] == true):
      if (await sortEntities(dataset, "updates") > 0)
        await buildDataset(true, true)   // ready to publish
      break
    default:
      console.log(helpMessage)
      Deno.exit(1)
  }
}

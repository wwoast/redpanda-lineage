import { git } from '@roka/git'
import { parseArgs } from '@std/cli/parse-args'
import { IniMap } from '@std/ini/ini-map'
import { buildDataset,
         importDataset,
         isDatasetFresh } from './build.ts'
import { Dataset, Updates } from './dataset.ts'
import { Paths,
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
/**
 * Using the `contributions.conf` configuration for where RPF hosts its files,
 * log into that system over SSH and delete duplicate photos from a single
 * entity file (media/panda/wild/zoo).
 */
function deletePhotosFromServer(photoFilenames: string[]) {
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
 * When removing duplicate photos from the server, only do one input photo at a
 * time, to prevent any events that are difficult to audit or recover from. If
 * an entity has multiple duplicates of the same photo, this can still return a
 * list of photos to remove.
 */
function removePhotoFromEntity(
  dataset: Dataset,
  path: string,
  index: any
) {
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
  const removedPhotos: Photo[] = []
  const removedIndices = targetIndices
    .filter(index => index > -1 && index < entity.photos.length)
  // Remove photos from the entity, and put them in a list so we can get the
  // filenames for later deletion if we want.
  removedIndices.forEach(index =>
    removedPhotos.push(entity.photos.splice(index, 1)))
  // Rewrite the file to disk
  dataset.writeEntityToDisk(entity)
  // Return the list of entities removed
  const removedPerId: Record<string, number[]> = {}
  removedPerId[entity._id] = removedIndices.sort()
  // Natural numbers for the indexes in the files
  const displayIndices = removedIndices.map((index: number) => index + 1)
  console.log(`[manage] ${entity._id}: removed photos: ${displayIndices.sort().join(", ")}`)
  return removedPhotos.map(photo => photo.url)
}


/**
 * If a file has the same photo URI multiple times, make a new photo entry with
 * a union of the tags for each one, and the earlier commitdate. We track
 * duplicates across the entire dataset now, but if a photos is in two or more
 * distinct entity files, it will require manual review.
 */
function resolveDuplicatePhotoUris(dataset: Dataset): number {
  interface PhotoAndPath extends Photo {
    _id: number | string,
    index: number,
    path: string
  }
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
    from: previousCommit,
    to: currentCommit,
    path: [Paths.links, Paths.media, Paths.pandas, Paths.wilds, Paths.zoos]
  })
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
      // removeAuthorFromLineage(flags["remove-author"])
      break
    case (typeof flags["remove-duplicate"] === "string"):
      const removed = removePhotoFromEntity(dataset, flags["remove-duplicate"], args[0])
      deletePhotosFromServer(removed)
      break
    case (typeof flags["remove-photo"] === "string"):
      removePhotosFromEntity(dataset, flags["remove-photo"], args)
      await buildDataset(true, true)   // ready to publish
      break
    case (typeof flags["restore-author"] === "string"): {
      // restoreAuthorToLineage(flags["restore-author"], args[0])
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

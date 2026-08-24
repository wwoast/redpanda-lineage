import { git } from '@roka/git'
import { parseArgs } from '@std/cli/parse-args'
import { join } from '@std/path'
import { buildDataset,
         importDataset,
         isDatasetFresh } from './build.ts'
import { Dataset } from './dataset.ts'
import { Paths,
         existsFileSync,
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
  --sort-image-updates
        Sort image locators for all .txt files changed since the last commit.
        Use photo names with a "timestamp hash" and sort them in order of
        oldest-published to newest-published.
`

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
function removePhotoFromEntity(
  dataset: Dataset,
  path: string,
  indexes: any[]
): Record<string, number[]> {
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
  const removedIndices = targetIndices
    .filter(index => index > -1 && index < entity.photos.length)
  removedIndices.forEach(index => entity.photos.splice(index, 1))
  // Rewrite the file to disk
  dataset.writeEntityToDisk(entity)
  // Return the list of entities removed
  const removedPerId: Record<string, number[]> = {}
  removedPerId[entity._id] = removedIndices.sort()
  // Natural numbers for the indexes in the files
  const displayIndices = removedIndices.map((index: number) => index + 1)
  console.log(`[manage] ${entity._id}: removed photos: ${displayIndices.sort().join(", ")}`)
  return removedPerId
}


/**
 * If a file has the same photo URI multiple times, make a new photo entry with
 * a union of the tags for each one, and the earlier commitdate. We track
 * duplicates across the entire dataset now, but if a photos is in two or more
 * distinct entity files
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
        pathList.map(path => `\t${path}`).join("\n") + "\n"
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
 */
async function sortImageUpdates(dataset: Dataset): number {
  const repo = git()
  const currentCommit = await repo.commit.get("HEAD")
  const datasetCommit = await repo.commit.get(dataset.commit)
  const patches = await repo.diff.patch({
    from: datasetCommit,
    to: currentCommit,
    path: [Paths.links, Paths.media, Paths.pandas, Paths.wilds, Paths.zoos]
  })
  // If any `.txt` files in the patch set, the dataset should be rebuilt 
  const pathsUpdated = patches
    .map(change => join(repo.path(), change.path))
    .filter(path => path.endsWith(".txt"))
  if (pathsUpdated.length == 0) {
    console.log(`[manage] No dataset files were updated, so none sorted.\n`)
    return 0   // No changes needed
  }
  const pathsResorted: string[] = []
  pathsUpdated.forEach(path => {
    const input = Deno.readTextFileSync(path)
    // Open the file with an ini mapper. The section is the file type, and the
    // _id value is going to be the value in the graph (times -1 if a zoo).
    const ingest = dataset.ingest(path, reviveNode)
    const type = Object.keys(ingest)[0] as NodeType
    const node = ingest[type] as GraphNode
    const entity = dataset.processNode(path, node, type)
    // Take the updated entity and put it back on disk
    const output = dataset.writeEntityToDisk(entity)
    if (input != output)
      pathsResorted.push(path)
  })
  console.log(
    `[manage] ${pathsResorted.length}/${pathsUpdated.length} updated files needed key sort:\n` +
    pathsResorted.map(path => `\t${path}\n`) + "\n"
  )
  return pathsResorted.length
}

/** 
 * `deno task` runs this script relative from the root of the
 * `redpanda-lineage` project source code, where `deno.json` is found.
 */
if (import.meta.main) {
  // TODO: check CLI arguments with options that enforce data types
  const { _: args, ...flags } = parseArgs(Deno.args, {
    boolean: ["deduplicate-photo-uris", "sort-image-updates"],
    string: ["remove-author", "remove-duplicate", "remove-photo", "restore-author"]
  })
  // If no arguments, don't try and build the dataset
  if (Deno.args.length == 0) {
    console.log(helpMessage)
    Deno.exit(0)
  }
  // Either build a new dataset, or import an existing one. Make sure we have
  // file paths represented on every vertex.
  const fresh = await isDatasetFresh()
  const dataset = (fresh == true)
    ? importDataset()
    : await buildDataset(false, false)
  // Now we can assume `export/redpanda.json` exactly represents the underlying
  // data, and our other checks can make decisions about processing entirely on
  // the JSON file, rather than reading all the `.txt` files one by one
  switch (true) {
    case (flags["deduplicate-photo-uris"] == true):
      const autoResolved = resolveDuplicatePhotoUris(dataset)
      if (autoResolved > 0)   // build and commit if the dataset changed
        await buildDataset(true, true)
      break
    case (typeof flags["remove-author"] === "string"):
      // removeAuthorFromLineage(flags["remove-author"])
      break
    case (typeof flags["remove-duplicate"] === "string"):
      // removePhotoFromEntity(dataset, flags["remove-duplicate"], args)
      // deletePhotoFromServer()
      break
    case (typeof flags["remove-photo"] === "string"):
      removePhotoFromEntity(dataset, flags["remove-photo"], args)
      await buildDataset(true, true)   // ready to publish
      break
    case (typeof flags["restore-author"] === "string"): {
      // restoreAuthorToLineage(flags["restore-author"], args[0])
      break
    }
    case (flags["sort-image-updates"] == true):
      const count = sortImageUpdates(dataset)
      if (count > 0)
        await buildDataset(true, true)   // ready to publish
      break
    default:
      console.log(helpMessage)
      Deno.exit(1)
  }
  // TODO: once we've done all this, build an updated dataset
}

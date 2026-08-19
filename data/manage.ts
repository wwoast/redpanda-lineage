import { IniMap } from '@std/ini/ini-map'
import { parseArgs } from '@std/cli/parse-args'
import { Dataset,
         buildDataset,
         importDataset,
         isDatasetFresh } from './build.ts'
import { processObject } from './shared.ts'

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
  --sort-image-locators <path>
        Take all photo files with a "photo hash" in the name, and sort them in
        order of oldest-published to newest-published.
  --sort-image-updates
        Sort image locators for all .txt files changed since the last commit.
`

/**
 * If a file has the same photo URI multiple times, make a new photo entry with
 * a union of the tags for each one, and the earlier commitdate. We track
 * duplicates across the entire dataset now, but if a photos is in two or more
 * distinct entity files
 */
function resolveDuplicatePhotoUris(dataset: Dataset) {
  interface PhotoAndPath extends Photo {
    _id: number | string,
    index: number,
    path: string
  }
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
  Object.keys(urlToPhotos).map(url => {
    const photos = urlToPhotos[url]
    const tagList = [...new Set(photos.flatMap(photo => photo.tags).sort())]
    const pathList = [...new Set(photos.flatMap(photo => photo.path))]
    if (pathList.length > 1) {
      console.log(
        `[manage] WARN: manually review: multiple paths for photo: ${url}\n` +
        pathList.sort().map(path => `\t${path}`).join("\n") + "\n"
      )
    } else {
      // Find the lowest index and update the photo info
      const duplicateIndexes = photos.map(photo => photo.index).sort()
      const newIndex = duplicateIndexes.shift() as number
      /* console.log(`new: ${newIndex}, duplicated: ${duplicateIndexes}`)
      console.log(`${url}: ${photos[newIndex]}`)
      console.log(JSON.stringify(photos)) */
      const resolvedPhoto =
        photos.filter(photo => photo.index == newIndex).pop() as PhotoAndPath
      const entityId = resolvedPhoto._id
      // Unify the tags for all the photos we deduplicated
      resolvedPhoto.tags = tagList
      // Take the updated entity and put it back on disk. Some of the node data
      // becomes edges in the graph, so put those back as well.
      const relevantEdges =
        dataset.graph.edges.filter(edge => edge._out._id == entityId)
      const entity = idToVertex[entityId]
      // Delete the photo entries not matching this index
      duplicateIndexes.forEach(index => entity.photos.splice(index, 1))
      const path = entity.path
      const processed = processObject(entity, relevantEdges)
      // Set keys one at a time in the ini map
      Object.keys(processed).sort().map(key =>
        dataset.ini.set(entity.type, key, processed[key]))
      // TODO: replace first colon on a line with colon-space, since ini-map
      // can't reasonably handle multiple-character assignment characters
      Deno.writeTextFileSync(path, dataset.ini.toString())
      dataset.ini.clear()
      console.log(
        `[manage]: ${entityId}: ${url} resolved to single index: ${newIndex}\n` +
        `\tRemoved indexes: ${duplicateIndexes.join(', ')}\n`
      )
    }
  })
  console.log(`[manage] ${Object.keys(urlToPhotos).length} total duplicated photos.`)
}

/** 
 * `deno task` runs this script relative from the root of the
 * `redpanda-lineage` project source code, where `deno.json` is found.
 */
if (import.meta.main) {
  // TODO: check CLI arguments with options that enforce data types
  const { _: args, ...flags } = parseArgs(Deno.args)
  // If no arguments, don't try and build the dataset
  if (Object.keys(flags).length == 0) {
    console.log(helpMessage)
    Deno.exit(0)
  }
  // Either build a new dataset, or import an existing one
  const buildNeeded = await isDatasetFresh()
  const dataset = (!buildNeeded)
    ? await importDataset()
    : await buildDataset(false, true)
  // Now we can assume `export/redpanda.json` exactly represents the underlying
  // data, and our other checks can make decisions about processing entirely on
  // the JSON file, rather than reading all the `.txt` files one by one
  switch (true) {
    case (flags["deduplicate-photo-uris"]):
      resolveDuplicatePhotoUris(dataset)
      break
    case (flags["remove-author"]):
      // removeAuthorFromLineage(flags["remove-author"])
      break
    case (flags["remove-duplicate"]):
      // TODO: get file path (first argument) and photo id (second argument)
      break
    case (flags["remove-photo"]):
      // TODO: get file path (first argument) and photo id (second argument)
      break
    case (flags["restore-author"]): {
      // handle the case with a commit, and without a commit
      // restoreAuthorToLineage(flags["restore-author"])
      break
    }
    case (flags["sort-image-locators"]): {
      const filePath = flags["sort-image-locators"]
      // sortImageLocators(filePath)
      // TODO: check ^^ returns false / has non cwdc urls
      /**            
       * Inner functions don't manage their git commits, so do it here
            repo = git.Repo(".")
            repo.git.add(file_path)
            message = "sorted path: {path}".format(path=file_path)
            repo.index.commit(message)
            repo.close()
       */
      break
    }
    case (flags["sort-image-updates"]):
      // sortImageUpdates()
      break
    default:
      console.log(helpMessage)
      Deno.exit(1)
  }
  // TODO: once we've done all this, build an updated dataset
}

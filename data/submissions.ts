import { git } from "@roka/git";
import { parseArgs } from '@std/cli/parse-args'
import { IniMap } from "@std/ini/ini-map"
import { basename, dirname, join, parse } from '@std/path'
import sharp from 'sharp'
import { getDataset } from './build.ts'
import { Dataset } from './dataset.ts'
import { sortEntities } from './manage.ts'
import { byFieldName,
         existsDirSync,
         existsFileSync,
         readConfigForExternalSystems, 
         standardDate } from './shared.ts'

/** 
 * Tools to manage local photos, or uploading of photos to redpandafinder's
 * online hosting. Runtime dependencies for these workflows include:
 *   feh, git, rsync, ssh, vim
 * 
 * SSH uses remote server and account settings from the root-directory's
 * INI-format `contributions.conf` file.
 */

const helpMessage = `
Usage:
  deno task submissions [arguments]

Workflows for pulling in photo contributions, and updating the underlying
database files with the new photo content. Without any arguments, it pulls new
photos down using folder locations and server settings defined in the
./contributions.conf file, and begins a new photo-review workflow.

Arguments:
  --local
        If the workflow is terminated with a system reboot or CTRL+C, this
        argument will restart an existing workflow from the most recently
        edited photo.
  --help
        Show these usage notes.
`

/** 
 * Code to convert from the JSON-formatted output of the _redpanda-submission_
 * forms, and the INI-format `.txt` file format of the _redpanda-lineage_
 * database files. The important logic is all around controlling for malformed
 * input, and automatically setting values that we know ambiently, like the
 * "commitdate".
 */
function convertJsonToConfigFragment(
  dataset: Dataset,
  configPath: string,
  entityJson: SubmittedPanda | SubmittedPhoto | SubmittedZoo
) {
  let input: Record<string, any>
  switch (entityJson.type) {
    case "panda":
      input = convertJsonToPanda(dataset, configPath, entityJson)
      break
    case "photo":
      input = convertJsonToPhoto(dataset, configPath, entityJson)
      break
    case "zoo":
      input = convertJsonToZoo(dataset, configPath, entityJson)
      break
  }
  // Set keys one at a time in the ini map
  const ini = new IniMap({assignment: ": "})
  Object.keys(input).sort(byFieldName).map(key =>
    ini.set(entityJson.type, key, input[key]))
  // Replace first colon on a line with colon-space, since ini-map
  // can't reasonably handle multiple-character assignment symbols
  const output = ini.toString()
    .split("\n").map(line => line.replace(":", ": ")).join("\n") + "\n"
  Deno.writeTextFileSync(configPath, output)
}

/**
 * Create a new panda object from _redpanda-submission_ data, for later
 * serializing into an INI-format `.txt` file.
 * 
 * The `_id` field will be chosen automatically at ingest-time. Fallback fields
 * are filled in for English-legible names.
 */
function convertJsonToPanda(
  dataset: Dataset,
  configPath: string,
  entityJson: SubmittedPanda
) {
  const zooString = (entityJson.zoo)
    ? (parseInt(entityJson.zoo) * -1).toString()
    : "unknown"
  const output: Record<string, any> = {
    _notes: entityJson.notes,
    birthday: standardDate(entityJson.birthday),
    commitdate: standardDate(),
    gender: entityJson.gender,
    species: entityJson.species,
    zoo: zooString
  }
  output["language.order"] =
    Array.from(new Set([entityJson.language, "en"]).keys()).join(", ")
  output[`${entityJson.language}.name`] = entityJson.name
  output[`${entityJson.language}.nicknames`] = "none"
  output[`${entityJson.language}.othernames`] = "none"
  if (!("en.name" in output)) {
    output["en.name"] = '<English-Name-For-Output-File>'
    output["en.nicknames"] = "none"
    output["en.othernames"] = "none"
  }
  const photos = convertJsonToPhoto(dataset, configPath, entityJson)
  return {...output, ...photos}
}

function convertJsonToPhoto(
  dataset: Dataset,
  configPath: string,
  entityJson: SubmittedPanda | SubmittedPhoto | SubmittedZoo
) {
  const locators = (entityJson.type != "photo")
    ? entityJson.photo_locators
    : [configPath.replace(".txt", "")]
  const guessLink = (entityJson.type != "photo")
    ? `https://www.instagram.com/${entityJson.author}`
    : `ig://${entityJson.ig_locator}`
  const output: Record<string, any> = {}
  locators.forEach((locator: string, index: number) => {
    const naturalIndex = index + 1
    output[`photo.${naturalIndex}`] = `cwdc://${basename(locator)}`
    output[`photo.${naturalIndex}.author`] = entityJson.author
    output[`photo.${naturalIndex}.commitdate`] = standardDate()
    output[`photo.${naturalIndex}.link`] = guessLink
    if (entityJson.type == "photo")
      output[`photo.${naturalIndex}.tags`] = entityJson.tags.join(", ")
    if (entityJson.type != "photo" || entityJson.ig_locator == null)
      return   // continue
    // If photo is based on an ig_locator that already exists in this dataset,
    // merge the existing commitdate and tag information.
    const originalPhoto =
      findInstagramLocator(dataset, entityJson._id, entityJson.ig_locator)
    if (originalPhoto) {
      output[`photo.${naturalIndex}.commitdate`] = originalPhoto.commitdate
      output[`photo.${naturalIndex}.tags`] =
        Array.from(new Set([...entityJson.tags, ...originalPhoto.tags]))
          .sort()
          .join(", ")
    }
  })
  return output
}

/**
 * Create a new zoo object from _redpanda-submission_ data, for later
 * serializing into an INI-format `.txt` file.
 * 
 * The `_id` field will be chosen automatically at ingest-time. Fallback fields
 * are filled in for English-legible addresses and locations.
 */
function convertJsonToZoo(
  dataset: Dataset,
  configPath: string,
  entityJson: SubmittedZoo
) {
  const output: Record<string, any> = {
    _zoofilename: "<Shortened-Lowercase-Zoo-Name-With-Dashes>",
    commitdate: standardDate(),
    latitude: entityJson.latitude.toString(),
    longitude: entityJson.longitude.toString(),
    map: "<Google-Maps-Link>",
    website: entityJson.website
  }
  output["country.name"] = entityJson.country
  output["country.folder"] = entityJson.folder
  output["language.order"] =
    Array.from(new Set([entityJson.language, "en"]).keys()).join(", ")
  output[`${entityJson.language}.address`] = entityJson.address
  output[`${entityJson.language}.location`] = "<Locality-Name-State-and-Province>"
  output[`${entityJson.language}.name`] = entityJson.name
  if (!("en.name" in output)) {
    output["en.address"] = entityJson.address
    output["en.location"] = "<Locality-Name-State-and-Province>"
    output["en.name"] = entityJson.name
  }
  const photos = convertJsonToPhoto(dataset, configPath, entityJson)
  return {...output, ...photos}
}

/** After photos are processed / reoriented / resized, put them online */
function copyImagesToServer(config: ExternalConfig, results: ProcessedEntity[]) {
  const photoPaths = results.flatMap(result => result.photos)
  const server = config.submissions.image_hosting_server
  const destinationFolder = config.submissions.image_hosting_server_folder
  const user = config.submissions.image_hosting_user
  const args = photoPaths.concat([
    `${user}@${server}:${destinationFolder}`
  ])
  const scpCommand = new Deno.Command("/usr/bin/scp", {
    args: args,
    stdout: "piped",
    stderr: "piped" 
  })
  console.log("[submissions] Copying images to image server...\n")
  const runStatus = scpCommand.outputSync().code
  if (runStatus != 0)
    Deno.exit(runStatus)
}

/** Use `rsync` to fetch data from the _redpanda-submission_ server */
function copyReviewDataFromSubmissionsServer(config: ExternalConfig) {
  const processingFolder = config.submissions.processing_folder
  const reviewFolder = config.submissions.contributions_server_folder
  const server = config.submissions.contributions_server
  const user = config.submissions.contributions_user
  const args = [
    '-avrz',
    '--remove-source-files',
    `${user}@${server}:${reviewFolder}/*`,
    `${processingFolder}`
  ]
  const rsyncCommand = new Deno.Command("/usr/bin/rsync", {
    args: args,
    stdout: "piped",
    stderr: "piped"
  })
  const runStatus = rsyncCommand.outputSync().code
  if (runStatus != 0)
    Deno.exit(runStatus)
  // Delete any empty folders copied from the server
  const contributions: string[] = []
  Deno.readDirSync(processingFolder)
    .map(entry => join(processingFolder, entry.name))
    .filter(subPath => existsDirSync(subPath))
    .forEach(subPath => {
      if (Array.from(Deno.readDirSync(subPath)).length > 0)
        contributions.push(subPath)
      else
        Deno.removeSync(subPath)
    })
  // If we didn't find any content to add in the folders copied from the server
  // then there's nothing left to do.
  if (contributions.length == 0) {
    console.log('[submissions] No non-empty folders to process.')
    Deno.exit(-1)
  }
}

/** Merge all submissions data into files on a new repo branch */
async function createSubmissionsBranch(dataset: Dataset, results: ProcessedEntity[]) {
  const messages: string[] = [] 
  const repo = git()
  try {
    const currentTime = new Date().getTime()
    let branch = await repo.branch.current()
    if (branch.name == "master") {
      const newBranchName = `submissions-${currentTime}`
      branch = await repo.branch.create(newBranchName, {target: "HEAD"})
      console.log(`[submissions] starting new branch from master: ${newBranchName}`)
    }
    const messages: string[] = []
    const changed = new Set<string>()
    results.forEach(result => {
      const merge = mergeConfiguration(dataset, result)
      if (merge) {
        const message = `+${merge.locator}: ${basename(merge.config)}`
        messages.push(message)
        changed.add(merge.config)
      }
    })
    // Any changed files get added to the commit
    changed.forEach(path => repo.index.add(path))
  } finally {
    const commitMessage = messages.join("\n")
    await repo.commit.create({all: true, subject: commitMessage})
  }
}

/** Open an image viewer and display in a carousel, all photo paths given */
function displayImages(photoPaths: string[]) {
  const fehCommand = new Deno.Command("/usr/bin/feh", {
    args: photoPaths,
    stdin: "null",
    stdout: "null",
    stderr: "null"
  })
  const childProcess = fehCommand.spawn()
  // Let Deno exit without waiting for the image viewer to close
  childProcess.unref()
  return childProcess
}

/** Get the vertex photo matching the given Instagram locator, if it exists */
function findInstagramLocator(dataset: Dataset, id: number | string, locator?: string) {
  if (!locator)
    return
  const datasetEntity = dataset.graph.vertices
    .filter(vertex => vertex._id == id)
    .shift()
  if (!datasetEntity || (!("photos" in datasetEntity)))
    return
  const originalPhoto = (datasetEntity.photos as Photo[])
    .filter(photo => photo.url.endsWith(locator as string))
    .shift()
  return originalPhoto
}

/** Return relevant image locators in panda/zoo/photo submitted fragments */
function getImageLocators(
  entityPath: string,
  entityJson: SubmittedPanda | SubmittedPhoto | SubmittedZoo
) {
  const contributionPath = dirname(entityPath)
  const photoPaths = (entityJson.type == "photo")
    ? [entityPath.replace(".txt", "")]
    : entityJson.photo_locators.map(locator => join(contributionPath, locator))
  return photoPaths
}

/** For new pandas added to _redpanda-lineage_, write to this file path */
function getLocationPathForNewPanda(dataset: Dataset, panda: NodePanda) {
  const locationLookupId = (panda.zoo)
    ? parseInt(panda.zoo) * -1
    : panda.wild
  const locationEntity = dataset.graph.vertices
    .filter(vertex => vertex._id == locationLookupId)
    .shift()
  if (!locationEntity)
    throw new Error(
      `[submissions] ${panda._id} ${panda.name["en"]}: ` +
      `location ${locationLookupId} not found`
    )
  const [ _, countryName, fileName] = locationEntity.path.split("/")
  const fileId = getNewIdWithLeadingZeroes(dataset, "panda")
  const zooFoldername = parse(fileName).name
  const pandaName = panda.name["en"]?.toLowerCase()
  return `pandas/${countryName}/${zooFoldername}/${fileId}_${pandaName}.txt`
}

/** For new zoos added to _redpanda-lineage_, write to this file path */
function getLocationPathForNewZoo(dataset: Dataset, zoo: FragmentZoo) {
  const fileId = getNewIdWithLeadingZeroes(dataset, "zoo")
  return `zoos/${zoo["country.folder"]}/${fileId}_${zoo["_zoofilename"]}.txt`
}

/** 
 * All _redpanda-lineage_ panda and zoo entities are in a file that begins
 * with the entity's ID, zero-padded up to four digits.
 */
function getNewIdWithLeadingZeroes(dataset: Dataset, type: "panda" | "zoo") {
  const newEntityId = dataset.graph.vertices
    .filter(vertex => vertex.type == type)
    .map(vertex => Math.abs(vertex._id as number))
    .reduce((max: number, current: number) => {
      if (current > max) return current
      else return max
    }, 0)
  return (newEntityId + 1).toString().padStart(4, '0')
}

/** 
 * Process any panda, zoo, or photo JSON object coming from the
 * _redpanda-submissions_ server, into INI-formatted `.txt` config fragments,
 * intended for later manual touch-up and merging into the _redpanda-lineage_
 * database.
 */
async function iterateThroughContributions(dataset: Dataset, config: ExternalConfig) {
  const results: ProcessedEntity[] = []
  const processedPaths: string[] = []
  const processingFolder = config.submissions.processing_folder
  // One layer deep of folders and files
  const contributions = Array.from(Deno.readDirSync(processingFolder))
    .map(entry => join(processingFolder, entry.name))
    .filter(subPath => existsDirSync(subPath))
    .flatMap(subPath =>
      Array.from(Deno.readDirSync(subPath)).map(entry => join(subPath, entry.name)))
    .sort()
  // Look at each contribution file one at a time
  for (const entityPath of contributions) {
    let entityJson, result
    switch (true) {
      case (entityPath.endsWith(".panda.json")):
        entityJson = JSON.parse(Deno.readTextFileSync(entityPath)) as SubmittedPanda
        entityJson.type = "panda"
        result = await processEntity(dataset, entityPath, entityJson)
        processedPaths.push(entityPath)
        break
      case (entityPath.endsWith(".zoo.json")):
        entityJson = JSON.parse(Deno.readTextFileSync(entityPath)) as SubmittedZoo
        entityJson.type = "zoo"
        result = await processEntity(dataset, entityPath, entityJson)
        processedPaths.push(entityPath)
        break
      case (entityPath.endsWith(".json") && (!processedPaths.includes(entityPath))):
        entityJson = JSON.parse(Deno.readTextFileSync(entityPath)) as SubmittedPhoto
        entityJson.type = "photo"
        result = await processEntity(dataset, entityPath, entityJson)
        processedPaths.push(entityPath)
        break
    }
    if (result && result.status == "keep")
      results.push(result)
  }
  return results
}

/** 
 * Take a config fragment, and merge any updated facets into the dataset
 * files. Leverage the combination of _dataset_ (all entities in JSON
 * format) and the dataset object's INI-mapper, to merge two bits of
 * configuration together, prior to spitting out a merged dataset file.
 * 
 * We also delete any temporary values from the fragment that we don't
 * want landing in the final dataset.
 */
function mergeConfiguration(dataset: Dataset, result: ProcessedEntity) {
  const fragment = dataset.getEntityFromDisk(result.config)
  switch(fragment.type) {
    // Any panda configuration fragments shouldn't exist yet in the dataset, so
    // this is a "put the file where it should go" operation.
    case "panda": {
      fragment.path = getLocationPathForNewPanda(dataset, fragment)
      delete fragment._notes
      dataset.writeEntityToDisk(fragment)
      return {
        "config": fragment.path,
        "locator": "panda",
        "type": "panda"
      }
    }
    // Photo fragments must merge into entities that already exist
    case "photo": {
      const matchingVertex = dataset.graph.vertices
        .filter(vertex => vertex._id == fragment._id)
        .shift() as GraphNode
      if (!matchingVertex)
        return
      const matchingPhoto =
        findInstagramLocator(dataset, fragment._id, fragment._ig_locator)
      if (matchingPhoto) {
        // Union-set the tags and clobber most photo properties, but keep commitdate
        matchingPhoto.author = fragment.photo.author
        matchingPhoto.source = fragment.photo.source
        matchingPhoto.tags =
          Array.from(new Set([...fragment.photo.tags, ...matchingPhoto.tags])).sort()
        matchingPhoto.url = fragment.photo.url
      } else {
        matchingVertex.photos.push(fragment.photo)
      }
      // Render the modified entity back to disk
      dataset.writeEntityToDisk(matchingVertex)
      return {
        "config": matchingVertex.path,
        "locator": fragment.photo.url,
        "type": "photo"
      }
    }
    // Any zoo configuration fragments shouldn't exist yet in the dataset, so
    // this is a "put the file where it should go" operation.
    case "zoo": {
      fragment.path = getLocationPathForNewZoo(dataset, fragment as FragmentZoo)
      delete fragment._zoofilename
      delete fragment["country.folder"]
      delete fragment["country.name"]
      dataset.writeEntityToDisk(fragment)
      return {
        "config": fragment.path,
        "locator": "zoo",
        "type": "zoo"
      }
    }
  }
}

function migrateSubmissionsToProcessed(config: ExternalConfig) {
  const submissionsFolder = config.submissions.processing_folder
  const processedFolder = config.submissions.processed_folder
  // All content inside the submissions folder should be themselves folders
  // with unique IDs in the names.
  Deno.readDirSync(submissionsFolder)
    .map(entry => join(submissionsFolder, entry.name))
    .forEach(submissionPath => {
      const processedPath = submissionPath.replace(submissionsFolder, processedFolder)
      Deno.renameSync(submissionPath, processedPath)
    })
}

/** See the snippet of the config fragment for the given panda/photo/zoo */
function printConfigFragmentContents(configPath: string) {
  const configOutput = Deno.readTextFileSync(configPath)
  const horizontalRule = "-".repeat(configPath.length)
  console.log(`\n${configPath}\n${horizontalRule}\n${configOutput}`)
}

type ProcessedEntity = {
  config: string,
  photos: string[],
  status: "keep" | "remove"
}
/**
 * Show a metadata file converted from json into configparser format, and look
 * at a carousel of its resized images.
 * 
 * You have the option to interactively edit the metadata file before it is
 * finalized into a Git commit, or delete the metadata prior to the commit.
 * As is standard for _redpanda-lineage_, any interface for editing data looks
 * like the raw INI-format `.txt` database files.
 * 
 * Return an object with the decision, the metadata path, and a list of paths
 * to the resized-in-place photos.
 */
async function processEntity(
  dataset: Dataset,
  entityPath: string,
  entityJson: SubmittedPanda | SubmittedPhoto | SubmittedZoo
): Promise<ProcessedEntity> {
  const configPath = entityPath.replace(".json", ".txt")
  const photoPaths = getImageLocators(configPath, entityJson)
  // Skip photo metadata files for stuff already processed for a panda or zoo
  if (entityJson.type == "photo" && photoPaths.length == 0) {
    return {
      "config": configPath,
      "photos": photoPaths,
      "status": "remove"
    }
  }
  if (existsFileSync(configPath)) {
    console.log(`[submissions] ${configPath}: preserving from a previous run`)
    return {
      "config": configPath,
      "photos": photoPaths,
      "status": "keep"
    }
  }
  // Take the rpfs-submitted JSON and make a INI-format `.txt` fragment
  convertJsonToConfigFragment(dataset, configPath, entityJson)
  // Print the results of the conversion to the terminal
  printConfigFragmentContents(configPath)
  // Resize and rotate images given the nature of the entity
  await Promise.all(photoPaths.map(async (path) => await resizeAndRotateImage(entityJson, path)))
  // Display all images from this entity JSON
  const feh = displayImages(photoPaths)
  // Prompt to see whether we should open an editor to modify this config
  // prior to ingesting it into redpandafinder. TODO: for non-photo entities
  // the editing process is required to finalize some details
  const decision = promptForDecision()
  if (decision == "c") {
    feh.kill()
    return {
      "config": configPath,
      "photos": photoPaths,
      "status": "keep"
    }
  } else if (decision == "d") {
    const cleanupList = [entityPath].concat(photoPaths)
    cleanupList.map(path => Deno.removeSync(path))
    feh.kill()
    return {
      "config": configPath,
      "photos": photoPaths,
      "status": "remove"
    }
  } else {
    // Open vim to the point where you would add new tags to a photo
    const editorCommand = new Deno.Command("/usr/bin/vim", {
      args: ["+call cursor(8, 1000)", configPath],
      stdin: "inherit",
      stdout: "inherit",
      stderr: "inherit"
    })
    const child = editorCommand.spawn()
    await child.status
    feh.kill()
    return {
      "config": configPath,
      "photos": photoPaths,
      "status": "keep"
    }
  }
}

/** Prompt to either edit or delete a contributed config fragment */
function promptForDecision() {
  const options = ["c", "d", "e"]
  const decision = prompt('(e)dit, (d)elete, or (c)ontinue:')
  if (decision && !options.includes(decision))
    return promptForDecision()
  else
    return decision
}

/**
 * For submitted photo metadata, determine how the photo should be resized.
 * Group photos (with a `media` _id) keep more info than individual pandas.
 */
async function resizeAndRotateImage(
  entityJson: SubmittedPanda | SubmittedPhoto | SubmittedZoo,
  imagePath: string
) {
  if (entityJson.type != "photo")
    return
  // Aspect ratio policy for resizing the largest dimension of a photo
  const resizeGroup = 800
  const resizePhoto = 400
  const aspect = (entityJson._id.startsWith("media."))
    ? resizeGroup
    : resizePhoto
  // Sharp pipelines cannot read and write to the same file in one pipeline
  const buffer = Deno.readFileSync(imagePath)
  // Burn in the orientation from the JSON entity data, and resize the image.
  // Fit 'inside' forces the image to scale to fit inside `aspect` as the
  // largest dimension. Photo orientations strings are from the exif standard
  // in _MikeKovarik/exif_ project's `src/dicts/tiff-ifd0-values.mjs`
  switch (entityJson.orientation) {
    case 'Mirror horizontal':
      await sharp(buffer)
        .flip()
        .resize({width: aspect, height: aspect, fit: 'inside'})
        .toFile(imagePath)
      return
    case 'Rotate 180':
      await sharp(buffer)
        .rotate(180)
        .resize({width: aspect, height: aspect, fit: 'inside'})
        .toFile(imagePath)
      return
    case 'Mirror vertical':
      await sharp(buffer)
        .flop()
        .resize({width: aspect, height: aspect, fit: 'inside'})
        .toFile(imagePath)
      return
    case 'Mirror horizontal and rotate 270 CW':
      await sharp(buffer)
        .flip()
        .rotate(90)
        .resize({width: aspect, height: aspect, fit: 'inside'})
        .toFile(imagePath)
      return
    case 'Mirror horizontal and rotate 90 CW':
      await sharp(buffer)
        .flip()
        .rotate(270)
        .resize({width: aspect, height: aspect, fit: 'inside'})
        .toFile(imagePath)
      return
    case 'Horizontal (normal)':
    default:
      await sharp(buffer)
        .resize({width: aspect, height: aspect, fit: 'inside'})
        .toFile(imagePath)
      return
  }
}

/** 
 * `deno task` runs this script relative from the root of the
 * _redpanda-lineage_ project source code, where `deno.json` is found.
 */
if (import.meta.main) {
  const { _: args, ...flags } = parseArgs(Deno.args, {
    boolean: ["help", "local"]
  })
  const config = readConfigForExternalSystems()
  switch (true) {
    case (flags["help"] == true):
      console.log(helpMessage)
      Deno.exit(1)
    case (flags["local"] == false):
      // Pull remote data from the upstream server, and then continue through
      // to the default-use case of starting a photo-review workflow.
      copyReviewDataFromSubmissionsServer(config)
    default:
      // Leverage the existing JSON for per-entity file path to ID mapping
      const dataset = await getDataset()
      const results = await iterateThroughContributions(dataset, config)
      copyImagesToServer(config, results)
      // Create a new branch and commit the changes for added content
      await createSubmissionsBranch(dataset, results)
      // Make sure all added content has been correctly sorted
      await sortEntities(dataset, "updates")
      // Migrate all submissions to the processed/ folder
      migrateSubmissionsToProcessed(config)
      console.log("Please merge submissions to master when ready.")
  }
}

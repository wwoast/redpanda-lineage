import { parseArgs } from '@std/cli/parse-args'
import { IniMap } from "@std/ini/ini-map"
import { dirname, join } from '@std/path'
import { sharp } from 'sharp'
import { getDataset } from './build.ts'
import { Dataset } from './dataset.ts'
import { byFieldName,
         existsDirSync,
         existsFileSync,
         readConfigForExternalSystems, 
         standardDate} from './shared.ts'

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
    ? `ig://${entityJson.author}`
    : `ig://${entityJson.ig_locator}`
  const output: Record<string, any> = {}
  locators.forEach((locator: string, index: number) => {
    const naturalIndex = index + 1
    output[`photo.${naturalIndex}`] = `cwdc://${locator}`
    output[`photo.${naturalIndex}.author`] = entityJson.author
    output[`photo.${naturalIndex}.commitdate`] = standardDate()
    output[`photo.${naturalIndex}.link`] = guessLink
    if (entityJson.type == "photo")
      output[`photo.${naturalIndex}.tags`] = entityJson.tags.join(", ")
    if (entityJson.type != "photo" || entityJson.ig_locator == null)
      return   // continue
    // If photo is based on an ig_locator that already exists in this dataset,
    // merge the existing commitdate and tag information.
    const datasetEntity = dataset.graph.vertices
      .filter(vertex => vertex._id == entityJson._id)
      .shift()
    const originalPhoto = (datasetEntity && entityJson.ig_locator != null)
      ? datasetEntity.photos
        .filter((photo: Photo) => photo.url.endsWith(entityJson.ig_locator as string))
        .shift()
      : undefined
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
    "args": args,
    "stdout": "piped",
    "stderr": "piped"
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

function displayImages(photoPaths: string[]) {
  const fehCommand = new Deno.Command("/usr/bin/feh", {
    "args": photoPaths,
    "stdin": "null",
    "stdout": "null",
    "stderr": "null"
  })
  const childProcess = fehCommand.spawn()
  // Let Deno exit without waiting for the image viewer to close
  childProcess.unref()
  return childProcess
}

/** Return relevant image locators in panda/zoo/photo submitted fragments */
function getImageLocators(
  entityPath: string,
  entityJson: SubmittedPanda | SubmittedPhoto | SubmittedZoo
) {
  const contributionPath = dirname(entityPath)
  const photoPaths = (entityJson.type == "photo")
    ? [entityPath.replace(".json", "")]
    : entityJson.photo_locators.map(locator => join(contributionPath, locator))
  return photoPaths
}

function iterateThroughContributions(dataset: Dataset, config: ExternalConfig) {
  const results = []
  const processedPaths: string[] = []
  const processingFolder = config.submissions.processing_folder
  const contributions = Array.from(Deno.readDirSync(processingFolder))
      .map(entry => join(processingFolder, entry.name))
      .filter(subPath => existsDirSync(subPath))
  contributions.forEach(subPath => {
    Array.from(Deno.readDirSync(subPath))
      .sort()
      .map(entry => join(subPath, entry.name))
      // TODO: need to process the pandas and zoos first?
      .forEach(entityPath => {
        let entityJson, result
        switch (true) {
          case (entityPath.endsWith(".panda.json")):
            entityJson = JSON.parse(Deno.readTextFileSync(entityPath)) as SubmittedPanda
            entityJson.type = "panda"
            result = processEntity(dataset, entityPath, entityJson)
            processedPaths.push(entityPath)
            break
          case (entityPath.endsWith(".zoo.json")):
            entityJson = JSON.parse(Deno.readTextFileSync(entityPath)) as SubmittedZoo
            entityJson.type = "zoo"
            result = processEntity(dataset, entityPath, entityJson)
            processedPaths.push(entityPath)
            break
          case (entityPath.endsWith(".json") && (!processedPaths.includes(entityPath))):
            entityJson = JSON.parse(Deno.readTextFileSync(entityPath)) as SubmittedPhoto
            entityJson.type = "photo"
            result = processEntity(dataset, entityPath, entityJson)
            processedPaths.push(entityPath)
            break
        }
        if (result && result.status == "keep")
          results.append(result)
      })
  })
  return results
}

/** See the snippet of the config fragment for the given panda/photo/zoo */
function printConfigFragmentContents(configPath: string) {
  const configOutput = Deno.readTextFileSync(configPath)
  const horizontalRule = "-".repeat(configPath.length)
  console.log(`${configPath}\n${horizontalRule}\n${configOutput}\n`)
}

/**
 * Show a metadata file converted from json into configparser format, and look
 * at a carousel of its resized images.
 * 
 * You have the option to interactively edit the metadata file before it is
 * finalized into a Git commit, or delete the metadata prior to the commit.
 * 
 * Return an object with the decision, the metadata path, and a list of paths
 * to the resized-in-place photos.
 */
type ProcessedEntity = {
  config: string,
  photos: string[],
  status: "keep" | "remove"
}
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
  await Promise.all(photoPaths.map(async (path) => resizeAndRotateImage(entityJson, path)))
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
  const decision = prompt('(e)dit, (d)elete, or (c)ontinue: ')
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
  let buffer = Deno.readFileSync(imagePath)
  // Track width and height of the image prior to burning in the orientation
  const metadata = await sharp(buffer).metadata()
  // Burn in the orientation from the JSON entity data. Photo orientations
  // strings are from the exif standard as per the _MikeKovarik/exif_ project's
  // `src/dicts/tiff-ifd0-values.mjs` file. The default case is
  // 'Horizontal (normal)' and requires no processing.
  switch (entityJson.orientation) {
    case 'Mirror horizontal':
      buffer = await sharp(buffer).flip().toBuffer()
    case 'Rotate 180':
      buffer = await sharp(buffer).rotate(180).toBuffer()
    case 'Mirror vertical':
      buffer = await sharp(buffer).flop().toBuffer()
    case 'Mirror horizontal and rotate 270 CW':
      buffer = await sharp(buffer).flip().rotate(90).toBuffer()
    case 'Mirror horizontal and rotate 90 CW':
      buffer = await sharp(buffer).flip().rotate(270).toBuffer()
  }
  // Proportionally scale the image to match our desired aspect ratio policy
  if (metadata.width >= metadata.height && metadata.width > aspect)
    buffer = await sharp(buffer).resize({width: aspect}).toBuffer()
  else if (metadata.height >= metadata.width && metadata.height > aspect)
    buffer = await sharp(buffer).resize({height: aspect}).toBuffer()
  // Write the final file
  await sharp(buffer).jpeg().toFile(imagePath)
}

/** 
 * `deno task` runs this script relative from the root of the
 * `redpanda-lineage` project source code, where `deno.json` is found.
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
      iterateThroughContributions(dataset, config)
      // TODO: iterate_through_contributions
      // TODO: copy_images_to_server
      // TODO: create_submissions_branch
      // TODO: sort_image_updates from manage.ts
      // TODO: migrate_submissions_to_submitted
      console.log("Please merge submissions to master when ready.")
  }
}

import { parseArgs } from '@std/cli/parse-args'
import { basename, dirname, join } from '@std/path'
import { getDataset } from './build.ts'
import { Dataset } from './dataset.ts'
import { existsDirSync,
         readConfigForExternalSystems,
         readConfigFragment } from './shared.ts'

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

/** Return the relevant image locators in panda/zoo/photo metadata fragments */
function getImageLocators(
  entityPath: string,
  entityType: "panda" | "photo" | "zoo"
) {
  const contributionPath = dirname(entityPath)
  const entityJson = JSON.parse(Deno.readTextFileSync(entityPath)) as Record<string, any>
  const locators = (entityType == "photo")
    ? [entityPath.replace(".json", "")]
    : entity.photo_locators.map(locator => join(contributionPath, locator))
  const imageName = basename(entityPath).replace(".json", "")
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
        let result
        switch (true) {
          case (entityPath.endsWith(".panda.json")):
            result = processEntity(entityPath, "panda")
            processedPaths.push(entityPath)
            break
          case (entityPath.endsWith(".zoo.json")):
            result = processEntity(entityPath, "zoo")
            processedPaths.push(entityPath)
            break
          case (entityPath.endsWith(".json") && (!processedPaths.includes(entityPath))):
            result = processEntity(entityPath, "photo")
            processedPaths.push(entityPath)
            break
        }
        if (result && result.status == "keep")
          results.append(result)
      })
  })
  return results
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
function processEntity(
  entityPath: string,
  entityType: "panda" | "zoo" | "photo"
): ProcessedEntity {
  try {
    const configPath = entityPath.replace(".json", ".txt")
    const entity = readConfigFragment(configPath, entityType)
    const photoPaths = getImageLocators(configPath, entity)
    // TODO
  } catch(err) {
    console.log(`[submissions] error reading ${entityPath}`)
  }
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
      // TODO: iterate_through_contributions
      // TODO: copy_images_to_server
      // TODO: create_submissions_branch
      // TODO: sort_image_updates from manage.ts
      // TODO: migrate_submissions_to_submitted
      console.log("Please merge submissions to master when ready.")
  }
}

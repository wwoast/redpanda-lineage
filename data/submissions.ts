import { parseArgs } from '@std/cli/parse-args'
import { join } from '@std/path'
import { getDataset } from './build.ts'
import { existsDirSync, readConfigForExternalSystems } from './shared.ts'

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
  deleteEmptySubmissionDirs(config)
}

function deleteEmptySubmissionDirs(config: ExternalConfig) {
  const processingFolder = config.submissions.processing_folder
  const contributions: string[] = []
  for (const entry of Deno.readDirSync(processingFolder)) {
    const subPath = join(processingFolder, entry.name)
    if (!existsDirSync(subPath))
      continue
    if (Array.from(Deno.readDirSync(subPath)).length > 0)
      contributions.push(subPath)
    else
      Deno.removeSync(subPath)
  }
  if (contributions.length == 0) {
    console.log('[submissions] No non-empty folders to process.')
    Deno.exit(-1)
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
      const processingFolder = config.submissions.processing_folder
      // TODO: iterate_through_contributions
      // TODO: copy_images_to_server
      // TODO: create_submissions_branch
      // TODO: sort_image_updates from manage.ts
      // TODO: migrate_submissions_to_submitted
      console.log("Please merge submissions to master when ready.")
  }
}

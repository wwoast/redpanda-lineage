import { parseArgs } from '@std/cli/parse-args'
import { buildDataset, isDatasetFresh } from './build.ts'

const helpMessage = `
Usage:
  deno task manage <subcommand> [arguments]

Manage the contents of the redpanda-lineage flat file database files. Each of
the subcommands may generate a commit to the redpanda-lineage current branch.

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
 * `deno task` runs this script relative from the root of the
 * `redpanda-lineage` project source code, where `deno.json` is found.
 */
if (import.meta.main) {
  // TODO: check CLI arguments with options that enforce data types
  const { _: args, ...flags } = parseArgs(Deno.args)
  // Make sure dataset is up to date (if there are some kind of flags)
  if (Object.keys(flags).length > 0)
    if (!isDatasetFresh())
      await buildDataset(false)
  else
    console.log(`[manage] fresh dataset didn't need rebuilding`)
  switch (true) {
    case (flags["deduplicate-photo-uris"]):
      // removeDuplicatePhotoUrisPerFile()
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
  }
}

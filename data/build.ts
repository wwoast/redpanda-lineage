import { Dataset, Updates } from './dataset.ts'
import { join } from '@std/path'
import { git } from '@roka/git'
import { Paths } from './shared.ts'

/** 
 * Construct a new `export/redpanda.json` file, calculate updates for all
 * commits in the last week, and git-commit the new dataset to the repo.
 * 
 * The Git CLI is a runtime dependency of this script and it has locking, so
 * we create and pass around a singleton instance of the Git object instead of
 * storing it inside the classes that use it.
 * 
 * @param metrics print the current count of pandas / zoos to the console
 * @param paths each object tracks the filename it represents
 * 
 * For publishing, you want `metrics` true and `paths` false, and for making
 * scripted dataset changes, you want `metrics` false and `paths` true.
 * 
 * TODO: if the dataset exists and no .txt file changes, but paths are false,
 * make this a no-op?
 */
export async function buildDataset(metrics: boolean, commit: boolean): Promise<Dataset> {
  const repo = git()
  // Create a JS object from the redpandafinder `.txt` files
  const dataset = new Dataset().build()
  // Determine what changed in the last week of Git commits
  const updates = await new Updates().build(repo, dataset.graph)
  // Generate the ouptut JSON file
  await dataset.exportJsonGraph(Paths.output, repo, updates, metrics)
  // Commit the output JSON file to the repository if desired
  if (commit) {
    await repo.index.add(Paths.output)
    const currentCommit = await repo.commit.get("HEAD")
    const shortCommit = (currentCommit && currentCommit.short)
      ? currentCommit.short
      : "HEAD~1"
    const commitMessage = `dataset from ${shortCommit}`
    await repo.commit.create({ all: true, subject: commitMessage })
    console.log(`[build] committed: ${commitMessage}`)
  }
  return dataset
}

/** 
 * Read in an existing version of the `export/redpanda.json` dataset for doing
 * management tasks with. If the file paths aren't included in each vertex,
 * perform a rebuild task so that the paths are included.
 */
export function importDataset(): Dataset {
  const dataset = new Dataset().importJsonGraph()
  // TODO: better freshness check based on commit
  console.log(`[build] imported graph is fresh`)
  return dataset
}

/** 
 * Technically, every time you build a new dataset, it will give you current
 * data for commits in the last week from the current time. So any time you
 * want a new dataset, it's not unreasonable to make one.
 * 
 * However, for `manage.ts` and other tools that deal with dataset management,
 * we only want to build a new dataset if there were changes to the underlying
 * red panda data since the last commit. So determine if the dataset is _fresh_
 * or represents the current state of the underlying `.txt` files.
 * 
 * If any error happens here, assume the dataset should be rebuild
 */
export async function isDatasetFresh() {
  try {
    const repo = git()
    const datasetCommitish = JSON.parse(Deno.readTextFileSync(Paths.output))._commit
    const currentCommit = await repo.commit.get("HEAD")
    const datasetCommit = await repo.commit.get(datasetCommitish)
    const patches = await repo.diff.patch({
      from: datasetCommit,
      to: currentCommit,
      path: [Paths.links, Paths.media, Paths.pandas, Paths.wilds, Paths.zoos]
    })
    // If any `.txt` files in the patch set, the dataset should be rebuilt 
    const buildNeeded = patches
      .map(change => join(repo.path(), change.path))
      .some(path => path.endsWith(".txt"))
    return !buildNeeded
  } catch(_err) {
    console.log(`[build] problem with existing dataset, so rebuilding`)
    return false
  } 
}

/** 
 * `deno task` runs this script relative from the root of the
 * `redpanda-lineage` project source code, where `deno.json` is found.
 */
if (import.meta.main) {
  await buildDataset(true, true)
}

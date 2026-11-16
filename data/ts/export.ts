/** 
 * Shared functions used by all the RPF projects. When moving to prefix-ids,
 * the `num()` function I had in `@redpanda-lineage/ui/ts/pandas.ts` was needed
 * by the `@redpanda-lineage/dataset` subproject also, but I didn't want the UI
 * project to export dependencies to other things.
 * 
 * Then I realized various other utility functions and sorting strategies might
 * have a useful place here as well.
 */

/** Take a prefixed ID like `panda.100` and return 100 */
export function num(prefixId: string) {
  const suffix = (prefixId.includes("."))
    ? prefixId.split(".").pop() ?? ""
    : prefixId
  const numericId = parseInt(suffix)
  if (isNaN(numericId))
    throw new Error(`TODO: ${prefixId} value or suffix is not numeric`)
  return numericId
}

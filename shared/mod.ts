/** 
 * Shared functions used by all the RPF projects. When moving to prefix-ids,
 * suddenly I needed the `Pandas.num` function in multiple projects. Sorting
 * methods for various things might live here as well.
 */

/** Take a prefixed ID like `panda.100` and return 100 */
export function num(prefixId: string) {
  return parseInt(prefixId.split(".").pop() as string) as number
}

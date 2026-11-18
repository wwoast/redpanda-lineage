/**
 * Shared functions used by all the RPF projects. When moving to prefix-ids,
 * the `num()` function I had in `@redpanda-lineage/ui/ts/pandas.ts` was needed
 * by the `@redpanda-lineage/dataset` subproject also, but I didn't want the UI
 * project to export dependencies to other things.
 * 
 * Then I realized various other utility functions and sorting strategies might
 * have a useful place here as well.
 */
/** 
 * Filter for distinct animals or zoos. When dealing with Dagoba graphs,
 * use its unique method instead.
 */ export function distinct(list) {
  return list.filter((value, index, self)=>self.indexOf(value) === index);
}
/** Take a prefixed ID like `panda.100` and return 100 */ export function num(prefixId) {
  const suffix = prefixId.includes(".") ? prefixId.split(".").pop() ?? "" : prefixId;
  const numericId = parseInt(suffix);
  if (isNaN(numericId)) throw new Error(`TODO: ${prefixId} value or suffix is not numeric`);
  return numericId;
}
/** 
 * Reducer functions for type narrowing of vertex lists.
 * TODO: just add these to the graph library so we don't filter so much, and to
 * improve type safety of dagoba.ts?
 */
/** Take the input vertices and keep just links */ export function toLinks(accumulator, vertex) {
  if (vertex.type == 'link') accumulator.push(vertex);
  return accumulator;
}
/** Take the input vertices and keep just media */ export function toMedia(accumulator, vertex) {
  if (vertex.type == 'media') accumulator.push(vertex);
  return accumulator;
}
/** Take the input vertices and keep just pandas */ export function toPandas(accumulator, vertex) {
  if (vertex.type == 'panda') accumulator.push(vertex);
  return accumulator;
}
export function toPhotoEntities(accumulator, vertex) {
  if (vertex.type == 'media') accumulator.push(vertex);
  else if (vertex.type == 'panda') accumulator.push(vertex);
  else if (vertex.type == 'wild') accumulator.push(vertex);
  else if (vertex.type == 'zoo') accumulator.push(vertex);
  return accumulator;
}
/** Take the input vertices and keep just wild locations */ export function toWilds(accumulator, vertex) {
  if (vertex.type == 'wild') accumulator.push(vertex);
  return accumulator;
}
/** Take the input vertices and keep just media */ export function toZoos(accumulator, vertex) {
  if (vertex.type == 'zoo') accumulator.push(vertex);
  return accumulator;
}

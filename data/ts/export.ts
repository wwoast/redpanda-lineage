import type { Vertex } from '@redpanda-lineage/data/dagoba'

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
 */
export function distinct<T>(list: T[]) {    
  return list.filter(
    (value: T, index: number, self: T[]) => self.indexOf(value) === index)
}

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

/** 
 * Reducer functions for type narrowing of vertex lists.
 * TODO: just add these to the graph library so we don't filter so much, and to
 * improve type safety of dagoba.ts?
 */

/** Take the input vertices and keep just links */
export function toLinks(accumulator: NodeLinks[], vertex: Vertex) {
  if (vertex.type == 'link')
    accumulator.push(vertex as NodeLinks)
  return accumulator
}

/** Take the input vertices and keep just media */
export function toMedia(accumulator: NodeMedia[], vertex: Vertex) {
  if (vertex.type == 'media')
    accumulator.push(vertex as NodeMedia)
  return accumulator
}

/** Take the input vertices and keep just pandas */
export function toPandas(accumulator: NodePanda[], vertex: Vertex) {
  if (vertex.type == 'panda')
    accumulator.push(vertex as NodePanda)
  return accumulator
}

export function toPhotoEntities(accumulator: PhotoGraphNode[], vertex: Vertex) {
  if (vertex.type == 'media')
    accumulator.push(vertex as NodeMedia)
  else if (vertex.type == 'panda')
    accumulator.push(vertex as NodePanda)
  else if (vertex.type == 'wild')
    accumulator.push(vertex as NodeWild)
  else if (vertex.type == 'zoo')
    accumulator.push(vertex as NodeZoo)
  return accumulator
}

/** Take the input vertices and keep just wild locations */
export function toWilds(accumulator: NodeWild[], vertex: Vertex) {
  if (vertex.type == 'wild')
    accumulator.push(vertex as NodeWild)
  return accumulator
}

/** Take the input vertices and keep just media */
export function toZoos(accumulator: NodeZoo[], vertex: Vertex) {
  if (vertex.type == 'zoo')
    accumulator.push(vertex as NodeZoo)
  return accumulator
}

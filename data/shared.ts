import type { Vertex } from './dagoba.ts'

/** Keep consistent with the `NodeType` type definition */
export const nodeTypes: NodeType[] = ["links", "media", "panda", "wild", "zoo"]
/** Keep consistent with the `SupportedLanguages` enum definition */
export const supportedLanguages: Language[] = ["en", "es", "ja", "ko", "ne", "pt", "zh"]

export function ensureNodeType(input: string) {
  if ((nodeTypes as string[]).includes(input))
    return input as NodeType
}

export function ensureLanguage(input: string) {
  if ((supportedLanguages as string[]).includes(input))
    return input as Language
}

/** Check whether or not the given path exists as a directory. */
export function existsDirSync(path: string): boolean | Error {
  try {
    const fi = Deno.lstatSync(path)
    if (fi.isDirectory)
      return true
    return false
  } catch (err) {
    if (err instanceof Deno.errors.NotFound)
      return false
    throw err
  }
}

/** Check whether or not the given path exists as regular file. */
export function existsFileSync(path: string): boolean {
  try {
    const fi = Deno.lstatSync(path)
    if (fi.isFile)
      return true
    return false
  } catch (err) {
    if (err instanceof Deno.errors.NotFound)
      return false
    throw err
  }
}

/** Where to import or export red panda data from */
export const Paths: Record<string, string> = {
  links: "./links",
  media: "./media",
  output: "./export/redpanda.json",
  pandas: "./pandas",
  wild: "./wild",
  zoos: "./zoos"
}

/** Reducer functions for type narrowing of vertex lists */

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

/** Sort functions */

/** Sort numeric IDs from lowest to highest */
export function byIdAscending(v1: Record<string, any>, v2: Record<string, any>) {
  return v1._id - v2._id
}

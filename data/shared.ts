import { version } from "../js/jsleri-1.1.15.js";
import type { Edge, Vertex } from './dagoba.ts'

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
  links: "links/",
  media: "media/",
  output: "export/redpanda.json",
  pandas: "pandas/",
  wilds: "wild/",
  zoos: "zoos/"
}

/**
 * Replacer functions for particular entities, converting from a GraphNode
 * or Vertex object in a dataset, back to a `.txt` INI-format file.
 */

/** 
 * Prepare an entity drawn from the JSON graph, to be reserialized to a
 * `.txt` INI-format file. The vertex type is made the top-level object key,
 * locations and photos values are unspooled into key/value fields, where
 * each value is a string.
 * 
 */
export function processObject(entity: GraphNode, edges: Edge[]) {
  switch (entity.type) {
    case "panda":
      return processPandaObject(entity, edges)
    case "media":
      return processMediaObject(entity)
    case "wild":
    case "zoo":
      return processZooObject(entity)
    default:
      throw new Error(`[manage] ${entity._id}: unknown node object type: ${entity.type}`)
  }
}

/** TODO: stricter typing on entity, oldnames in PandaNode */
export function processMediaObject(entity: Vertex) {
  const working = structuredClone(entity)
  if ("panda.tags" in working)
    working['panda.tags'] = working['panda.tags'].join(', ')
  if ("language.order" in working)
    working['language.order'] = working['language.order'].join(', ')
  if ("photos" in working) {
    working.photos.map((photo: Photo, index: number) => {
      const naturalIndex = index + 1
      working[`photo.${naturalIndex}`] = photo.url
      working[`photo.${naturalIndex}.author`] = photo.author
      working[`photo.${naturalIndex}.commitdate`] = photo.commitdate
      working[`photo.${naturalIndex}.link`] = photo.source
      working[`photo.${naturalIndex}.tags`] = photo.tags.join(', ')
      if (photo.locations) {
        Object.entries(photo.locations).map((entry: [string, [number, number]]) => {
          const [pandaId, coordinates] = entry
          working[`photo.${naturalIndex}.tags.${pandaId}.location`] = coordinates.join(', ')
        })
      }
    })
  }
  //@ts-ignore
  delete working._in
  //@ts-ignore
  delete working._out
  delete working.path
  delete working.photos
  delete working.type
  return working
}

/** TODO: stricter typing on entity, oldnames in PandaNode */
export function processPandaObject(entity: Vertex, edges: Edge[]) {
  const working = structuredClone(entity)
  // Unknown gender is just elided in the JSON. Add it back
  if ("gender" in working)
    working.gender = (working.gender == "Female") ? "f" : "m"
  else
    working.gender = "unknown"
  if ("language.order" in working)
    working['language.order'] = working['language.order'].join(', ')
  if ("locations" in working) {
    working.locations.map((location: PandaLocation, index: number) => {
      const naturalIndex = index + 1
      working[`location.${naturalIndex}`] = `${location._id}, ${location.date}`
    })
  }
  if ("name" in working) {
    Object.keys(working.name).map(language =>
      working[`${language}.name`] = working.name[language])
  }
  if ("nicknames" in working) {
    Object.keys(working.nicknames).map(language =>
      working[`${language}.nicknames`] = working.nicknames[language].join(", "))
  }
  if ("oldnames" in working) {
    Object.keys(working.oldnames).map(language =>
      working[`${language}.oldnames`] = working.oldnames[language].join(", "))
  }
  if ("othernames" in working) {
    Object.keys(working.othernames).map(language =>
      working[`${language}.othernames`] = working.othernames[language].join(", "))
  }
  if ("photos" in working) {
    working.photos.map((photo: Photo, index: number) => {
      const naturalIndex = index + 1
      working[`photo.${naturalIndex}`] = photo.url
      working[`photo.${naturalIndex}.author`] = photo.author
      working[`photo.${naturalIndex}.commitdate`] = photo.commitdate
      working[`photo.${naturalIndex}.link`] = photo.source
      working[`photo.${naturalIndex}.tags`] = photo.tags.join(', ')
    })
  }
  // Add back the data from the edges
  // TODO: differentiate between media, panda objects, wild  objects, and zoo objects
  working.birthplace = "unknown"
  working.children = "none"
  working.litter = "none"
  working.zoo = "unknown"
  edges.map(edge => {
    switch (edge._label) {
      case "birthplace":
        working.birthplace = parseInt(edge._in._id) * -1
        break
      case "family":
        if (working.children == "none")
          working.children = edge._in._id
        else {
          const children = working.children.split(", ")
          children.push(edge._in._id)
          working.children = children.join(", ")
        }
        break
      case "litter":
        if (working.litter == "none")
          working.litter = edge._in._id
        else {
          const litter = working.litter.split(", ")
          litter.push(edge._in._id)
          working.litter = litter.join(", ")
        }
        break
      case "zoo":
        working.zoo = parseInt(edge._in._id) * -1
        break
      default:
        console.log(`[shared] unknown edge type: ${edge._label}`)
    }
  })
  // Set the top-level key that will be treated as the section header
  //@ts-ignore
  delete working._in
  //@ts-ignore
  delete working._out
  delete working.locations
  delete working.name
  delete working.nicknames
  delete working.oldnames
  delete working.othernames
  delete working.path
  delete working.photos
  delete working.type
  return working
}

/** TODO: stricter typing on entity, oldnames in PandaNode */
export function processZooObject(entity: Vertex) {
  const working = structuredClone(entity)
  if ("address" in working) {
    Object.keys(working.address).map(language =>
      working[`${language}.address`] = working.address[language])
  }
  if ("language.order" in working)
    working['language.order'] = working['language.order'].join(', ')
  if ("location" in working) {
    Object.keys(working.location).map(language =>
      working[`${language}.location`] = working.location[language])
  }
  if ("name" in working) {
    Object.keys(working.name).map(language =>
      working[`${language}.name`] = working.name[language])
  }
  if ("othernames" in working) {
    Object.keys(working.othernames).map(language =>
      working[`${language}.othernames`] = working.othernames[language].join(", "))
  }
  if ("photos" in working) {
    working.photos.map((photo: Photo, index: number) => {
      const naturalIndex = index + 1
      working[`photo.${naturalIndex}`] = photo.url
      working[`photo.${naturalIndex}.author`] = photo.author
      working[`photo.${naturalIndex}.commitdate`] = photo.commitdate
      working[`photo.${naturalIndex}.link`] = photo.source
      working[`photo.${naturalIndex}.tags`] = photo.tags.join(', ')
    })
  }
  // Set the top-level key that will be treated as the section header
  //@ts-ignore
  delete working._in
  //@ts-ignore
  delete working._out
  delete working.name
  delete working.othernames
  delete working.path
  delete working.photos
  delete working.type
  return working
}

/** 
 * Reviver functions for particular node types, converting from `.txt`
 * INI-format to the Dataset class object.
 */
export function reviveNode(key: string, value: unknown, section?: string) {
  switch (section) {
    case "links":
      return reviveLinksNode(key, value, section)
    case "media":
      return reviveMediaNode(key, value, section)
    case "panda":
      return revivePandaNode(key, value, section)
    case "wild":
      return reviveWildNode(key, value, section)
    case "zoo":
      return reviveZooNode(key, value, section)
    default:
      throw new Error(`[manage]: section ${section}: not a valid redpandafinder node`)
  }
}

/**
 * When importing data from plaintext files with `[links]` data, convert any
 * primitive values into more ergonomic TypeScript types.
 */
export function reviveLinksNode(key: string, value: unknown, section?: string): any {
  if (section != "links")
    return value   // Shouldn't happen
  switch (true) {
    case (key.includes("language.order")):
      return (value as string).split(", ") as Language[]
    default:
      return value
  }
}

/**
 * When importing data from plaintext files with `[media]` data, convert any
 * primitive values into types we can better use or validate in TypeScript.
 */
export function reviveMediaNode(key: string, value: unknown, section?: string) {
  if (section != "media")
    return value   // Shouldn't happen
  switch (true) {
    case (key.includes("location")):
    case (key.includes("tags")):
      return (value as string).split(", ")
    default:
      return value
  }
}

/**
 * When importing data from plaintext files with `[panda]` data, convert
 * primitive values into more ergonomic TypeScript types.
 */
export function revivePandaNode(key: string, value: unknown, section?: string): any {
  if (section != "panda")
    return value   // Shouldn't happen
  switch (true) {
    case (key.includes("children")):
    case (key.includes("litter")):
      return (value as string).split(", ")
    case (key == "language.order"):
      return (value as string).split(", ") as Language[]
    case (key.includes("tags")):
      return (value as string).split(", ")
    default:
      return value
  }
}

/**
 * When importing data from plaintext files with `[wild]` data, convert any
 * primitive values into more ergonomic TypeScript types.
 */
export function reviveWildNode(key: string, value: unknown, section?: string): any {
  if (section != "wild")
    return value   // Shouldn't happen
  switch (true) {
    case (key == "language.order"):
      return (value as string).split(", ") as Language[]
    default:
      return value
  }
}

  /**
   * When importing data from plaintext files with `[zoo]` data, convert any
   * primitive values into more ergonomic TypeScript types.
   *
   * The hack for ensuring integers for all connected nodes is making panda
   * IDs positive integers, and zoo IDs negative integers!
   */
export function reviveZooNode(key: string, value: unknown, section?: string): any {
  if (section != "zoo")
    return value   // Shouldn't happen
  switch (true) {
    case (key.includes("_id")):
      return (parseInt(value as string) * -1).toString()
    case (key == "language.order"):
      return (value as string).split(", ") as Language[]
    case (key.includes("tags")):
      return (value as string).split(", ")
    default:
      return value
  }
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

export function toPhotoEntities(
  accumulator: (NodeMedia | NodePanda | NodeWild | NodeZoo)[],
  vertex: Vertex
) {
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

/** Sort functions */

/** Sort numeric IDs from lowest to highest */
export function byIdAscending(v1: Record<string, any>, v2: Record<string, any>) {
  return v1._id - v2._id
}

/** 
 * Sort all keys in a redpandafinder `.txt` database file. Alphabetic sort,
 * except for if any of the components of the key are numbers, numeric sort.
 */
export function byFieldName(v1: string, v2: string) {
  function valueSort(a: string | number, b: string | number) {
    if (a < b) return -1
    else if (a > b) return 1
    else return 0
  }
  const v1s = v1.split(".")
  const v2s = v2.split(".")
  // No splits in the key
  if (v1s.length == 1 && v2s.length == 1)
    return valueSort(v1, v2)
  // OK, one of the keys have a split
  for (const [i, p1] of v1s.entries()) {
    const p2 = v2s[i]
    if (p2 == undefined)   // p1 is longer
      return -1   // p1 wins
    if (isNaN(parseInt(p1)) || isNaN(parseInt(p2))) {
      if (p1 != p2)
        return valueSort(p1, p2)
      else
        continue
    }
    // Treat these as numbers
    const n1 = parseInt(p1)
    const n2 = parseInt(p2)
    // Put "photo.1" before "photo.1.author"
    if (n1 == n2)
      return valueSort(v1s.length, v2s.length)
    // Put "photo.1" before "photo.2"
    else if (n1 != n2) 
      return valueSort(n1, n2)
    else
      continue
  }
  // Fallback
  return valueSort(v1, v2)
}

import type { Vertex } from './dagoba.ts'

export const firstCommit = "832f3469e61901ebf9a38a6c2da1f427cf64e188"

/**
 * IG locators are A-Za-z0-9-_ 26+26+10+1+1, and we will use a similar modified
 * base64 scheme but encoding different information and the normal Unix epoch.
 */
const base64CharacterSet: string[] = [
  "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M",
  "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z",
  "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m",
  "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z",
  "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "-", "_"
]

/**
 * Object mapping numbers to each character above, in order they are listed,
 * using the array index of each character (starting from zero). Since we are
 * doing bit-shifting math on Instagram locators, we need to use BigInt since
 * the bit-shift operators for regular Numbers only work on 32-bit values.
 */
const base64LookupTable: Record<string, bigint> = Object.fromEntries(
  base64CharacterSet.map(character => 
    [character, BigInt(base64CharacterSet.indexOf(character))]))

/** Keep consistent with the `SupportedLanguages` _enum_ definition */
export const supportedLanguages: Language[] =
  ["en", "es", "ja", "ko", "ne", "pt", "zh"]

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

export function entityTypeFromFileName(filename: string): Exclude<NodeType, "none"> {
  switch (true) {
    case filename.includes(Paths.links):
      return "links"
    case filename.includes(Paths.media):
      return "media"
    case filename.includes(Paths.panda):
      return "panda"
    case filename.includes(Paths.wild):
      return "wild"
    case filename.includes(Paths.zoo):
      return "zoo"
    default:
      throw new Error(`[shared] not an entity file: ${filename}\n`)
  }
}

/** 
 * Where to import or export red panda data from, relative to the location that
 * deno tasks run from. All deno tasks run relative to where `deno.json` is
 * located, which is the root folder of the _redpanda-lineage_ repository.
 */
export const Paths: Record<string, string> = {
  contributions: "contributions.conf",
  links: "links/",
  media: "media/",
  output: "export/redpanda.json",
  pandas: "pandas/",
  wilds: "wild/",
  zoos: "zoos/"
}

/** 
 * If we look for commits outside the data file repos, the
 * `export/redpanda.json` file changes cause git to OOM.
 */
export const DataPaths =
  [Paths.links, Paths.media, Paths.pandas, Paths.wilds, Paths.zoos]

/**
 * Replacer functions for particular entities, converting from a GraphNode
 * or Vertex object in a dataset, back to a `.txt` INI-format file.
 */

/** 
 * Reviver function for particular node types, converting from `.txt`
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
function reviveLinksNode(key: string, value: unknown, section?: string): any {
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
function reviveMediaNode(key: string, value: unknown, section?: string) {
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
function revivePandaNode(key: string, value: unknown, section?: string): any {
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
function reviveWildNode(key: string, value: unknown, section?: string): any {
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
function reviveZooNode(key: string, value: unknown, section?: string): any {
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

/** Sort lists of numbers highest to lowest */
export function byNumericHighest(a: number, b: number) {
  if (a > b) return -1
  else if (a < b) return 1
  else return 0
}

/** Sort lists of numbers from lowest to highest */
export function byNumericLowest(a: number, b: number) {
  if (a < b) return -1
  else if (a > b) return 1
  else return 0
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

/**
 * Sort a set of photos, leveraging their publish date (in a base62-formatted
 * filename), and falling back to the commit date of the photo in RPF.
 * 
 * RPF and IG URIs both use a consistent base64 standard for creating URLs
 * for photos, but the defined epoch time, and the overall format for each one,
 * is slightly different.
 * 
 * Perform the photo sorting as part of reserializing the contents of a JSON
 * entity to disk. DO NOT perform photo sorting prior to other management tasks
 * because it means your numeric photo indexes won't be stable! i.e. you would
 * delete a photo you did not intend to delete!
 */
export function byPhotoUri(a: Photo, b: Photo) {
  /** Internally we use getTime() (epoch time in ms) as the sorting comparison */
  function selectDate(p: Photo): number {
    return (p.url.startsWith("ig://") && p.url.split("/").length == 5)
        ? reduceInstagramLocatorToTimestamp(p.url.split("/")[3])
        : (p.url.startsWith("ig://"))
          ? reduceInstagramLocatorToTimestamp(p.url.split("/")[2])
          : (p.url.startsWith("cwdc://"))
            ? reduceRpfsLocatorToTimestamp(p.url.split("/")[2].split(".")[0])
            : new Date(p.commitdate).getTime()
  }
  // Numeric ordering of chosen dates
  return selectDate(a) - selectDate(b)
}

/**
 * Convert Instagram share link into a locator, and convert the locator's
 * leading 41 bits into a normal Unix timestamp in milliseconds.
 * 
 * Writing this in terms of bit-shifting requires everything to be bigint type
 * since the bitshift operators in Javascript only work on 32-bit integers and
 * my bit vectors are larger than this.
 */
function reduceInstagramLocatorToTimestamp(locator: string): number {
  // Comparing known IG locators and publication dates:
  //   C1bdtpLuDU5 => (wall-clock) Dec 29, 2023 23:48 PST
  //   C02q-dDJkmC => Dec 14, 2023
  //   B-02mMUB81- == April 10, 2020
  //   B_0sxp5JjNl == May 5, 2020
  // Based on this, I'm estimating this constant to offset how IG's
  // epoch is not the same as normal Unix time. 
  const instagramEpoch = new Date("2011-08-24T21:07:00.000Z").getTime()
  const locatorNumber = Array.from(locator).map((x: string, i: number) => {
    const j = BigInt(locator.length - i - 1)
    return BigInt(base64LookupTable[x]) << (6n * j)
  }).reduce((a: bigint, b: bigint) => a + b)
  const bitString = locatorNumber.toString(2).padStart(64, '0')
  const leadingBitsString = bitString.slice(0, 41)
  const timestampNumber = Array.from(leadingBitsString).map((x: string, i: number) => {
    const j = BigInt(leadingBitsString.length - i - 1)
    return BigInt(x) << j
  }).reduce((a: bigint, b: bigint) => a + b)
  return Number(timestampNumber) + instagramEpoch
}

/** 
 * Similar to the instagram locator reducer's base64 alphabet, but for RPF the
 * the epoch is the standard Unix epoch (1/1/1970-00:00).
 * 
 * TODO: Since I've decided to stick with the 41-bit timestamp thing from IG,
 * 2^41 milliseconds is only around 70 years. Starting from the epoch, that
 * means my filenames will roll over in 2040, which is terrible and I should
 * consider renaming all the files with cwdc urls.
 */
function reduceRpfsLocatorToTimestamp(locator: string): number {
  const locatorNumber = Array.from(locator).map((x: string, i: number) => {
    const j = BigInt(locator.length - i - 1)
    return BigInt(base64LookupTable[x]) << (6n * j)
  }).reduce((a: bigint, b: bigint) => a + b)
  const bitString = locatorNumber.toString(2).padStart(64, '0')
  const leadingBitsString = bitString.slice(0, 41)
  const timestampNumber = Array.from(leadingBitsString).map((x: string, i: number) => {
    const j = BigInt(leadingBitsString.length - i - 1)
    return BigInt(x) << j
  }).reduce((a: bigint, b: bigint) => a + b)
  return Number(timestampNumber)
}

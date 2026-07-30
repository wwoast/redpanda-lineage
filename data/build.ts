import Dagoba from '../js/dagoba.js'
import * as ini from '@std/ini'
import { join } from '@std/path'
import { git } from '@roka/git'
import { Paths,
         ensureLanguage,
         ensureNodeType,
         existsDirSync,
         existsFileSync, 
         supportedLanguages } from './shared.ts'

/**
 * Build a JSON file that is a consolidated summary of all the text files
 * tracked in the _redpanda-lineage_ repository.
 */

interface PhotoMetrics {
  /** Index of author to number of photos contributed */
  credit: Record<string, number>,
  /** Highest photo count for a single entity */
  max: number,
  /** Most animals in a single group photo */
  group: number
}
/** List of metrics related to photos ingested by this script */
const photoMetrics: PhotoMetrics = {
  credit: {},
  max: 0,
  group: 0
}

/** Total contributors, pandas, zoos, photos, and entity counters */
const totalsMetrics: Record<string, number> = {
  /** Number of photo contributors to redpandafinder */
  credit: 0,
  /** Total number of entities tracked */
  entities: 0,
  /** Total number of pandas in redpandafinder */
  pandas: 0,
  /** Total number of photos in redpandafinder */
  photos: 0,
  /** Total number of zoos in redpandafinder */
  zoos: 0
}

const updatesMetrics: Record<string, number> = {
  /** Number of new authors in the latest git update */
  authors: 0,
  /** Number of new pandas in the latest git update */
  pandas: 0,
  /** Number of new photos in the latest git update */
  photos: 0,
  /** Number of new zoos in the latest git update */
  zoos: 0
}

interface RedPandaFinderMetrics {
  last_born: string,
  last_died: string,
  lexer_names: Set<string>,
  photos: PhotoMetrics,
  totals: Record<string, number>,
  updates: Record<string, number>
}
/** Data specifically for redpandafinder use */
const rpf: RedPandaFinderMetrics = {
  /** Most recently born animal being tracked */
  last_born: "",
  /** Most recently passed-away animal being tracked */
  last_died: "",
  /** Complex names with spaces which the lexer needs to handle */
  lexer_names: new Set<string>(),
  /** Indices or counters of relevant photo data */
  photos: photoMetrics,
  /** Tracking totals */
  totals: totalsMetrics,
  /** Tracking update counts */
  updates: updatesMetrics,

}

/** Lists of files ingested during an ingest */
const files: Record<string, string[]> = {
  /** Files containing list of links in a handful of categories */
  links: [],
  /** Files representing photos of sets of multiple pandas */
  media: [],
  /** Files representing a single panda id */
  panda: [],
  /** Files representing a wild animal sighting location */
  wild: [],
  /** Files representing specific zoos */
  zoo: []
}

/** 
 * This Red Panda Lineage dataset builder takes all source input data and
 * creates a JSON file intended for family tree querying. It deserializes all
 * input strings from the ConfigParser-format `.ini` files into the intended
 * primitive and object types for use in TypeScript.
 */
class Dataset {
  data: Graph = Dagoba.graph()
  /** Lists of files ingested during an ingest */
  files = files
  /** Pre-calculated metrics for the redpandafinder dataset */
  rpf = rpf

  constructor() {
    this.buildGraph()
  }

  /**
   * Check the panda children IDs to ensure they form a family tree.
   * 
   * - The children IDs should be valid for only one red panda file
   * 
   * - There should be no loops / I'm my own grandpa situations
   * 
   * - Each child should have a mother and a father
   * 
   * We make stacks of child -> parent -> grandparent ... paths,
   * and look for any duplicate IDs in the stacks.
   * 
   * Only run this check on nodes just added to the dataset.
   */
  assertCorrectChildrenIds() { 
    const pandas = this.data.vertices.filter(v => v.type == "panda")
    /*
      def check_dataset_children_ids(self):
          # Start with the set of pandas that have no children
          childless_ids = [p['_id'] for p in self.vertices
                        if (p['children'] == "none" 
                            or p['children'] == "unknown")]
          # Finish with the pandas that have no recorded parents
          all_child_ids = [x['_out'] for x in self.edges]
          parentless_ids = [y for y in range(1, self.sum_pandas())
                              if y not in all_child_ids]
          # Sets of edges we can start or finish on
          starting_edges = [s for s in self.edges 
                              if s['_out'] in childless_ids]
          finishing_edges = [f for f in self.edges
                              if f['in'] in parentless_ids]
          # This is hard to write :)
          pass
    */  
  }

  /** 
   * TODO: Run checks against the complete tree of red panda dates.
   *
   *   - Birth date and date of death should not be reversed.
   * 
   *   - Child pandas should not be born before the parent.
   * 
   *   - Child pandas should not be born after the parent died.
   */
  assertDatasetDates() {
    const pandas = this.data.vertices.filter(v => v.type == "panda")
  }

  /** Any animal name is limited to 100 characters in length at import */
  assertImportedName(path: string, name: string) {
    if (name.length > 100)
      throw new Error(`ERR: ${path}: name too long: ${name}`)
  }

  /** Complain if two vertices in the graph have the same `_id` value */
  assertNoDuplicateDatasetIds(vertices: GraphNode[]) {
    const duplicateIds = vertices
      .map(v => v._id)
      .filter((id, _, list) => list.indexOf(id) != list.lastIndexOf(id))
    if (duplicateIds.length > 0) {
      const nameTypes = ["panda", "wild", "zoo"]
      const namedDuplicates = vertices
        .filter(v => duplicateIds.includes(v._id))
        .filter(v => nameTypes.includes(v.type))
      // Give names if the duplicate nodes have names. Otherwise, ids
      const diagnosticStrings = (namedDuplicates.length > 0)
        //@ts-ignore 
        ? namedDuplicates.map(v => v.name["en"])
        : duplicateIds
      throw new Error(
        `ERR: duplicate ids for: ${diagnosticStrings.join(", ")}`)
    }
  }

  /** 
   * Read in all files to build a red panda graph. Verification of panda data
   * requires location records to be read first.
   */
  buildGraph() {
    this.importTree(Paths.zoos, this.importZoos, this.verifyZoos)
    this.importTree(Paths.wilds, this.importWilds, this.verifyWilds)
    this.importTree(Paths.pandas, this.importPanda, this.verifyPanda)
    this.importTree(Paths.media, this.importMedia, this.verifyMedia)
    this.importTree(Paths.links, this.importLinks, this.verifyLinks)
  }

  /**
   * Take a single links file and add it to the graph (just vertices).
   *
   * Links files are expected to have a header of `[links]`. Any fields defined
   * under that header will be consumed into the list of links. We keep all
   * fields in the `[links]` section as either `string` or `string[]`.
   */
  importLinks(path: string) {
    const ingest = ini.parse(
      Deno.readTextFileSync(path), {reviver: this.reviveLinksNode}
    ) as Record<"links", Record<string, string | string[]>>
    // Revivers are good for establishing property types of existing keys, but
    // do processing to rearrange or set new-keys after parsing
    const node = this.processNode(path, ingest.links, "links") as NodeLinks
    this.data.   // TODO Oh shit, let's just make this a class
    this.files.links.push(path)
  }

  /**
   * Take a single media file and add it to the dataset (just vertices).
   *
   * Media files are expected to have a header of `[media]`. Any fields defined
   * under that header will be consumed into the list of nodes with group panda
   * photos. All fields in the `[media]` section become either `Date`,
   * `string`, or `string[]`.
   */
  importMedia(path: string) {
    const ingest = ini.parse(
      Deno.readTextFileSync(path), {reviver: this.reviveMediaNode}
    ) as Record<"media", Record<string, Date | string | string[]>>
    // Revivers are good for establishing property types of existing keys, but
    // do processing to rearrange or set new-keys after parsing
    const node = this.processNode(path, ingest.media, "media") as NodeMedia
    this.data.vertices.push(node)
    this.files.links.push(path)
  }

  /**
   * Take a single panda file and add it to the dataset. The animals themselves
   * are vertices, and the family relationships and zoo living arrangement, are
   * all edges.
   *
   * Panda files are expected to have a header of `[panda]`. Any fields defined
   * under that header will be consumed into the list of graph nodes connected
   * to other family member and zoo nodes, with Dagoba edges. All fields in the
   * `[panda]` section become either `Date`, `string`, or `string[]`.
   */
  importPanda(path: string) {
    const ingest = ini.parse(
      Deno.readTextFileSync(path), {reviver: this.revivePandaNode}
    ) as Record<"panda", Record<string, Date | string | string[]>>
    // Revivers are good for establishing property types of existing keys, but
    // do processing to rearrange or set new-keys after parsing
    const node = this.processNode(path, ingest.panda, "panda") as NodeMedia
    this.data.vertices.push(node)
    this.files.links.push(path)
  }

  /**
   * Given a starting path, import all files into the graph. By adjusting path
   * and import method, this is used to import either the panda data or the
   * zoo data.
   */
  importTree(
    path: string,
    importMethod: Function,
    verifyMethod: Function
  ) {
    for (const entry of Deno.readDirSync(path)) {
      const subPath = join(path, entry.name)
      if (existsFileSync(subPath) && subPath.toLowerCase().endsWith(".txt")) {
        // Links files are at the highest level
        importMethod(subPath)
      }
      else if (existsDirSync(subPath)) {
        for (const entry of Deno.readDirSync(subPath)) {
          const subSubPath = join(subPath, entry.name)
          if (existsFileSync(subSubPath) && subSubPath.toLowerCase().endsWith(".txt")) {
            // Zoos files are at the second level
            importMethod(subSubPath)
          }
          if (existsDirSync(subSubPath)) {
            for (const entry of Deno.readDirSync(subSubPath)) {
              const dataPath = join(subSubPath, entry.name)
              if (existsFileSync(dataPath) && dataPath.toLowerCase().endsWith(".txt")) {
                // Import pandas or media
                importMethod(dataPath)
              }
            }
          }
        }
      }
    }
    // Post-import, validate the entire dataset
    verifyMethod()
  }

  /**
   * Take a single wild location record and add it to the dataset.
   *
   * Zoo files are expected to have a header of `[zoo]`. Any fields defined
   * under that header will be consumed into the list of graph nodes connected
   * to other family member and zoo nodes, with Dagoba edges. All fields in the
   * `[zoo]` section become either `Date`, single strings, or string[].
   */
  importWilds(path: string) {
    const ingest = ini.parse(
      Deno.readTextFileSync(path), {reviver: this.reviveWildNode}
    ) as Record<"wild", Record<string, Date | string | string[]>>
    // Revivers are good for establishing property types of existing keys, but
    // do processing to rearrange or set new-keys after parsing
    const node = this.processNode(path, ingest.wild, "wild") as NodeMedia
    this.data.vertices.push(node)
    this.files.links.push(path)
  }

  /**
   * Take a single zoo file and add it to the dataset.
   *
   * Zoo files are expected to have a header of `[zoo]`. Any fields defined
   * under that header will be consumed into the list of graph nodes connected
   * to other family member and zoo nodes, with Dagoba edges. All fields in the
   * `[zoo]` section become either `Date`, single strings, or string[].
   */
  importZoos(path: string) {
    const ingest = ini.parse(
      Deno.readTextFileSync(path), {reviver: this.reviveZooNode}
    ) as Record<"zoo", Record<string, Date | string | string[]>>
    // Revivers are good for establishing property types of existing keys, but
    // do processing to rearrange or set new-keys after parsing
    const node = this.processNode(path, ingest.zoo, "zoo") as NodeMedia
    this.data.vertices.push(node)
    this.files.links.push(path)
  }

  /**
   * - Enforce a length policy on names
   * 
   * - Add names with spaces as lexer token keys, for later searchability
   */
  processName(path: string, name: string) {
    this.assertImportedName(path, name)
    if (name.includes(" "))
      this.rpf.lexer_names.add(name)
  }

  /** 
   * Redpandafinder flat-text files are `key: value` format text files with a
   * completely flat key hierarchy. They are designed for their contents to be
   * simple to machine-parse, manually edit, and manually review.
   * 
   * `processNode` converts these files into Javascript objects that are
   * vertexes of the redpandafinder Dagoba graph. These `GraphNode` objects are
   * intended to be easy to enforce type constraints on, infer properties of,
   * and automatically validate.
   */
  processNode(path: string, vertex: Record<string, any>, type: NodeType): GraphNode {
    this.processNodeLanguageKeys(path, vertex)
    switch(type) {
      case "links":
      case "media":
      case "panda":
      case "wild":
      case "zoo":
    }
    vertex.type = type
    return vertex as GraphNode
  }

  /** 
   * Convert all fields with language-prefixes into objects keyed by language:
   * 
   * ```
   * `en.name` = `Kin`   => `name`: {
   * `ja.name` = `キン`         `en`: `Kin`,
   *                           `ja`: `キン`
   *                         }
   * ```
   */
  processNodeLanguageKeys(path: string, vertex: Record<string, any>) {
    const languageKeyedFields =
      ["address", "location", "name", "nicknames", "oldnames", "othernames"]
    const possibleLanguageVertexFields = languageKeyedFields
      .map(field => supportedLanguages.map(language => `${language}.${field}`))
      .reduce((a, b) => a.concat(b), [])
    const inputLanguageVertexFields = Object.keys(vertex)
      .filter(field => possibleLanguageVertexFields.includes(field))
    inputLanguageVertexFields.map(field => {
      const language = field.split(".")[0] as Language
      const suffix = field.split(".")[1]
      switch(suffix) {
        case "address":
        case "location":
          this.processNodeLanguageString(vertex, field, suffix, language as Language)
          break
        case "name":
          this.processNodeLanguageString(vertex, field, suffix, language as Language)
          const name = vertex[suffix][language] as string
          this.processName(path, name)
          break
        case "nicknames":
        case "oldnames":
        case "othernames":
          this.processNodeLanguageList(vertex, field, suffix, language as Language)
          const nameList = vertex[suffix][language] as string[]
          nameList.forEach(name => this.processName(path, name))
          break
        default:
          throw new Error(`ERR: unrecognized input field: ${field}`)
      }
    })
    // Once all language fields are processed, delete the input fields that
    // correspond to contents from the flat-text files
    inputLanguageVertexFields.forEach(field => { delete vertex[field] })
  }

  /** 
   * Add language-prefixed `${language}.name` value to the contents of the
   * `name` field on this vertex. The `address` and `location` fiels use very
   * similar logic.
   */
  processNodeLanguageString(
    vertex: Record<string, any>,
    field: string,
    suffix: string,
    language: Language
  ) {
    const name: NameByLanguage = {}
    name[language] = vertex[field]
    vertex[suffix] = {...vertex[suffix], ...name}
  }

  /** 
   * Add language-prefixed `${language}.nicknames` value to the contents of the
   * `nicknames` field on this vertex. The `oldnames` and `othernames` fields
   * use very similar logic.
   */
  processNodeLanguageList(
    vertex: Record<string, any>,
    field: string,
    suffix: string,
    language: Language
  ) {
    const nameList: NameListByLanguage = {}
    nameList[language] = vertex[field].split(", ")
    vertex[suffix] = {...vertex[suffix], ...{nameList}}
  }

  /**
   * When importing data from plaintext files with `[links]` data, convert any
   * primitive values into types we can better use or validate in TypeScript.
   */
  reviveLinksNode(key: string, value: unknown, section?: string): any {
    if (section != "links")
      return value   // Shouldn't happen
    switch (key) {
      case "language.order":
        return (value as string).split(", ") as Language[]
      default:
        return value
    }
  }

  /**
   * When importing data from plaintext files with `[media]` data, convert any
   * primitive values into types we can better use or validate in TypeScript.
   */
  reviveMediaNode(key: string, value: unknown, section?: string): any {
    if (section != "media")
      return value   // Shouldn't happen
    switch (true) {
      case (key.includes("commitdate")):
        return new Date(value as string)
      case (key.includes("location")):
      case (key.includes("tags")):
        return (value as string).split(", ")
      default:
        return value
    }
  }

  /**
   * When importing data from plaintext files with `[panda]` data, convert any
   * primitive values into types we can better use or validate in TypeScript.
   */
  revivePandaNode(key: string, value: unknown, section?: string): any {
    if (section != "panda")
      return value   // Shouldn't happen
    switch (true) {
      case (key.includes("birthday")):
      case (key.includes("commitdate")):
      case (key.includes("death")):
        return new Date(value as string)
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
   * primitive values into types we can better use or validate in TypeScript.
   */
  reviveWildNode(key: string, value: unknown, section?: string): any {
    if (section != "wild")
      return value   // Shouldn't happen
    switch (true) {
      case (key.includes("commitdate")):
        return new Date(value as string)
      case (key == "language.order"):
        return (value as string).split(", ") as Language[]
      default:
        return value
    }
  }

  /**
   * When importing data from plaintext files with `[zoo]` data, convert any
   * primitive values into types we can better use or validate in TypeScript.
   */
  reviveZooNode(key: string, value: unknown, section?: string): any {
    if (section != "zoo")
      return value   // Shouldn't happen
    switch (true) {
      case (key.includes("closed")):
      case (key.includes("commitdate")):
        return new Date(value as string)
      case (key == "language.order"):
        return (value as string).split(", ") as Language[]
      case (key.includes("tags")):
        return (value as string).split(", ")
      default:
        return value
    }
  }

  verifyLinks() {
    this.assertNoDuplicateDatasetIds(
      this.data.vertices.filter(v => v.type == "link"))
  }

  verifyMedia() {
    this.assertNoDuplicateDatasetIds(
      this.data.vertices.filter(v => v.type == "media"))
  }

  verifyPanda() {
    this.assertNoDuplicateDatasetIds(
      this.data.vertices.filter(v => v.type == "panda"))
  }

  verifyWilds() {
    this.assertNoDuplicateDatasetIds(
      this.data.vertices.filter(v => v.type == "wild"))
  }

  verifyZoos() {
    this.assertNoDuplicateDatasetIds(
      this.data.vertices.filter(v => v.type == "zoo"))
  }
}

if (import.meta.main) {
  const dataset = new Dataset()
}

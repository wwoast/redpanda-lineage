import * as ini from '@std/ini'
import { join } from '@std/path'
import { git } from '@roka/git'
import { Paths,
         ensureLanguage,
         ensureNodeType,
         existsDirSync, existsFileSync } from './shared.ts'

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
  lexer_names: string[],
  links: NodeLinks[],
  media: NodeMedia[],
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
  lexer_names: [],
  /** NodeLinks vertices */
  links: [],
  /** NodeMedia vertices */
  media: [],
  /** Indices or counters of relevant photo data */
  photos: photoMetrics,
  /** Tracking totals */
  totals: totalsMetrics,
  /** Tracking update counts */
  updates: updatesMetrics
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
 * creates a JSON file intended for family tree querying.
 */
class Dataset {
  data: Graph = {
    /** Edges represent living arrangements or family kinship relationships */
    edges: [],
    /** Vertices represent entities (animals/zoos) */
    vertices: []
  }
  /** Lists of files ingested during an ingest */
  files = files
  /** Pre-calculated metrics for the redpandafinder dataset */
  rpf = rpf

  constructor() {
    this.buildGraph()
  }

  assertNoDuplicateDatasetIds(vertices: GraphNode[]) {
    const duplicateIds = vertices
      .map(v => v._id)
      .filter((id, _, list) => list.indexOf(id) != list.lastIndexOf(id))
    if (duplicateIds.length > 0) {
      const duplicateNames = vertices
        .filter(v => duplicateIds.includes(v._id))
        .map(v => v.name["en"])
      throw new Error(
        `ERR: duplicate ids for en.names: ${duplicateNames.join(", ")}`)
    }
  }

  /** Read in all files to build a red panda graph */
  buildGraph() {
    this.importTree(Paths.links, this.importLinks, this.verifyLinks)
  }

  /**
   * Take a single links file and add it to the dataset.
   *
   * Links files are expected to have a header of `[links]`. Any fields defined
   * under that header will be consumed into the list of links. We keep all
   * fields in the `[links]` section as strings.
   */
  importLinks(path: string) {
    const ingest = ini.parse(Deno.readTextFileSync(path), {reviver: this.reviveNode})
    this.rpf.links.push(ingest.links as NodeLinks)
    this.data.vertices.push(ingest.links as NodeLinks)
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
   * When importing data from plaintext files, convert language-prefixed fields
   * like _address_, _location_, _name_, _nicknames_, and _othernames_, and
   * make them language-keyed properties instead.
   */
  reviveNode(key: string, value: unknown, section?: string): any {
    if (!section || !ensureNodeType(section))
      return value   // Shouldn't happen
    if (key.includes(".")) {
      const split = key.split(".")
      const prefix = split[0]
      const suffix = split.slice(1).join(".")
      if (ensureLanguage(prefix))
        return this.reviveNodeLanguage(key, value)

    }
  }

  // TODO: I need to set a new value on the ingest, so maybe reviver no worky
  reviveNodeLanguage(suffix: string, value: unknown) {
    switch(suffix) {
      case "address":
        return this.reviveNodeAddress(suffix, value)
      case "name":
        return this.reviveNodeName(suffix, value)
      case "nicknames":
        return this.reviveNodeNicknames(suffix, value)
      default:
        return value      
    }
  }

  // TODO: need access to all the other key/value things
  reviveNodeName(key: string, value: unknown): NameByLanguage {
    
  }

  verifyLinks() {
    this.assertNoDuplicateDatasetIds(this.rpf.links)
  }
}

if (import.meta.main) {
  const dataset = new Dataset()
}
/
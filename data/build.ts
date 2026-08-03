import Graph from './dagoba.ts'
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
 * tracked in the _redpanda-lineage_ repository. Unlike previous Python
 * versions of the redpandafinder JSON-dataset build script, the export of
 * this process is the Dagoba graph database serialized to disk. This gives
 * our builder script the ability to use graph queries to determine correctness
 * of the input data.
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
 * primitive and object types for use in TypeScript. It also canonicalizes
 * many of the values, and removes null content to save space.
 * 
 * In general, any validity checks we can enforce on single pandas or zoos in
 * the graph, we do as the data is imported. TOWRITE: `validate.ts` to do
 * full graph validation logic.
 * 
 * TODO: treat all RPF ids as numbers, and use the type discriminator plus
 * the id number to determine the full identifier of all items. This means ids
 * might be missing if there's a conflict between zoos and wilds, or zoos and
 * pandas. But this should be OK as long as the ids themselves don't encode
 * type information. 
 */
interface Dataset {
  /** The actual _Dagobah_ graph and methods, with vertex and edge lists */
  graph: Graph,
  /** Lists of files ingested during an ingest */
  files: Record<string, string[]>,
  /** Pre-calculated metrics for the redpandafinder dataset */
  rpf: RedPandaFinderMetrics
}
class Dataset {
  graph
  files = files
  rpf = rpf

  /** 
   * Read in all files to build a red panda graph. Verification of panda data
   * requires location records to be read first.
   */
  constructor() {
    this.graph = new Graph()
    this.importTree(Paths.zoos, this.importZoos, this.verifyZoos)
    this.importTree(Paths.wilds, this.importWilds, this.verifyWilds)
    this.importTree(Paths.pandas, this.importPanda, this.verifyPanda)
    this.importTree(Paths.media, this.importMedia, this.verifyMedia)
    this.importTree(Paths.links, this.importLinks, this.verifyLinks)
  }

  /**
   * The reviver functions convert fields that should be dates into `Date()`
   * objects, but we assert valid dates in the `process*` functions so that
   * the debugging output doesn't suck.
   */
  assertDateExistsAndIsValid(path: string, key: string, value: string) {
    if (!value)
      throw new Error(`ERR: ${path}: missing date: ${key}`)
    const date = new Date(value)
    if (date.toString() == 'Invalid Date')
      throw new Error(`ERR: ${path}: invalid YYYY/MM/DD date: ${key}: ${value}`)
  }

  /** If date is present, assure it is checked */
  assertDateIsValid(path: string, key: string, value: string) {
    if (!value) return   // no check
    else return this.assertDateExistsAndIsValid(path, key, value)
  }

  /** 
   * All litters should be born to the same parents, no more than two days
   * apart from each other. Will also complain if any litter id values don't
   * point to an actual panda.
   */
  assertGraphHasFeasibleLitters() {
    function compareLittermateBirthdays(a: string, b: string): boolean {
      // wild-caught litters may not have known birthdays
      if ((a == "unknown") || (b == "unknown"))
        return true
      const dateA = new Date(a)
      const dateB = new Date(b)
      // one day, in milliseconds
      const maxLitterDifference =  1000 * 60 * 60 * 24
      // If either date is invalid, this will return false
      return (Math.abs(dateB.getTime() - dateA.getTime()) > maxLitterDifference)
    }
    const litterEdges = this.graph.edges.filter(edge => edge._label == "litter")
    const seen_pairs: [number, number][] = []
    litterEdges.map(edge => {
      // in the graph, edges point to vertexes
      const pair: [number, number] = [edge._in._id, edge._out._id]
      if (pair.filter(value => value == undefined).length > 0)
        throw new Error(`ERR: possible misrecorded litter value: ${edge}`)
      if (!seen_pairs.includes(pair))
        if (!compareLittermateBirthdays(edge._in.birthday, edge._out.birthday))
          throw new Error(
            `ERR: litter birthdays don't match: ` + 
            `${edge._in._id}: ${edge._in.name["en"]}, ` + 
            `${edge._out._id}: ${edge._out.name["en"]}`)
    })
  }

  /** 
   * For each panda, verify it has no children who are their own parents or
   * grandparents.
   */
  assertGraphHasNoCycles() {
    const reviewedIds = new Set<string>()
    // Family _out edges indicate pandas have a child. Family _in edges
    // indicate that the panda is someone else's child.
    const pandas =
      this.graph.vertices.filter(vertex => vertex.type == "panda")
        .sort((v1, v2) => v1._id - v2._id)
    // Detect children to mothers who were dead more than 48 hours before the
    // panda themselves were born
    
  }

  /**
   * Verify children weren't born more than 48 hours after the mother passed
   * away (fathers can pass away before the child is born).
   */
  assertGraphHasNoZombieChildren() {
    const pandas =
      this.graph.vertices.filter(vertex => vertex.type == "panda")
        .sort((v1, v2) => v1._id - v2._id)
    const zombies = pandas.map(panda =>
      this.graph.v(panda).in("family")
        .filter((relative: NodePanda) => relative.gender == "Female")
        .filter((mother: NodePanda) => {
          const motherDeathdate = new Date(mother.death ?? panda.birthday).getTime()
          const childBirthdate = new Date(panda.birthday).getTime()
          const maxWindow = 1000 * 60 * 60 * 24 * 2   // two days, in millisenconds
          if (isNaN(childBirthdate) || isNaN(motherDeathdate))
            return false
          if (childBirthdate - motherDeathdate > maxWindow)
            return true
        })
    )
    if (zombies.length > 0) {
      throw new Error(
        `ERR: Mothers died before children were born:\n` +
        zombies.map(zombie => `\t${zombie.id}: ${zombie.name["en"]}\n`))
    }
  }

  /** If the link for an author is not a recognized URL format, throw */
  assertImportedAuthorLink(path: string, link: string) {
    const validLinkProtocols = ["http://", "https://", "ig://"]
    const match = validLinkProtocols.filter(
      protocol => link.indexOf(protocol) == 0)
    if (match.length == 0)
      throw new Error(`ERR: ${path}: ${link}: not a valid URL`)
  }

  /** Any animal name is limited to 100 characters in length at import */
  assertImportedName(path: string, name: string) {
    if (name.length > 100)
      throw new Error(`ERR: ${path}: name too long: ${name}`)
  }

  /** 
   * Panda date checks for a single animal:
   *
   *   - All dates for an animal should be valid
   * 
   *   - Birth date and date of death should not be reversed.
   */
  assertIndividualPandaDates(vertex: Record<string, any>) {
    this.assertDateExistsAndIsValid(vertex.path, "birthday", vertex.birthday)
    this.assertDateExistsAndIsValid(vertex.path, "commitdate", vertex.commitdate)
    // Animals that passed away need valid dates of death
    if (vertex.death) {
      this.assertDateExistsAndIsValid(vertex.path, "death", vertex.death)
      if (vertex.birthday > vertex.death)
        throw new Error(`ERR: ${vertex.path}: birthday occurs after date of death`)
    }
  }

  /** Complain if two vertices in the graph have the same `_id` value */
  // TODO: unify GraphNode types with Vertex types
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

  /** Panda and Zoo ids must be integers */
  assertValidPandaOrZooId(path: string, key: string, value: string) {
    if (isNaN(parseInt(value)))
      throw new Error(`ERR: ${path}: ${key}: invalid id: ${value}`)
  }

  /** 
   * Animals w/o location fields need birthplace and current zoo to match.
   * Unknown birthplaces (-1) are omitted from this check.
   */
  assertYoungPandaLocation(vertex: Record<string, any>) {
    if (!vertex.locations && vertex.birthplace != -1)
      if (vertex.birthplace != vertex.zoo)
        throw new Error(
          `ERR: ${vertex.path}: for new pandas, birthplace and zoo should be the same`)
  }

  /** Unknown genders are inferred by their omission */
  canonicalizeGender(vertex: Record<string, any>) {
    if (vertex.gender == "f") vertex.gender = "Female"
    if (vertex.gender == "m") vertex.gender = "Male"
  }

  /** 
   * Print a warning, and return true if the field has a URL. Assert functions
   * can wrap this to enforce / throw if they like.
   */
  checkFieldIsAUrl(path: string, key: string, value: string, warn: boolean) {
    const urlCheck = (value.indexOf("http") == 0)
    if (urlCheck == true && warn)
      console.warn(`WARN: ${path}: ${key} should not be a URL`)
    return urlCheck
  }

  /** Shrink export JSON by eliding any unkown/none values where possible */
  deleteNoneOrUnknownFields(vertex: Record<string, any>) {
    const undesirables = ["none", "unknown"]
    Object.keys(vertex).forEach(key =>
      undesirables.includes(vertex[key]) && delete vertex[key])
  }

  /**
   * For pandas, litter/siblings/children relationships get edges. Eventually
   * the parent relationships may as well. The tracking of panda ids in these
   * lists as numbers, happens here.
   */
  edgesForPandaFamilies(vertex: Record<string, any>) {
    if (vertex.children) {
      vertex.children.map((item: string) => {
        if (item.includes("/")) {
          const [childId, childPercent] = vertex.children.trim().split(" ")
          this.graph.addEdge({
            "_in": parseInt(childId),
            "_label": "family",
            "_out": vertex._id,
            "probability": childPercent
          })
        } else {
          const childId = item
          this.graph.addEdge({
            "_in": parseInt(childId),
            "_label": "family",
            "_out": vertex._id
          })
        }
      })
    }
    if (vertex.litter) {
      vertex.litter.map((litterId: string) => this.graph.addEdge({
        "_in": parseInt(litterId),
        "_label": "litter",
        "_out": vertex._id
      }))
    }
  }

  /** 
   * Turn birthplace and zoo into edges that point from a panda, to a zoo
   * entity. Zoo edges have negative numbers
   */
  edgesForPandaLocations(vertex: Record<string, any>) {
    if (vertex.birthplace) {
      // Wild locations are string IDs
      if (vertex.birthplace.indexOf("wild") == 0) {
        this.graph.addEdge({
          "_in": vertex.birthplace,
          "_label": "birthplace",
          "_out": vertex._id
        })
      // Zoo IDs are cast to negative numbers when added to the graph
      } else {
        this.graph.addEdge({
          "_in": parseInt(vertex.birthplace) * -1,
          "_label": "birthplace",
          "_out": vertex._id
        })
      }
      // Now tracked as an edge, not a vertex property
      delete vertex.birthplace
    }
    // Zoo IDs are cast to negative numbers when added to the graph
    if (vertex.zoo) {
      this.graph.addEdge({
        "_in": parseInt(vertex.zoo) * -1,
        "_label": "zoo",
        "_out": vertex._id
      })
      // Now tracked as an edge, not a vertex property
      delete vertex.zoo
    }
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
    this.graph.addVertex(node)
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
    this.graph.addVertex(node)
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
    this.graph.addVertex(node)
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
    this.graph.addVertex(node)
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
    this.graph.addVertex(node)
    this.files.links.push(path)
  }

  /** Increment the panda/zoo/media/wild counts */
  incrementEntityMetrics(vertex: Record<string, any>) {
    const entityMetric = 
      (vertex.type == "panda") ? "pandas" :
      (vertex.type == "zoo") ? "zoos" :
      (vertex.type == "media") ? "media" :
      (vertex.type == "wild") ? "wild" :
      undefined
    if (entityMetric != undefined)
      this.rpf.totals[entityMetric]++
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
    // For easier diagnostics, record the path a node's data originated from
    vertex.path = path
    // Ship the type with the graph node prior to processing
    vertex.type = type
    this.processNodeLanguageKeys(vertex)
    this.incrementEntityMetrics(vertex)
    // No processing for links nodes _shrug_
    switch(vertex.type) {
      case "media":
        this.processNodePhotos(vertex)
        break
      case "panda":
        this.assertIndividualPandaDates(vertex)
        this.processNodePhotos(vertex)
        this.processNodeLocations(vertex)
        this.assertYoungPandaLocation(vertex)
        this.edgesForPandaFamilies(vertex)
        this.edgesForPandaLocations(vertex)
        this.deleteNoneOrUnknownFields(vertex)
        this.canonicalizeGender(vertex)
        break
      case "wild":
        this.processNodePhotos(vertex)
        break
      case "zoo":
        this.processNodePhotos(vertex)
        this.assertDateIsValid(path, "closed", vertex.closed)
        break
      default:
        break
    }
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
  processNodeLanguageKeys(vertex: Record<string, any>) {
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
          this.processName(vertex.path, name)
          break
        case "nicknames":
        case "oldnames":
        case "othernames":
          this.processNodeLanguageList(vertex, field, suffix, language as Language)
          const nameList = vertex[suffix][language] as string[]
          nameList.forEach(name => this.processName(vertex.path, name))
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
    // Once `name[en]` is written, delete `en.name`
    delete vertex[`${language}.${field}`]
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
    // Once `nicknames[en] is written, delete `en.nicknames`
    delete vertex[`${language}.${field}`]
  }

  /** 
   * For a panda, convert `location.X` blocks to an array of locations the
   * panda has lived at. Throws if dates or zoo ids are malformed, or if the
   * `birthday` field of the panda doesn't match.
   */
  processNodeLocations(vertex: Record<string, any>) {
    vertex.locations = []
    // Iterate on just the `location.X` fields
    const locationKeys = Object.keys(vertex).filter(key => key.match(/location\.\d+$/))
    locationKeys.forEach(locationKey => {
      const [zoo, dateString] = vertex[locationKey].split(", ")
      this.assertValidPandaOrZooId(vertex.path, locationKey, zoo)
      this.assertDateExistsAndIsValid(vertex.path, locationKey, dateString)
      if (dateString != vertex.birthday)
        throw new Error(
          `ERR: ${vertex.path}: ${locationKey}: doesn't match birthday: ${vertex.birthday}`)
      const location = {
        zoo: zoo,
        date: dateString
      }
      vertex.locations.push(location)
      // Check the last location matches the most recent zoo
      if (locationKeys.indexOf(locationKey) == locationKeys.length - 1)
        if (location.zoo != vertex.zoo)
          throw new Error(
            `ERR: ${vertex.path}: ${locationKey}: doesn't match zoo ${vertex.zoo}`)
      // Once location[] is written, delete the old location key
      delete vertex[locationKey]
    })
  }

  /** 
   * Convert `photo.X` blocks to an array of photo values. Warns if any of the
   * author fields are URLs and not straight strings, and throws if the
   * commitdate is not valid.
   */
  processNodePhotos(vertex: Record<string, any>) {
    vertex.photos = []
    // Iterate on just the `photo.X:` fields
    Object.keys(vertex).filter(key => key.match(/photo\.\d+$/)).forEach(photoKey => {
      // Increment photo and author credits, if the author field isn't borked
      const author = vertex[`${photoKey}.author`]
      if (this.checkFieldIsAUrl(vertex.path, `${photoKey}.author`, author, true) == false) {
        this.rpf.photos.credit[author]++
        this.rpf.totals.photos++
      }
      // Throw if the commitdate is missing or fat-fingered
      const commitdate = vertex[`${photoKey}.commitdate`]
      this.assertDateExistsAndIsValid(vertex.path, `${photoKey}.commitdate`, commitdate)
      // Turn `photo.1` into the first item in the photos array
      const photo = <Photo>{
        author: author,
        commitdate: commitdate,
        source: vertex[`${photoKey}.link`],
        tags: vertex[`${photoKey}.tags`].split(", "),
        url: vertex[`${photoKey}`]
      }
      vertex.photos.push(photo)
    })
    // Once photos[] is written, delete all old photo keys
    Object.keys(vertex).filter(key => key.match(/photo\./))
      .forEach(oldPhotoKey => delete vertex[oldPhotoKey])
  }

    /**
   * For each `photo.X.author` field in a vertex, increment the counters
   * for an author and for totals. Requires `processNodePhotos` to run
   * for the metric collecting to work.
   */
  incrementPhotoMetrics(vertex: Record<string, any>) {
    Object.keys(vertex)
      .filter(field => field.endsWith(".author"))
        .map(field => {
          const author = vertex[field] as string
          this.rpf.photos.credit[author]++
          this.rpf.totals.photos++
        })
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
      case (key.includes("_id")):
        return parseInt(value as string)
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
   * primitive values into types we can better use or validate in TypeScript.
   */
  reviveWildNode(key: string, value: unknown, section?: string): any {
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
   * primitive values into types we can better use or validate in TypeScript.
   *
   * Note the hack for ensuring all connected graph data has integers while
   * zoo IDs and panda IDs don't collide -- zoo IDs become negative numbers!
   */
  reviveZooNode(key: string, value: unknown, section?: string): any {
    if (section != "zoo")
      return value   // Shouldn't happen
    switch (true) {
      case (key.includes("_id")):
        return parseInt(value as string) * -1
      case (key == "language.order"):
        return (value as string).split(", ") as Language[]
      case (key.includes("tags")):
        return (value as string).split(", ")
      default:
        return value
    }
  }

  verifyLinks() {
    const linksNodes = this.graph.vertices.filter(v => v.type == "link")
    this.assertNoDuplicateDatasetIds(linksNodes)
  }

  verifyMedia() {
    const mediaNodes = this.graph.vertices.filter(v => v.type == "media")
    this.assertNoDuplicateDatasetIds(mediaNodes)
  }

  verifyPanda() {
    const pandaNodes = this.graph.vertices.filter(v => v.type == "panda")
    this.assertNoDuplicateDatasetIds(pandaNodes)
    this.assertGraphHasFeasibleLitters()
    this.assertGraphHasNoCycles()
  }

  verifyWilds() {
    const wildNodes = this.graph.vertices.filter(v => v.type == "wild")
    this.assertNoDuplicateDatasetIds(wildNodes)
  }

  verifyZoos() {
    const zooNodes = this.graph.vertices.filter(v => v.type == "zoo")
    this.assertNoDuplicateDatasetIds(zooNodes)
  }
}

if (import.meta.main) {
  const dataset = new Dataset()
}

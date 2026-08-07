import Graph, { cleanEdge, cleanVertex } from './dagoba.ts'
import { IniMap } from '@std/ini/ini-map'
import { join } from '@std/path'
import { Commit, Git, Patch, git } from '@roka/git'
import { PhotoEntry } from './photos.ts'
import { Paths,
         byIdAscending,
         existsDirSync,
         existsFileSync, 
         supportedLanguages,
         toLinks,
         toMedia,
         toPandas,
         toPhotoEntities,
         toWilds,
         toZoos } from './shared.ts'

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
  /** Total number of photos in redpandafinder */
  photos: 0,
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
  /** Most recently born animal being tracked */
  last_born: number,
  /** Most recently passed-away animal being tracked */
  last_died: number,
  /** Complex names with spaces which the lexer needs to handle */
  lexer_names: Set<string>,
  /** Indices or counters of relevant photo data */
  photos: PhotoMetrics,
  /** Tracking totals */
  totals: Record<string, number>,
  /** Tracking update counts */
  updates: Record<string, number>
}
/** Data specifically for redpandafinder use */
const rpf: RedPandaFinderMetrics = {
  last_born: 1970,
  last_died: 1970,
  lexer_names: new Set<string>(),
  photos: photoMetrics,
  totals: totalsMetrics,
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
  /** Lists of files ingested during an ingest */
  files: Record<string, string[]>,
  /** The actual _Dagobah_ graph and methods, with vertex and edge lists */
  graph: Graph,
  /** The default ini parser can't handle colon-delimited key-value pairs */
  ini: IniMap,
  /** Pre-calculated metrics for the redpandafinder dataset */
  rpf: RedPandaFinderMetrics
}
class Dataset {
  graph
  files = files
  ini
  rpf = rpf

  /** 
   * Read in all files to build a red panda graph. Verification of panda data
   * requires location records to be read first.
   */
  constructor() {
    this.graph = new Graph()
    this.ini = new IniMap({assignment: ":"})
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
  assertDateExistsAndIsValid = (path: string, key: string, value: string) => {
    const seasons = ["Spring", "Summer", "Fall", "Winter"]
    if (!value)
      throw new Error(`ERR: ${path}: missing date: ${key}`)
    if (value == "unknown")
      return   // We don't know what we don't know
    if (seasons.includes(value.split("/")[1]))
      return   // Rough season value
    const date = new Date(value)
    if (date.toString() == 'Invalid Date')
      throw new Error(`ERR: ${path}: invalid YYYY/MM/DD date: ${key}: ${value}`)
    // When we have valid dates, try to update our most recently born/died year
    this.checkBirthAndDeathDates(key, date)
  }

  /** If date is present, assure it is checked */
  assertDateIsValid = (path: string, key: string, value: string) => {
    if (!value) return   // no check
    else return this.assertDateExistsAndIsValid(path, key, value)
  }

  /** 
   * All litters should be born to the same parents, no more than two days
   * apart from each other. Will also complain if any litter id values don't
   * point to an actual panda.
   */
  assertGraphHasFeasibleLitters = () => {
    /** Return false if outside the max litter difference */
    function compareLittermateBirthdays(a: string, b: string): boolean {
      // wild-caught litters may not have known birthdays
      if ((a == "unknown") || (b == "unknown"))
        return true
      const dateA = new Date(a).getTime()
      const dateB = new Date(b).getTime()
      // two days, in milliseconds. Koko and Seina at Chausuyama are apparently
      // littermates born two days apart!
      const maxLitterDifference =  1000 * 60 * 60 * 24 * 2
      // If either date is invalid, this will return false
      return (Math.abs(dateB - dateA) <= maxLitterDifference)
    }
    const litterEdges = this.graph.edges.filter(edge => edge._label == "litter")
    const seen_pairs: [number, number][] = []
    litterEdges.map(edge => {
      // in the graph, edges point to vertexes
      const pair: [number, number] = [
        (edge._in as NodePanda)._id,
        (edge._out as NodePanda)._id
      ]
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
   * Verify no pandas exist who are their own parents or grandparents.
   * TODO: do this efficiently, and track animals whose cycles have been
   * properly checked
   */
  assertGraphHasNoCycles = () => {
    // Family _out edges indicate pandas have a child. Family _in edges
    // indicate that the panda is someone else's child.
    const pandas = this.graph.vertices.reduce(toPandas, []).sort(byIdAscending)
    const cycleCheck = (seen: Set<number>, panda: NodePanda): NodePanda[] => {
      const parents = this.graph.v(panda).in("family").run() as NodePanda[]
      if (parents.length > 0) {
        // True if someone was their own parent
        const hasSeen = parents.map(p => p._id)
          .map(id => seen.has(id))
          .reduce((a, b) => a || b, false)
        if (hasSeen)
          return parents.filter(animal => seen.has(animal._id))
        else {
          parents.map(animal => seen.add(animal._id))
          return parents.flatMap(animal => cycleCheck(seen, animal))
        }          
      }
      return []   // No more parents to look through
    }
    // TODO: this algorithm is broken because its running multiple checks at
    // once, when the seen logic only works for one animal tree check at a time
    const seen = new Set<number>()
    const selfParents = pandas.flatMap(panda => {
      seen.add(panda._id)
      return cycleCheck(seen, panda)
    }).filter((panda, index, array) => array.indexOf(panda) === index)
    if (selfParents.length > 0) {
      throw new Error(
        `ERR: ensure these animals are not their own parents:\n` +
        selfParents.map(animal => `\t${animal._id}: ${animal.name["en"]}\n`)
      )
    }
  }

  /**
   * Verify children weren't born more than 48 hours after the mother passed
   * away (fathers can pass away before the child is born).
   */
  assertGraphHasNoZombieChildren = () => {
    const pandas = this.graph.vertices.reduce(toPandas, []).sort(byIdAscending)
    const zombies = pandas.flatMap(panda =>
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
        .run()
    )
    if (zombies.length > 0) {
      throw new Error(
        `ERR: Mothers died before children were born:\n` +
        zombies.map(zombie => `\t${zombie.id}: ${zombie.name["en"]}\n`))
    }
  }

  /** If the link for an author is not a recognized URL format, throw */
  assertImportedAuthorLink = (path: string, link: string) => {
    const validLinkProtocols = ["http://", "https://", "ig://"]
    const match = validLinkProtocols.filter(
      protocol => link.indexOf(protocol) == 0)
    if (match.length == 0)
      throw new Error(`ERR: ${path}: ${link}: not a valid URL`)
  }

  /** Any animal name is limited to 100 characters in length at import */
  assertImportedName = (path: string, name: string) => {
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
  assertIndividualPandaDates = (vertex: NodePanda) => {
    this.assertDateExistsAndIsValid(vertex.path, "birthday", vertex.birthday)
    this.assertDateExistsAndIsValid(vertex.path, "commitdate", vertex.commitdate)
    // Animals that passed away need valid dates of death
    if (vertex.death) {
      this.assertDateExistsAndIsValid(vertex.path, "death", vertex.death)
      if (vertex.birthday == "unknown" || vertex.death == "unknown")
        return   // We don't know what we don't know
      if (new Date(vertex.birthday).getTime() > new Date(vertex.death).getTime())
        throw new Error(`ERR: ${vertex.path}: birthday occurs after date of death`)
    }
  }

  /** Complain if two vertices in the graph have the same `_id` value */
  assertNoDuplicateDatasetIds = (vertices: GraphNode[]) => {
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
   * Checks the id value of a `location.X` field. Must be a positive integer
   * for a panda, negative integer for a zoo, `wild.X` for a wild location, or
   * `unknown` if we don't know.
   */
  assertValidPandaOrZooId = (path: string, key: string, value: string) => {
    if (value == "unknown")
      return   // We don't know what we don't know
    if (value.indexOf("wild") == 0)
      return   // Born in a wild place
    if (isNaN(parseInt(value)))
      throw new Error(`ERR: ${path}: ${key}: invalid id: ${value}`)
  }

  /** 
   * Animals w/o location fields need birthplace and current zoo to match.
   * Unknown birthplaces (-1) are omitted from this check.
   */
  assertYoungPandaLocation = (vertex: NodePanda) => {
    if (!vertex.locations && vertex.birthplace != "unknown")
      if (vertex.birthplace != vertex.zoo)
        throw new Error(
          `ERR: ${vertex.path}: for new pandas, birthplace and zoo should be the same`)
  }

  /** Unknown genders are inferred by their omission */
  canonicalizeGender = (vertex: NodePanda) => {
    if (vertex.gender == "f") vertex.gender = "Female"
    if (vertex.gender == "m") vertex.gender = "Male"
  }

  /**
   * Track which year the most recent panda was born or died. This informs how the
   * `born` or `died` keywords work when no year argument is provided.
   */
  checkBirthAndDeathDates(key: string, date: Date) {
    if (key == "birthday" && this.rpf.last_born < date.getFullYear())
      this.rpf.last_born = date.getFullYear()
    if (key == "death" && this.rpf.last_died < date.getFullYear())
      this.rpf.last_died = date.getFullYear()
  }

  /** 
   * Print a warning, and return true if the field has a URL. Assert functions
   * can wrap this to enforce / throw if they like.
   */
  checkFieldIsAUrl = (path: string, key: string, value: string, warn: boolean) => {
    const urlCheck = (value.indexOf("http") == 0)
    if (urlCheck == true && warn)
      console.warn(`WARN: ${path}: ${key} should not be a URL`)
    return urlCheck
  }

  /** Shrink export JSON by eliding any unkown/none values where possible */
  deleteNoneOrUnknownFields = (vertex: GraphNode) => {
    const undesirables = ["none", "unknown"]
    Object.keys(vertex).forEach(key =>
      undesirables.includes(vertex[key]) && delete vertex[key])
  }

  /**
   * For pandas, litter/siblings/children relationships get edges. Eventually
   * the parent relationships may as well. The tracking of panda ids in these
   * lists as numbers, happens here.
   */
  edgesForPandaFamilies = (vertex: NodePanda) => {
    if (vertex.children) {
      vertex.children.map((item: string) => {
        if (item.includes("/")) {
          const [childId, childPercent] = item.trim().split(" ")
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
  edgesForPandaLocations = (vertex: NodePanda) => {
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
   * Write a JSON representation of the red panda graph. The serial format of
   * the Dagoba graph is just writing cleaned vertexes and edges as lists. When
   * deserialized, Dagoba re-hydrates vertex ids with references to actual
   * vertex nodes.
   * 
   * Redpandafinder supplements this with various counters and indexes for
   * use in dataset metrics and searching.
   */
  exportJsonGraph = (exportPath: string, updates: Updates) => {
    const pandas = this.files.panda.length
    const wilds = this.files.wild.length
    const zoos = this.files.zoo.length
    const locations = wilds + zoos
    // Sort the keys in the photo credits set
    const photoCredits: Record<string, number> = Object.keys(this.rpf.photos.credit)
      .sort()
      .reduce((accumulator: Record<string, number>, key) => {
        accumulator[key] = this.rpf.photos.credit[key]
        return accumulator
      }, {})
    const totalCredits = Object.keys(this.rpf.photos.credit).length
    // Track entities by `<type>.id` in a single concatenated list
    const entityLocators = [
      ...updates.recent.media,
      ...updates.recent.panda,
      ...updates.recent.zoo
    ]
    // Anything not in a Dagoba graph object is keyed with an underscore
    Deno.writeTextFileSync(exportPath,
      JSON.stringify({
        _lexer: {
          names: Array.from(this.rpf.lexer_names).sort()
        },
        _photo: {
          credit: photoCredits,
          entity_max: this.rpf.photos.max,
          group_max: this.rpf.photos.group
        },
        _totals: {
          credit: totalCredits,
          last_born: this.rpf.last_born,
          last_died: this.rpf.last_died,
          locations: locations,
          media: this.files.media.length,
          pandas: pandas,
          photos: this.rpf.totals.photos,
          updates: {
            authors: updates.tallies.author,
            entities: entityLocators.length,
            pandas: updates.tallies.panda,
            photos: updates.tallies.photo,
            zoos: updates.tallies.zoo
          },
          wilds: wilds,
          zoos: zoos,
        },
        _updates: {
          authors: [...updates.recent.authors],
          entities: entityLocators,
          photos: [...updates.recent.photos]
        },
        // Clean the edges but save final string formatting to the end
        edges: JSON.parse(JSON.stringify(this.graph.edges, cleanEdge)),
        // Clean the vertices but save final string formatting to the end
        vertices: JSON.parse(JSON.stringify(this.graph.vertices, cleanVertex))
      })
    )
    console.log(
      `Dataset exported: ${pandas} pandas at ${locations} locations ` +
      `(${wilds} wild, ${zoos} zoo)`
    )
  }

  /**
   * Take a single links file and add it to the graph (just vertices).
   *
   * Links files are expected to have a header of `[links]`. Any fields defined
   * under that header will be consumed into the list of links. All fields in
   * the `[links]` section becomes `string` or `string[]`.
   */
  importLinks = (path: string) => {
    const ingest = this.ini.parse(
      Deno.readTextFileSync(path),
      this.reviveLinksNode
    ).toObject() as Record<"links", NodeLinks>
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
   * photos. All fields in the `[media]` section become `string` or `string[]`.
   */
  importMedia = (path: string) => {
    const ingest = this.ini.parse(
      Deno.readTextFileSync(path),
      this.reviveMediaNode
    ).toObject() as Record<"media", NodeMedia>
    // Revivers are good for establishing property types of existing keys, but
    // do processing to rearrange or set new-keys after parsing
    const node = this.processNode(path, ingest.media, "media") as NodeMedia
    this.graph.addVertex(node)
    this.files.media.push(path)
  }

  /**
   * Take a single panda file and add it to the dataset. The animals themselves
   * are vertices, and the family relationships and zoo living arrangement, are
   * all edges.
   *
   * Panda files are expected to have a header of `[panda]`. Any fields defined
   * under that header will be consumed into the list of graph nodes connected
   * to other family member and zoo nodes, with Dagoba edges. All fields in the
   * `[panda]` section become one of `number`, `string`, or `string[]`.
   */
  importPanda = (path: string) => {
    const ingest = this.ini.parse(
      Deno.readTextFileSync(path),
      this.revivePandaNode
    ).toObject() as Record<"panda", NodePanda>
    // Revivers are good for establishing property types of existing keys, but
    // do processing to rearrange or set new-keys after parsing
    const node = this.processNode(path, ingest.panda, "panda") as NodePanda
    this.graph.addVertex(node)
    this.files.panda.push(path)
  }

  /**
   * Given a starting path, import all files into the graph. By adjusting path
   * and import method, this is used to import either the panda data or the
   * zoo data.
   */
  importTree = (path: string, importMethod: Function, verifyMethod: Function) => {
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
   * Wild location files are expected to have a header of `[wild]`. Any fields
   * defined under that header will be consumed into the list of graph nodes
   * connected to other family member and zoo nodes, with Dagoba edges. All
   * fields in the `[wild]` section become either `string` or `string[]`.
   */
  importWilds = (path: string) => {
    const ingest = this.ini.parse(
      Deno.readTextFileSync(path),
      this.reviveWildNode
    ).toObject() as Record<"wild", NodeWild>
    // Revivers are good for establishing property types of existing keys, but
    // do processing to rearrange or set new-keys after parsing
    const node = this.processNode(path, ingest.wild, "wild") as NodeWild
    this.graph.addVertex(node)
    this.files.wild.push(path)
  }

  /**
   * Take a single zoo file and add it to the dataset.
   *
   * Zoo files are expected to have a header of `[zoo]`. Any fields defined
   * under that header will be consumed into the list of graph nodes connected
   * to other family member and zoo nodes, with Dagoba edges. All fields in the
   * `[zoo]` section become one of `number`, `string` or `string[]`.
   */
  importZoos = (path: string) => {
    const ingest =
      this.ini.parse(
        Deno.readTextFileSync(path),
        this.reviveZooNode
      ).toObject() as Record<"zoo", NodeZoo>
    // Revivers are good for establishing property types of existing keys, but
    // do processing to rearrange or set new-keys after parsing
    const node = this.processNode(path, ingest.zoo, "zoo") as NodeZoo
    this.graph.addVertex(node)
    this.files.zoo.push(path)
  }

  /**
   * - Enforce a length policy on names
   * 
   * - Add names with spaces as lexer token keys, for later searchability
   */
  processName = (path: string, name: string) => {
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
  processNode = (
    path: string,
    vertex: GraphNode,
    type: NodeType
  ): GraphNode => {
    // For easier diagnostics, record the path a node's data originated from
    vertex.path = path
    // Ship the type with the graph node prior to processing
    vertex.type = type
    this.processNodeLanguageKeys(vertex)
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
  processNodeLanguageKeys = (vertex: GraphNode) => {
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
          if (name)
            this.processName(vertex.path, name)
          break
        case "nicknames":
        case "oldnames":
        case "othernames":
          this.processNodeLanguageList(vertex, field, suffix, language as Language)
          const nameList: string[] = vertex[suffix][language] ?? []
          if (nameList.length > 0)
            nameList.forEach(name => this.processName(vertex.path, name))
          break
        default:
          throw new Error(`ERR: unrecognized input field: ${field}`)
      }
    })
  }

  /** 
   * Add language-prefixed `${language}.name` value to the contents of the
   * `name` field on this vertex. The `address` and `location` fiels use very
   * similar logic.
   */
  processNodeLanguageString = (
    vertex: GraphNode,
    field: string,
    suffix: string,
    language: Language
  ) => {
    const name: NameByLanguage = {}
    name[language] = vertex[field]
    vertex[suffix] = {...vertex[suffix], ...name}
    // Once `name[en]` is written, delete `en.name`
    delete vertex[`${language}.${suffix}`]
  }

  /** 
   * Add language-prefixed `${language}.nicknames` value to the contents of the
   * `nicknames` field on this vertex. The `oldnames` and `othernames` fields
   * use very similar logic.
   */
  processNodeLanguageList = (
    vertex: GraphNode,
    field: string,
    suffix: string,
    language: Language
  ) => {
    const nameList: NameListByLanguage = {}
    nameList[language] = vertex[field].split(", ")
    vertex[suffix] = {...vertex[suffix], ...nameList}
    // Once `nicknames[en] is written, delete `en.nicknames`
    delete vertex[`${language}.${suffix}`]
  }

  /** 
   * For a panda, convert `location.X` blocks to an array of locations the
   * panda has lived at. Throws if dates or zoo ids are malformed, or if the
   * `birthday` field of the panda doesn't match.
   */
  processNodeLocations = (vertex: NodePanda) => {
    vertex.locations = []
    // Iterate on just the `location.X` fields
    const locationKeys = Object.keys(vertex).filter(key => key.match(/location\.\d+$/))
    locationKeys.forEach(locationKey => {
      const [zoo, dateString] = vertex[locationKey].split(", ")
      this.assertValidPandaOrZooId(vertex.path, locationKey, zoo)
      this.assertDateExistsAndIsValid(vertex.path, locationKey, dateString)
      const location = {
        id: zoo,
        date: dateString
      }
      vertex.locations.push(location)
      // Check the first location date matches the birthday, if the birthday is known
      if ((locationKeys.indexOf(locationKey) == 0) && (vertex.birthday != "unknown"))
        if (dateString != vertex.birthday)
          throw new Error(
            `ERR: ${vertex.path}: ${locationKey}: doesn't match birthday: ${vertex.birthday}`)
      // Check the last location matches the most recent zoo or wild id
      if (locationKeys.indexOf(locationKey) == locationKeys.length - 1) {
        if (vertex.wild && location.id != vertex.wild)
          throw new Error(
            `ERR: ${vertex.path}: ${locationKey}: doesn't match wild ${vertex.wild}`)
        if (vertex.zoo && location.id != vertex.zoo)
          throw new Error(
            `ERR: ${vertex.path}: ${locationKey}: doesn't match zoo ${vertex.zoo}`)
      }
      // Once location[] is written, delete the old location key
      delete vertex[locationKey]
    })
  }

  /** 
   * Convert `photo.X` blocks to an array of photo values. Warns if any of the
   * author fields are URLs and not straight strings, and throws if the
   * commitdate is not valid.
   */
  processNodePhotos = (vertex: NodeMedia | NodePanda | NodeWild | NodeZoo) => {
    vertex.photos = []
    // Iterate on just the `photo.X:` fields
    Object.keys(vertex).filter(key => key.match(/photo\.\d+$/)).forEach(photoKey => {
      // Increment photo and author credits, if the author field isn't borked
      const author = vertex[`${photoKey}.author`]
      if (this.checkFieldIsAUrl(vertex.path, `${photoKey}.author`, author, true) == false) {
        this.rpf.photos.credit[author] = (this.rpf.photos.credit[author] ?? 0) + 1
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
        tags: vertex[`${photoKey}.tags`],
        url: vertex[`${photoKey}`]
      }
      vertex.photos.push(photo)
    })
    // Once photos[] is written, delete all old photo keys
    Object.keys(vertex).filter(key => key.match(/photo\./))
      .forEach(oldPhotoKey => delete vertex[oldPhotoKey])
  }

  /**
   * When importing data from plaintext files with `[links]` data, convert any
   * primitive values into more ergonomic TypeScript types.
   */
  reviveLinksNode = (key: string, value: unknown, section?: string): any => {
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
  reviveMediaNode = (key: string, value: unknown, section?: string): any => {
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
  revivePandaNode = (key: string, value: unknown, section?: string): any => {
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
   * primitive values into more ergonomic TypeScript types.
   */
  reviveWildNode = (key: string, value: unknown, section?: string): any => {
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
  reviveZooNode = (key: string, value: unknown, section?: string): any => {
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

  verifyLinks = () => {
    const linksNodes = this.graph.vertices.reduce(toLinks, [])
    this.assertNoDuplicateDatasetIds(linksNodes)
  }

  verifyMedia = () => {
    const mediaNodes = this.graph.vertices.reduce(toMedia, [])
    this.assertNoDuplicateDatasetIds(mediaNodes)
  }

  verifyPanda = () => {
    const pandaNodes = this.graph.vertices.reduce(toPandas, [])
    this.assertNoDuplicateDatasetIds(pandaNodes)
    // No more nodes left to process, so the edges will have real pointers
    pandaNodes.map(vertex => {
      this.edgesForPandaFamilies(vertex)
      this.edgesForPandaLocations(vertex)
    })
    // Now we can do tests with the edges
    this.assertGraphHasFeasibleLitters()
    this.assertGraphHasNoZombieChildren()
    // this.assertGraphHasNoCycles()
    // After edges are processed, kill any unknown fields
    pandaNodes.map(vertex => this.deleteNoneOrUnknownFields(vertex))
  }

  verifyWilds = () => {
    const wildNodes = this.graph.vertices.reduce(toWilds, [])
    this.assertNoDuplicateDatasetIds(wildNodes)
  }

  verifyZoos = () => {
    const zooNodes = this.graph.vertices.reduce(toZoos, [])
    this.assertNoDuplicateDatasetIds(zooNodes)
  }
}

/** 
 * On the redpandafinder front page, we want to show content contributed in the
 * last week. Some of this we can determine from doing a git diff on the last
 * seven days of commits. For authors, we lean into the entity graph. 
 */
interface Updates {
  /** The most recent `HEAD` commit in the _redpanda-lineage_ git repository */
  currentCommit: Commit | undefined
  /** The current epoch in milliseconds, for seeing what is a week old */
  currentTime: number,
  /** The earliest clock time for something to be considered fresh */
  earliestTime: number,
  /** The patch diff between the current commit and the prior commit */
  patches: Patch[]
  /** Time range for updates to be fresh (7 days in ms by default) */
  period: number
  /** The most recent commit newer than the `period` time range. */
  priorCommit: Commit | undefined
  /** Tracking which entities or photo locators have new content */
  recent: Record<string, Set<string>>
  /** The git repo to iterate on */
  repo: Git
  /** Tallies for updated content */
  tallies: Record<string, number>
}
class Updates {
  currentCommit: Commit | undefined
  period = 1000 * 60 * 60 * 24 * 7  // 7 days in milliseconds
  priorCommit: Commit | undefined
  repo: Git

  constructor() {
    this.repo = git()
    this.currentTime = new Date().getTime()
    this.earliestTime = this.currentTime - this.period
    this.recent = {}
    this.tallies = {}
    // Create sets and tallies for any content we want track updates about
    const updateTypes = ["authors", "media", "panda", "photos", "wild", "zoo"]
    updateTypes.map(type => {
      this.recent[type] = new Set<string>
      this.tallies[type] = 0
    })
  }

  /** 
   * `@roka/git` heavily uses async logic, which is not permitted in the
   * constructor method. So we "build" the diff results instead.
   */
  build = async (graph: Graph) => {
    this.currentCommit = await this.repo.commit.get("HEAD")
    this.priorCommit = await this.#startingCommit()
    // Memory use quickly gets out of hand when commits get busy, especially with
    // redpanda.json being on the path. So restrict the possible paths
    this.patches = await this.repo.diff.patch({
      from: this.priorCommit,
      to: this.currentCommit,
      path: [Paths.links, Paths.media, Paths.pandas, Paths.wilds, Paths.zoos]
    })
    // Simultaneously process update determination from git commits, and the
    // full graph processing for determining who the new contributors are.
    await Promise.all([
      this.#determineUpdates(),
      this.#newContributors(graph)
    ])
  }

  #determineUpdates = async () => {
    for (const change of this.patches) {
      const filename = change.path
      // Don't care about non-data files
      if (!filename.endsWith(".txt"))
        continue
      // Don't care about lines we removed
      else if (change.stats && change.stats.added == 0)
        continue
      // Don't care about files removed
      else if (!existsFileSync(change.path))
        continue
      // Don't care if there are no hunks
      else if (!change.hunks)
        continue
      else
        for (const hunk of change.hunks)
          for (const line of hunk.lines)
            if (line.type == "added")
              this.#processRawLine(filename, line.content)
    }
  }

  /**
   * To correctly determine whether a contributor is new to redpandafinder,
   * we need to look at commitdates on every single photo they've sumbitted,
   * across all entities, and then see if their contributions this week match
   * the number of contributions they've had total.
   */
  #newContributors = async (graph: Graph) => {
    // Map of photo locator to PhotoEntry object
    const authorToEarliestCommit: Record<string, number> = {}
    const nodes = graph.vertices.reduce(toPhotoEntities, [])
    nodes.map(node => {
      node.photos.map(photo => {
        const { author, commitdate } = photo
        const committime = new Date(commitdate).getTime()
        // Set the oldest posisble time for a photo commit date per author
        if (!Object.keys(authorToEarliestCommit).includes(author))
          authorToEarliestCommit[author] = committime
        else if (authorToEarliestCommit[author] > committime)
          authorToEarliestCommit[author] = committime          
      })
    })
    const newContributors = Object.keys(authorToEarliestCommit)
      .filter(author => authorToEarliestCommit[author] > this.earliestTime)
    this.recent.authors = new Set(newContributors)
    this.tallies.authors = newContributors.length
  }

  /**
   * Annoying code where we use the PhotoEntry object to create locators for
   * where an entity or a photo might already exist in our lookup caches for
   * entities and photos.
   *
   * If the photoCommitDate is new enough, track the new photo locator in
   * `this.recent.photos`. If the entityCommitDate is new enough, track the
   * entity in `this.recent[entityType]`. Increment tallies for photos and
   * entities as we go.
   */
  #processRawLine = (filename: string, raw: string) => {
    // Only match photo lines that were added
    if (!raw.match(/^photo\.\d+:/))
      return
    raw = raw.trim()
    const photo = new PhotoEntry(filename, raw)
    const entity = photo.entityLocator()
    const entityType = photo.entityType
    const locator = photo.photoLocator()
    // Recent enough photos are tracked by photo locator
    const photoCommitTime = new Date(photo.photoCommitDate).getTime()
    if (photoCommitTime >= this.earliestTime) {
      this.recent.photos.add(locator)
      this.tallies.photos++
    }
    // Recent enough entities are tracked by entity locator
    const entityCommitTime = new Date(photo.entityCommitDate).getTime()
    if (!this.recent[entityType].has(entity) && entityCommitTime >= this.earliestTime) {
      this.recent[entityType].add(entity)
      this.tallies[entityType]++
    }
  }

  /** Determine the earliest commit newer than the `period` value (7 days) */
  #startingCommit = async () => {
    const iterateCommits = (await this.repo.commit.log()).values()
    let oldestCommit = await this.repo.commit.get("HEAD")
    for (const commit of iterateCommits)
      if (commit.author.date.epochMilliseconds > this.earliestTime)
        oldestCommit = commit
    return oldestCommit
  }
}

if (import.meta.main) {
  const dataset = new Dataset()
  const updates = new Updates()
  updates.build(dataset.graph)
  dataset.exportJsonGraph(Paths.output, updates)
}

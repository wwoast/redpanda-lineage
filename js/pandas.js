import Dagoba from './dagoba.js'
import Env from './environment.js'
import * as Language from './language.js'
import { DateLocale, Defaults, Fallback, Gui, Polyglots } from './lookup.js'
import { Text } from './message.js'

/** 
 * Logic for a Red Panda database search form.
 * Built with love and Dagoba.js :)  
 */

/** The event that fires when the `redpanda.json` data is fetched */
const loaded = new Event('panda_data')

/** Object with all the `redpanda.json` data backs redpandafinder */
let P = {}

/** The Dagoba graph built from the panda data is private to this module */
let G = {}

/** 
 * Create a Pandas search object, and do the initial database import,
 * setting the `P.db` value of the default export above.
 *
 * `XMLHttpRequest` the JSON panda data once all basic scripts have loaded.
 * Then return the big chunk of data, along with our query functions. The path
 * opened is relative to the redpandafinder server's hostname.
 * 
 * TODO: if import attributes for JSON files are supported broadly enough, we
 * can get rid of this `init` function entirely.
 */
export function init() {
  const request = new XMLHttpRequest()
  request.open('GET', '/export/redpanda.json')
  request.responseType = 'json'
  request.send()
  request.onload = function() {
    P.db = request.response   // Set the panda database for importing
    // P.db.vertices.forEach(G.addVertex.bind(G))
    // P.db.edges.forEach(G.addEdge.bind(G))
    G = Dagoba.graph(P.db.vertices, P.db.edges)
    window.dispatchEvent(loaded)   // Report the data has loaded
  }
}

/** Utility functions and generators for doing panda processing */

/** Check if two arrays have the same contents (not necessarily same order) */
function arrayContentsEqual(a, b) {
  // Check if the arrays are the same length
	if (a.length !== b.length) return false
  // Sort the input arrays so we get consistent comparisons
  const arr1 = a.sort()
  const arr2 = b.sort()
	// Check if all items exist and are in the same order
	for (let i = 0; i < arr1.length; i++) {
		if (arr1[i] !== arr2[i]) return false
	}
	// Otherwise, return true
	return true
}

/**
 * Process author links that are intended to point at other sources, such as
 * Instagram. The Instagram URLs will fall back to an author profile page if
 * the link is private.
 */
export function authorLink(author, link) {
  if (!link)
    return link
  else if (link.indexOf("ig://") == 0) {
    const ig_locator = link.split("/").at(-1)
    const inline_author = link.split("/").at(-2)
    if (!inline_author)
      return `https://www.instagram.com/${author}/p/${ig_locator}`
    else
      return `https://www.instagram.com/${inline_author}/p/${ig_locator}`
  } else {
    return link
  }
}

/** Valid panda IDs are numeric and non-zero */
export function checkId(input) {
  return (isFinite(input) && input != Defaults.animal['_id'])
}

/** 
 * For wildcard date values, we do some date checks by converting Date objects
 * to year-month-day dicts
 */
function date_to_ymd(date) {
  return {
    "year": date.getFullYear(),
    "month": date.getMonth() + 1,
    "day": date.getDate()
  }
}

/** 
 * Match a birthday against a date-ymd dict, allowing for if the check field
 * (y m or d) is "any", match against the other values.
 */
function date_ymd_compare_field(birthday, input, check) {
  if (input[check] == "any") {
    return true
  } else {
    return (birthday[check] == input[check])
  }
}

function date_ymd_compare(birthday_ymd, input_ymd) {
  return ((date_ymd_compare_field(birthday_ymd, input_ymd, "day")) &&
          (date_ymd_compare_field(birthday_ymd, input_ymd, "month")) &&
          (date_ymd_compare_field(birthday_ymd, input_ymd, "year")))
}

/** Filter for distinct animals or zoos */
export function distinct(list) {
  const unique =
    (value, index, self) => self.indexOf(value) === index
  return list.filter(unique)
}

/** 
 * Generates a valid index to a link for a link entity, up to the point that
 * said entity doesn't have a defined link in its data.
 */
export function* linkGeneratorEntity(entity, index=0) {
  if (entity == undefined)
    return
  while (index < index + 1) {
    index++
    if (entity["link." + index] == undefined)
      return
    yield "link." + index
  }
}

/**
 * Generates a valid index to a location for a panda entity, up to the point
 * that said entity doesn't have a defined historical location in its data.
 */
export function* locationGeneratorEntity(entity, index=0) {
  if (entity == undefined)
    return
  while (index < index + 1) {
    index++
    if (entity["location." + index] == undefined)
      return
    yield "location." + index
  }
}

/** 
 * Generates a valid index to a photo for a panda entity, up to the point that
 * said entity doesn't have a defined photo in its data.
 */
export function* photoGeneratorEntity(entity, index=0) {
  if (entity == undefined)
    return
  while (index < index + 1) {
    index++
    if (entity["photo." + index] == undefined)
      return
    yield "photo." + index
  }
}

/** 
 * Generates a valid index to a photo for a panda entity, up to the max index.
 */
function* photoGeneratorMax() {
  let index = 0
  const max = P.db["_photo"]["entity_max"]
  while (index < index + 1) {
    index++
    if (index > max) {
      return
    }
    yield "photo." + index
  }
}

/** 
 * If given no argument, return a random number. Otherwise return a repeatable
 * random value.
 */
function prngValue(input, count) {
  let seed = undefined
  // If no inputs given, we want a truly random value
  if (input == undefined)
    return Math.random() 
  if (count == undefined)
    count = 1
  // Otherwise, take a chain of random values
  let next_input = input
  for (let i = 0; i <= count; i++) {
    seed = seededPrng(next_input)
    // Since good inputs to prng should be integers, convert to integer
    next_input = parseInt(seed.toString().split(".")[1])
  }
  return seed
}

/** 
 * Get random items from the array, trying our best not to select the same item 
 * more than once.
 */
export function randomChoice(array, count) {
  // Logic to handle small arrays
  if (array.length <= 1)
    return array
  // Logic to handle when asking for too many items
  if (array.length < count)
    count = array.length
  return randomChoiceSeed(array, undefined, count)
}

/** 
 * Do random choices given an input seed. If seed_input is undefined, choose a
 * random seed instead.
 */
function randomChoiceSeed(array, seed_input, count) {
  let seed = undefined
  const seen = {}
  // If you want just all the array items, return a shuffle instead
  if (count >= array.length) {
    return shuffleWithSeed(array, seed_input)
  }
  let n = count
  for (let i = 1; i <= n; i++) {
    seed = prngValue(seed_input, i)
    const random = Math.floor(seed * array.length)
    if (random in seen)
      n = n + 1   // Don't choose duplicate array indexes
    else
      seen[random] = array[random]
  }
  return Object.values(seen)
}

/** Remove elements from the second list from the first */
export function removeElements(list, removals) {
  return list.filter(function(item) {
    if (removals.includes(item)) {
      return false
    } else {
      return true
    }
  })
}

/** 
 * Remove elements from the second list from the first, as long as some
 * dictionary item matches (typically the animal or zoo id)
 */
export function removeElementsWithMatchingField(list, removals, field) {
  const removals_field = removals.map(x => x[field])
  return list.filter(function(item) {
    if (removals_field.includes(item[field])) {
      return false
    } else {
      return true
    }
  })
}

/** Seeded PRNG for the random choice function */
function seededPrng(input) {
  /** 
   * Mulberry32 seeded PRNG for the random choice function. Call using
   * `seededPrng(seed)()`
   */
  const seededPrngInner = s=>t=>
    (s=s+1831565813|0,t=Math.imul(s^s>>>15,1|s),t=t+Math.imul(t^t>>>7,61|t)^t,
    (t^t>>>14)>>>0)/2**32
  /** Burtleburtle hash that uniformly distributes bits in integer inputs */
  const prngHash = n=>
    (n=61^n^n>>>16,n+=n<<3,n=Math.imul(n,668265261),n^=n>>>15)>>>0
  return seededPrngInner(prngHash(input))()
}

/** Shuffle an array randomly */
export function shuffle(array) {
  return shuffleWithSeed(array, undefined)
}

/** Shuffle an array with a seed */
export function shuffleWithSeed(array, seed_input) {
  // Get a chosen-random value, or a truly random one 
  // if seed_input is undefined
  const seed = prngValue(seed_input, 1)
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(seed * (i + 1))
    const temp = array[i]
    array[i] = array[j]
    array[j] = temp
  }
  return array
}

/** 
 * Enforce uniqueness on members of array-dicts, based on a field.
 * Force a shuffle before choosing unique values, to add variety
 * when displaying unique values
 */
export function unique(array, field) {
  array = shuffle(array)
  const seen = {}
  for (let i = 0; i < array.length; i++) {
    const value = array[i][field]
    if (value in seen) {
      array.splice(i, 1)
      i--
    } else {
      seen[value] = true
    }
  }
  return array
}

/**
 * Get a list of valid values (the leaf children) of the different keyword
 * arrays. Return the result as a single-level array.
 * 
 * This is used to build lists of operators in `parse.js` but is in `pandas.js`
 * to avoid circular imports between those classes.
 * 
 * TODO: use Javascript sets instead?
 */
export function values(input) {
  let results = []
  if (typeof input != "object") {
    results = results.concat(input)
  } else {
    Object.values(input).forEach(function(subinput) {
      if (typeof subinput != "object") {
        results = results.concat(subinput)
      } else {
        results = results.concat(values(subinput))
      }
    })
  }
  return results
}

/** Methods for searching on Red Pandas */

/** Shorthand for getting all the animals */
export function allAnimals() {
  const animals = G.v().filter(function(vertex) {
    return vertex["_id"] > 0
  }).run()
  return animals
}

export function allAnimalsAndMedia() {
  const vertices = G.v().filter(function(vertex) {
    return ((vertex["_id"] > 0) || 
            (vertex["_id"].indexOf("media") != -1))
  }).run()
  return vertices
}

/** Find all panda babies born within a calendar year. */
export function searchBabies(year) {
  // Default search is for the most recent year we recorded a birth in
  const baby_year = P.db["_totals"]["last_born"]
  // Process whatever comes in as a year value. If > 1970, call it a year
  if (parseInt(year) > parseInt(Defaults.date.earliest_year)) {
    baby_year = year
  }
  const nodes = G.v().filter(function(vertex) {
    const their_date = new Date(vertex.birthday)
    const their_year = their_date.getFullYear()
    return their_year == baby_year
  }).unique().run()
  return sortYoungestToOldest(nodes)
}

/** 
 * Find all pandas that have a certain birthday. Used for date searches, unlike
 * other functions which are for showing birthday pandas on the front page.
 */
export function searchBirthdayList(input_date) {
  const input_ymd = parseDate(input_date, Env.language)
  // Make sure we're using a 4-digit year, assume > 2000
  if (input_ymd["year"] < 2000) {
    input_ymd["year"] = input_ymd["year"] + 2000
  }
  const nodes = G.v().filter(function(vertex) {
    return vertex["_id"] > 0;   // Just animals
  }).filter(function(vertex) {
    const birthday = new Date(vertex.birthday)
    const birthday_ymd = date_to_ymd(birthday)
    return date_ymd_compare(birthday_ymd, input_ymd)
  }).run()
  // TODO: make litter mates show up next to each other
  return sortOldestToYoungest(nodes)
}

/** 
 * Find all pandas born today, sorted oldest to youngest, given:
 * 
 * @param keep_living panda must still be alive
 * @param photo_count panda must have at least this many photos
 */
export function searchBirthdayToday(keep_living=true, photo_count=20) {
  const today = new Date()
  const nodes = G.v().filter(function(vertex) {
    return vertex["_id"] > 0;   // Just animals
  }).filter(function(vertex) {
    var birthday = new Date(vertex.birthday)
    return ((birthday.getDate() == today.getDate()) &&
            (birthday.getMonth() == today.getMonth()))
  }).filter(function(vertex) {
    if (keep_living == true) {
      return (vertex.death == undefined)
    } else {
      return true   // Get everyone
    }
  }).filter(function(vertex) {
    if (photo_count > 0) {
      return vertex["photo." + photo_count] != undefined
    }
  }).run()
  return sortOldestToYoungest(nodes)
}

/** 
 * Return ids for any panda that has photos, whose birthday it is, and who has
 * litter mates with the exact same birthday.
 */
function searchBirthdayLitterIds(keep_living=true, photo_count=20) {
  const today = new Date()
  const litter_ids = G.v().filter(function(vertex) {
    return vertex["_id"] > 0;   // Just animals
  }).filter(function(vertex) {
    const birthday = new Date(vertex.birthday)
    return ((birthday.getDate() == today.getDate()) &&
            (birthday.getMonth() == today.getMonth()))
  }).filter(function(vertex) {
    if (photo_count > 0) {
      return vertex["photo." + photo_count] != undefined
    }
  }).in("litter").filter(function(vertex) {
    // Litter mates for this search must have the exact same
    // birthday as today. Sometimes they're born a day apart
    const birthday = new Date(vertex.birthday)
    return ((birthday.getDate() == today.getDate()) &&
            (birthday.getMonth() == today.getMonth()))
  }).filter(function(vertex) {
    // Filter out any animals in litters are passed away
    if (keep_living == true) {
      return (vertex.death == undefined)
    } else {
      return true   // Get everyone
    }        
  }).run().map(x => x._id)
  litter_ids = distinct(litter_ids)
  return litter_ids
}

/** 
 * Find all pandas born today, given parameters:
 * 
 * @param keep_living panda must still be alive
 * @param photo_count panda must have at least this many photos
 * @param max_count get a random sample of birthdays
 * 
 * Bias towards pandas with littermates in this random sample, so if a panda
 * appears in the set, so will its littermates.
 */
export function searchBirthdayLitterBias(keep_living=true, photo_count=20, max_count=5) {
  const initial_set = searchBirthdayToday(keep_living, photo_count)
  const initial_ids = shuffle(initial_set.map(x => x._id))
  const litter_ids = searchBirthdayLitterIds(keep_living, photo_count)
  // Find all pandas we can remove from the random sample,
  // for not having any litter mates
  let has_litters = initial_ids.filter(function(x) {
    return litter_ids.includes(x)
  })
  let no_litters = initial_ids.filter(function(x) {
    return (!litter_ids.includes(x))
  })
  has_litters = distinct(has_litters)
  // Get the id of a single animal that has a litter born on
  // this date, and include them all in the output. Have fallbacks
  // in case we don't have any litter birthdays
  let chosen_year = -1
  let chosen_id = -1
  let chosen_litter_ids = []
  if (has_litters.length > 0) {
    // TODO: ONLY ONE SET OF LITTERS IN THE BIRTHDAY FRONT PAGE. :/ Refactor.
    chosen_id = randomChoice(has_litters, 1)[0]
    const chosen_animal = searchPandaId(chosen_id)[0]
    chosen_litter_ids = searchLitter(chosen_id)
      .filter(function(x) {
        return x.birthday = chosen_animal.birthday
      }).filter(function(vertex) {
        // Filter out any animals in litters are passed away
        if (keep_living == true) {
          return (vertex.death == undefined)
        } else {
          return true   // Get everyone
        }        
      }).map(x => x._id)
    chosen_litter_ids.unshift(chosen_id)
    chosen_year = parseInt(chosen_animal.birthday.split("/")[0])
  }
  // Insert the litter mate into the list next to their sibling.
  let s2_ids = []
  const after_litter = []
  let remaining_count = max_count - chosen_litter_ids.length
  if (no_litters.length < remaining_count) {
    // Don't display a birthday panda unless it can be with their
    // litter-mate. We could backfill the no_litters with litter 
    // pandas, but it means litter mates wouldn't be shown
    remaining_count = no_litters.length
  }
  // Add animals from the no-litter list
  for (let i = 0; i < remaining_count; i++) {
    const current_id = no_litters[i]
    const current_year = parseInt(searchPandaId(current_id)[0].birthday.split("/")[0])
    if (current_year <= chosen_year) {
      s2_ids.unshift(current_id)
    } else if ((current_year == chosen_year) && 
               (s2_ids.indexOf(chosen_id) == -1)) {
      s2_ids = s2_ids.concat(chosen_litter_ids)
      s2_ids.unshift(current_id)
    } else {
      after_litter.unshift(current_id)
    }
  }
  // Add back the litter members if they're not there
  if (!s2_ids.includes(chosen_id))
    s2_ids = s2_ids.concat(chosen_litter_ids)
  // Add back animals younger than the displayed litter
  if (after_litter.length > 0)
    s2_ids = s2_ids.concat(after_litter)
  let final_animals = s2_ids.map(x => searchPandaId(x)[0])
  // Good enough for year sort
  final_animals = sortByName(final_animals, "birthday")
  return final_animals
}

/** Find all pandas that died within a calendar year. */
export function searchDead(year) {
  // Default search is for the most recent year we recorded a birth in
  const died_year = P.db["_totals"]["last_died"]
  // Process whatever comes in as a year value. If > 1970, call it a year
  if (parseInt(year) > parseInt(Defaults.date.earliest_year))
    died_year = year
  const nodes = G.v().filter(function(vertex) {
    const their_date = new Date(vertex.death)
    const their_year = their_date.getFullYear()
    return their_year == died_year
  }).unique().run()
  return sortYoungestToOldest(nodes)
}

export function searchDiedList(input_date) {
  let died_date_ymd = parseDate(input_date, Env.language)
  // Make sure we're using a 4-digit year, assume > 2000
  if (died_date_ymd["year"] < 2000)
    died_date_ymd["year"] = died_date_ymd["year"] + 2000
  const nodes = G.v().filter(function(vertex) {
    return (vertex["photo.1"] != undefined)
  }).filter(function (vertex) {
    const their_date = new Date(vertex.death)
    const their_date_ymd = date_to_ymd(their_date)
    return date_ymd_compare(their_date_ymd, died_date_ymd)
  }).unique().run()
  return sortYoungestToOldest(nodes)
}

/** Find a pandas's direct siblings, with the same mother and same father. */
function searchDirectSiblings(idnum) {
  return   // TODO
}

/** Find family half siblings, not the ones sharing both mother and father */
function searchHalfSiblings(idnum) {
  return   // TODO
}

/** 
 * Find a panda's littermates. Search for all pandas with the same parents and
 * the same (or close, within 48hrs) birthday
 */
export function searchLitter(idnum) {
  const nodes = G.v(idnum).in("litter").run()
  return nodes
}

/** Find all links stored in a single panda database `[links]` file */
export function searchLinks(idstr) {
  const nodes = G.v().filter(function(vertex) {
    return (vertex["_id"] == "links." + idstr)
  }).run()
  // Instead of returning the nodes, return a dictionary 
  // corresponding to all the links in that file.
  return nodes[0]
}

/** Find a panda's siblings, not including littermates. */
export function searchNonLitterSiblings(idnum) {
  const birthday = G.v(idnum).run()[0].birthday
  const nodes =
    G.v(idnum).as("me").in("family").out("family").unique().except("me")
      .filter(function(vertex) {
        const my_date = new Date(birthday)
        const their_date = new Date(vertex.birthday)
        const timeDiff = Math.abs(my_date.getTime() - their_date.getTime())
        const diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24))
        if ( diffDays > 2 )
          return true
        else
          return false
    }).run()
  return nodes
}

/** 
 * Replaced `searchOldnames` and `searchOthernames` with a more generic
 * function that can eventually support hiragana/katakana swapping.
 */
function searchPandaNameFields(input, name_fields=undefined) {
  const inputs = []
  // If the name is English, capitalize every space-separated name.
  if (Language.testString(input, "Latin") == true)
    input = Language.capitalNames(input)
  // If the name is Hiragana or Katakana, search for animals with the other name.
  if (Language.testString(input, "Hiragana") == true)
    inputs.push(Language.hiraganaToKatakana(input))
  if (Language.testString(input, "Katakana") == true)
    inputs.push(Language.katakanaToHiragana(input))
  // Guarantee that we at least have the original input string
  inputs.unshift(input)
  // Choose which name fields to search against
  if (name_fields == undefined) {
    // Default searches for one of a Panda's possible names.
    // Add "nicknames" if you want to search for that too.
    name_fields = ["name", "oldnames", "othernames"]
  }
  const nodes = G.v().filter(function(animal) {
    const languages = Defaults.languages
    // Valid per-language name fields
    let collected_fields = []
    for (const name_field of name_fields) {
      collected_fields = collected_fields.concat(
        languages.map(l => `${l}.${name_field}`)
      )
    }
    for (const field of collected_fields) {
      if (animal[field] != undefined) {
        const name_list = animal[field].split(", ")
        for (let wanted of inputs) {
          if (name_list.includes(wanted)) {
            return animal
          }
        }
      }
    }
  }).run()
  return nodes
}

/** Find a panda by either name or id */
export function searchPanda(input_string) {
  if (checkId(input_string) == true)
    return searchPandaId(input_string)
  else
    return searchPandaName(input_string)
}

/** Find any panda entry with photos */
export function searchPandaAnyPhoto() {
  const nodes = G.v().filter(function(vertex) {
    return ((vertex["photo.1"] != undefined) && 
            (vertex["gender"] != undefined))
  }).run()
  return nodes
}

/** Find any panda or media entry with photos */
export function searchPandaAnyPhotoMedia() {
  const nodes = G.v().filter(function(vertex) {
    return ((vertex["photo.1"] != undefined) && 
            (vertex["website"] == undefined))
  }).run()
  return nodes
}

/** Find a panda's children */
export function searchPandaChildren(idnum) {
  const nodes = G.v(idnum).out("family").run()
  return nodes
}

/** Find a panda's dad */
export function searchPandaDad(idnum) {
  const nodes = G.v(idnum).in("family").filter(function(vertex) {
    return vertex.gender == "Male"
  }).run()
  return nodes
}

/** Find a single panda by id number */
export function searchPandaId(idnum) {
  const node = G.v(idnum).run()
  return node
}

/** 
 * Find instances of a panda's ID in both the animal vertices and in the media
 * (group) photos. Optionally, only return group information for animals.
 */
export function searchPandaMedia(query, only_media=false) {
  const animals = searchPanda(query)
  // Get an array of graph result arrays, and flatten them
  const media = [].concat.apply([],
    animals.map(x => x._id).map(function(id) {
      // Search for graph nodes that have "panda.tags" values
      // that match the ids of any animal in the original 
      // searchPanda list.
      const nodes = G.v().filter(function(vertex) {
        if (Object.keys(vertex).includes("panda.tags")) {
          return vertex["panda.tags"].split(", ").includes(id)
        }
      }).run()
      return nodes
    })
  )
  if (only_media == true)
    return media
  else
    return animals.concat(media)
}

/** 
 * Find instances of panda media photos for a list of animals. Only return
 * entities that contain all of the animals in the input list.
 */
export function searchPandaMediaIntersect(id_list) {
  // Search for graph nodes that have "panda.tags" values
  // that match the ids of any animal in the original 
  // searchPanda list.
  const nodes = G.v().filter(function(vertex) {
    if (Object.keys(vertex).includes("panda.tags")) {
      const panda_tags = vertex["panda.tags"].split(", ")
      return arrayContentsEqual(id_list, panda_tags)
    }
  }).run()
  return nodes
}

/** Find a panda's mother */
export function searchPandaMom(idnum) {
  const nodes = G.v(idnum).in("family").filter(function(vertex) {
    return vertex.gender == "Female"
  }).run()
  return nodes
}

/** Find a panda by any name field. */
export function searchPandaName(name) {
  let nodes = searchPandaNameFields(name)
  nodes = nodes.filter(function(value, index, self) { 
    return self.indexOf(value) === index;  // Am I the first value in the array?
  })
  return sortYoungestToOldest(nodes)
}

/** 
 * Given a panda, search for photos searched with ALL of a list of tags. Returns
 * photo info only.
 */
function searchPandaPhotoTagsIntersect(animal, tags) {
  const photo_fields = photoGeneratorMax
  const output = []
  for (const field_name of photo_fields()) {
    if (animal[field_name] == undefined)
      break
    const photo_author = `${field_name}.author`
    const photo_link = `${field_name}.link`
    const photo_tags = `${field_name}.tags`
    const photo_index = field_name.split(".")[1]
    if (animal[photo_tags] == undefined)
      continue
    const photo_tag_list = animal[photo_tags].split(", ")
    // Is the search tag list a subset of the photo_tag_list
    const contains = !(tags.some(val => !photo_tag_list.includes(val)))
    if (contains == true) {
      const bundle = {
        "id": animal["_id"],
        "photo": animal[field_name],
        "photo.author": animal[photo_author],
        "photo.index": photo_index,
        "photo.link": authorLink(animal[photo_author], animal[photo_link]),
        "photo.tags": tags   // Not the original tags, but the ones searched for
      }
      output.push(bundle)
    }
  }
  return output
}

/** 
 * Given a panda, search for photos tagged with any of a list of tags. May
 * return photo info only, or the entire animal.
 * TODO: usable for zoo entities too, fix
 */
function searchPandaPhotoTagsUnion(animal, tags, mode) {
  const photo_fields = photoGeneratorMax
  const output = []
  // Gets panda photos
  for (const field_name of photo_fields()) {
    if (animal[field_name] == undefined)
      break
    for (const tag of tags) {
      const photo_author = `${field_name}.author`
      const photo_link = `${field_name}.link`
      const photo_tags = `${field_name}.tags`
      const photo_index = field_name.split(".")[1]
      if (animal[photo_tags] == undefined)
        continue
      if (animal[photo_tags].split(", ").includes(tag)) {
        if (mode == "animal") {
          return [animal]
        } else {
          const bundle = {
            "id": animal["_id"],
            "photo": animal[field_name],
            "photo.author": animal[photo_author],
            "photo.index": photo_index,
            "photo.link": authorLink(animal[photo_author], animal[photo_link]),
            "photo.tags": tags   // Not the original tags, but the ones searched for
          }
          output.push(bundle)
          if (mode == "singleton") {
            // Only want the first photo of each tag found
            return output
          }
        }
      }  
    }
  }
  // If no photos exist, we need default information to feed the photo
  // generators. Make sure the empty bundle still tracks the valid panda id.
  if (output.length == 0) {
    if (mode != "animal") {
      const empty_bundle = {
        "id": animal["_id"],
        "photo": Defaults.animal["photo.1"],
        "photo.author": Defaults.unknown[Env.language],
        "photo.index": Defaults.animal["_id"],
        "photo.link": Defaults.unknown[Env.language],
        "photo.tags": Defaults.unknown[Env.language]
      }
      output.push(empty_bundle)
    }
  }
  return output
}

/** Find all pandas at a given zoo. Zoo IDs are negative numbers */
export function searchPandaZoo(idnum) {
  const nodes = G.v(idnum).in("zoo").run()
  return nodes
}

/** Find all pandas at a given zoo that are alive, and arrived recently */
export function searchPandaZooArrived(idnum, months=6) {
  const compare_id = idnum * -1
  let nodes = G.v(idnum).in("zoo").filter(function(vertex) {
    return vertex.death == undefined   // Gotta be alive
  }).filter(function(vertex) {
    // If their arrival date was within six months, keep in the list
    const location_fields = locationGeneratorEntity
    let last_location = null
    for (let field_name of location_fields(vertex)) {
      const location = field(vertex, field_name)
      const [zoo_id, move_date] = location.split(", ")
      if (zoo_id != compare_id) {
        last_location = zoo_id
        continue   // Ignore location values not at this zoo
      }
      // Compare all zoo node dates with current time.
      const current_time = new Date()
      const move_time = new Date(move_date)
      const ms_per_month = 1000 * 60 * 60 * 24 * 31
      const ms_in_period = months * ms_per_month
      if (ms_in_period == 0) {
        // Get all arrived if months == 0
        vertex["sort_time"] = move_time
        // Info about why this animal appeared in results
        vertex["search_context"] = {
          "query": "arrived",
          "from": parseInt(last_location) * -1,
          "move_date": move_date
        }
        return vertex
      }
      if (current_time - move_time < ms_in_period) {
        vertex["sort_time"] = move_time
        // Info about why this animal appeared in results
        vertex["search_context"] = {
          "query": "arrived",
          "from": parseInt(last_location) * -1,
          "move_date": move_date
        }
        return vertex   // Less than N months?
      }
      last_location = zoo_id
    }
  }).run()
  nodes = sortByDate(nodes, "sort_time", "descending")
  // TODO: iterating backwards on location fields would fix
  // if there was a quick back-and-forth travel
  return nodes
}

/** 
 * Find all pandas born (and living) at a given zoo. For interleaving with
 * other results, make a date object from  their birthday for the `sort_time`
 */
export function searchPandaZooBorn(idnum, months=6) {
  const born = G.v(idnum).in("birthplace").filter(function(vertex) {
    return vertex.death == undefined   // Gotta be alive
  }).filter(function(vertex) {
    // Compare all panda birthdays node dates with current time.
    const current_time = new Date()
    const birth_time = new Date(vertex["birthday"])
    const ms_per_month = 1000 * 60 * 60 * 24 * 31
    const ms_in_period = months * ms_per_month
    if (ms_in_period == 0) {
      // Get all born if months == 0
      vertex["sort_time"] = birth_time
      return vertex
    }
    if (current_time - birth_time < ms_in_period) {
      vertex["sort_time"] = birth_time
      // Info about why this animal appeared in results
      vertex["search_context"] = {
        "query": "born",
        "at": idnum
      }
      return vertex
    } else {
      return false
    }
  }).run()
  return born
}

/** Find all pandas that were either born at, or lived at a given zoo */
export function searchPandaZooBornLived(idnum, search_context=false) {
  if (idnum > 0)
    idnum = idnum * -1
  const compare_id = idnum * -1
  const lives = G.v(idnum).in("zoo").run()
  const born = G.v(idnum).in("birthplace").run()
  const was_here = G.v().filter(function(vertex) {
    // Gets panda locations and finds zoo matches
    const location_fields = locationGeneratorEntity
    for (const field_name of location_fields(vertex)) {
      const location = field(vertex, field_name)
      const zoo_id = location.split(", ")[0]
      // Matching zoo values will be positive ids in location fields
      if (zoo_id == compare_id)
        return vertex
    }
    return false
  }).run()
  let nodes = lives.concat(born).concat(was_here).filter(function(value, index, self) { 
    return self.indexOf(value) === index  // Am I the first value in the array?
  })
  if (search_context == true) {
    // Inject valid date ranges for this animal at the given zoo
    nodes = nodes.filter(function(vertex) {
      const location_fields = locationGeneratorEntity
      const date_ranges = []
      let current_range = undefined
      for (const field_name of location_fields(vertex)) {
        const location = field(vertex, field_name)
        const [zoo_id, date] = location.split(", ")
        // Matching zoo values will be positive ids in location fields
        if (zoo_id == compare_id) {
          current_range = [date]
        } else if (current_range != undefined) {
          current_range.push(date)
          date_ranges.push(current_range)
          current_range = undefined
        }
      }
      // Catch a range going on until today
      if (current_range != undefined)
        date_ranges.push(current_range)
      // Sort by first arrival time in the list
      if (date_ranges.length == 0) {
        vertex["sort_time"] = new Date(vertex.birthday)
      } else {
        vertex["sort_time"] = new Date(date_ranges[0][0])
      }
      vertex["search_context"] = {
        "query": "born_or_lived",
        "ranges": date_ranges,
        "at": idnum
      }
      return vertex
    })
  }
  nodes = sortByDate(nodes, "sort_time", "ascending")
  return nodes
}

/** 
 * Find all pandas born at a given zoo any time. Set search_context to `true`
 * if you want the results to add a "born" zoo listing
 */
export function searchPandaZooBornRecords(idnum, search_context=false) {
  if (idnum > 0) 
    idnum = idnum * -1;   // HACK: zoo records
  let nodes = G.v(idnum).in("birthplace").filter(function(vertex) {
    if (search_context == true) {
      vertex["search_context"] = {
        "query": "born_at",
        "at": idnum
      }
    }
    return vertex
  }).run()
  // HACK: good enough for year sorting
  nodes = sortByName(nodes, "birthday").reverse()
  return nodes
}

/** Find all pandas at a given zoo that are still alive */
export function searchPandaZooCurrent(idnum) {
  const nodes = G.v(idnum).in("zoo").filter(function(vertex) {
    return vertex.death == undefined
  }).run()
  return nodes
}

/**
 * Find all pandas that left a zoo in the last six months. Use the location tag
 */
export function searchPandaZooDeparted(idnum, months=6) {
  const compare_id = idnum * -1
  let nodes = G.v().filter(function(vertex) {
    // Departed animals aren't at the desired zoo currently
    return vertex["zoo"] != idnum
  }).filter(function(vertex) {
    // Gets panda locations. We want the date of the next zoo
    // the animal was based at. If that date is less than 6 months 
    // ago, return in list.
    let at_zoo_previously = false
    let zoo_post_move = ''
    const location_fields = locationGeneratorEntity
    for (const field_name of location_fields(vertex)) {
      const location = field(vertex, field_name)
      const [zoo_id, move_date] = location.split(", ")
      if (zoo_id != compare_id && at_zoo_previously == false)
        continue
      if (zoo_id == compare_id) {
        at_zoo_previously = true
        continue
      } else {
        zoo_post_move = move_date
      }
      // Compare all zoo node dates with current time.
      const current_time = new Date()
      const move_time = new Date(zoo_post_move)
      const ms_per_month = 1000 * 60 * 60 * 24 * 31
      const ms_in_period = months * ms_per_month
      if (ms_in_period == 0) {
        // Get all departed if months == 0
        vertex["sort_time"] = move_time
        // Info about why this animal appeared in results
        vertex["search_context"] = {
          "query": "departed",
          "to": parseInt(zoo_id) * -1,
          "move_date": move_date
        }
        return vertex
      }
      if (current_time - move_time < ms_in_period) {
        vertex["sort_time"] = move_time
        // Info about why this animal appeared in results
        vertex["search_context"] = {
          "query": "departed",
          "to": parseInt(zoo_id) * -1,
          "move_date": move_date
        }
        return vertex   // Less than N months?
      } else {
        // This move didn't happen recently. Start the move
        // calculations from scratch again, continuing through
        // the list of animal locations
        at_zoo_previously = false
        zoo_post_move = ''
      }
    }
  }).run()
  nodes = sortByDate(nodes, "sort_time", "descending")
  // TODO: does this logic work with multiple arrival/returns?
  return nodes
}

export function searchPandaZooDied(idnum, months=6) {
  if (idnum > 0)
    idnum = idnum * -1;   // HACK: zoo records
  let nodes = G.v(idnum).in("zoo").filter(function(vertex) {
    return vertex.death != undefined   // Gotta be dead
  }).filter(function(vertex) {
    // Compare all panda anniversary dates with current time.
    const current_time = new Date()
    const anniversary = new Date(vertex["death"])
    const ms_per_month = 1000 * 60 * 60 * 24 * 31
    const ms_in_period = months * ms_per_month
    if (ms_in_period == 0) {
      // Get all died if months == 0
      vertex["sort_time"] = anniversary
      // Info about why this animal appeared in results
      vertex["search_context"] = {
        "query": "died"
      }
      return vertex
    }
    if (current_time - anniversary < ms_in_period) {
      vertex["sort_time"] = anniversary
      // Info about why this animal appeared in results
      vertex["search_context"] = {
        "query": "died"
      }
      return vertex
    } else {
      return false
    }
  }).run()
  nodes = sortByDate(nodes, "sort_time", "descending")
  return nodes
}

/** 
 * Find all nodes with a particular photo credit. Optionally, filter by a list
 * of panda ids.
 */
export function searchPhotoCredit(author, filter_ids=[]) {
  const photo_fields = photoGeneratorMax
  const query = {}
  for (const field_name of photo_fields())
    query[`${field_name}.author`] = author
  const nodes = G.v(query).run()
  return nodes.filter(function(value, index, self) {
    // Return any unique nodes that matched one of these searches
    return self.indexOf(value) === index
  }).filter(function(value, index, self) {
    // Filter by desired panda ids
    if (filter_ids.length == 0)
      return true
    else
      return filter_ids.includes(value["_id"])
  })
}

/** Find profile photos for all animals listed */
export function searchPhotoProfile(animal_list) {
  return searchPhotoTags(
    animal_list, ["profile"], "singleton", "first")
}

/** Find profile photos for an animal's children */
export function searchPhotoProfileChildren(idnum) {
  const children = sortOldestToYoungest(searchPandaChildren(idnum))
  return searchPhotoProfile(children)
}

/** Find profile photos for an animal's family */
export function searchPhotoProfileImmediateFamily(idnum) {
  const me = searchPandaId(idnum)
  const mom = searchPandaMom(idnum)
  const dad = searchPandaDad(idnum)
  const litter = searchLitter(idnum)
  const family = me.concat(mom).concat(dad).concat(litter)
  return searchPhotoProfile(family)
}

/** Find profile photos for an animal's siblings */
export function searchPhotoProfileSiblings(idnum) {
  const nonLitterSiblings = searchNonLitterSiblings(idnum)
  const litter = searchLitter(idnum)
  const siblings = sortOldestToYoungest(nonLitterSiblings.concat(litter))
  return searchPhotoProfile(siblings)
}

/** 
 * Get all photos with a specific set of tags from a list of animals.
 * Useful modes here include:
 *  
 *   `photos` (just return photos) and 
 *  
 *   `singleton` (for only one photo of each tag)
 * 
 * Fallback strategies include:
 * 
 *   `none`: return a null photo entry
 * 
 *   `first`: if no tag available, choose the first photo in the set
 */
export function searchPhotoTags(animal_list, tags, mode, fallback) {
  // Iterate per animal
  let output = []
  for (const animal of animal_list) {
    let set = []
    if (mode == "photos" || mode == "union" || mode == "singleton") {
      set = searchPandaPhotoTagsUnion(animal, tags, mode)
    }
    if (mode == "intersect") {
      set = searchPandaPhotoTagsIntersect(animal, tags)
    }
    if (fallback == "first") {
      // Fallback to profile photo if possible
      if ((set.length == 1) && 
          (Object.values(Defaults.unknown).includes(set[0]["photo.author"]))) {
        set = [profilePhoto(animal, "1")]
      }
      // If no profile photo either, return empty set
      if ((set.length == 1) &&
          (Object.values(Defaults.unknown).includes(set[0]["photo.author"]))) {
        set = []
      }
    }
    output = output.concat(set)
  }
  // Filter out any cases where photo results with no matches were returned
  return output.filter(x => x["photo.index"] != "0")
}

/** 
 * Find a panda's siblings, defined as the intersection of children by the same
 * mother and father panda, but excluding the initial panda we started from.
 */
function searchSiblings(idnum) {
  const nodes = G.v(idnum).as("me").in("family").out("family").unique().except("me").run()
  return nodes
}

/**
 * Zoos are stored with negative numbers, but are tracked in the database by
 * their positive ID numbers. So convert the ID before searching
 */
export function searchZooId(idnum) {
  // Wild animals or other situations may have id == 0
  if (parseInt(idnum) == 0) {
    return [Defaults.wild]
  }
  if (parseInt(idnum) > 0) {
    idnum = parseInt(idnum * -1).toString()
  }
  const nodes = G.v(idnum).run()
  return nodes
}

/**
 * Search for a word in the Zoo's name or location, and return any nodes that
 * match one of the strings therein.
 */
export function searchZooName(zoo_name_str) {
  if (Language.testString(zoo_name_str, "Latin") == true) {
    zoo_name_str = Language.capitalNames(zoo_name_str)
  }
  // Get the matches against any of the valid zoo strings we care about
  const languages = Defaults.languages
  const fields = ["location", "name"]
  const wants = []
  // Convolve the desired fields with the possible language options
  languages.forEach(lang => 
    fields.forEach(field => 
      wants.push(`${lang}.${field}`)))
  const location_nodes = G.v().filter(function(vertex) {
    // Start with just the zoo ID nodes
    if (vertex["_id"] > 0)
      return false
    // Match the input string against any of the possible zoo name or location fields
    const matches = []
    wants.forEach(function(want) {
      if (vertex[want] != undefined) {  // Node doesn't exist? We don't care
        if (vertex[want].includes(zoo_name_str)) {
          matches.push(vertex)
        }
      }
    })
    return (matches.length > 0)
  }).run()
  // TODO: Have a counting heuristic. Zoos in both sets that match
  // should be returned. For now just try returning the nodes we have.
  return location_nodes
}

/** 
 * Methods for sorting the output of Panda searches. Birthday searches use Unix
 * epoch time and do javascript value sort.
 */

/**
 * Sort Japanese panda names by determining the hiragana-equivalent name for
 * each animal in the dataset.
 */
function sortByNameJapanese(nodes) {
  function hiragana_generate(name) {
    const hiragana = Defaults.ranges['ja'][1]   // Hiragana range regex
    const katakana = Defaults.ranges['ja'][2]   // Katakana range regex
    if (hiragana.test(name) == true) {
      return name
    }
    if (katakana.test(name) == true) {
      return Language.katakanaToHiragana(name)
    }
  }
  function build_name_list(node, name_field, othername_field) {
    let name_list = []
    if (name_field in node) {
      name_list = name_list.concat(node[name_field])
    }
    if (othername_field in node) {
      name_list = name_list.concat(node[othername_field].split(", "))
    }
    return name_list
  }
  const name_field = "ja.name"
  const othername_field = "ja.othernames"
  const sort_name = "ja.sortname"
  let connector = Text["and"][Env.language]
  nodes = nodes.map(function(node) {
    // Determine which panda is first in the photo, and sort by
    // its hiragana name in the "othernames" list if necessary
    if (node["_id"].indexOf("media.") == 0) {
      const panda_ids = node["panda.tags"].split(", ")
      const animals = panda_ids.map(function(id) {
        const panda = searchPandaId(id)[0]
        return panda
      })
      // Sort only by the first name in the photo
      const first_group_name = node[name_field].split(connector)[0]
      const animal = animals.filter(
        animal => animal[name_field] == first_group_name)[0]
      const name_list = build_name_list(animal, name_field, othername_field)
      node[sort_name] = name_list
        .map(name => hiragana_generate(name))
        .filter(name => name != undefined)[0]
    } else {
      // Sort by the first hiragana name, from the "othernames"
      // list if necessary. Find the first hiragana or katakana string.
      const name_list = build_name_list(node, name_field, othername_field)
      node[sort_name] = name_list
        .map(name => hiragana_generate(name))
        .filter(name => name != undefined)[0]
    }
    return node
  })
  return sortByName(nodes, sort_name)
}

/** 
 * Sort a list of pandas by their desired "Lang.name" field. Works for
 * non-group entities (pandas and zoos).
 */
function sortByName(nodes, name_field) {
  return nodes.sort(function(a, b) {
    if (a[name_field] > b[name_field]) {
      return 1
    } else if (a[name_field] < b[name_field]) {
      return -1
    } else {
      return 0
    }
  })
}

/** 
 * Sort a list of pandas including groups. This must include the list of
 * specific photos you're pulling out of the group file, because the group
 * name is based on the arrangement of pandas in the photo.
 */
function sortByNameWithGroups(nodes, photo_list, name_field) {
  nodes = nodes.map(function(node) {
    if (node["_id"].indexOf("media.") == 0) {
      // Media file. Get the group caption based on your desired photo in the list
      desired_index = photo_list.filter(photo => 
        photo.photo == node["photo." + photo.index])[0].index
      node[name_field] = groupMediaCaption(node, "photo." + desired_index)
    }
    return node
  })
  if (Env.language == "ja") {
    return sortByNameJapanese(nodes)
  } else {
    return sortByName(nodes, name_field)
  }
}

export function sortByDate(nodes, field_name, mode="descending") {
  // sortByName lexicographic sort should work for numbers too,
  // but to get recent ordering, reverse the list
  if (mode == "descending") {
    return sortByName(nodes, field_name).reverse()
  } else {
    return sortByName(nodes, field_name)
  }
}

/** 
 * photo lists don't have names. So rebuild the animals list and then arrange
 * the set of items based on the animal list.
 */
export function sortPhotosByName(photo_list, name_field) {
  let animals = photo_list.map(photo => searchPandaId(photo.id)[0])
  animals = sortByNameWithGroups(animals, photo_list, name_field)
  const output_list = animals.map(animal =>
    photo_list.filter(photo => photo.id == animal["_id"])[0])
  return output_list
}

export function sortOldestToYoungest(nodes) {
  return nodes.sort(function(a, b) {
    const time_a = parseInt(new Date(a.birthday).getTime())
    const time_b = parseInt(new Date(b.birthday).getTime())
    if (time_a > time_b) {
      return 1
    } else if (time_a < time_b) {
      return -1
    } else {
      return 0
    }
  })
}

export function sortYoungestToOldest(nodes) {
  return nodes.sort(function(a, b) {
    const time_a = parseInt(new Date(a.birthday).getTime())
    const time_b = parseInt(new Date(b.birthday).getTime())
    if (time_a < time_b) {
      return 1
    } else if (time_a > time_b) {
      return -1
    } else {
      return 0
    }
  })
}

/** Getters and formatters for Red Panda details, with sensible defaults */

/** 
 * Given an animal's birthday, return either:
 * 
 *   Their age up to today
 * 
 *   The date of their passing.
 */
export function age(animal, language) {
  const birth = animal['birthday']
  if ((birth == undefined) || (birth == "unknown"))
    return Defaults.unknown[language]
  const birthday = new Date(birth)
  const death = animal['death']
  // If the animal's date of death is listed as "unknown", this means the animal
  // passed at an undetermined date, so its age is also unknown.
  if (death == "unknown")
    return Defaults.unknown[language]
  const endday = (death == undefined ? new Date() : new Date(death))
  const ms_per_day = 1000 * 60 * 60 * 24
  const age_days = (endday - birthday)/ms_per_day
  const age_years = Math.floor(age_days / 365)
  const age_months = Math.floor(age_days / 31)
  // Specify whether you say "day" or "days" in the age string
  function pluralize(count, time_word, language) {
    return (count < 2) ? Defaults.age[language][time_word]
                       : Defaults.age[language][time_word + "s"]
  }
  function spacing(language) {
    return (language == "ja") ? '' : " "
  }
  // Date heuristics: Print the age in days if younger than 100 days old.
  // Otherwise, print the age in terms of months and years, up to two years,
  // where you should just print the age in years.
  if (age_days <= 100) {
    return (Math.floor(age_days)).toString() + spacing(language) + pluralize(age_days, "day", language)
  } else if (age_days <= 365) {
    return age_months.toString() + spacing(language) + Defaults.age[language]['months']
  } else if (age_days <= 403) {
    // 403/31 == 13, lowest number that is still cleanly one year and less than one month
    return "1" + spacing(language) + Defaults.age[language]['year']
  } else if (age_days <= 730) {
    return "1" + spacing(language) + Defaults.age[language]['year'] + " " + 
           (age_months - 12).toString() + spacing(language) + pluralize((age_months - 12).toString(), "month", language)
  } else {
    return age_years.toString() + spacing(language) + Defaults.age[language]['years']
  }
}

/** Return just a panda's age in years (for birthday messages/etc) */
export function ageYears(animal) {
  const birth = animal['birthday']
  if ((birth == undefined) || (birth == "unknown"))
    return Defaults.unknown[language]
  const birthday = new Date(birth)
  const endday = new Date()
  const ms_per_day = 1000 * 60 * 60 * 24
  const age_days = (endday - birthday)/ms_per_day
  const age_years = Math.floor(age_days / 365)
  return age_years.toString()
}

/** Given an animal, return their birthday, formatted to the correct locale. */
export function birthday(animal, language) {
  return date(animal, 'birthday', language)
}

/** 
 * Given an animal and a language, return one of the panda's date fields in the
 * local format.
 */
export function date(animal, field, language) {
  const date = animal[field]
  if ((date == undefined) || (date == "unknown"))
    return Defaults.unknown[language]
  return formatDate(date, language)
}

/** 
 * Given a field that doesn't have language information associated with it,
 * return either the field if it exists, or some reasonable default.
 */
export function field(animal, field, mode="animal") {
  if (animal[field] != undefined)
    return animal[field]
  else if (Defaults[mode][field] != undefined)
    return Defaults[mode][field]
  else if (field.indexOf("photo.") == 0)
    return Defaults[mode]["photo.1"]
  else if (field.indexOf("video.") == 0)
    return Defaults[mode]["video.1"]
  else
    return undefined
}

/** 
 * Given a date string, format the date as per the locale settings. The
 * database tracks dates in YYYY/MM/DD format for zoo animals. For wild animal
 * sightings, it tracks dates less granularly, since pandas are endangered and
 * we need to protect their whereabouts.
 */
export function formatDate(date, language) {
  if ((date == undefined) || (date == "unknown"))
    return Defaults.unknown[language]
  if ((date.split("/").length == 2) &&
      (Gui[date.split("/")[1].toLowerCase()] != undefined)) {
    return formatSeason(date, language)
  }
  let format = Defaults.date[language]
  const [ year, month, day ] = date.split("/")
  format = format.replace("YYYY", year)
  format = format.replace("MM", month)
  format = format.replace("DD", day)
  return format
}

/** Given a date string with a year and a season, format that date */
function formatSeason(date, language) {
  if ((date == undefined) || (date == "unknown"))
    return Defaults.unknown[language]
  const [ year, season ] = date.split("/")
  season = season.toLowerCase()
  const format = Defaults.date_season[language]
  format = format.replace("YYYY", year)
  format = format.replace("SEASON", Gui[season][language])
  return format
}

/** Given a date string, return just the year */
export function formatYear(date, language) {
  if ((date == undefined) || (date == "unknown"))
    return Defaults.unknown[language]
  const [ year, month, day ] = date.split("/")
  return year
}

/** Given an animal and a language, return the proper gender string. */
export function gender(animal, language) {
  const gender = animal["gender"]
  return gender == undefined ? Defaults.unknown[language] 
                             : Defaults.gender[gender][language]
}

/** 
 * Given an animal from a media/file with tag info that indicates pixel
 * location in a photo, generate a string describing the pandas in the photo.
 */
export function groupMediaCaption(entity, photo_index) {
  const tag_index = `${photo_index}.tags`
  const pandaTags = entity["panda.tags"].split(", ")
  let output_string = Defaults.animal[`${Env.language}.name`]
  let animals = []
  for (const id of pandaTags) {
    // Must be a numeric non-negative panda ID
    const panda = searchPandaId(id)[0]
    const [x, y] = entity[tag_index + "." + id + ".location"].split(", ")
    const name = Language.fallback_name(panda)
    var info = {
      "name": name,
      "x": parseInt(x),
      "y": parseInt(y)
    }
    animals.push(info)
  }
  // Sort animals list by x values. Chrome requires the return value to be 
  // one, zero, or minus one, to determine sorting.
  animals = animals.sort((a, b) => a['x'] > b['x'] ? 1: -1)
  // Read off their names into the output string and return
  if (animals.length > 0) {
    let connector = Text["and"][Env.language]
    // HACK: Assume latin languages do comma-replacement the same way
    if ((animals.length > 2) && 
        (Language.alphabets.latin.includes(Env.language))) {
      connector = Text["comma"][Env.language]
      output_string = animals.map(x => x.name).join(connector)
      const last_animal = animals[animals.length-1]
      const match = new RegExp(connector + last_animal.name + "$")
      const replace = Text["and"][Env.language] + last_animal.name
      output_string = output_string.replace(match, replace)
    } else {  
      output_string = animals.map(x => x.name).join(connector)
    }
  }
  // Replace "baby, baby, baby" with group term
  if ((values(Polyglots["baby"]).includes(animals[0].name)) &&
      (unique(animals, "name").length == 1)) {
    output_string = Gui["babies"][Env.language]
  }
  // TODO: replace "baby, baby & mom" with "babies & mom"
  return output_string
}

/** 
 * If both animals don't share parents, and neither animal's parents are in an
 * undefined/unknown situation, they are half siblings. Also, if a panda has
 * multiple "possible" moms or dads, it's impossible to truly say whether you
 * have a haf sibling or not.
 */
export function halfSiblings(animal, sibling) {
  // Indeterminate mom/dad check means your half sibling calculations
  // are impossible. You just can't know for sure.
  if (indeterminateSiblings(animal["_id"], sibling["_id"]) == true)
    return false
  const animal_mom = searchPandaMom(animal["_id"])[0]
  const animal_dad = searchPandaDad(animal["_id"])[0]
  const sibling_mom = searchPandaMom(sibling["_id"])[0]
  const sibling_dad = searchPandaDad(sibling["_id"])[0]
  // If the sibling is older than one of your parents, they must be a half
  // sibling. If one of the parents is missing, do this as a heuristic to
  // determine whether someone is a half-sibling or not.
  let sibling_year = -1
  if (sibling["birthday"] != Defaults.animal["birthday"])
    sibling_year = parseInt(formatYear(sibling["birthday"], Env.language))
  let mymom_year = -2
  if (animal_mom != undefined)
    mymom_year = parseInt(formatYear(animal_mom["birthday"], Env.language))
  let mydad_year = -2
  if (animal_dad != undefined)
    mydad_year = parseInt(formatYear(animal_dad["birthday"], Env.language))
  // Conditions where you can defer half-sibling relationships based on whether
  // your siblings are older than either your mom or dad
  if (((animal_mom == undefined) || (animal_dad == undefined) || 
       (sibling_mom == undefined) || (sibling_dad == undefined)) &&
      ((sibling_year <= mymom_year) || (sibling_year <= mydad_year))) {
    return true
  }
  // Otherwise, return based on whether the parents match, and omit the half-sibling
  // marker if one of the moms or dads happens to not be defined.
  return (!((animal_mom == sibling_mom) && (animal_dad == sibling_dad)) &&
           ((animal_mom != undefined) && (animal_dad != undefined)) &&
           ((sibling_mom != undefined) && (sibling_dad != undefined)))
}

/**
 * Check whether this animal's child has more than one parent of the same
 * gender listed.
 */
export function indeterminateParent(parent_id, child_id) {
  const parent_gender = searchPandaId(parent_id)[0].gender
  if (parent_gender == "m") {
    return searchPandaDad(child_id).length > 1
  } else {
    return searchPandaMom(child_id).length > 1
  }
}

/** 
 * If an animal has more than one possible parent, it can make it hard
 * to determine parent or sibling relationships.
 */
export function indeterminateSiblings(animal_id, sibling_id) {
  const animal_moms = searchPandaMom(animal_id)
  const animal_dads = searchPandaDad(animal_id)
  const sibling_moms = searchPandaMom(sibling_id)
  const sibling_dads = searchPandaDad(sibling_id)
  if ((animal_moms.length > 1) || (animal_dads.length > 1) ||
      (sibling_moms.length > 1) || (sibling_dads.length > 1)) {
    return true
  }
  return false
}

/** Return the language order as an array */
export function language_order(entity) {
  const ordering = entity["language.order"]
  if (ordering == undefined) {
    return Fallback.order
  } else {
    return ordering.split(", ")
  }
}

/** Returns a list of locations valid for a zoo animal */
export function locationList(animal) {
  const locations = []
  const location_fields = locationManifest(animal)
  // Return not just the chosen photo but the author and link as well
  for (const location_field in location_fields) {
    const [field_name, index] = location_field.split(".")
    const next_field = `${field_name}.${(parseInt(index) + 1)}`
    let end_date = undefined
    if (animal[next_field] != undefined) {
      const [_, next_start] = animal[next_field].split(", ")
      end_date = next_start
    } else {
      if (animal["death"] != undefined) {
        end_date = animal["death"]
      }
    }
    let [zoo_index, start_date] = animal[location_field].split(", ")
    // If there was a wild animal, fill in defaults for the dates
    if (zoo_index == 0) {
      start_date = Defaults.animal["birthday"]
      end_date = Defaults.animal["birthday"]
    }
    const location = {
          "zoo": zoo_index,
   "start_date": start_date,
     "end_date": end_date,
    }
    locations.push(location)
  }
  // If there were no location. fields, use the zoo field, birthday, and date
  // of death. If a wild animal, use a wild field instead of the zoo field
  if ((locations.length == 0) && (myWild(animal, "wild") != undefined))
    locations = locationWild(animal)
  if ((locations.length == 0) && (myZoo(animal, "zoo") != undefined))
    locations = locationZoo(animal)
  return locations
}

/** Return a list of location fields an animal has for historical zoo info */
function locationManifest(animal) {
  const locations = {}
  const location_fields = locationGeneratorEntity
  // Gets panda locations
  for (const field_name of location_fields(animal)) {
    locations[field_name] = field(animal, field_name)
  }
  return locations
}

/** 
 * When a panda doesn't have a list of wild locations as `location.X` fields,
 * use the wild field, birthday, and date of death to fill in needed details
 */
function locationWild(animal) {
  let end_date = undefined
  if (animal["death"] != undefined) {
    end_date = animal["death"]
  }
  const locations = [{
    "zoo": myWild(animal, "wild"),
    "start_date": Defaults.date[Env.language],
    "end_date": Defaults.date[Env.language]
  }]
  return locations
}

/** 
 * When a panda doesn't have a list of zoo locations as `location.X` fields,
 * use the zoo, birthday, and date of death to fill in needed details
 */
function locationZoo(animal) {
  let end_date = undefined
  if (animal["death"] != undefined) {
    end_date = animal["death"]
  }
  const locations = [{
    "zoo": myZoo(animal, "zoo"),
    "start_date": animal["birthday"],
    "end_date": animal["death"]
  }]
  return locations
}

/** Get a list of photos given a list of photo locators */
export function locatorsToPhotos(locators) {
  const photos = []
  for (const locator of locators) {
    photos.push(locatorToPhoto(locator))
  }
  return photos
}

// Locators are of the form "entity.EID.photo.PID". Resolve these into the
// corresponding animal photo.
function locatorToPhoto(locator) {
  const parts = locator.split(".")
  const photo_id = parts[parts.length - 1]
  // Given the entity type, convert to the proper media/panda/zoo
  const entity_type = parts[0]
  let entity_id = undefined
  let entity = undefined
  if (entity_type == "media") {
    entity_id = `${parts[0]}.${parts[1]}.${parts[2]}`
    entity = searchPandaId(entity_id)[0]
  }
  else if (entity_type == "zoo") {
    entity_id = parseInt(parts[1] * -1).toString()
    entity = searchZooId(entity_id)[0]
  }
  else {
    entity_id = parts[1]
    entity = searchPandaId(entity_id)[0]
  }
  // Get the photo for this entity
  const choice = "photo." + photo_id
  const desired = {
        "id": entity["_id"],
     "photo": entity[choice],
    "credit": entity[choice + ".author"],
     "index": photo_id,
      "link": authorLink(entity[choice + ".author"], entity[choice + ".link"]),
      "type": entity_type
  }
  return desired
}

/** Given an animal and a chosen language, return details for a red panda. */
export function myName(animal, language) {
  const field = `${language}.name`
  return animal[field] == undefined ? Defaults.animal[field] : animal[field]
}

/** 
 * Given an animal and a field name, return wild location info. Though wild
 * locations are stored in the text files related to an animal, when moved into
 * Dagoba they become edges to "wild" nodes. Proper "fields" might be
 * `birthplace` or `wild`, but we cannot assume the birthplace of wild animals.
 */
export function myWild(animal, field) {
  const wild = G.v(animal['_id']).out(field).run()
  return wild == [] ? Defaults.wild : wild[0]
}

/**
 * Given an animal and a field name, return details about a zoo. Though zoos
 * are stored in the text files related to an animal, when moved into Dagoba
 * they become edges to zoo nodes. Proper "fields" might be `birthplace` or
 * `zoo`.
 */
export function myZoo(animal, field) {
  const zoo = G.v(animal['_id']).out(field).run()
  return zoo == [] ? Defaults.zoo : zoo[0]
}

/** Given an animal and a chosen language, return nicknames. */
export function nicknames(animal, language) {
  const field = `${language}.nicknames`
  return animal[field] == undefined ? Defaults.animal[field] : animal[field]
}

/**
 * Given an animal and a chosen language, return alternate names, such as
 * alternative Hiragana/Katakana/Kanji spellings of names.
 */
export function othernames(animal, language) {
  const field = `${language}.othernames`
  return animal[field] == undefined ? Defaults.animal[field] : animal[field]
}

/** 
 * Parse a date based on the observed values, falling back to a
 * language-specific date format as appropriate.
 */
function parseDate(date, language) {
  // Whatever the non-numeric date delimiters are, replace it with slash.
  // Then chop off any delimiters at the beginning or end of the string.
  date = date.replace(/[^\d]/g, '/')
  date = date.replace(/^\//, '')
  date = date.replace(/\/$/, '')
  // Now figure out how many numbers are in the date we're dealing with
  const nums = date.split("/").map(x => parseInt(x))
  if (nums.length == 2) {
    // Either month/day or month/year
    if (nums[0] > 31) {    // Almost certainly YYYY/MM
      return {"year": nums[0], "month": nums[1], "day": "any"}
    } else if (nums[1] > 31) {    // Almost certainly MM/YYYY
      return {"year": nums[1], "month": nums[0], "day": "any"}
    } else {
      // no four-digit year, so assume MM/DD based on locale
      var locale = DateLocale["mm_dd"][language].split("_")
      if (locale[0] == "mm") {
        return {"year": "any", "month": nums[0], "day": nums[1]}
      } else {
        return {"year": "any", "month": nums[1], "day": nums[0]}
      }
    }
  } else if (nums.length == 3) {
    // Some form of month/day/year
    const locale = DateLocale["yy_mm_dd"][language].split("_")
    if (nums[0] > 31) {    // Almost certainly YYYY/MM/DD
      return {"year": nums[0], "month": nums[1], "day": nums[2]}
    } else if (nums[2] > 31) {
      if (nums[0] > 12) {    // Almost certainly DD/MM/YYYY
        return {"year": nums[2], "month": nums[1], "day": nums[0]}
      } else if (nums[1] > 12) {    // Almost certainly MM/DD/YYYY
        return {"year": nums[2], "month": nums[0], "day": nums[1]}
      } else {
        if (locale[0] == "mm") {
          return {"year": nums[2], "month": nums[0], "day": nums[1]}
        } else {
          return {"year": nums[2], "month": nums[1], "day": nums[0]}
        }
      }
    } else {   // All two-digit values for dates, so use the locale
      const locale = DateLocale["yy_mm_dd"][language].split("_")
      if (locale[0] == "mm") {
        return {"year": nums[2], "month": nums[0], "day": nums[1]}
      } else if (locale[0] == "dd") {
        return {"year": nums[2], "month": nums[1], "day": nums[0]}
      } else {
        return {"year": nums[0], "month": nums[1], "day": nums[2]}
      }
    }
  } else {   // Who knows what this is
    return { "year": -1, "month": -1, "day": -1}
  }
}

/** Find all available photos for a specific animal */
export function photoManifest(entity, mode="animal") {
  let photos = {}
  const photo_fields = photoGeneratorEntity
  // Gets panda or zoo photos
  for (const field_name of photo_fields(entity)) {
    photos[field_name] = field(entity, field_name, mode)
  }
  // Filter out any keys that have the default value for either
  // an animal or a zoo
  photos = Object.keys(photos).reduce(function(filtered, key) {
    if ((photos[key] != Defaults.animal[key]) && 
        (photos[key] != Defaults.zoo[key])) {
      filtered[key] = photos[key]
    }
    return filtered
  }, {})
  return photos
}

/** Given an animal, choose a single photo to display as its profile photo. */
export function profilePhoto(animal, index, mode="animal") {
  // Find the available photo indexes
  const photos = photoManifest(animal, mode)
  // If photo.(index) not in the photos dict, choose one of the available keys
  // at random from the set of remaining valid images.
  let choice = `photo.${index}`
  if (photos[choice] == undefined) {
    const space = Object.keys(photos).length
    index = Math.floor(Math.random() * space)
    choice = Object.keys(photos)[index]
  }
  // If there were still no valid photos, because the panda has no photos
  // listed, return the default for one. Cannot check if == {} because
  // Javascript is ridiculous
  if (Object.keys(photos).length === 0) {
    choice = "photo.1"
    photos[choice] = field(animal, choice, mode)
  }
  // Return not just the chosen photo but the author and link as well
  const desired = {
    "id": animal["_id"],
    "photo": photos[choice],
    "photo.author": animal[choice + ".author"],
    "photo.index": choice.replace("photo.", ""),
    "photo.link": authorLink(animal[choice + ".author"], animal[choice + ".link"])
  }
  return desired
}

/** Given an animal species id, return the full species name */
export function species(animal, language) {
  // 0th value in `Defaults.species` is fulgens
  // 1th vlue in `Defaults.species` is styani
  // The panda files list the species as a number that is off by one from this
  if (animal["species"] == undefined) {
    return Defaults.unknown[language]
  }
  const idx = parseInt(animal["species"]) - 1
  return Defaults.species[language][idx]
}

/** Given a wild location found with `location()`, return the location name. */
export function wildName(wild, language) {
  const field = `${language}.name`
  return wild[field] == undefined ? Defaults.wild[field] : wild[field]
}

/**
 * Given a wild location found with `location()`, return an arbitrary field.
 * Useful for anything that's just a URI, like videos or photos.
 */
export function wildField(wild, field) {
  return wild[field] == undefined ? Defaults.wild[field] : wild[field]
}

/** Given a zoo found with `location()`, return the name of the zoo. */
export function zooName(zoo, language) {
  const field = `${language}.name`
  return zoo[field] == undefined ? Defaults.zoo[field] : zoo[field]
}

/** 
 * Given a zoo found with `location()`, return an arbitrary field. Useful for
 * anything that's just a URI, like videos or photos.
 */
export function zooField(zoo, field) {
  return zoo[field] == undefined ? Defaults.zoo[field] : zoo[field]
}

/** Export the red panda data for anything to use */
export default P

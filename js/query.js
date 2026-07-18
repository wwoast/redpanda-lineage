import * as Geo from './geolocate.js'
import * as Language from './language.js'
import * as Pandas from './pandas.js'
import * as Parse from './parse.js'

/**
 * Query processing for the search box. Translates operators and parameters
 * into a graph search.
 */

// TODO: clear more, like paging stuff? Or manage in localStorage for
// browser history work?
/** Reset query environment to defaults, typically after a search is run */
export function clear() {
  env.preserve_case = false
  env.output_mode = "entities"
  env.specific_photo = undefined
}

/** Settings for redpandafinder search queries in the current browser tab */
export const env = {
  /**
   * When displaying results, by default we display zoo and panda _entities_.
   * However, other output modes are supported based on the supplied types. The
   * _credit_ search shows a spread of photos credited to a particular user.
   */
  output_mode = "entities",
  /** Details about paging through search results */
  paging: {
    /** 
     * Callback for how the next button loads new content on this page,
     * and what frame DIV it spools that content into.
     */
    callback = {
      /** Page number must always come first in the arguments list */
      arguments: [],
      function: undefined,
      frame_id: undefined
    },
    /** If a query has enough results for multiple pages, display the button */
    display_button: false,
    media_count: 10,
    results_count: 15,
    /** Paging seed, set to when the page was last loaded */
    seed: Date.now(),
    /** Shown counter, for page refreshes */
    shown_pages: 1
  },
  /** Credit for photos being shown */
  preserve_case: false,
  /** If a URI indicates a specific photo, indicate which one here */
  specific_photo: undefined,
}

/** Resolve the query string into something */
export function result(input_string) {
  // Take the input string and lex it out into tokens
  const lexed_input = Parse.lexer.generate(input_string)
  // Parse the lexed input
  const parse_tree = Parse.tree.generate(lexed_input)
  // Build result sets. For now, this should just be very simple result sets
  // based on one of the available search sets
  const set_nodes = Parse.tree.filter(parse_tree, Parse.tree.tests.sets)
  // Nothing parsed looks like a search set to return results for
  if (set_nodes.length == 0) {
    return {
      "hits": [],
      "parsed": "no_results",
      "query": input_string,
    }
  }
  // Zeroary search, or Single subject search
  const singular_nodes = Parse.tree.filter(set_nodes[0], Parse.tree.tests.singular);
  if (set_nodes.length == 1 && singular_nodes.length == 1) {
    return single(set_nodes[0], singular_nodes[0])
  }
  // Unary search, or Keyword + Search Term, or Two Keywords
  if (set_nodes.length == 1 && singular_nodes.length == 2) {
    return pair(set_nodes[0], singular_nodes);
  }
  // Group search
  if (set_nodes.length == 1 && singular_nodes.length > 2) {
    return group_one_set(set_nodes[0]);
  }
  // Filter search (set nodes inside another set)
  // Start processing based on the outer set. Decide the outer set based on
  // which "set node" is based on a larger portion of the input string
  if (set_nodes.length == 2 && singular_nodes.length > 2) {
    const start_node = set_nodes.reduce((prev, current) =>
      (prev.end - prev.start > current.end - current.start) 
        ? prev
        : current
    )
    return filter_set(start_node)
  }
}

/**
 * The parse tree found multiple sets. For now, assume this is a filter set.
 * TODO: generalize
 */
function filter_set(set_node) {
  let hits = []
  const keyword_nodes = Parse.tree.filter(set_node, Parse.tree.tests.keyword)
  let search_word = undefined
  let filter_word = undefined
  let parsed = set_node.type
  if (set_node.type == "set_credit_photos_filtered") {
    const author_node = Parse.tree.filter(set_node, Parse.tree.tests.subject_author)[0]
    const filter_node = Parse.tree.filter(set_node, Parse.tree.tests.subject_filter)[0]
    search_word = author_node.str
    filter_word = filter_node.str
    env.output_mode = "photos"
    env.paging.display_button = true
    const filter_ids = Pandas.searchPandaMedia(filter_word).map(n => n["_id"])
    if (filter_ids.length == 0) {
      // Fall back to normal credit photo search
      parsed = "set_credit_photos"
      filter_word = undefined
    } else {
      // If idnum given, show name instead
      if (parseInt(filter_word) > 0) {
        filter_word = Language.fallback_name(Pandas.searchPanda(filter_word)[0])
      }
    }
    hits = Pandas.searchPhotoCredit(search_word, filter_ids)
  }
  return {
    "filter": filter_word,
    "hits": hits,
    "parsed": parsed,
    "query": set_node.str.replace(/\n/g, " "),
    "subject": search_word,
  }
}
/** The parse tree found a group with one set, and many nodes */
function group_one_set(set_node) {
  let hits = []
  const keyword_nodes = Parse.tree.filter(set_node, Parse.tree.tests.keyword)
  let search_word = undefined   // TODO: multi-subject search
  let tag = undefined
  if (set_node.type == "set_tag_intersection_subject") {
    const subject_node = Parse.tree.filter(set_node, Parse.tree.tests.subject)[0]
    search_word = subject_node.str
    env.output_mode = "photos"
    env.paging.display_button = true
    const tags = keyword_nodes
      .map(keyword_node => Parse.searchTag(keyword_node.str))   // All keywords
    tag = tags.join(", ")   // For query output
    hits = Pandas.searchPhotoTags(
      Pandas.searchPandaMedia(search_word), 
      tags, mode="intersect", fallback="none"
    )
  }
  if (set_node.type == "set_tag_intersection") {
    env.output_mode = "photos"
    env.paging.display_button = true
    tags = keyword_nodes
      .map(keyword_node => Parse.searchTag(keyword_node.str))   // All keywords
    tag = tags.join(", ")   // For query output
    hits = Pandas.searchPhotoTags(
      Pandas.allAnimalsAndMedia(), 
      tags,
      mode="intersect",
      fallback="none"
    )
  }
  if (set_node.type == "set_only_subjects") {
    env.output_mode = "group"
    const ids = set_node.str.split("\n")
    hits = Pandas.searchPandaMediaIntersect(ids)
    if (hits.length > 0) {
      env.paging.display_button = true
    }
  }
  return {
    "hits": hits,
    "parsed": set_node.type,
    "query": set_node.str.replace(/\n/g, " "),
    "subject": search_word,
    "tag": tag
  }
}
// The parse tree found a single set node, with a pair of nodes underneath it
function pair(set_node) {
  let hits = []
  const keyword_node = Parse.tree.filter(set_node, Parse.tree.tests.keyword)[0]
  const subject_node = Parse.tree.filter(set_node, Parse.tree.tests.subject)[0]
  let search_word = undefined
  if (subject_node != undefined) {
    search_word = subject_node.str   // Only set when a subject is given
  }
  let tag = undefined
  if (set_node.type == "set_keyword_date") {
    if (Parse.group.born.includes(keyword_node.str)) {
      hits = Pandas.searchBirthdayList(search_word)
    }
    if (Parse.group.dead.includes(keyword_node.str)) {
      hits = Pandas.searchDiedList(search_word)
    }
  }
  if (set_node.type == "set_keyword_subject") {
    // Go through what all the possible keywords might be that we care about here.
    // Subject may be ambiguous (number as either id or year) but is clarified by
    // the additional keyword that is provided
    if (Parse.group.born_at.includes(keyword_node.str)) {
      hits = Pandas.searchPandaZooBornRecords(search_word, true)
    }
    if (Parse.group.died_at.includes(keyword_node.str)) {
      hits = Pandas.searchPandaZooDied(search_word, 0)
    }
    if (Parse.group.lived_at.includes(keyword_node.str)) {
      hits = Pandas.searchPandaZooBornLived(search_word, true)
    }
    if (Parse.group.zoo.includes(keyword_node.str)) {
      hits = Pandas.searchZooName(search_word)
    }
    if (Parse.group.panda.includes(keyword_node.str)) {
      hits = Pandas.searchPandaName(search_word)
    }
    if (Parse.group.dead.includes(keyword_node.str)) {
      hits = Pandas.searchDead(search_word)
    }
  }
  if (set_node.type == "set_panda_id") {
    hits = Pandas.searchPandaId(search_word)
  }
  if (set_node.type == "set_zoo_id") {
    hits = Pandas.searchZooId(search_word)
  }
  if (set_node.type == "set_credit_photos") {
    env.output_mode = "photos"
    env.paging.display_button = true
    hits = Pandas.searchPhotoCredit(search_word)
  }
  if (set_node.type == "set_babies_year_list") {
    hits = Pandas.searchBabies(search_word)
  }
  if ((set_node.type == "set_tag_subject") ||
      (set_node.type == "set_baby_subject")) {
    env.output_mode = "photos"
    env.paging.display_button = true
    tag = Parse.searchTag(keyword_node.str)
    const animals = Pandas.searchPandaMedia(search_word)
    hits = Pandas.searchPhotoTags(animals, [tag], mode="photos", fallback="none")
  }
  if (set_node.type == "set_tag_intersection") {
    env.output_mode = "photos"
    env.paging.display_button = true
    tags = Parse.tree.filter(set_node, Parse.tree.tests.keyword)
      .map(keyword_node => Parse.searchTag(keyword_node.str))   // All keywords
    tag = tags.join(", ")   // For query output
    hits = Pandas.searchPhotoTags(
      Pandas.allAnimalsAndMedia(), 
      tags,
      mode="intersect",
      fallback="none"
    )
  }
  if (set_node.type == "set_only_subjects") {
    env.output_mode = "group"
    const ids = set_node.str.split("\n")
    hits = Pandas.searchPandaMediaIntersect(ids)
    if (hits.length > 0) {
      env.paging.display_button = true
    }
  }
  return {
    "hits": hits,
    "parsed": set_node.type,
    "query": set_node.str.replace(/\n/g, " "),
    "subject": search_word,
    "tag": tag
  }
}
// The parse tree found only a single term for searching
function single(set_node, singular_node) {
  let hits = [];
  const search_word = singular_node.str;
  if (set_node.type == "set_subject") {
    // subject_id on its own should be a panda
    if (singular_node.type == "subject_id") {
      hits = Pandas.searchPandaId(search_word)
    }
    // subject_name on its own may be a panda or a zoo
    if (singular_node.type == "subject_name") {
      const panda_hits = Pandas.searchPandaName(search_word)
      const zoo_hits = Pandas.searchZooName(search_word)
      hits = (panda_hits.length >= zoo_hits.length)
                ? panda_hits
                : zoo_hits;
    }
    // subject_date is treated like a birthday on its own
    if (singular_node.type == "subject_date") {
      hits = Pandas.searchBirthdayList(search_word)
    }
    // subject_year isn't valid on its own
  }
  if (set_node.type == "set_keyword") {
    if (Parse.group.baby.includes(search_word)) {
      hits = Pandas.searchBabies()
    }
    if (Parse.group.nearby.includes(search_word)) {
      env.output_mode = "nearby"
      if (Geo.state.resolved == false) {
        Geo.getNaiveLocation()
      }
      // If we're still on a query page and another action hasn't occurred,
      // display the zoo results when we're done.
    }
    if (Parse.group.dead.includes(search_word)) {
      hits = Pandas.searchDead()
    }
  }
  if (set_node.type == "set_tag") {
    if (Parse.group.tags.includes(search_word)) {
      env.output_mode = "photos"
      env.paging.display_button = true
      // Find the canonical tag to do the searching by
      const tag = Parse.searchTag(search_word)
      // TODO: search media photos for all the animals by id, and include
      // in the searchPhotoTags animals set
      hits = Pandas.searchPhotoTags(
        Pandas.allAnimalsAndMedia(), 
        [tag],
        mode="photos",
        fallback="none"
      )
    }
  }
  return {
    "hits": hits,
    "parsed": set_node.type,
    "query": set_node.str.replace(/\n/g, " ")
  }
}

/*
    Query processing for the search box. Translates operators and parameters
    into a graph search.
*/

var Query = {};   // Namespace

Query.Q = {};     // Prototype

Query.init = function() {
  var query = Object.create(Query.Q);
  return query;
}

Query.env = {};
// Credit for photos being shown
Query.env.preserve_case = false;
// When displaying results, normally we just display zoos and pandas ("entities").
// However, other output modes are supported based on the supplied types.
// The "credit" search results in a spread of photos credited to a particular user.
Query.env.output_mode = "entities";
Query.env.paging = {};
// If a query has enough results to do paging, display the button
Query.env.paging.display_button = false;
// Callback for how the next button loads new content on this page,
// and what frame DIV it spools that content into.
Query.env.paging.callback = {};
// Page number must always come first in the arguments list
Query.env.paging.callback.arguments = [];
Query.env.paging.callback.function = undefined;
Query.env.paging.callback.frame_id = undefined;
Query.env.paging.media_count = 10;
Query.env.paging.results_count = 15;
// Paging seed, set to when the page was last loaded
Query.env.paging.seed = Date.now();
// Shown counter, for page refreshes
Query.env.paging.shown_pages = 1;
// If a URI indicates a specific photo, indicate which one here.
Query.env.specific_photo = undefined;
// Reset query environment back to defaults, typically after a search is run
Query.env.clear = function() {
  Query.env.preserve_case = false;
  Query.env.output_mode = "entities";
  Query.env.specific_photo = undefined;
}

/* 
    Resolve the query string into something
*/
Query.resolver = {};
Query.resolver.begin = function(input_string) {
  // Take the input string and lex it out into tokens
  var lexed_input = Parse.lexer.generate(input_string);
  // Parse the lexed input
  var parse_tree = Parse.tree.generate(lexed_input);
  // Build result sets. For now, this should just be very simple result sets
  // based on one of the available search sets
  var set_nodes = Parse.tree.filter(parse_tree, Parse.tree.tests.sets);
  // Nothing parsed looks like a search set to return results for
  if (set_nodes.length == 0) {
    return {
      "hits": [],
      "parsed": "no_results",
      "query": input_string,
    };
  }
  // Zeroary search, or Single subject search.
  var singular_nodes = Parse.tree.filter(set_nodes[0], Parse.tree.tests.singular);
  if (set_nodes.length == 1 && singular_nodes.length == 1) {
    return Query.resolver.single(set_nodes[0], singular_nodes[0])
  }
  // Unary search, or Keyword + Search Term, or Two Keywords
  if (set_nodes.length == 1 && singular_nodes.length == 2) {
    return Query.resolver.pair(set_nodes[0], singular_nodes);
  }
  // Group search
  if (set_nodes.length == 1 && singular_nodes.length > 2) {
    return Query.resolver.group_one_set(set_nodes[0]);
  }
  // Filter search (set nodes inside another set)
  // Start processing based on the outer set. Decide the outer
  // set based on which "set node" is based on a larger portion
  // of the input string
  if (set_nodes.length == 2 && singular_nodes.length > 2) {
    var start_node = set_nodes.reduce(function(prev, current) {
      return (prev.end - prev.start > 
              current.end - current.start) ? prev : current
    });
    return Query.resolver.filter_set(start_node);
  }
}
// The parse tree found multiple sets.
// For now, assume that this is a filter set. TODO: generalize
Query.resolver.filter_set = function(set_node) {
  var hits = [];
  var keyword_nodes = Parse.tree.filter(set_node, Parse.tree.tests.keyword);
  var search_word = undefined;
  var filter_word = undefined;
  var parsed = set_node.type;
  if (set_node.type == "set_credit_photos_filtered") {
    var author_node = Parse.tree.filter(set_node, Parse.tree.tests.subject_author)[0];
    var filter_node = Parse.tree.filter(set_node, Parse.tree.tests.subject_filter)[0];
    search_word = author_node.str;
    filter_word = filter_node.str;
    Query.env.output_mode = "photos";
    Query.env.paging.display_button = true;
    var filter_ids = Pandas.searchPandaMedia(filter_word).map(n => n["_id"]);
    if (filter_ids.length == 0) {
      // Fall back to normal credit photo search
      parsed = "set_credit_photos";
      filter_word = undefined;
    } else {
      // If idnum given, show name instead
      if (parseInt(filter_word) > 0) {
        filter_word = Language.fallback_name(Pandas.searchPanda(filter_word)[0]);
      }
    }
    hits = Pandas.searchPhotoCredit(search_word, filter_ids);
  }
  return {
    "filter": filter_word,
    "hits": hits,
    "parsed": parsed,
    "query": set_node.str.replace(/\n/g, " "),
    "subject": search_word,
  }
}
// The parse tree found a group with one set, and many nodes
Query.resolver.group_one_set = function(set_node) {
  var hits = [];
  var keyword_nodes = Parse.tree.filter(set_node, Parse.tree.tests.keyword);
  var search_word = undefined;   // TODO: multi-subject search
  var tag = undefined;
  if (set_node.type == "set_tag_intersection_subject") {
    var subject_node = Parse.tree.filter(set_node, Parse.tree.tests.subject)[0];
    search_word = subject_node.str;
    Query.env.output_mode = "photos";
    Query.env.paging.display_button = true;
    tags = keyword_nodes
      .map(keyword_node => Parse.searchTag(keyword_node.str));   // All keywords
    tag = tags.join(", ");   // For query output
    hits = Pandas.searchPhotoTags(
      Pandas.searchPandaMedia(search_word), 
      tags, mode="intersect", fallback="none"
    );
  }
  if (set_node.type == "set_tag_intersection") {
    Query.env.output_mode = "photos";
    Query.env.paging.display_button = true;
    tags = keyword_nodes
      .map(keyword_node => Parse.searchTag(keyword_node.str));   // All keywords
    tag = tags.join(", ");   // For query output
    hits = Pandas.searchPhotoTags(
      Pandas.allAnimalsAndMedia(), 
      tags, mode="intersect", fallback="none"
    );
  }
  if (set_node.type == "set_only_subjects") {
    Query.env.output_mode = "group";
    var ids = set_node.str.split("\n");
    hits = Pandas.searchPandaMediaIntersect(ids);
    if (hits.length > 0) {
      Query.env.paging.display_button = true;
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
Query.resolver.pair = function(set_node) {
  var hits = [];
  var keyword_node = Parse.tree.filter(set_node, Parse.tree.tests.keyword)[0];
  var subject_node = Parse.tree.filter(set_node, Parse.tree.tests.subject)[0];
  var search_word = undefined;
  if (subject_node != undefined) {
    search_word = subject_node.str;   // Only set when a subject is given
  }
  var tag = undefined;
  if (set_node.type == "set_keyword_subject") {
    // Go through what all the possible keywords might be that we care about here
    if (Parse.group.born_at.indexOf(keyword_node.str) != -1) {
      hits = Pandas.searchPandaZooBornRecords(search_word, true);
    }
    if (Parse.group.died_at.indexOf(keyword_node.str) != -1) {
      hits = Pandas.searchPandaZooDied(search_word, 0);
    }
    if (Parse.group.lived_at.indexOf(keyword_node.str) != -1) {
      hits = Pandas.searchPandaZooBornLived(search_word, true);
    }
    if (Parse.group.zoo.indexOf(keyword_node.str) != -1) {
      hits = Pandas.searchZooName(search_word);
    }
    if (Parse.group.panda.indexOf(keyword_node.str) != -1) {
      hits = Pandas.searchPandaName(search_word);
    }
    if (Parse.group.dead.indexOf(keyword_node.str) != -1) {
      hits = Pandas.searchDead(search_word);
    }
  }
  if (set_node.type == "set_panda_id") {
    hits = Pandas.searchPandaId(search_word);
  }
  if (set_node.type == "set_zoo_id") {
    hits = Pandas.searchZooId(search_word);
  }
  if (set_node.type == "set_credit_photos") {
    Query.env.output_mode = "photos";
    Query.env.paging.display_button = true;
    hits = Pandas.searchPhotoCredit(search_word);
  }
  if (set_node.type == "set_babies_year_list") {
    hits = Pandas.searchBabies(search_word);
  }
  if ((set_node.type == "set_tag_subject") ||
      (set_node.type == "set_baby_subject")) {
    Query.env.output_mode = "photos";
    Query.env.paging.display_button = true;
    tag = Parse.searchTag(keyword_node.str);
    var animals = Pandas.searchPandaMedia(search_word);
    hits = Pandas.searchPhotoTags(animals, [tag], mode="photos", fallback="none");
  }
  if (set_node.type == "set_tag_intersection") {
    Query.env.output_mode = "photos";
    Query.env.paging.display_button = true;
    tags = Parse.tree.filter(set_node, Parse.tree.tests.keyword)
      .map(keyword_node => Parse.searchTag(keyword_node.str));   // All keywords
    tag = tags.join(", ");   // For query output
    hits = Pandas.searchPhotoTags(
      Pandas.allAnimalsAndMedia(), 
      tags, mode="intersect", fallback="none"
    );
  }
  if (set_node.type == "set_only_subjects") {
    Query.env.output_mode = "group";
    var ids = set_node.str.split("\n");
    hits = Pandas.searchPandaMediaIntersect(ids);
    if (hits.length > 0) {
      Query.env.paging.display_button = true;
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
Query.resolver.single = function(set_node, singular_node) {
  var hits = [];
  var search_word = singular_node.str;
  if (set_node.type == "set_subject") {
    // subject_id on its own should be a panda
    if (singular_node.type == "subject_id") {
      hits = Pandas.searchPandaId(search_word);
    }
    // subject_name on its own may be a panda or a zoo
    if (singular_node.type == "subject_name") {
      var panda_hits = Pandas.searchPandaName(search_word);
      var zoo_hits = Pandas.searchZooName(search_word);
      hits = (panda_hits.length >= zoo_hits.length)
                    ? panda_hits : zoo_hits;
    }
    // subject_year isn't valid on its own
  }
  if (set_node.type == "set_keyword") {
    if (Parse.group.baby.indexOf(search_word) != -1) {
      hits = Pandas.searchBabies();
    }
    if (Parse.group.nearby.indexOf(search_word) != -1) {
      Query.env.output_mode = "nearby";
      if (F.resolved == false) {
        F.getNaiveLocation();
      }
      // If we're still on a query page and another action hasn't occurred,
      // display the zoo results when we're done.
    }
    if (Parse.group.dead.indexOf(search_word) != -1) {
      hits = Pandas.searchDead();
    }
  }
  if (set_node.type == "set_tag") {
    if (Parse.group.tags.indexOf(search_word) != -1) {
      Query.env.output_mode = "photos";
      Query.env.paging.display_button = true;
      // Find the canonical tag to do the searching by
      var tag = Parse.searchTag(search_word);
      // TODO: search media photos for all the animals by id, and include
      // in the searchPhotoTags animals set
      hits = Pandas.searchPhotoTags(
        Pandas.allAnimalsAndMedia(), 
        [tag], mode="photos", fallback="none"
      );
    }
  }
  return {
    "hits": hits,
    "parsed": set_node.type,
    "query": set_node.str.replace(/\n/g, " ")
  }
}

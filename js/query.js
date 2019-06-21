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
// If a URI indicates a specific photo, indicate which one here.
Query.env.specific_photo = undefined;
// Reset query environment back to defaults, typically after a search is run
Query.env.clear = function() {
  Query.env.preserve_case = false;
  Query.env.output_mode = "entities";
  Query.env.specific_photo = undefined;
}

// Get a list of valid operators (the children) of the Query.obj array
// Return the result as a single-level array
Query.values = function(input) {
  var results = [];
  if (typeof input != "object") {
    results = results.concat(input);
  } else {
    Object.values(input).forEach(function(subinput) {
      if (typeof subinput != "object") {
        results = results.concat(subinput);
      } else {
        results = results.concat(Query.values(subinput));
      }
    });
  }
  return results;
}

// Given a search tag, find the equivalent term for that tag that is standardized
// on in the panda files, and return results for that tag. Searches all language
// keywords for a tag.
Query.searchTag = function(search_tag) {
  for (var key of Object.keys(Language.L.tags)) {
    let terms = Query.values(Language.L.tags[key]);
    if (terms.indexOf(search_tag) != -1) {
      return key;
    } 
  }
  return undefined;
}


/*
    Operator Definitions and aliases, organized into stages (processing order), and then
    by alphabetical operator order, and then in the alternate languages for searching that
    we're trying to support. Includes lists of the valid operators that may work on two
    different panda arguments.
    WARN: substrings in the keyword list may be problematic, so try and avoid them
*/
Query.ops = {
  "type": {
    "baby": ['Baby', 'baby', 'Babies', 'babies', 'Aka-Chan', 'Aka-chan', 'aka-chan', '赤ちゃん'],
    "credit": ['Credit', 'credit', 'Author', 'author', '著者'],
    "dead": ["Dead", "dead", "Died", "died", "死", "Rainbow", "rainbow", "虹"],
    "panda": ['Panda', 'panda', 'red panda', 'パンダ', 'レッサーパンダ'],
    "zoo": ['Zoo', 'zoo', '動物園']
  },
  "subtype": {
    "alive": ['alive', 'living'],
    "born": ['born'],
    "born before": ['born before'],
    "born after": ['born after'],
    "dead": ['dead'],
    "died": ['died'],
    "died before": ['died before'],
    "died after": ['died after'],
    "in": ['in', 'at']
  },
  "glob": {
    "*": ['*'],
    "?": ['?']
  },
  "logical": {
    "and": ['and'],
    "or": ['or'],
    "not": ['not'],
    "nor": ['nor']
  },
  "family": {
    "aunt": ['aunt'],
    "brother": ['brother'],
    "cousin": ['cousin'],
    "children": ['children'],
    "dad": ['dad', 'father', 'papa'],
    "grandma": ['grandma', 'grandmother'],
    "grandpa": ['grandpa', 'grandfather'],
    "litter": ['litter'],
    "mate": ['husband', 'mate', 'wife'],
    "mom": ['mom', 'mother'],
    "nephew": ['nephew'],
    "niece": ['niece'],
    "parents": ['parents'],
    "relatives": ['relative', 'relatives'],
    "siblings": ['sibling', 'siblings'],
    "uncle": ['uncle']
  }
}

Query.ops.group = {};
// Type operators 
Query.ops.group.types = Query.values(Query.ops.type);
// Single keywords that represent queries on their own. Indexes into Query.ops
Query.ops.group.zeroary = Query.values([
  Query.ops.type.baby,
  Query.ops.type.dead,
  Language.L.tags
])
// Unary operators
Query.ops.group.unary = Query.values([
  Query.ops.type,
  Query.ops.subtype,
  Query.ops.family
])
// Binary and more operators
Query.ops.group.binary = Query.values([
  Query.ops.logical,
  Query.ops.family
])

Query.regexp = {};
// Escape any characters in the operations list that have meaning for regexes.
// https://stackoverflow.com/questions/3446170/escape-string-for-use-in-javascript-regex
Query.regexp.safe_input = function(input) {
  if (input instanceof Array) {
    return input.filter(x => x != undefined).map(i => i.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));  // $& means the whole matched string
  } else {
    return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}

// Make a regex that matches all terms in an array, or matches a single term from a string
Query.regexp.match_portion = function(input) {
  var safe = Query.regexp.safe_input(input);
  if (safe instanceof Array) {
    // Parse any one of a number of equivalent operators
    return new RegExp("(" + safe.join("|") + ")" + "[^$]", 'iu');
  } else {
    // Single string parsing
    return new RegExp(safe + "[^$]");  
  }
}

// Make a regexp that matches just a single term on its own
Query.regexp.match_single = function(input) {
  var safe = Query.regexp.safe_input(input);
  if (safe instanceof Array) {
    // Match any one of a number of equivalent operators
    return new RegExp("(" + safe.join("|") + ")" + "$", 'iu');
  } else {
    // Single string parsing
    return new RegExp(safe + "$");
  }
}

// Rules for reLexer. This is a series of stacked regexes that compose to match
// a parsed query, for insertion into a parse tree for ordered processing of matches.
Query.rules = {
  "space": /\s+/,
  /*** ATOMS ***/
  "idAtom": /\d{1,5}/,
  "nameAtom": /[^\s]+(\s+[^\s]+)*/,
  "yearAtom": /19\d\d|2\d\d\d/,
  /*** TERMS ***/
  // Terms include keywords, operators, and panda / zoo names.
  // Subjects, either an id number or a panda / zoo name.
  "subjectTerm": or(
    ":idAtom>idAtom",
    ":nameAtom>nameAtom",
  ),
  // Tags: match any of the tags in the language files
  "tagTerm": Query.regexp.match_portion(Query.values(Language.L.tags)),
  // Type: panda or zoo keywords
  "typeTerm": Query.regexp.match_portion(Query.ops.group.types),
  // Zeroary terms are operators that require no other keywords
  "zeroaryTerm": Query.regexp.match_single(Query.ops.group.zeroary),
  /*** EXPRESSIONS ***/
  // A query string consists of expressions
  "tagSubjectExpression": [
    ':tagTerm>tagTerm', ':space?', ':subjectTerm>subjectTerm'
  ],
  "typeSubjectExpression": [
    ':typeTerm>typeTerm', ':space?', ':subjectTerm>subjectTerm'
  ],
  "typeYearExpression": [
    ':typeTerm>typeTerm', ':space?', ':yearAtom>yearAtom'
  ],
  "zeroaryExpression": [
    ':zeroaryTerm>zeroaryTerm'
  ],
  // This is the root rule that new reLexer() starts its processing at.
  "expression": or(
    ':zeroaryExpression/1',
    ':typeYearExpression/2',
    ':typeSubjectExpression/3',
    ':tagSubjectExpression/4',
    ':subjectTerm/5'
  )
}
/*
    Actions are callbacks from the lexer matching. If an expression matches one of the
    expressions in the rules list, a sequence of these callbacks is run. The first regex that
    matches will process that data, and the returned data will pass up to the next callback.
    So whatever is processed by the "type" action will then be seen in the "typeExpresssion"
    action. The callbacks chain together! It's pretty cool.

    The format of capture is as follows:
     - non named capture (:subject) => capture is a scalar
     - named capture (:number>id) => capture is an array, with a[1] being the value
     - multiple captures, looks like capture.(named)/capture.(named)

     Do all query processing in these action functions, with the output landing in the
     Query.results[] array.

     When any of the types shown in the regex list are seen, you get one of these callbacks,
     regardless of whether they're in the expression list or not! So you only want callbacks
     for full expression matches.

     Term actions return a parser-dict which is used to build an array of expressions.
     Expression actions return a resolution to the panda graph.
*/
Query.actions = {
  /*** ATOM ACTIONS ***/
  // Guarantee that the id number is valid
  "idAtom": function(_, capture) {
    return Pandas.checkId(capture) ? capture : Pandas.def.animal[_id];
  },
  // For panda names, do locale-specific tweaks to make the search work
  // as you'd expect (capitalization, etc). Can't base this on the current 
  // page language, since we need to match latin partials against 
  // capitalized dataset names!
  "nameAtom": function(_, capture) {
    return Language.capitalNames(capture);
  },
  // For years, default to the earliest year (1970) if it's some stupid number
  "yearAtom": function(_, capture) {
    return capture > Pandas.def.date.earliest_year ? capture : Pandas.def.date.earliest_year;
  },
  /*** TERM ACTIONS ***/
  // Based on result counts, guess whether this is a panda or zoo, and then
  // return results for either the panda or the zoo.
  "subjectTerm": function(_, captures) {
    [match_type, value] = captures;
    // Possible result sets
    var panda_results = Query.resolver.subject(value, "panda", L.display);
    var zoo_results = Query.resolver.subject(value, "zoo", L.display);
    var credit_results = Query.resolver.subject(value, "credit", L.display);
    // By default, a bare subjectTerm search result should show the most
    // available hits for either a zoo type or a panda type.
    var most_hits = (panda_results.length >= zoo_results.length)
                        ? panda_results : zoo_results;
    return {
      "query": value,
      "parsed": "subjectTerm",
      "hits": most_hits,
      "credit_hits": credit_results,
      "panda_hits": panda_results,
      "zoo_hits": zoo_results
    }
  },
  // Tag expressions only result in photo results
  "tagTerm": function(_, capture) {
    var tag = Query.searchTag(capture.trim().toLowerCase());
    Query.env.output_mode = "photos";
    return {
      "query": tag,
      "tag": tag
    }
  },
  "typeTerm": function(_, capture) {
    var type = capture.trim().toLowerCase();
    // Normal searches. Just return pandas/zoos in a later subject search.
    // Re-capitalize to match names in the database.
    Query.env.output_mode = "entities";
    Query.env.preserve_case = false;
    // Don't adjust case for author searches. Switch to "photo credit" output mode
    if (Query.ops.type.credit.includes(type)) {
      Query.env.output_mode = "photos";
      Query.env.preserve_case = true;
    }
    return {
      "query": type,
      "type": type
    };
  },
  /*** EXPRESSION ACTIONS ***/
  "subjectTagExpression": function(_, captures) {
    return Query.actions.tagSubjectExpression(_, captures);
  },
  "subjectTypeExpression": function(_, captures) {
    return Query.actions.termSubjectExpression(_, captures);
  },
  // Tag + Subject. Search for either a panda or a zoo.
  "tagSubjectExpression": function(_, captures) {
    // Get the subject results for this one, and do the tag search
    // based on the results found here.
    var tag = captures.tagTerm.tag;
    var last_stage = captures.subjectTerm;
    // Search media photos for all the animals by id.
    // Include in the searchPhotoTags animals set
    var animals = Pandas.searchPandaMedia(last_stage.query);
    return {
      "hits": Pandas.searchPhotoTags(animals, [tag], mode="photos", fallback="none"),
      "query": tag + " " + last_stage.query,
      "parsed": "tagExpression",
      "subject": last_stage.query,
      "tag": tag
    }
  },
  // Type + Subject. Search for either a panda or a zoo.
  "typeSubjectExpression": function(_, captures) {
    // Get the subject results for this one, select from the available
    // zoo/panda/credit results, and store that as the main "hits".
    var type = captures.typeTerm.type;
    var results = captures.subjectTerm;
    return {
      "hits": results[type + "_hits"],
      "query": type + " " + results.query,
      "parsed": "typeExpression",
      "subject": results.query,
      "type": type
    }
  },
  "typeYearExpression": function(_, captures) {
    // Only works for specific type terms like born and died. Otherwise
    // process similar to typeSubjectExpression
    var type = captures.typeTerm.type;
    var year = captures.yearAtom;
    // Fallback to doing this like a panda ID search. If the other results
    // option has more hits, return that instead.
    var panda_results = Pandas.searchPanda(year);
    var type_results = Query.resolver.subject(year, type, L.display);
    var most_hits = (panda_results.length >= type_results.length)
                        ? panda_results : type_results;
    return {
      "hits": most_hits,
      "query": type + " " + year,
      "parsed": "typeExpression",
      "subject": year,
      "type": type
    }
  },
  // Resolve the behavior of the zero-argument operator into results.
  "zeroaryExpression": function(_, captures) {
    var keyword = captures.zeroaryTerm.toLowerCase();
    // If this zeroary expression is a tag, store the in-file representation of this tag
    var tag = Query.searchTag(keyword);
    return {
      "hits": Query.resolver.singleton(keyword),
      "parsed": "zeroaryExpression",
      "query": keyword,
      "tag": tag
    }
  }
}
/* 
    Resolvers are non-callback ways to validate data from a parse. They typically
    turn some string value into a node in the Pandas graph.
*/
Query.resolver = {
  // Process searches that are just single keywords, like "babies"
  "singleton": function(keyword) {
    if (Query.ops.type.baby.indexOf(keyword) != -1) {
      return Pandas.searchBabies();
    }
    if (Query.ops.type.dead.indexOf(keyword) != -1) {
      return Pandas.searchDead();
    }
    if (Query.values(Language.L.tags).indexOf(keyword) != -1) {
      Query.env.output_mode = "photos";
      // Find the canonical tag to do the searching by
      var tag = Query.searchTag(keyword);
      // TODO: search media photos for all the animals by id, and include
      // in the searchPhotoTags animals set
      return Pandas.searchPhotoTags(Pandas.allAnimalsAndMedia(), [tag], mode="photos", fallback="none");
    }
  },
  // Process a search term, either typed as panda/zoo, or untyped,
  // into a list of nodes in the Pandas/Zoos graph
  "subject": function(subject, type, language) {
    // Explicitly search for a panda by id
    if ((Pandas.checkId(subject) == true) &&
        (Query.ops.type.panda.indexOf(type) != -1)) {
      return Pandas.searchPandaId(subject);
    }
    // Explicitly search for a zoo by id
    if ((Pandas.checkId(subject) == true) &&
        (Query.ops.type.zoo.indexOf(type) != -1)) {
      return Pandas.searchZooId(subject);
    }
    // If the baby operator is there, search for babies by year
    if (Query.ops.type.baby.indexOf(type) != -1) {
      return Pandas.searchBabies(subject);
    }
    // If the dead operator is there, search for panda deaths by year
    if (Query.ops.type.dead.indexOf(type) != -1) {
      return Pandas.searchDead(subject);
    }
    // If a credit operator is there, search for photo credits
    if (Query.ops.type.credit.indexOf(type) != -1) {
      return Pandas.searchPhotoCredit(subject);
    }
    // Raw ids are assumed to be panda ids
    if ((Pandas.checkId(subject) == true) &&
        (type == undefined)) {
      return Pandas.searchPandaId(subject);    
    }
    // Otherwise search by name
    if (Query.ops.type.panda.indexOf(type) != -1) {
      return Pandas.searchPandaName(subject);
    }
    if (Query.ops.type.zoo.indexOf(type) != -1) {
      return Pandas.searchZooName(subject);
    }
  },
}

/*
    Lexer instantiation
*/
Query.lexer = new reLexer(Query.rules, 'expression', Query.actions);

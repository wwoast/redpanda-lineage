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
Query.env.credit = undefined;
Query.env.preserve_case = false;
// When displaying results, normally we just display zoos and pandas ("entities").
// However, other output modes are supported based on the supplied types.
// The "credit" search results in a spread of photos credited to a particular user.
Query.env.output = "entities";
// If a URI indicates a specific photo, indicate which one here.
Query.env.specific = undefined;
// Reset query environment back to defaults, typically after a search is run
Query.env.clear = function() {
  Query.env.credit = undefined;
  Query.env.preserve_case = false;
  Query.env.output = "entities";
  Query.env.specific = undefined;
  Query.env.tokens = [];
}
Query.regexp = {};
/*
   First-pass processing into terms
[{
    "type": "operator",
    "term": "panda"
},
{
    "type": "subject",
    "term": "ichimaru"
}]
*/
Query.env.terms = [];

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
  Query.ops.type.dead
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

// Negative lookahead to fail matching an input
Query.regexp.match_none = function(input) {
  var safe = Query.regexp.safe_input(input);
  if (safe instanceof Array) {
    // Match any one of a number of equivalent operators
    return new RegExp("^(?!.*(" + safe.join("|") + "))", 'iu');
  } else {
    // Single string parsing
    return new RegExp("^(?!.*(" + safe + "))");
  }  
}

// Rules for reLexer. This is a series of stacked regexes that compose to match
// a parsed query, for insertion into a parse tree for ordered processing of matches.
Query.rules = {
  /*** ATOMS ***/
  "idAtom": /\d{1,5}/,
  "nameAtom": /[^\s]+(\s+[^\s]+)*/,
  "spaceAtom": /\s+/,
  "yearAtom": /\d{4}/,
  /*** TERMS ***/
  // Terms include keywords, operators, and panda / zoo names.
  // Subjects, either an id number or a panda / zoo name.
  "subjectTerm": or(
    ':idAtom>idAtom',
    ':nameAtom>nameAtom'
  ),
  // Tags: match any of the tags in the language files
  "tagTerm": Query.regexp.match_portion(Query.values(Language.L.tags)),
  // Type: panda or zoo kewards
  "typeTerm": Query.regexp.match_portion(Query.ops.group.types),
  // Zeroary terms are operators that require no other keywords
  "zeroaryTerm": Query.regexp.match_single(Query.ops.group.zeroary),
  /*** EXPRESSIONS ***/
  // A query string consists of expressions
  "subjectExpression": [
    ":subjectTerm>subjectTerm",
  ],
  "tagExpression": [
    ':tagTerm>tagTerm', ':spaceAtom?', ':subjectTerm>subjectTerm'
  ],
  "typeExpression": [
    ':typeTerm>typeTerm', ':spaceAtom?', ':subjectTerm>subjectTerm'
  ],
  "zeroaryExpression": [
    ':zeroaryTerm>zeroaryTerm'
  ],
  // This is the root rule that new reLexer() starts its processing at 
  "expression": or(
    ':zeroaryExpression/1',
    ':typeExpression/2',
    ':tagExpression/3',
    // ':subjectExpression/4',
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
  /*** TERM ACTIONS ***/
  // Parse IDs if they are valid numbers, and names as if they have proper search 
  // capitalization. Parsing here percolates down itno other expressions :)
  "subjectTerm": function(_, captures) {
    [match_type, value] = captures;
    if (Query.env.output == "photos") {
      // Search results must be post-processed for photo credit mode.
      // Take the name we'll be filtering photos on.
      Query.env.credit = value;
      return value;   // Return the string value unmodified for searching
    }
    switch (match_type) {
      case "idAtom":
        return Pandas.checkId(value) ? value : 0;
      case "nameAtom":
        return Query.resolver.name(value, L.display);
    }
  },
  // Tag expressions only result in photo results
  "tagTerm": function(_, capture) {
    var tag = capture.trim()
    Query.env.output = "photos";
    return tag;
  },
  "typeTerm": function(_, capture) {
    var type = capture.replace(" ", "");   // Support zeroary types
    // Don't adjust case for author searches. Switch to "photo credit" output mode
    if (Query.ops.type.credit.includes(type)) {
      Query.env.preserve_case = true;
      Query.env.output = "photos";
    // Normal searches. Just return pandas/zoos in a later subject search.
    // Re-capitalize to match names in the database.
    } else {
      Query.env.preserve_case = false;
      Query.env.output = "entities";
    }
    return type;
  },
  // Special zero-argument operator. Pass through.
  "zeroaryTerm": function(_, capture) {
    var keyword = capture;
    return keyword;
  },
  /*** EXPRESSION ACTIONS ***/
  // No type given. Based on result counts, guess whether this is a panda or zoo
  "subjectExpression": function(_, captures) {
    var panda_results = Query.resolver.subject(captures.subjectTerm, "panda", L.display);
    var zoo_results = Query.resolver.subject(captures.subjectTerm, "zoo", L.display);
    return (panda_results.length >= zoo_results.length) ? panda_results : zoo_results;
  },
  // Tag + Subject. Search for either a panda or a zoo.
  "tagExpression": function(_, captures) {
    var results = Query.resolver.tag(captures.subjectTerm, captures.tagTerm);
    return results;
  },
  // Type + Subject. Search for either a panda or a zoo.
  "typeExpression": function(_, captures) {
    var results = Query.resolver.subject(captures.subjectTerm, captures.typeTerm);
    return results;
  },
  // Resolve the behavior of the zero-argument operator into results.
  "zeroaryExpression": function(_, captures) {
    return Query.resolver.singleton(captures.zeroaryTerm);
  }
}
/* 
    Resolvers are non-callback ways to validate data from a parse. They typically
    turn some string value into a node in the Pandas graph.
*/
Query.resolver = {
  // Assume this is a panda name. Do locale-specific tweaks to
  // make the search work as you'd expect (capitalization, etc)
  // Can't base this on the current page language, since we need
  // to match latin partials against capitalized dataset names!
  "name": function(input) {
    var words = input.split(' ');
    return Language.capitalNames(words);
  },
  // Process searches that are just single keywords, like "babies"
  "singleton": function(keyword) {
    if (Query.ops.type.baby.indexOf(keyword) != -1) {
      return Pandas.searchBabies();
    }
    if (Query.ops.type.dead.indexOf(keyword) != -1) {
      return Pandas.searchDead();
    }
  },
  // Process a search term, either typed as panda/zoo, or untyped,
  // into a list of nodes in the Pandas/Zoos graph
  "subject": function(subject, type, language) {
    type = type.replace(" ", "");   // End of word $ check may add space to type
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
      return Pandas.searchPandaName(Query.resolver.name(subject, language));
    }
    if (Query.ops.type.zoo.indexOf(type) != -1) {
      return Pandas.searchZooName(Query.resolver.name(subject, language));
    }
  },
  "tag": function(subject, tag) {
    var subject_split = subject.split(' ');
    var canonical_subject = Language.capitalNames(subject_split);
    var pandas = Pandas.searchPanda(canonical_subject);
    return Pandas.searchPhotoTags(pandas, [tag], mode="photos", fallback="none");
  }
}

/*
    Lexer instantiation
*/
Query.lexer = new reLexer(Query.rules, 'expression', Query.actions);

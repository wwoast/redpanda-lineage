/*
    Query processing for the search box. Translates operators and parameters
    into a graph search.
*/

var Query = {};   // Namespace

Query.Q = {};     // Prototype

Query.init = function() {
  var query = Object.create(Query.Q);
  query.results = [];   // Where results are stored
  return query;
}

/*
    Operator Definitions and aliases, organized into stages (processing order), and then
    by alphabetical operator order, and then in the alternate languages for searching that
    we're trying to support. Includes lists of the valid operators that may work on two
    different panda arguments.
*/
Query.ops = {
  "type": {
    "panda": ['panda', 'red panda', 'パンダ', 'レッサーパンダ'],
    "zoo": ['zoo', '動物園']
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
  },
  "binary": [
    Query.ops.family.children,
    Query.ops.family.relatives,
    Query.ops.family.siblings,
    Query.ops.subtype.born,
    Query.ops.subtype.died
  ],
  "n_ary": [
    Query.ops.family.relatives,
    Query.ops.family.siblings
  ]
}

// Escape any characters in the operations list that have meaning for regexes.
// https://stackoverflow.com/questions/3446170/escape-string-for-use-in-javascript-regex
Query.safe_regexp_input = function(input) {
  if (input instanceof Array) {
    return input.map(i => i.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));  // $& means the whole matched string
  } else {
    return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}

// Make a regex that matches all terms in an array, or matches a single term from a string
Query.regexp = function(input) {
  var safe = Query.safe_regexp_input(input);
  if (safe instanceof Array) {
    // Parse any one of a number of equivalent operators
    return new RegExp(safe.join("|"), 'gi');
  } else {
    // Single string parsing
    return new RegExp(safe);  
  }
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

// Rules for reLexer. This is a series of stacked regexes that compose to match
// a parsed query, for insertion into a parse tree for ordered processing of matches.
Query.rules = {
  // Primitive components 
  number: /-?\d+(\.\d+)?/,
  space: /\s+/,
  string: /\w+/,
  separator: /\S{1}/,
  divider: [
    ':space?', ':separator?', ':space?'
  ],
  // Operators, in various languages
  type: Query.values(Query.ops.type),
  // Subjects, either an id number or a panda / zoo name
  id: ':number>number',
  subject: or(
    ':id>id',
    ':string>string'
  ),
  stringExpression: [
    ":subject>subject"
  ],
  typeExpression: [
    ':type>type', ':divider?', ':subject>subject'
  ],
  expression: or(
    ':typeExpression',
    ':stringExpression'
  )
}

/*
    Actions are callbacks from the lexer matching. If an expression matches one of the
    expressions in the rules list, one of these callbacks is run. The env is passed in
    when running the lexer.parse function.
*/
Query.actions = {
  "stringExpression": function(env, captures) {
    // Search on the Panda list and on the Zoo list. Whichever has more hits
    // is what we'll say this string is.
    var panda_nodes = Query.resolver.subject(captures.subject, "panda");
    var zoo_nodes = Query.resolver.subject(captures.subject, "zoo");
    (panda_nodes.length >= zoo_nodes.length) ? Query.results.concat(panda_nodes)
                                             : Query.results.concat(zoo_nodes);
  },
  "typeExpression": function(env, captures) {
    var node = Query.resolvers.subject(captures.subject, captures.type);
    Query.results.push(node);
  }
}

/* 
    Resolvers are non-callback ways to validate data from a parse. They typically
    turn some string value into a node in the Pandas graph.
*/
Query.resolvers = {
  "is_id": function(input) {
    return (isFinite(input) && input != Pandas.def.animal['_id']);
  },
  "subject": function(subject, type) {
    // Explicitly search for a panda by id
    if ((Query.resolvers.is_id(subject)) &&
        (type in Query.ops.type.panda)) {
      return Pandas.searchPandaId(subject);
    }
    // Explicitly search for a zoo by id
    if ((Query.resolvers.is_id(subject) == true) &&
        (type in Query.ops.type.zoo)) {
      return Pandas.searchZooId(subject);
    }
    // Raw ids are assumed to be panda ids
    if ((Query.resolvers.is_id(subject)) &&
        (type == undefined)) {
      return Panda.searchPandaId(subject);    
    }
    // Otherwise search by name
    if (type in Query.ops.type.panda) {
      return Panda.searchPandaName(subject);
    }
    if (type in Query.ops.type.zoo) {
      return Panda.searchZooName(subject);
    }
  }
}

/*
    Lexer instantiation
*/
Query.lexer = new reLexer(Query.rules, 'expression', Query.actions);

/*
    Pre-reLexer Query processing helper and resolution methods
*/
// Resolve whether the input is a name or an id, purely based on retrieval attempts.
// Order these attempts as follows:
// 1) Numeric data is treated as an ID, and then searched by its type.
// 2) String data has language detection done
// 3) String exact matched against its type's name, nickname, or othername
// 4) String partial matched against its type's name, nickname, or othername.
//    -- At this point the type either has no results or is null --
// 5) String match as if type was panda
// 6) String match as if type was a zoo
// 7) String match as if type was a location
// 8) String match as if type was a date
Query.resolve = function(single_term, type, language) {
  var bundle = {
    "object": null,
    "language": language,
    "type": type,
  }
  // 1. Process numeric IDs, defaulting to assume it is
  // a panda unless otherwise described.
  if (Query.isId(single_term)) {
    if (type == "zoo") {
      bundle.object = Pandas.searchZooId(single_term);
    } else if (type == "panda") {
      bundle.object = Pandas.searchPandaId(single_term);
    } else {
      bundle.type = "panda";
      bundle.object = Pandas.searchPandaId(single_term);
    }
    return bundle;
  }
  // TODO: the rest of the resolution steps for strings.
  // For now, anything that's not a number is a string.
  // For English strings, our names are capitalized in
  // the database, and strings after a hyphern are also
  // capitalized.
  single_term = single_term.replace(/^\w/, function(chr) {
    return chr.toUpperCase();
  });
  single_term = single_term.replace(/-./, function(chr) {
    return chr.toUpperCase();
  });
  single_term = single_term.replace(/ ./, function(chr) {
    return chr.toUpperCase();
  });
  bundle.object = Pandas.searchPandaName(single_term);
  return bundle;
}

// Given a list of tokens, return a bundle with the current set of 
// tokens processed, and metadata about each found token in the terms.
Query.findTokens = function(terms, tokens) {
  var bundle = {
    "terms": terms
  };
  tokens.forEach(function(token) {
    var index = terms.indexOf(token);
    if (index > -1) {
      bundle[index] = {
      "object": undefined,
       "terms": terms[index],
        "type": "type"
      }
      terms[index] = Query.ops.processed;  // Tombstone a processed token
    }
  });
  return bundle;
}

// Find type operators (panda, zoo) and validate which terms after
// the type might be subjects for those type operators
Query.typeAtoms = function(terms) {
  var bundle = {};
  var types = Query.ops.type.panda.concat(Query.ops.type.zoo);
  types.forEach(function(type_op) {
    var index = terms.indexOf(type_op);
    if (index > -1) {
      bundle[index] = {
      "object": undefined,
       "terms": terms[index],
        "type": "type"
      }
    }
  });
  terms.forEach(function(term) {
    
  });


  return bundle;
}

// Split input into words, and ascribe meanings to each one.
// Return a bundle with an array of terms, with an array of meanings.
Query.tokenize = function(input) {
  var bundle = {};
  var terms = input.split(' ');

  // Pass 1: Find type operators (panda, zoo)

}

/*
    Query processing rules
*/
// TOWRITE MORE

/*
    Hash-Link Processing
*/
// Differentiate between events that change the hashlink on a page.
Query.hashlink = function(input) {
  if ((input.indexOf("#panda_") == 0) || (input.indexOf("#zoo_") == 0)) {
    // in-links don't need a redraw
    return false;
  } else if (input.indexOf("#panda/") == 0) {
    // go-link for a single panda result.
    // for now, just a search result. soon, a detailed result page
    var panda = input.slice(7);
    var bundle = Query.resolve(panda, "panda", "en");
    return bundle.object;
  } else if (input.indexOf("#zoo/") == 0) {
    // go-link for a single zoo result.
    var zoo = input.slice(5);
    var bundle = Query.resolve(zoo, "zoo", "en");
    return bundle.object;
  } else if (input.indexOf("#timeline/") == 0) {
    // show full info and timeline for a panda. TODO
    var panda = input.slice(10);
    var bundle = Query.resolve(panda, "panda", "en");
    return bundle.object;
  } else if (input.indexOf("#query/") == 0) {
    // process a query. TODO: better
    var query = input.slice(7);
    var single_term = query.split(' ')[0];
    var bundle = Query.resolve(single_term, "panda", "en");
    return bundle.object;
  } else {
    // Don't know how to process the hashlink, so do nothing
    return false;
  }
}
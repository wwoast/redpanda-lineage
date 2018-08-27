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
  }
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
  type: Query.regexp(Query.values(Query.ops.type)),
  // Subjects, either an id number or a panda / zoo name
  id: ':number',
  subject: or(
    ':id',
    ':string'
  ),
  stringExpression: [
    ":subject"
  ],
  typeExpression: [
    ':type', ':divider?', ':string'
  ],
  // This is the root rule that new reLexer() starts its processing at 
  expression: or(
    ':id'
  )
}

/*
    Actions are callbacks from the lexer matching. If an expression matches one of the
    expressions in the rules list, one of these callbacks is run. The env is passed in
    when running the lexer.parse function.

    The format of capture is as follows:
     - non named capture (:subject) => capture is a scalar
     - named capture (:number>id) => capture is an array, with a[1] being the value
     - multiple captures, apparently looks like capture.(named)/capture.(named)

     Try putting parser and friends into its own object since it doesn't like being on this one
     or removing all use of concat from my javascript since it uses up the call stack:
     https://davidwalsh.name/merge-arrays-javascript
*/
Query.actions = {
  // Search on the Panda list and on the Zoo list. Prefer to do ID matches for pandas
  "id": function(env, captures) {
    var panda_nodes = Query.resolver.subject(captures, "panda");
    var zoo_nodes = Query.resolver.subject(captures, "zoo");
    Query.results = (panda_nodes.length >= zoo_nodes.length) ? panda_nodes : zoo_nodes;
  }
}

/* 
    Resolvers are non-callback ways to validate data from a parse. They typically
    turn some string value into a node in the Pandas graph.
*/
Query.resolver = {
  // Is the input an id number or not?
  "is_id": function(input) {
    return (isFinite(input) && input != Pandas.def.animal['_id']);
  },
  // Assume this is a panda name. Do locale-specific tweaks to
  // make the search work as you'd expect (capitalization, etc)
  "name": function(input, language) {
    if (language in ["en", "es"]) {  // Latin languages get caps
      input = input.replace(/^\w/, function(chr) {
        return chr.toUpperCase();
      });
      input = input.replace(/-./, function(chr) {
        return chr.toUpperCase();
      });
      input = input.replace(/ ./, function(chr) {
        return chr.toUpperCase();
      });
    }
    return input;
  },
  // Process a search term, either typed as panda/zoo, or untyped
  "subject": function(subject, type) {
    // Explicitly search for a panda by id
    if ((Query.resolver.is_id(subject)) &&
        (Query.ops.type.panda.indexOf(type) != -1)) {
      return Pandas.searchPandaId(subject);
    }
    // Explicitly search for a zoo by id
    if ((Query.resolver.is_id(subject) == true) &&
        (Query.ops.type.zoo.indexOf(type) != -1)) {
      return Pandas.searchZooId(subject);
    }
    // Raw ids are assumed to be panda ids
    if ((Query.resolver.is_id(subject)) &&
        (type == undefined)) {
      return Pandas.searchPandaId(subject);    
    }
    // Otherwise search by name
    if (Query.ops.type.panda.indexOf(type) != -1) {
      return Pandas.searchPandaName(Query.resolver.name(input, L));
    }
    if (Query.ops.type.zoo.indexOf(type) != -1) {
      return Pandas.searchZooName(Query.resolver.name(input, L));
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
  if (Query.resolver.is_id(single_term)) {
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
    // process a query. TODO: racey?
    return Query.results;
  } else {
    // Don't know how to process the hashlink, so do nothing
    return false;
  }
}
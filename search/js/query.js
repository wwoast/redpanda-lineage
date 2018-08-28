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
    return new RegExp(safe.join("|"), 'iu');
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
  "id": /\d{1,5}/,
  "space": /\s+/,
  "string": /\w+/,
  "separator": /\S{1}/,
  "divider": [
    ':space?', ':separator?', ':space?'
  ],
  // Operators, in various languages
  "type": Query.regexp(Query.values(Query.ops.type)),
  // "type": /panda|zoo/,
  // Subjects, either an id number or a panda / zoo name
  "subject": or(
    ':id>id',
    ':string>string'
  ),
  // Expression types
  "subjectExpression": [
    ":subject>subject"
  ],
  "typeExpression": [
    ':type>type', ':space?', ':subject>subject'
  ],
  // This is the root rule that new reLexer() starts its processing at 
  "expression": or(
    ':typeExpression',
    ':subjectExpression'
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

     Do all query processing in these action functions, with the output landing in the
     Query.results[] array.

     When any of the types shown in the regex list are seen, you get one of these callbacks,
     regardless of whether they're in the expression list or not! So you only want callbacks
     for full expression matches.
*/
Query.actions = {
  // Parse IDs if they are valid numbers, and names as if they have proper search 
  // capitalization. Parsing here percolates down itno other expressions :)
  "subject": function(env, captures) {
    [match_type, value] = captures;
    switch (match_type) {
      case "id":
        return Query.resolver.is_id(value) ? value : 0;
      case "string":
        return Query.resolver.name(value, L);
    }
  },
  // No type given. Based on result counts, guess whether this is a panda or zoo
  "subjectExpression": function(env, captures) {
    var panda_results = Query.resolver.subject(captures.subject, "panda", L);
    var zoo_results = Query.resolver.subject(captures.subject, "zoo", L);
    return (panda_results.length >= zoo_results.length) ? panda_results : zoo_results;
  },
  // Type is given. Search for either a panda or a zoo.
  "typeExpression": function(env, captures) {
    var results = Query.resolver.subject(captures.subject, captures.type);
    return results;
  }
},

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
    if (["en", "es"].indexOf(language) != -1) {  // Latin languages get caps
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
  // Process a search term, either typed as panda/zoo, or untyped,
  // into a list of nodes in the Pandas/Zoos graph
  "subject": function(subject, type, language) {
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
      return Pandas.searchPandaName(Query.resolver.name(subject, language));
    }
    if (Query.ops.type.zoo.indexOf(type) != -1) {
      return Pandas.searchZooName(Query.resolver.name(subject, language));
    }
  }
}

/*
    Lexer instantiation
*/
Query.lexer = new reLexer(Query.rules, 'expression', Query.actions);

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
    return Query.resolver.subject(panda, "panda", L);
  } else if (input.indexOf("#zoo/") == 0) {
    // go-link for a single zoo result.
    var zoo = input.slice(5);
    return Query.resolver.subject(zoo, "zoo", L);
  } else if (input.indexOf("#timeline/") == 0) {
    // show full info and timeline for a panda. TODO
    var panda = input.slice(10);
    return Query.resolver.subject(panda, "panda", L);
  } else if (input.indexOf("#query/") == 0) {
    // process a query.
    var terms = input.slice(7);
    return Query.lexer.parse(terms);
  } else {
    // Don't know how to process the hashlink, so do nothing
    return false;
  }
}
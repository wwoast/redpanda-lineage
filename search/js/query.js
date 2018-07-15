/*
    Query processing for the search box. Translates operators and parameters
    into a graph search.
*/

var Query = {};   // Namespace

Query.Q = {};     // Prototype

Query.init = function() {
  /* Create a Query object.

     This stores the stack of operations and parameters necessary to perform
     targeted searches in the panda database.
  */ 
  var query = Object.create(Query.Q); 
  return query;
}

/*
    Query processing helper and resolution methods
*/
// Is the given input a non-zero id number or not? Helper for other resolve function
Query.isId = function(input) {
  return (isFinite(input) && input != Pandas.def.animal['_id']);
}

// Naive language detection of input strings. TODO: make better :P
// Assume Japanese if any Japanese characters are detected!
Query.myLanguage = function(input) {
  for (var i = 0; i < input.length; i++) {
    if ((str.charCodeAt(i) >= 12352 && str.charCodeAt(i) <= 12543) ||
        (str.charCodeAt(i) >= 19000 && str.charCodeAt(i) <= 44000)) {
      return "jp";
    }
  }
  return "en";
}

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
Query.resolve = function(input, type, language) {
  var bundle = {
    "object": null,
    "language": language,
    "type": type,
  }
  // 1. Process numeric IDs, defaulting to assume it is
  // a panda unless otherwise described.
  if (Query.isId(input)) {
    if (type == "zoo") {
      bundle.object = Pandas.searchZooId(input);
    } else if (type == "panda") {
      bundle.object = Pandas.searchPandaId(input);
    } else {
      bundle.type = "panda";
      bundle.object = Pandas.searchPandaId(input);
    }
    return bundle;
  }
  // TODO: the rest of the resolution steps for strings
  return bundle;
}

/*
    Query processing rules
*/
// TOWRITE
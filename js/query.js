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

/* 
    Resolve the query string into something
*/
Query.resolver = function(input_string) {
  var parse_tree = Parse.tree.generate(input_string);
  
  // Build result sets. For now, this should just be very simple result sets
  // based on one of the available 

  // Process searches that are just single keywords, like "babies"
  /*
  "singleton": function(keyword) {
    if (Query.ops.type.baby.indexOf(keyword) != -1) {
      return Pandas.searchBabies();
    }
    if (Query.ops.type.nearby.indexOf(keyword) != -1) {
      if (F.resolved == false) {
        F.getNaiveLocation();
      }
      // If we're still on a query page and another action hasn't occurred,
      // display the zoo results when we're done.
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
  */
}

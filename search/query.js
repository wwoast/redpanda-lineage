/*
    Query processing for the search box. Translates operators and parameters
    into a graph search.
*/

var Query = {};   // Namespace

Query.Q = {};     // Prototype

Query.init = function() {
  /* Create a Query object

  XMLHttpRequest the JSON panda data once all basic scripts have loaded.
  Then return the big chunk of data, along with our query functions.
  */ 
  var query = Object.create(Query.Q); 
  return query;
}
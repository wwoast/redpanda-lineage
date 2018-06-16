/*
    Logic for a Red Panda database search form.
    Built with love and Dagoba.js :)  
*/


var Pandas = {};   // Namespace

Pandas.P = {};     // Prototype

Pandas.init = function() {
  /* Create a Pandas search object, and do the initial database import.
  
  XMLHttpRequest the JSON panda data once all basic scripts have loaded.
  Then return the big chunk of data, along with our query functions.
  */ 
  var db_url = "https://wwoast.github.io/redpanda-lineage/export/redpanda.json";
 
  var pandas = Object.create(Pandas.P); 
  var request = new XMLHttpRequest();
  request.open('GET', db_url);
  request.responseType = 'json';
  request.send();
  request.onload = function() {
    pandas.db = request.response;
  }

  return pandas;
}

/*
Pandas.P.test_output = function(db) {
  return JSON.stringify(db);
}
*/

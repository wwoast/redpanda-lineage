/*
    Logic for a Red Panda database search form.
    Built with love and Dagoba.js :)  
*/

/*
    The Panda search form namespace
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
    Operator Definitions and aliases, organized into stages (processing order), and then
    by alphabetical operator order, and then in the alternate languages for searching that
    we're trying to support
*/
Pandas.ops = {
  "type": {
    "panda": ['panda', 'red panda', 'パンダ', 'レッサーパンダ'],
    "zoo": ['zoo', '動物園']
  },
  "sub-type": {
    "alive": ['alive', 'living'],
    "born": ['born'],
    "dead": ['dead'],
    "died": ['died'],
    "in": ['in']
  },
  "glob": {
    "*": ['*'],
    "?": ['?']
  },
  "boolean": {
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

/*
    Methods for searching on Red Pandas
*/
Pandas.queryPandaId = function(idnum) {
  var node = G.v(idnum).run();
  console.log(a[0]['en.name']);
  return node;
}

Pandas.queryPandaName = function(query) {
  var nodes = G.v({"en.name": query}).run();
  return nodes;
}

// Search for each term in the graph database and infer what it is.
Pandas.resolveQueryTerms = function(query) {
  return null;
}
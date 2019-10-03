var Parse = {};   // Namespace. TODO: replace Query object

// Get a list of valid operators (the children) of the Parse.obj array
// Return the result as a single-level array
Parse.values = function(input) {
  var results = [];
  if (typeof input != "object") {
    results = results.concat(input);
  } else {
    Object.values(input).forEach(function(subinput) {
      if (typeof subinput != "object") {
        results = results.concat(subinput);
      } else {
        results = results.concat(Parse.values(subinput));
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
Parse.ops = {
  "type": {
    "baby": ['Baby', 'baby', 'Babies', 'babies', 'Aka-Chan', 'Aka-chan', 'aka-chan', '赤ちゃん'],
    "credit": ['Credit', 'credit', 'Author', 'author', '著者'],
    "dead": ["Dead", "dead", "Died", "died", "死", "Rainbow", "rainbow", "虹"],
    "nearby": ["nearby", "near", "近く", "近くの動物園"],
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

Parse.ops.group = {};
// Type operators 
Parse.ops.group.types = Parse.values(Parse.ops.type);
// Single keywords that represent queries on their own. Indexes into Parse.ops
Parse.ops.group.zeroary = Parse.values([
  Parse.ops.type.baby,
  Parse.ops.type.dead,
  Parse.ops.type.nearby,
  Language.L.tags
]);
Parse.ops.group.tags = Parse.values([
  Language.L.tags
]);
// Unary operators
Parse.ops.group.name_subject = Parse.values([
  Parse.ops.family,
  Parse.ops.type.credit,
  Parse.ops.type.panda,
  Parse.ops.type.zoo,
  Language.L.tags
]);
Parse.ops.group.number_subject = Parse.values([
  Parse.ops.family,
  Parse.ops.type.panda,
  Parse.ops.type.zoo,
  Language.L.tags
]);
// TODO: flesh where these operators live
Parse.ops.group.year_subject = Parse.values([
  Parse.ops.type.baby,
  Parse.ops.subtype.born,
  Parse.ops.subtype.dead,
  Parse.ops.subtype.died,
  Parse.ops.type.dead
]);
// Binary operators
Parse.ops.group.binary_logic = Parse.values([
  Parse.ops.logical.and,
  Parse.ops.logical.or
]);
// Regex strings
Parse.regex = {};
// Any number, positive or negative
Parse.regex.id = '(?:^[\-0-9][0-9]*)';
// Any sequence of strings separated by spaces
Parse.regex.name = '(?:[^\s]+(?:\s+[^\s]+)*)';
// Any year (1900 - 2999)
Parse.regex.year = '(?:19[0-9]{2}|2[0-9]{3})';

/* 
Navigation and introspection through a grammar's parse tree. 
jsleri won't do it for us, so we have to write this code ourself.

Pass separate children value in case we want to process not the original
parse tree, but a derived tree of children.
*/
Parse.tree = {};
// Build a grammar for making parse trees with.
Parse.tree.build_grammar = function() {
  var Choice = window.jsleri.Choice;
  var Grammar = window.jsleri.Grammar;
  var Keyword = window.jsleri.Keyword;
  var Prio = window.jsleri.Prio;
  var Regex = window.jsleri.Regex;
  var Sequence = window.jsleri.Sequence;
  // var THIS = window.jsleri.THIS;
  // Take a list of operators and turn it into a choice
  // NOTE: Choice.apply(Choice, Parse.ops) == Choice(...Parse.ops)
  var Choices = function(keyword_list) {
    return Choice.apply(Choice, (keyword_list).map(kw => Keyword(kw)));
  }
  // Take a sequence, and make it parse in either direction
  // Example: "born 1999" or "2005 babies"
  var Reversible = function(a, b) {
    return Choice(
      Sequence(a, b),
      Sequence(b, a)
    )
  }
  // Regex matches
  var r_id = Regex(Parse.regex.id);
  var r_name = Regex(Parse.regex.name);
  var r_year = Regex(Parse.regex.year);
  // Sets of operators
  // Zeroary keywords: Valid search with just a single term
  var c_k_zeroary = Choices(Parse.ops.group.zeroary);
  // Unary keywords: Valid search with the correct subject
  var c_k_unary_name = Reversible(Choices(Parse.ops.group.name_subject), r_name);
  var c_k_unary_number = Reversible(Choices(Parse.ops.group.name_subject), r_id);
  var c_k_unary_year = Reversible(Choices(Parse.ops.group.year_subject), r_year);
  // Binary keywords
  // var c_k_binary_logical = Choices(Parse.ops.group.binary_logic);
  // Start of the parsing logic, a list of prioritized forms of search queries
  var START = Prio(
    r_year,
    r_id,
    c_k_zeroary,
    c_k_unary_year,     // Unary keywords followed by year-number
    c_k_unary_number,   // Unary keywords followed by id-number
    c_k_unary_name,     // Unary keywords followed by a name-string
    // TODO: don't have parse tree techniques to detect these
    // Sequence('(', THIS, ')'),   // Bracketed expressions
    // Sequence(THIS, c_k_binary_logical, THIS),
    r_name
  );
  Parse.tree.grammar = Grammar(START);
}
// After performing the parse, navigate through the tree and do subsequent
// node type classification and resolution.
Parse.tree.classify = function(tree) {
  // Get subject nodes (year/name/id)
  var subject_nodes = this.filter(tree, this.tests.subject);
  // Get the subject container nodes, and classify those vlaues
  var container_nodes = subject_nodes.map(n => this.get_subject_container(n));
  container_nodes.forEach(n => this.node_type_composite_ids(n));
  // Finally, given what's in the containers, resolve what the keywords are
  for (let containter_node of container_nodes) {
    var value_nodes = this.filter(container_node, this.tests.singular);
    // Resolve keyword types into something more specific based on the subject
    this.node_type_specific_ids(container_node, value_nodes);
  }
}
// Flatten results from something in a tree like form, to an array
Parse.tree.flatten = function(input) {
  var array = [];
  while(input.length) {
    var value = input.shift();
    if (Array.isArray(value)) {
      input = value.concat(input);
    } else {
      array.push(value);
    }
  }
  return array;
}
// Filter all nodes of a tree and return a list of nodes that match
// a given condition that we care about. 
// Tests are an array of dict, and each dict has field names and values.
// If any one of the tests match, it's a node we want.
Parse.tree.filter = function(node, tests) {
  var results = [];
  outer: for (let test of tests) {
    for (let field in test) {
      if (node.hasOwnProperty(field)) {
        var value = test[field];
        if (node[field] == value) {
          results.push(node);
          break outer;   // Don't add matching result more than once
        }
      }  
    }
  }
  // Do my children match?
  results = results.concat(node.children.map(c =>
    this.filter(c, tests)));
  return this.flatten(results);
}
// Convert jsleri parse tree to our desired format, one child at a time.
Parse.tree.get_children = function(parent, children) {
  return children.map(c => 
    this.node_props(parent, c, this.get_children(parent, c.children))
  );
}
// Start with leaf nodes containing type: "subject_*" in the parse tree,
// and then work your way up until you're looking at the parser's stanza
// where it parsed that subject in context of another keyword.
Parse.tree.get_subject_container = function(node) {
  var type = this.node_type_composite_ids(node.parent);
  if (type.indexOf("contains") == 0) {
    return this.get_subject_container(node.parent);
  } else {
    return node;
  }
}
// Where the grammar object is stored
Parse.tree.grammar = undefined;
Parse.tree.nodes = {};
Parse.tree.nodes.all = {};
Parse.tree.nodes.subjects = [];
// Define our ideal tree node, using jsleri's as a base 
Parse.tree.node_props = function(parent, node, children) {
  return {
    'start': node.start,
    'end': node.end,
    'type': this.node_type(node),
    'str': node.str,
    'parent': parent,
    'children': children
  }
}
// Identify the nodes by simple types, for later processing into query sets.
// This is the first-level of parse-tree node identification.
Parse.tree.node_type = function(node) {
  if (children.length != 0) {
    return "composite";
  }
  if (node.element.hasOwnProperty("keyword")) {
    return "keyword";
  }
  if (node.element.hasOwnProperty("re")) {
    if (node.element.re == Parse.regex.id) {
      return "subject_id";
    }
    if (node.element.re == Parse.regex.name) {
      return "subject_name";
    }
    if (node.element.re == Parse.regex.year) {
      return "subject_year";
    }
  }
}
// Starting with subject nodes, go up the tree and categorize
// nodes based on their children
// Figure out what a node is based on its composite types.
// This is the second-level of parse-tree node identification.
Parse.tree.node_type_composite_ids = function(node) {
  var singulars = this.filter(node, this.tests.singular).map(n => n.type).sort();
  if (singulars.length == 1) {
    return "contains_" + singulars[0];
  }
  // Unary parse structures
  if (singulars.length == 2) {
    if (singulars[0] == "keyword" && singulars[1] == "keyword") {
      return "set_keywords";
    }
    if (singulars[0] == "keyword" && singulars[1].indexOf("subject") == 0) {
      return "set_keyword_subject";
    }
  }
  // TODO: handle binary parse structures 
  return "composite";
}
// Identify nodes intended to form a set of results.
// Based on the combination of nodes, and possibly order, choose by default
// whether or not a keyword is parsed as a type or a tag, disambiguating.
// This is the third-level of parse-tree node identification.
Parse.tree.node_type_specific_ids = function(container_node, value_nodes) {
  if (container_node.type == "set_keywords") {
    var keywords = value_nodes.map(n => n.str);
    // Many keyword combinations will not have valid results, but we want to
    // do some processing if we see certain types together. Examples:
    // 1) If all are tags: search set should be intersection of all tags
    // TODO
  }
  if (container_node.type == "set_keyword_subject") {
    var keyword_node = this.filter(value_nodes, [{"type": "keyword"}]);
    var subject_node = this.filter(value_nodes, this.tests.subject);
    // Some keyword-subject combinations will not have valid results, but we
    // want to process certain types of results together. Examples, from most
    // specific to least specific:
    //  1) (baby)+(year): baby is a type, year is the subject. Get all babies
    if ((Parse.ops.group.type.baby.indexOf(keyword_node.str) != -1) && 
        (subject_node.type == "subject_year")) {
      container_node.type = "set_babies_list_year";
      keyword_node.type = "type";
    }
    //  2) (baby)+(name or id): baby is a tag, name is the intended panda. Get baby photos
    else if ((Parse.ops.group.type.baby.indexOf(keyword_node.str) != -1) &&
             ((subject_node.type == "subject_name") || 
              (subject_node.type == "subject_year"))) {
      container_node.type = "set_baby_photos_subject";
      keyword_node.type = "tag";
    }
    //  3) (credit)+(any subject): subject is an author name. Author search
    else if (Parse.ops.type.credit.indexOf(keyword_node.str) != -1) {
      container_node.type = "set_credit_photos";
      keyword_node.type = "subject_author";
    }
    //  4) (family-term)+(year or id): keyword plus an id. Get pandas of "relation"
    else if ((Parse.values(Parse.ops.family).indexOf(keyword_node.str) != -1) &&
             (subject_node.type == "subject_year")) {
      container_node.type = "set_family_list";
      subject_node.type = "subject_panda_id";
    }
    //  5) (group.year_subject)+(year or id): keyword plus a year
    else if ((Parse.ops.group.year_subject.indexOf(keyword_node.str) != -1) &&
             (subject_node.type == "subject_id"))          
    {
      container_node.type = "set_keyword_year";
      subject_node.type = "subject_year";
    }
    //  6) (nearby)+(year or id): id of a zoo. Get zoos near the given one.
    else if ((Parse.ops.nearby.indexOf(keyword) != -1) &&
             (subject_node.type == "subject_id")) {
      container_node.type = "set_nearby_zoo";
      subject_node.type = "subject_zoo_id";
    }
    //  7) (panda|zoo)+(year or id): keyword plus an id. Get the panda matching the id.
    else if ((Parse.ops.nearby.indexOf(keyword) != -1) &&
             (subject_node.type == "subject_id")) {
      container_node.type = "set_nearby_zoo";
      subject_node.type = "subject_zoo_id";
    }
    //  8) (subtype but not in)+(year or id): keyword plus an id. Panda search
    // TODO
    //  9) (subtype in)+(year or id): keyword plus an id. Get pandas at a zoo id
    // TODO
    // 10) (tag)+(year or id): tag of a photo, plus an id. Get tagged photos of a panda.
    else if ((Parse.ops.group.tags.indexOf(keyword) != -1) &&
             ((subject_node.type == "subject_year") || 
              (subject_node.type == "subject_id"))) {
      container_node.type = "set_tag_id";
      keyword_node.type = "tag";
      subject_node.type = "subject_id";
    }
  }
}
Parse.tree.types = {};
Parse.tree.types.composite = ["choice", "composite", "sequence"];
Parse.tree.types.singular = ["id", "keyword", "name", "year"];
Parse.tree.types.subject = ["id", "name", "year"];
Parse.tree.tests = {};
Parse.tree.tests.composite = Parse.tree.types.composite.map(t => ({"type": t}));
Parse.tree.tests.singular = Parse.tree.types.singular.map(t => ({"type": t}));
Parse.tree.tests.subject = Parse.tree.types.subject.map(t => ({"type": t}));
// Takes the result from parsing a grammar, and builds a parse tree
// with our own node details and formatting, based on jsleri's
Parse.tree.view = function(parse_input) {
  if (this.grammar == undefined) {
    console.log("No query grammar defined")
    return {};
  }
  var result = this.grammar.parse(parse_input);
  var start = result.tree;
  if (result.tree.hasOwnProperty("children")) {
    start = result.tree.children[0];
  }
  return this.node_props(undefined, start, this.get_children(start, start.children));
}
// Write a parse tree based on the given input
Parse.tree.write = function(parse_input) {
  this.nodes.all = this.view(parse_input);
  return this.nodes.all;
}

// Build the grammar for functions to use immediately
Parse.tree.build_grammar();

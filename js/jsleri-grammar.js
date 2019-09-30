var Queri = {};   // Namespace. TODO: replace Query object

// Get a list of valid operators (the children) of the Queri.obj array
// Return the result as a single-level array
Queri.values = function(input) {
  var results = [];
  if (typeof input != "object") {
    results = results.concat(input);
  } else {
    Object.values(input).forEach(function(subinput) {
      if (typeof subinput != "object") {
        results = results.concat(subinput);
      } else {
        results = results.concat(Queri.values(subinput));
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
Queri.ops = {
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

Queri.ops.group = {};
// Type operators 
Queri.ops.group.types = Queri.values(Queri.ops.type);
// Single keywords that represent queries on their own. Indexes into Queri.ops
Queri.ops.group.zeroary = Queri.values([
  Queri.ops.type.baby,
  Queri.ops.type.dead,
  Queri.ops.type.nearby,
  Language.L.tags
]);
// Unary operators
Queri.ops.group.name_subject = Queri.values([
  Queri.ops.family,
  Queri.ops.type.credit,
  Queri.ops.type.panda,
  Queri.ops.type.zoo,
  Language.L.tags
]);
Queri.ops.group.number_subject = Queri.values([
  Queri.ops.family,
  Queri.ops.type.panda,
  Queri.ops.type.zoo,
  Language.L.tags
]);
// TODO: flesh where these operators live
Queri.ops.group.year_subject = Queri.values([
  Queri.ops.type.baby,
  Queri.ops.subtype.born,
  Queri.ops.subtype.dead,
  Queri.ops.subtype.died,
  Queri.ops.type.dead
]);
// Binary operators
Queri.ops.group.binary_logic = Queri.values([
  Queri.ops.logical.and,
  Queri.ops.logical.or
]);
// Regex strings
Queri.regex = {};
// Any number, positive or negative
Queri.regex.id = '(?:^[\-0-9][0-9]*)';
// Any sequence of strings separated by spaces
Queri.regex.name = '(?:[^\s]+(?:\s+[^\s]+)*)';
// Any year (1900 - 2999)
Queri.regex.year = '(?:19[0-9]{2}|2[0-9]{3})';

/* 
Navigation and introspection through a grammar's parse tree. 
jsleri won't do it for us, so we have to write this code ourself.

Pass separate children value in case we want to process not the original
parse tree, but a derived tree of children.
*/
Queri.tree = {};
// Build a grammar for making parse trees with.
Queri.tree.build_grammar = function() {
  var Choice = window.jsleri.Choice;
  var Grammar = window.jsleri.Grammar;
  var Keyword = window.jsleri.Keyword;
  var Prio = window.jsleri.Prio;
  var Regex = window.jsleri.Regex;
  var Sequence = window.jsleri.Sequence;
  // var THIS = window.jsleri.THIS;
  // Take a list of operators and turn it into a choice
  // NOTE: Choice.apply(Choice, Queri.ops) == Choice(...Queri.ops)
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
  var r_id = Regex(Queri.regex.id);
  var r_name = Regex(Queri.regex.name);
  var r_year = Regex(Queri.regex.year);
  // Sets of operators
  // Zeroary keywords: Valid search with just a single term
  var c_k_zeroary = Choices(Queri.ops.group.zeroary);
  // Unary keywords: Valid search with the correct subject
  var c_k_unary_name = Reversible(Choices(Queri.ops.group.name_subject), r_name);
  var c_k_unary_number = Reversible(Choices(Queri.ops.group.name_subject), r_id);
  var c_k_unary_year = Reversible(Choices(Queri.ops.group.year_subject), r_year);
  // Binary keywords
  // var c_k_binary_logical = Choices(Queri.ops.group.binary_logic);
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
  Queri.tree.grammar = Grammar(START);
}
// Flatten results from something in a tree like form, to an array
Queri.tree.flatten = function(input) {
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
Queri.tree.filter = function(node, tests) {
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
// Convert jsleri parse tree to our desired format, one child at a time
Queri.tree.get_children = function(parent, children) {
  return children.map(c => 
    this.node_props(parent, c, this.get_children(parent, c.children))
  );
}
// Where the grammar object is stored
Queri.tree.grammar = undefined;
// Define our ideal tree node, using jsleri's as a base 
Queri.tree.node_props = function(parent, node, children) {
  return {
    'start': node.start,
    'end': node.end,
    'type': this.node_type(node, children),
    'str': node.str,
    'parent': parent,
    'children': children
  }
}
// Identify the nodes by type, for later processing into query sets
Queri.tree.node_type = function(node, children) {
  if (children.length != 0) {
    return "composite";   // TODO: nuance here
  }
  if (node.element.hasOwnProperty("keyword")) {
    return "keyword";   // TODO: is it an operator or a tag?
  }
  if (node.element.hasOwnProperty("re")) {
    if (node.element.re == Queri.regex.id) {
      return "id";
    }
    if (node.element.re == Queri.regex.name) {
      return "name";
    }
    if (node.element.re == Queri.regex.year) {
      return "year";
    }
  }
}
Queri.tree.types = {};
Queri.tree.types.composite = ["choice", "composite", "sequence"];
Queri.tree.types.singular = ["id", "keyword", "name", "year"];
Queri.tree.tests = {};
Queri.tree.tests.composite = Queri.tree.types.composite.map(t => ({"type": t}));
Queri.tree.tests.singular = Queri.tree.types.singular.map(t => ({"type": t}));
// Takes the result from parsing a grammar, and builds a parse tree
// with our own node details and formatting, based on jsleri's
Queri.tree.view = function(parse_input) {
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

// Build the grammar for functions to use immediately
Queri.tree.build_grammar();
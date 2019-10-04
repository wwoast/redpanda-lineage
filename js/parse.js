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
    TODO: organize operators by language for easier tracking / updating
    TODO: born after/before/etc
*/
Parse.keyword = {};
/* Parse.keyword.alive = TODO */
/* Parse.keyword.at = TODO */
Parse.keyword.baby = {
  "cn": ['TOWRITE'],
  "en": ['aka-chan', 'Aka-Chan', 'Aka-chan', 'baby', 'Baby', 'babies', 'Babies'],
  "jp": ['赤', '赤ちゃん']
}
Parse.keyword.born = {
  "cn": ['TOWRITE'],
  "en": ['born', 'Born'],
  "jp": ['TOWRITE']
}
/* Parse.keyword.born + (around|after|before) = TODO */
Parse.keyword.credit = {
  "cn": ['TOWRITE'],
  "en": ['author', 'Author', 'credit', 'Credit'],
  "jp": ['著者']
}
Parse.keyword.dead = {
  "cn": ['TOWRITE'],
  "en": ['dead', 'Dead', 'died', 'Died', 'rainbow', 'Rainbow'],
  "jp": ['死', '虹']
}
Parse.keyword.family = {};
Parse.keyword.family.aunt = {
  "cn": ['TOWRITE'],
  "en": ['aunt', 'Aunt'],
  "jp": ['TOWRITE']
}
Parse.keyword.family.brother = {
  "cn": ['TOWRITE'],
  "en": ['brother', 'Brother'],
  "jp": ['TOWRITE']
}
Parse.keyword.family.cousin = {
  "cn": ['TOWRITE'],
  "en": ['cousin', 'Cousin'],
  "jp": ['TOWRITE']
}
Parse.keyword.family.children = {
  "cn": ['TOWRITE'],
  "en": ['children'],
  "jp": ['TOWRITE']
}
Parse.keyword.family.dad = {
  "cn": ['TOWRITE'],
  "en": ['dad', 'Dad', 'father', 'Father', 'papa', 'Papa'],
  "jp": ['TOWRITE']
}
Parse.keyword.family.grandma = {
  "cn": ['TOWRITE'],
  "en": ['grandma', 'Grandma', 'grandmother', 'Grandmother'],
  "jp": ['TOWRITE']
}
Parse.keyword.family.grandpa = {
  "cn": ['TOWRITE'],
  "en": ['grandpa', 'Grandpa', 'grandfather', 'Grandfather'],
  "jp": ['TORWITE']
}
Parse.keyword.family.litter = {
  "cn": ['TOWRITE'],
  "en": ['litter', 'Litter'],
  "jp": ['TOWRITE']
}
Parse.keyword.family.mate = {
  "cn": ['TOWRITE'],
  "en": ['husband', 'Husband', 'mate', 'Mate', 'partner', 'Partner', 'wife', 'Wife'],
  "jp": ['TOWRITE']
}
Parse.keyword.family.mom = {
  "cn": ['TOWRITE'],
  "en": ['mam', 'Mam', 'mama', 'Mama', 'mom', 'Mom', 'mommy', 'Mommy', 'mother', 'Mother'],
  "jp": ['TOWRITE']
}
Parse.keyword.family.nephew = {
  "cn": ['TOWRITE'],
  "en": ['nephew', 'Nephew'],
  "jp": ['TOWRITE']
}
Parse.keyword.family.niece = {
  "cn": ['TOWRITE'],
  "en": ['niece', 'Niece'],
  "jp": ['TOWRITE']
}
Parse.keyword.family.parents = {
  "cn": ['TOWRITE'],
  "en": ['parent', 'Parent', 'parents', 'Parents'],
  "jp": ['TOWRITE']
}
Parse.keyword.family.relatives = {
  "cn": ['TOWRITE'],
  "en": ['family', 'Family', 'relatives', 'Relatives'],
  "jp": ['TOWRITE']
}
Parse.keyword.family.siblings = {
  "cn": ['TOWRITE'],
  "en": ['sibling', 'Sibling', 'siblings', 'Siblings'],
  "jp": ['TOWRITE']
}
Parse.keyword.family.uncle = {
  "cn": ['TOWRITE'],
  "en": ['uncle', 'Uncle'],
  "jp": ['TOWRITE']
}
/* Parse.keyword.in = TODO */
/* Parse.keyword.logical AND/OR/NOT/NOR = TODO */
Parse.keyword.nearby = {
  "cn": ['TOWRITE'],
  "en": ['near', 'Near', 'nearby', 'Nearby'],
  "jp": ['近く', '近くの動物園']
}
Parse.keyword.panda = {
  "cn": ['TOWRITE'],
  "en": ['panda', 'Panda', 'red panda', 'Red panda', 'Red Panda'],
  "jp": ['パンダ', 'レッサーパンダ']
}
Parse.keyword.tag = {
  "cn": ['TOWRITE'],
  "en": ['tag', 'Tag', 'tags', 'Tags'],
  "jp": ['TOWRITE']
}
Parse.keyword.zoo = {
  "cn": ['TOWRITE'],
  "en": ['zoo', 'Zoo'],
  "jp": ['動物園']
}

Parse.group = {};
// Valid baby keywords
Parse.group.baby = Parse.values([
  Parse.keyword.baby
]);
// Valid credit keywords
Parse.group.credit = Parse.values([
  Parse.keyword.credit
]);
// Valid family keywords
Parse.group.family = Parse.values([
  Parse.keyword.family
]);
// Valid nearby keywords
Parse.group.nearby = Parse.values([
  Parse.keyword.nearby
]);
// Valid panda keywords
Parse.group.panda = Parse.values([
  Parse.keyword.panda
]);
// Aggregate of all possible tag values
Parse.group.tags = Parse.values([
  Language.L.tags
]);
// Keywords that take some form of arbitrary string name
Parse.group.takes_subject_name = Parse.values([
  Language.L.tags,
  Parse.keyword.credit,
  Parse.keyword.family,
  Parse.keyword.panda,
  Parse.keyword.zoo
]);
// Keywords that take some form of numeric ID value
Parse.group.takes_subject_number = Parse.values([
  Language.L.tags,
  Parse.keyword.family,
  Parse.keyword.panda,
  Parse.keyword.zoo
]);
// Keywords that take some kind of numeric year value
Parse.group.takes_subject_year = Parse.values([
  Parse.keyword.baby,
  Parse.keyword.born,
  Parse.keyword.dead
]);
// Single keywords that represent queries on their own
Parse.group.zeroary = Parse.values([
  Language.L.tags,
  Parse.keyword.baby,
  Parse.keyword.dead,
  Parse.keyword.nearby
]);
// Valid zoo keywords
Parse.group.zoo = Parse.values([
  Parse.keyword.zoo
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
  // NOTE: Choice.apply(Choice, Parse.keyword) == Choice(...Parse.keyword)
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
  var c_k_zeroary = Choices(Parse.group.zeroary);
  // Unary keywords: Valid search with the correct subject
  var c_k_unary_name = Reversible(Choices(Parse.group.takes_subject_name), r_name);
  var c_k_unary_number = Reversible(Choices(Parse.group.takes_subject_number), r_id);
  var c_k_unary_year = Reversible(Choices(Parse.group.takes_subject_year), r_year);
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
  // TODO: for zeroary / single item queries, need a classify strategy
  var container_nodes = subject_nodes.map(n => this.walk_to_subject_container(n));
  // Finally, given what's in the containers, resolve what the keywords are
  for (let container_node of container_nodes) {
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
Parse.tree.get_children = function(children) {
  return children.map(c => 
    this.node_props(c, this.get_children(c.children))
  );
}
// Where the grammar object is stored
Parse.tree.grammar = undefined;
// Add parent node connectivity to the tree after the basic tree is generated
Parse.tree.link_parents = function(current) {
  current.children.forEach(c => c['parent'] = current);
  current.children.forEach(c => this.link_parents(c));
}
// Define our ideal tree node, using jsleri's as a base 
Parse.tree.node_props = function(node, children) {
  return {
    'start': node.start,
    'end': node.end,
    'type': this.node_type(node, children),
    'str': node.str,
    'children': children
  }
}
// Identify the nodes by simple types, for later processing into query sets.
// This is the first-level of parse-tree node identification.
Parse.tree.node_type = function(node, children) {
  if (children == undefined) {
    return;   // No need to update anything
  }
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
    return "contains";
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
    var keywords_tags = keywords.filter(k => Parse.group.tags.indexOf(k) != -1);
    if (keywords.length == keywords_tags.length) {
      container_node.type = "set_photos_matching_tags";
      value_nodes.forEach(n => n.type = "tag");
    }
    // TODO: how to handle the invalid case?
  }
  if (container_node.type == "set_keyword_subject") {
    var keyword_node = this.filter(container_node, [{"type": "keyword"}])[0];
    var subject_node = this.filter(container_node, this.tests.subject)[0];
    // Some keyword-subject combinations will not have valid results, but we
    // want to process certain types of results together. Examples, from most
    // specific to least specific:
    //  1) (baby)+(year): baby is a type, year is the subject. Get all babies
    if ((Parse.group.baby.indexOf(keyword_node.str) != -1) && 
        (subject_node.type == "subject_year")) {
      container_node.type = "set_babies_list_year";
      keyword_node.type = "type";
    }
    //  2) (baby)+(name or id): baby is a tag, name is the intended panda. Get baby photos
    else if ((Parse.group.baby.indexOf(keyword_node.str) != -1) &&
             ((subject_node.type == "subject_name") || 
              (subject_node.type == "subject_year"))) {
      container_node.type = "set_baby_photos_subject";
      keyword_node.type = "tag";
    }
    //  3) (credit)+(any subject): subject is an author name. Author search
    else if (Parse.group.credit.indexOf(keyword_node.str) != -1) {
      container_node.type = "set_credit_photos";
      keyword_node.type = "subject_author";
    }
    //  4) (family-term)+(year or id): keyword plus an id. Get pandas of "relation"
    else if ((Parse.group.family.indexOf(keyword_node.str) != -1) &&
             (subject_node.type == "subject_year")) {
      container_node.type = "set_family_list";
      subject_node.type = "subject_panda_id";
    }
    //  5) (group.year_subject)+(year or id): keyword plus a year
    else if ((Parse.group.takes_subject_year.indexOf(keyword_node.str) != -1) &&
             (subject_node.type == "subject_id"))          
    {
      container_node.type = "set_keyword_year";
      subject_node.type = "subject_year";
    }
    //  6) (nearby)+(year or id): id of a zoo. Get zoos near the given one.
    else if ((Parse.group.nearby.indexOf(keyword_node.str) != -1) &&
             (subject_node.type == "subject_id")) {
      container_node.type = "set_nearby_zoo";
      subject_node.type = "subject_zoo_id";
    }
    //  7) (panda)+(year or id): keyword plus an id. Get the panda matching the id.
    else if ((Parse.group.panda.indexOf(keyword_node.str) != -1) && 
             ((subject_node.type == "subject_id") || 
              (subject_node.type == "subject_year"))) {
      container_node.type = "set_panda_id";
      keyword_node.type = "type";
      subject_node.type = "subject_panda_id";
    }
    //  8) (zoo)+(year or id): keyword plus an id. Get the zoo matching the id.
    else if ((Parse.group.zoo.indexOf(keyword_node.str) != -1) && 
             ((subject_node.type == "subject_id") || 
              (subject_node.type == "subject_year"))) {
      container_node.type = "set_zoo_id";
      keyword_node.type = "type";
      subject_node.type = "subject_zoo_id";
    }
  }
}
Parse.tree.types = {};
Parse.tree.types.composite = [
  "choice",
  "composite",
  "contains",
  "sequence"
];
Parse.tree.types.singular = [
  "keyword",
  "subject_author",
  "subject_id",
  "subject_name",
  "subject_panda_id",
  "subject_year",
  "subject_zoo_id",
  "tag",
  "type"
];
Parse.tree.types.subject = [
  "subject_author",
  "subject_id",
  "subject_name",
  "subject_panda_id",
  "subject_year",
  "subject_zoo_id"
];
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
  var tree = this.node_props(start, this.get_children(start.children));
  // Double-link nodes in this tree to their parents
  this.link_parents(tree);
  return tree;
}
// Start with leaf nodes containing type: "subject_*" in the parse tree,
// and then work your way up until you're looking at the parser's stanza
// where it parsed that subject in context of another keyword. Re-classify
// any nodes you run into along the way.
Parse.tree.walk_to_subject_container = function(node) {
  var parent_type = this.node_type_composite_ids(node.parent);
  node.parent.type = parent_type;   // Set paret node types as we walk
  if (parent_type.indexOf("contains") == 0) {
    return this.get_subject_container(node.parent);
  } else {
    return node.parent;
  }
}
// Write a parse tree based on the given input
Parse.tree.write = function(parse_input) {
  this.nodes.all = this.view(parse_input);
  return this.nodes.all;
}

// Build the grammar for functions to use immediately
Parse.tree.build_grammar();

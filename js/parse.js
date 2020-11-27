var Parse = {};   // Namespace

L = Language.init();   // Initialize the language methods for proper parser building

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

// Given a search tag, find the equivalent term for that tag that is standardized
// on in the panda files, and return results for that tag. Searches all language
// keywords for a tag.
Parse.searchTag = function(search_tag) {
  // Lowercase any search terms in the latin character range
  var ranges = Pandas.def.ranges['en'];
  var latin = ranges.some(function(range) {
    return range.test(search_tag);
  });
  if (latin == true) {
    search_tag = search_tag.toLowerCase();
  }
  // Now search the tags list for a match
  for (var key of Object.keys(Language.L.tags)) {
    let terms = Parse.values(Language.L.tags[key]);
    if (terms.indexOf(search_tag) != -1) {
      return key;
    }
  }
  // Search things that could be tags in the right context
  for (var key of Object.keys(Language.L.polyglots)) {
    let terms = Parse.values(Language.L.polyglots[key]);
    if (terms.indexOf(search_tag) != -1) {
      return key;
    }    
  }
  return undefined;
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
Parse.keyword.born_at = {
  "cn": ['TOWRITE'],
  "en": ['born at', 'Born at'],
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
Parse.keyword.died_at = {
  "cn": ['TOWRITE'],
  "en": ['died at', 'Died at'],
  "jp": ['TOWRITE']
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
Parse.keyword.lived_at = {
  "cn": ['TOWRITE'],
  "en": ['lived at', 'Lived at'],
  "jp": ['TOWRITE']
}
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
  "en": ['label', 'labels', 'Label', 'Labels', 'tag', 'Tag', 'tags', 'Tags'],
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
// Valid born at keywords
Parse.group.born_at = Parse.values([
  Parse.keyword.born_at
]);
// Valid credit keywords
Parse.group.credit = Parse.values([
  Parse.keyword.credit
]);
// Valid dead keywords
Parse.group.dead = Parse.values([
  Parse.keyword.dead
]);
// Valid died at keywords
Parse.group.died_at = Parse.values([
  Parse.keyword.died_at
]);
// Valid family keywords
Parse.group.family = Parse.values([
  Parse.keyword.family
]);
// Valid keywords of any type
Parse.group.keywords = Parse.values([
  Parse.keyword
]);
// Valid lived at keywords
Parse.group.lived_at = Parse.values([
  Parse.keyword.lived_at
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
// Keywords that take some kind of contributor name
Parse.group.takes_subject_author = Parse.values([
  Parse.group.credit
]);
// Keywords that take some form of arbitrary string name
Parse.group.takes_subject_name = Parse.values([
  Language.L.tags,
  Parse.keyword.baby,
  Parse.keyword.credit,
  Parse.keyword.family,
  Parse.keyword.panda,
  Parse.keyword.zoo
]);
// Keywords that take some form of numeric ID value
Parse.group.takes_subject_number = Parse.values([
  Language.L.tags,
  Parse.keyword.born_at,
  Parse.keyword.died_at,
  Parse.keyword.lived_at,
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
Parse.regex.name = '(?:^[^\n]+)';
Parse.regex.year = '(?:19[0-9]{2}|2[0-9]{3})';

/*
    Code that helps jsleri tokenize things properly, finding things
    like panda names or keywords that have spaces in them.

    Many aspects of RPF come from the build step, but it's so handy 
    to process facets referentially in JS to build the lists of keywords.

    TODO: maybe get the names list from python.
*/
Parse.lexer = {};
Parse.lexer.terms = {};
Parse.lexer.terms.names = {};
Parse.lexer.terms.names.list = [];
Parse.lexer.terms.names.max_spaces = 0;
Parse.lexer.terms.tags = {};
Parse.lexer.terms.tags.list = [];
Parse.lexer.terms.tags.max_spaces = 0;
Parse.lexer.terms.keywords = {};
Parse.lexer.terms.keywords.list = [];
Parse.lexer.terms.keywords.max_spaces = 0;
// Build a wordlist of terms with spaces in them.
Parse.lexer.build_wordlist = function() {
  // Filter for terms with spaces, and track which term has the
  // most spaces in it, so the lexer knows how many terms to grab
  // at once when it starts with its greediest matches
  var word_filter = function(token, list_name) {
    if (token.indexOf(' ') != -1) {
      var space_count = token.replace(/\S/g, '').length;
      if (space_count > Parse.lexer.terms[list_name].max_spaces) {
        Parse.lexer.terms[list_name].max_spaces = space_count;
      }
      return token;
    }
  }
  Parse.lexer.terms.keywords.list = Parse.group.keywords
    .filter(kw => word_filter(kw, "keywords")).sort();
  Parse.lexer.terms.tags.list = Parse.group.tags
    .filter(kw => word_filter(kw, "tags")).sort();
  // It's sorted in Python but this gets us word counts
  Parse.lexer.terms.names.list = P.db['_lexer'].names
    .filter(kw => word_filter(kw, "names")).sort();  
}
// Generate a lexed (tokenized) string
Parse.lexer.generate = function(input) {
  var delimited_input = input.split(' ').join('\n');
  var space_tokens = this.process(input);
  for (let space_token of space_tokens) {
    // Search and replace it (case insensitively) in the input string
    var newline_token = space_token.replace(/ /g, "\n");
    var newline_regexp = new RegExp(newline_token, "i");
    delimited_input = delimited_input.replace(newline_regexp, space_token);
  }
  return delimited_input;
}
/*
    Find all valid tokens in the search input that have spaces,
    and return them in a newline-separated way.
    Prioritize panda names, then tag names, then keywords.
*/
Parse.lexer.process = function(input) {
  var possible_tokens = function(input, max_spaces, list_name) {
    var tokenlist = [];
    var input_split = input.split(' ');
    for (let n = max_spaces; n > 0; n--) {
      for (let i = 0; i < input_split.length - n; i++) {
        var token = input_split.slice(i, i+n+1).join(' ');
        // Name matching needs to use locale-specific normalizing
        if (list_name == "names") {
          token = Language.capitalNames(token);
        }
        tokenlist.push(token);
      }
    }
    return tokenlist;
  }
  var ordering = ["names", "tags", "keywords"];
  var input_spaces = input.replace(/\S/g, '').length;
  // Find all contiguous strings with max_spaces and see
  // if they're in one of the word lists
  var found_tokens = [];
  for (let list_name of ordering) {
    var lexlist = Parse.lexer.terms[list_name].list;
    // Count spaces in the input, so we can determine whether
    // tokens with N-spaces exist in the input
    var max_spaces = Parse.lexer.terms[list_name].max_spaces;
    if (max_spaces > input_spaces) {
      max_spaces = input_spaces;
    }
    // Don't deal with testing against possible space-holding keywords
    // that have more spaces than the input query did!
    lexlist = lexlist.filter(l => l.replace(/\S/g, '').length <= max_spaces);
    var tokens = possible_tokens(input, max_spaces, list_name)
      .filter(t => lexlist.indexOf(t) != -1)
    found_tokens = found_tokens.concat(tokens);
  }
  return found_tokens;
}

/* 
    Navigation and introspection through a grammar's parse tree. 
    jsleri won't do it for us, so we have to write this code ourself.

    Pass separate children value in case we want to process not the 
    original parse tree, but a derived tree of children.
*/
Parse.tree = {};
// Build a grammar for making parse trees with.
Parse.tree.build_grammar = function() {
  var Choice = window.jsleri.Choice;
  var Grammar = window.jsleri.Grammar;
  var Keyword = window.jsleri.Keyword;
  var Prio = window.jsleri.Prio;
  var Regex = window.jsleri.Regex;
  var Repeat = window.jsleri.Repeat;
  var Sequence = window.jsleri.Sequence;
  // var THIS = window.jsleri.THIS;
  // Take a list of operators and turn it into a choice
  // NOTE: Choice.apply(Choice, Parse.keyword) == Choice(...Parse.keyword)
  var Choices = function(keyword_list) {
    return Choice.apply(Choice, (keyword_list).map(kw => Keyword(kw, true)));
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
  // Unary keyword with two subjects
  // Used to search for photo credits of a specific animal
  var c_k_unary_credit_author_and_name = Reversible(Sequence(Choices(Parse.group.takes_subject_author), r_name), r_name);
  var c_k_unary_credit_author_and_id = Reversible(Sequence(Choices(Parse.group.takes_subject_author), r_name), r_id);
  // Groups of tags or keywords or unary items
  var c_k_group_ids = Repeat(r_id);
  var c_k_group_tags = Repeat(Choices(Parse.group.tags, 2));
  var c_k_group_tags_name = Reversible(Repeat(Choices(Parse.group.tags, 2)), r_name);
  var c_k_group_tags_id = Reversible(Repeat(Choices(Parse.group.tags, 2)), r_id);
  // Binary keywords
  // var c_k_binary_logical = Choices(Parse.ops.group.binary_logic);
  // Start of the parsing logic, a list of prioritized forms of search queries
  var START = Prio(
    r_id,
    c_k_zeroary,
    c_k_group_tags,       // Search for many tags at once
    c_k_group_tags_name,  // Tags followed by a name-string
    c_k_group_tags_id,    // Tags followed by id-number
    c_k_group_ids,        // Sequence of panda IDs
    c_k_unary_credit_author_and_name,   // credit <author> <panda-name>
    c_k_unary_credit_author_and_id,     // credit <author> <panda-id>
    c_k_unary_year,       // Unary keywords followed by year-number
    c_k_unary_number,     // Unary keywords followed by id-number
    c_k_unary_name,       // Unary keywords followed by a name-string
    // TODO: don't have parse tree techniques to detect these
    // Sequence('(', THIS, ')'),   // Bracketed expressions
    // Sequence(THIS, c_k_binary_logical, THIS),
    r_name
  );
  // Keywords are newline separated
  Parse.tree.grammar = new Grammar(START, '^[^\n]+');
}
// After performing the parse, navigate through the tree and do subsequent
// node type classification and resolution. These node types will identify
// where the query resolution code should do graph searches and build sets
// of results to display.
Parse.tree.classify = function(tree) {
  var subject_nodes = this.filter(tree, this.tests.subject);
  var keyword_nodes = this.filter(tree, this.tests.keyword);
  if (subject_nodes.length == 1 && keyword_nodes.length == 0) {
    Parse.tree.classify_subject_only(subject_nodes[0]);
  } else if (subject_nodes.length == 0 && keyword_nodes.length == 1) {
    Parse.tree.classify_keyword_only(keyword_nodes[0]);
  } else if (subject_nodes.length == 0 && keyword_nodes.length > 1) {
    Parse.tree.classify_plural(keyword_nodes);
  } else {
    Parse.tree.classify_plural(subject_nodes);
  }
}
Parse.tree.classify_keyword_only = function(keyword_node) {
  if (keyword_node.type == "tag") {
    keyword_node.parent.type = "set_tag";
  }  else {
    keyword_node.parent.type = "set_keyword";
  }
}
Parse.tree.classify_subject_only = function(subject_node) {
  subject_node.parent.type = "set_subject";
}
Parse.tree.classify_plural = function(plural_nodes) {
  // Get the container nodes, and classify those values
  var container_nodes = plural_nodes.map(n => this.walk_to_subject_container(n));
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
// Takes the result from parsing a grammar, and builds a parse tree
// with our own node details and formatting, based on jsleri's
Parse.tree.generate = function(parse_input) {
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
  // Do higher-level classification of the nodes in the tree, to prepare
  // for building results sets
  this.classify(tree);
  return tree;
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
    if (Parse.group.tags.indexOf(node.element.keyword) != -1) {
      return "tag";
    } else {
      return "keyword";   // All other query logic in result gathering
    }
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
    if (singulars[0].indexOf("subject") == 0 && singulars[1] == "tag") {
      return "set_tag_subject";
    }
    if (singulars[0] == "keyword" && singulars[1].indexOf("subject") == 0) {
      return "set_keyword_subject";
    }
    if (singulars[0] == "tag" && singulars[1] == "tag") {
      return "set_tag_intersection";
    }
    if (singulars[0].indexOf("subject") == 0 && singulars[1].indexOf("subject") == 0) {
      return "set_only_subjects";
    }
  }
  // Handle the credit <author> <panda-name-or-id-filter> form
  // TODO: if we have more of this "filter style form" change this logic
  if (singulars.length == 3) {
    if (singulars[0] == "keyword" &&
        singulars[1].indexOf("subject") == 0 &&
        singulars[2].indexOf("subject") == 0) {
      return "set_credit_photos_filtered";
    }
  }
  // Handle binary parse structures
  if (singulars.length > 2) {
    if (Pandas.distinct(singulars).length == 1 && singulars[0] == "tag") {
      return "set_tag_intersection";
    }
    if (Pandas.distinct(singulars).length == 2 && 
        singulars[0].indexOf("subject") == 0 &&
        singulars[1] == "tag") {
      return "set_tag_intersection_subject";
    }
    if (Pandas.distinct(singulars).length == 1 && singulars[0].indexOf("subject") == 0) {
      return "set_only_subjects";
    }
  }
  // Fallback for things we don't recognize
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
      container_node.type = "set_matching_tags_photos";
      value_nodes.forEach(n => n.type = "tag");
    }
    // TODO: how to handle the invalid case?
  }
  if (container_node.type == "set_keyword_subject") {
    var keyword_node = this.filter(container_node, this.tests.keyword)[0];
    var subject_node = this.filter(container_node, this.tests.subject)[0];
    // Some keyword-subject combinations will not have valid results, but we
    // want to process certain types of results together. Examples, from most
    // specific to least specific:
    //  1) (baby)+(year): baby is a type, year is the subject. Get all babies
    if ((Parse.group.baby.indexOf(keyword_node.str) != -1) && 
        (subject_node.type == "subject_year")) {
      container_node.type = "set_babies_year_list";
      keyword_node.type = "type";
    }
    //  2) (baby)+(name or id): baby is a tag, name is the intended panda. Get baby photos
    else if ((Parse.group.baby.indexOf(keyword_node.str) != -1) &&
             (subject_node.type == "subject_name")) {
      container_node.type = "set_baby_subject";
      keyword_node.type = "tag";
    }
    //  3) (credit)+(any subject): subject is an author name. Author search
    else if (Parse.group.credit.indexOf(keyword_node.str) != -1) {
      container_node.type = "set_credit_photos";
      subject_node.type = "subject_author";
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
Parse.tree.types.sets = [
  "set_babies_year_list",
  "set_baby_subject",  
  "set_credit_photos",
  "set_credit_photos_filtered",
  "set_family_list",
  "set_keyword",
  "set_keywords",
  "set_keyword_subject",
  "set_keyword_year",
  "set_matching_tags_photos",
  "set_nearby_zoo",
  "set_only_subjects",
  "set_subject",
  "set_panda_id",
  "set_tag",
  "set_tag_intersection",
  "set_tag_intersection_subject",
  "set_tag_subject",
  "set_zoo_id"
];
Parse.tree.types.composite = [
  "choice",
  "composite",
  "contains",
  "sequence"
].concat(Parse.tree.types.sets);
Parse.tree.types.keyword = [
  "keyword",
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
Parse.tree.types.subject_author = [
  "subject_author"
];
Parse.tree.types.subject_filter = [
  "subject_id",
  "subject_name"
];
Parse.tree.types.singular = Parse.tree.types.keyword
  .concat(Parse.tree.types.subject);
Parse.tree.tests = {};
Parse.tree.tests.composite = Parse.tree.types.composite.map(t => ({"type": t}));
Parse.tree.tests.keyword = Parse.tree.types.keyword.map(t => ({"type": t}));
Parse.tree.tests.sets = Parse.tree.types.sets.map(t => ({"type": t}));
Parse.tree.tests.singular = Parse.tree.types.singular.map(t => ({"type": t}));
Parse.tree.tests.subject = Parse.tree.types.subject.map(t => ({"type": t}));
Parse.tree.tests.subject_author = Parse.tree.types.subject_author.map(t => ({"type": t}));
Parse.tree.tests.subject_filter = Parse.tree.types.subject_filter.map(t => ({"type": t}));
// Start with leaf nodes containing type: "subject_*" in the parse tree,
// and then work your way up until you're looking at the parser's stanza
// where it parsed that subject in context of another keyword. Re-classify
// any nodes you run into along the way.
Parse.tree.walk_to_subject_container = function(node) {
  var parent_type = this.node_type_composite_ids(node.parent);
  node.parent.type = parent_type;   // Set parent node types as we walk
  if (parent_type.indexOf("contains") == 0) {
    return this.walk_to_subject_container(node.parent);
  } else {
    return node.parent;
  }
}

// Build the grammar for functions to use immediately
Parse.tree.build_grammar();

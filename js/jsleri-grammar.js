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
  Queri.ops.type.zoo
]);
Queri.ops.group.number_subject = Queri.values([
  Queri.ops.family,
  Queri.ops.type.panda,
  Queri.ops.type.zoo
]);
Queri.ops.group.year_subject = Queri.values([
  Queri.ops.type.baby,
  Queri.ops.type.dead
]);
// Binary operators
Queri.ops.group.binary_logic = Queri.values([
  Queri.ops.logical.and,
  Queri.ops.logical.or
]);

// IIFE that implements search queries in terms of the dictionaries above
(function (
  Choice,
  Grammar,
  Keyword,
  Prio,
  Regex,
  Sequence,
  THIS
) {
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
  // Any number, positive or negative
  var r_id = Regex('(?:^[\-0-9][0-9]*)');
  // Any year (1900 - 2999)
  var r_year = Regex('(?:19[0-9]{2}|2[0-9]{3})');
  // Any sequence of strings separated by spaces
  var r_name = Regex('(?:[^\s]+(?:\s+[^\s]+)*)');
  // Sets of operators
  // Zeroary keywords: Valid search with just a single term
  var c_k_zeroary = Choices(Queri.ops.group.zeroary);
  // Unary keywords: Valid search with the correct subject
  var c_k_unary_name = Reversible(Choices(Queri.ops.group.name_subject), r_name);
  var c_k_unary_number = Reversible(Choices(Queri.ops.group.name_subject), r_id);
  var c_k_unary_year = Reversible(Choices(Queri.ops.group.year_subject), r_year);
  // Binary keywords
  var c_k_binary_logical = Choices(Queri.ops.group.binary_logic);
  // Start of the parsing logic, a prioritized tree
  var START = Prio(
    r_year,
    r_id,
    c_k_zeroary,
    c_k_unary_year,     // Unary keywords followed by year-number
    c_k_unary_number,   // Unary keywords followed by id-number
    c_k_unary_name,     // Unary keywords followed by a name-string
    Sequence('(', THIS, ')'),   // Bracketed expressions
    Sequence(THIS, c_k_binary_logical, THIS),
    r_name
  );
  Queri.grammar = Grammar(START);
})(
  window.jsleri.Choice,
  window.jsleri.Grammar,
  window.jsleri.Keyword,
  window.jsleri.Prio,
  window.jsleri.Regex,
  window.jsleri.Sequence,
  window.jsleri.THIS,
);

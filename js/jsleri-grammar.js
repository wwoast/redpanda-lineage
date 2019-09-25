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
Queri.ops.group.unary = Queri.values([
  Queri.ops.type,
  Queri.ops.subtype,
  Queri.ops.family
]);
// Binary and more operators
Queri.ops.group.binary = Queri.values([
  Queri.ops.logical,
  Queri.ops.family
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
  // Choice.apply(Choice, Queri.ops) == Choice(...Queri.ops)
  var c_k_zeroary = Choice.apply(Choice, (Queri.ops.group.zeroary).map(kw => Keyword(kw)));
  var c_k_unary = Choice.apply(Choice, (Queri.ops.group.zeroary).map(kw => Keyword(kw)));
  var c_k_binary = Choice.apply(Choice, (Queri.ops.group.binary).map(kw => Keyword(kw)));

  var k_born = Keyword('born');
  var k_died = Keyword('died');
  var r_id = Regex('(?:[0-9]*)')
  var r_year = Regex('(?:19[0-9]{2}|2[0-9]{3})');
  var r_name = Regex('(?:[^\s]+(?:\s+[^\s]+)*)');
  var s_born_year = Sequence(k_born, r_year);
  var s_died_year = Sequence(k_died, r_year);
  var START = Prio(
    r_year,
    r_id,
    c_k_zeroary,
    Choice(k_born, k_died),
    Choice(s_born_year, s_died_year),
    Sequence('(', THIS, ')'),
    Sequence(THIS, Keyword('or'), THIS),
    Sequence(THIS, Keyword('and'), THIS),
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

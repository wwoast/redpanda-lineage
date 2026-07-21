import * as Jsleri from './jsleri-1.1.15.js'
import { capitalNames,
         polyglots as Polyglots,
         tags as Tags } from './language.js'
import P, { def, values } from './pandas.js'

/**
 * Given a search tag, find the equivalent term for that tag that is
 * standardized on in the panda files, and return results for that tag.
 * Searches all language keywords for a tag.
 */
export function searchTag(search_tag) {
  // Lowercase any search terms in the latin character range
  // TODO ES6
  const ranges = def.ranges['en']
  const latin = ranges.some(range => range.test(search_tag))
  if (latin == true)
    search_tag = search_tag.toLowerCase()
  // Now search the tags list for a match
  for (const key of Object.keys(Tags)) {
    const terms = values(Tags[key])
    if (terms.includes(search_tag))
      return key
  }
  // Search things that could be tags in the right context
  for (const key of Object.keys(Polyglots)) {
    const terms = values(Polyglots[key])
    if (terms.includes(search_tag))
      return key
  }
  return undefined
}

/** 
 * Operator Definitions and aliases, organized into stages (processing order), and then
 * by alphabetical operator order, and then in the alternate languages for searching that
 * we're trying to support. Includes lists of the valid operators that may work on two
 * different panda arguments.
 * 
 * WARN: substrings in the keyword list may be problematic, so try and avoid them
 * TODO: organize operators by language for easier tracking / updating
 * TODO: born after/before/etc
 * TODO: keyword.alive
 * TODO: keyword.at
 * TODO: keyword.born + (around|after|before)
 * TODO: keyword.in
 * TODO: logical AND/OR/NOT/NOR
 * 
 * type Keyword = Record<Language, string[]>
 * type KeywordTree = Record<string, Keyword | KeywordTree>
 */
const keyword = {
  baby: {
    "en": ['aka-chan', 'Aka-Chan', 'Aka-chan',
           'baby', 'Baby', 'babies', 'Babies'],
    "ja": ['赤', '赤ちゃん'],
    "ko": ['아기'],
    "zh": ['婴儿', '婴']
  },
  born: {
    "en": ['born', 'Born'],
    "ja": ['生まれ'],
    "ko": ['태어난','출생'],
    "zh": ['出生']
  },
  born_at: {
    "en": ['born at', 'Born at'],
    "ja": ['生まれ'],
    "ko": ['태어난 장소', '출생지'],
    "zh": ['出生']
  },
  credit: {
    "en": ['author', 'Author', 'credit', 'Credit', 'ask', 'Ask'],
    "ja": ['著者'],
    "ko": ['저자'],
    "zh": ['TOWRITE']
  },
  dead: {
    "en": ['dead', 'Dead', 'died', 'Died', 'rainbow', 'Rainbow'],
    "ja": ['死', '虹'],
    "ko": ['죽음'],
    "zh": ['TOWRITE']
  },
  died_at: {
    "en": ['died at', 'Died at'],
    "ja": ['TOWRITE'],
    "ko": ['죽은 장소'],
    "zh": ['TOWRITE']
  },
  family: {
    aunt: {
      "en": ['aunt', 'Aunt'],
      "ja": ['TOWRITE'],
      "ko": ['이모'],
      "zh": ['TOWRITE']
    },
    brother: {
      "en": ['brother', 'Brother'],
      "ja": ['TOWRITE'],
      "ko": ['형제'],
      "zh": ['TOWRITE']
    },
    cousin: {
      "en": ['cousin', 'Cousin'],
      "ja": ['TOWRITE'],
      "ko": ['사촌'],
      "zh": ['TOWRITE']
    },
    children: {
      "en": ['children'],
      "ja": ['TOWRITE'],
      "ko": ['자녀'],
      "zh": ['TOWRITE']
    },
    dad: {
      "en": ['dad', 'Dad', 'father', 'Father', 'papa', 'Papa'],
      "ja": ['TOWRITE'],
      "ko": ['아빠'],
      "zh": ['TOWRITE']
    },
    grandma: {
      "en": ['grandma', 'Grandma', 'grandmother', 'Grandmother'],
      "ja": ['TOWRITE'],
      "ko": ['할머니'],
      "zh": ['TOWRITE']
    },
    grandpa: {
      "en": ['grandpa', 'Grandpa', 'grandfather', 'Grandfather'],
      "ja": ['TORWITE'],
      "ko": ['할아버지'],
      "zh": ['TOWRITE']
    },
    litter: {
      "en": ['litter', 'Litter'],
      "ja": ['TOWRITE'],
      "ko": ['쌍둥이'],
      "zh": ['TOWRITE']
    },
    mate: {
      "en": ['husband', 'Husband', 'mate', 'Mate', 
             'partner', 'Partner', 'wife', 'Wife'],
      "ja": ['TOWRITE'],
      "ko": ['남편'],
      "zh": ['TOWRITE']
    },
    mom: {
      "en": ['mam', 'Mam', 'mama', 'Mama', 'mom', 'Mom', 
             'mommy', 'Mommy', 'mother', 'Mother'],
      "ja": ['TOWRITE'],
      "ko": ['엄마'],
      "zh": ['TOWRITE']
    },
    nephew: {
      "en": ['nephew', 'Nephew'],
      "ja": ['TOWRITE'],
      "ko": ['조카(남)'],
      "zh": ['TOWRITE']
    },
    niece: {
      "en": ['niece', 'Niece'],
      "ja": ['TOWRITE'],
      "ko": ['조카(여)'],
      "zh": ['TOWRITE']
    },
    parents: {
      "en": ['parent', 'Parent', 'parents', 'Parents'],
      "ja": ['TOWRITE'],
      "ko": ['부모'],
      "zh": ['TOWRITE']
    },
    relatives: {
      "en": ['family', 'Family', 'relatives', 'Relatives'],
      "ja": ['TOWRITE'],
      "ko": ['가족'],
      "zh": ['TOWRITE']
    },
    siblings: {
      "en": ['sibling', 'Sibling', 'siblings', 'Siblings'],
      "ja": ['TOWRITE'],
      "ko": ['형제·자매'],
      "zh": ['TOWRITE']
    },
    uncle: {
      "en": ['uncle', 'Uncle'],
      "ja": ['TOWRITE'],
      "ko": ['삼촌'],
      "zh": ['TOWRITE']
    }
  },
  lived_at: {
    "en": ['lived at', 'Lived at'],
    "ja": ['TOWRITE'],
    "ko": ['살았던 곳', '거주지'],
    "zh": ['TOWRITE']
  },
  nearby: {
    "en": ['near', 'Near', 'nearby', 'Nearby'],
    "ja": ['近く', '近くの動物園'],
    "ko": ['근처', '가까운', '주변'],
    "zh": ['附近']
  },
  panda: {
    "en": ['panda', 'Panda', 'red panda', 'Red panda', 'Red Panda'],
    "ja": ['パンダ', 'レッサーパンダ'],
    "ko": ['판다', '레서판다'],
    "zh": ['TOWRITE']
  },
  tag: {
    "en": ['label', 'labels', 'Label', 'Labels', 'tag', 'Tag', 'tags', 'Tags'],
    "ja": ['TOWRITE'],
    "ko": ['태그'],
    "zh": ['TOWRITE']
  },
  zoo: {
    "en": ['zoo', 'Zoo'],
    "ja": ['動物園'],
    "ko": ['동물원'],
    "zh": ['动物园']
  }
}

/** 
 * Groups of language-independent parser keywords indexed by the primary
 * English example of that keyword.
 */
export const group = {
  /** Valid _baby_ keywords */
  baby: values([keyword.baby]),
  /** Valid _born_ keywords */
  born: values([keyword.born]),
  /** Valid _born at_ keywords */
  born_at: values([keyword.born_at]),
  /** Valid _credit_ keywords */
  credit: values([keyword.credit]),
  /** Valid _dead_ keywords */
  dead: values([keyword.dead]),
  /** Valid _died at_ keywords */
  died_at: values([keyword.died_at]),
  /** Valid _family_ keywords */
  family: values([keyword.family]),
  /** Valid keywords _of any type_ */
  keywords: values([keyword]),
  /** Valid _lived at_ keywords */
  lived_at: values([keyword.lived_at]),
  /** Valid _nearby_ keywords */
  nearby: values([keyword.nearby]),
  /** Valid _panda_ keywords */
  panda: values([keyword.panda]),
  /** Aggregate of all possible tag values */
  tags: values([Tags]),
  /** Keywords that take some kind of author or contributor name */
  takes_subject_author: values([keyword.credit]),
  /** Keywords that take some form of arbitrary string name */
  takes_subject_name: values([
    Tags,
    keyword.baby,
    keyword.credit,
    keyword.family,
    keyword.panda,
    keyword.zoo
  ]),
  /** Keywords that take some form of numeric ID value */
  takes_subject_number: values([
    Tags,
    keyword.born_at,
    keyword.died_at,
    keyword.lived_at,
    keyword.family,
    keyword.panda,
    keyword.zoo
  ]),
  /** Keywords that take some kind of numeric year value */
  takes_subject_year: values([
    keyword.baby,
    keyword.born,
    keyword.dead
  ]),
  /** Keywords that take some kind of full date string */
  takes_subject_date: values([
    keyword.baby,
    keyword.born,
    keyword.dead
  ]),
  /** Single keywords that represent queries on their own */
  zeroary: values([
    Tags,
    keyword.baby,
    keyword.dead,
    keyword.nearby
  ]),
  /** Valid _zoo_ keywords */
  zoo: values([keyword.zoo])
}

/** Namespace collecting types of strings we parse with regular expressions */
const regex = {
  /** Any number, positive or negative */
  id: '(?:^[\-0-9][0-9]*)',
  /** Any sequence of strings separated by spaces */
  name: '(?:^[^\n]+)',
  /** Any year matching 19XX or 2XXX */
  year: '(?:19[0-9]{2}|2[0-9]{3})',
  date: {
    // Default to mm_yy, but allow flexibility if the meaning is unambiguous
    aa_bb: '(?:[0-9]{1,2}[^\s\n][0-9]{1,2}[^\s\n]?)',
    // Default to a locale-appropriate date format, falling back to dd_mm_yy
    aa_bb_cc: '(?:[0-9]{1,2}[^\s\n][0-9]{1,2}[^\s\n][0-9]{1,2}[^\s\n]?)',
    aa_bb_yyyy: '(?:[0-9]{1,2}[^\s\n][0-9]{1,2}[^\s\n][0-9]{4}[^\s\n]?)',
    // Unambiguous month and year
    mm_yy: '(?:[0-9]{1,2}[^\s\n][0-9]{4}[^\s\n]?)',
    // Unambiguous and standard date parsing
    yyyy_mm_dd: '(?:[0-9]{4}[^\s\n][0-9]{1,2}[^\s\n][0-9]{1,2}[^\s\n]?)'
  }
}

/**
 * Class that helps jsleri tokenize things properly, finding things
 * like panda names or keywords that have spaces in them.
 *
 * Many aspects of redpandafinder come from the build step, but it's handy
 * to process facets referentially in JS to build the lists of keywords.
 * 
 * This is initialized when we load redpandafinder, but we don't need to
 * manage instances of the lexer outside the context of a single browser tab.
 * 
 * TODO: build this during the RPF build step, and import as JSON
 */
class Lexer {
  terms = {
    names: {
      list: [],
      max_spaces: 0
    },
    keywords: {
      list: [],
      max_spaces: 0
    },
    tags: {
      list: [],
      max_spaces: 0
    },
  }

  /** Build a wordlist of terms with spaces in them */
  build_wordlist() {
    /** 
     * Filter for terms with spaces, and track which term has the
     * most spaces in it, so the lexer knows how many terms to grab
     * at once when it starts with its greediest matches
     */
    const word_filter = (token, list_name) => {
      if (token.includes(' ')) {
        const space_count = token.replace(/\S/g, '').length
        if (space_count > this.terms[list_name].max_spaces) {
          this.terms[list_name].max_spaces = space_count
        }
        return token
      }
    }
    this.terms.keywords.list = group.keywords
      .filter(kw => word_filter(kw, "keywords")).sort()
    this.terms.tags.list = group.tags
      .filter(tag => word_filter(tag, "tags")).sort()
    // It's sorted in Python but this gets us word counts
    this.terms.names.list = P.db['_lexer'].names
      .filter(name => word_filter(name, "names")).sort()
  }

  /**
   * Generate a lexed (tokenized) string. Support normal spaces and Japanese
   * ideographic spaces. If we need more, make a new function. The search bar
   * doesn't support newlines, so that's a natural delimiter to use here
   */
  generate(input) {
    // Validate we have built our wordlists to draw from. We can't do this in
    // a constructor because the class instantiates at module load time, and
    // `language.js` lookup tables may not be finished loading
    const wordListLength =  
      this.terms.keywords.list.length + 
      this.terms.names.list.length +
      this.terms.tags.list.length
    if (wordListLength == 0)
      this.build_wordlist()
    // Now process the input
    const split_input = this.split(input)
    let delimited_input = split_input.join('\n')
    const space_tokens = this.process(input)
    for (const space_token of space_tokens) {
      // Search and replace it (case insensitively) in the input string
      const newline_token = space_token.replace(/ /g, "\n")
      const newline_regexp = new RegExp(newline_token, "i")
      delimited_input = delimited_input.replace(newline_regexp, space_token)
    }
    return delimited_input
  }

  /**
   * Find all valid tokens in the search input that have spaces, and return
   * them in a newline-separated way. Also convert Japanese ideographic (wide)
   * spaces. Prioritize panda names, then tag names, then keywords.
   */
  process(input) {
    function possible_tokens(input, max_spaces, list_name) {
      const tokenlist = []
      const input_split = this.split(input)
      for (let n = max_spaces; n > 0; n--) {
        for (let i = 0; i < input_split.length - n; i++) {
          let token = input_split.slice(i, i+n+1).join(' ')
          // Name matching needs to use locale-specific normalizing
          if (list_name == "names")
            token = capitalNames(token)
          tokenlist.push(token)
        }
      }
      return tokenlist
    }
    const ordering = ["names", "tags", "keywords"]
    const input_spaces = input.replace(/\S/g, '').length
    // Find all contiguous strings with max_spaces and see
    // if they're in one of the word lists
    let found_tokens = []
    for (const list_name of ordering) {
      let lexlist = this.terms[list_name].list
      // Count spaces in the input, so we can determine whether
      // tokens with N-spaces exist in the input
      let max_spaces = this.terms[list_name].max_spaces
      if (max_spaces > input_spaces) {
        max_spaces = input_spaces
      }
      // Don't deal with testing against possible space-holding keywords
      // that have more spaces than the input query did!
      lexlist = lexlist.filter(l => l.replace(/\S/g, '').length <= max_spaces)
      const tokens = possible_tokens(input, max_spaces, list_name)
        .filter(t => lexlist.includes(t))
      found_tokens = found_tokens.concat(tokens)
    }
    return found_tokens
  }

  /** Split a string by spaces, assuming only one kind */
  split(input) {
    // Japanese wide spaces (U+3000)
    if (input.includes('　'))
      return input.split('　')
    // Normal US-ASCII spaces
    else if (input.includes(' '))
      return input.split(' ')
    // No spaces
    else
      return [input]
  }
}

/** 
 * Singleton instance of the redpandafinder `Lexer` class. At module load-time,
 * it builds state from all keywords, names, and tags that have spaces in them,
 * so it can be used in the Query module for processing search terms that have
 * spaces in them (panda names like _Will Smith_).
 */
export const lexer = new Lexer()

/**
 * Navigation and introspection through a grammar's parse tree. 
 * jsleri won't do it for us, so we have to write this code ourself.
 *
 * Pass separate children value in case we want to process not the 
 * original parse tree, but a derived tree of children.
 */
class Tree {
  /** Instance of the jsleri grammar object */
  grammar = undefined

  keyword = [
    "keyword",
    "tag",
    "type"
  ]

  sets = [
    "set_babies_year_list",
    "set_baby_subject",  
    "set_credit_photos",
    "set_credit_photos_filtered",
    "set_family_list",
    "set_keyword",
    "set_keywords",
    "set_keyword_subject",
    "set_keyword_date",
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
  ]

  subject = [
    "subject_author",
    "subject_date",
    "subject_id",
    "subject_name",
    "subject_panda_id",
    "subject_year",
    "subject_zoo_id"
  ]

  types = {
    composite:
      ["choice", "composite", "contains", "sequence"].concat(this.sets),
    keyword: this.keyword,
    subject: this.subject,
    subject_author: ["subject_author"],
    subject_filter: ["subject_id", "subject_name"],
    singular: this.keyword.concat(this.subject)
  }

  tests = {
    composite: this.types.composite.map(t => ({"type": t})),
    keyword: this.types.keyword.map(t => ({"type": t})),
    sets: this.sets.map(t => ({"type": t})),
    singular: this.types.singular.map(t => ({"type": t})),
    subject: this.types.subject.map(t => ({"type": t})),
    subject_author: this.types.subject_author.map(t => ({"type": t})),
    subject_filter: this.types.subject_filter.map(t => ({"type": t}))
  }

  /** Build a grammar for making parse trees with. */
  build_grammar() {
    const Choice = Jsleri.Choice
    const Grammar = Jsleri.Grammar
    const Keyword = Jsleri.Keyword
    const Prio = Jsleri.Prio
    const Regex = Jsleri.Regex
    const Repeat = Jsleri.Repeat
    const Sequence = Jsleri.Sequence
    // Take a list of keywords/operators and turn it into a choice
    // NOTE: Choice.apply(Choice, keyword) == Choice(...keyword)
    function Choices(keyword_list) {
      return Choice.apply(Choice, (keyword_list).map(kw => Keyword(kw, true)))
    }
    // Take a sequence, and make it parse in either direction
    // Example: "born 1999" or "2005 babies"
    function Reversible(a, b) {
      return Choice(
        Sequence(a, b),
        Sequence(b, a)
      )
    }
    // Regex matches
    const r_id = Regex(regex.id)
    const r_name = Regex(regex.name)
    const r_year = Regex(regex.year)
    // Date regexes
    const r_date_aa_bb = Regex(regex.date.aa_bb)
    const r_date_aa_bb_cc = Regex(regex.date.aa_bb_cc)
    const r_date_aa_bb_yyyy = Regex(regex.date.aa_bb_yyyy)
    const r_date_mm_yyyy = Regex(regex.date.mm_yyyy)
    const r_date_yyyy_mm_dd = Regex(regex.date.yyyy_mm_dd)
    // Sets of operators
    // Zeroary keywords: Valid search with just a single term
    const c_k_zeroary = Choices(group.zeroary)
    // Unary keywords: Valid search with the correct subject
    const c_k_unary_name =
      Reversible(Choices(group.takes_subject_name), r_name)
    const c_k_unary_number =
      Reversible(Choices(group.takes_subject_number), r_id)
    const c_k_unary_year =
      Reversible(Choices(group.takes_subject_year), r_year)
    const c_k_unary_date_aa_bb =
      Reversible(Choices(group.takes_subject_date), r_date_aa_bb)
    const c_k_unary_date_aa_bb_cc =
      Reversible(Choices(group.takes_subject_date), r_date_aa_bb_cc)
    const c_k_unary_date_aa_bb_yyyy =
      Reversible(Choices(group.takes_subject_date), r_date_aa_bb_yyyy)
    const c_k_unary_date_mm_yyyy =
      Reversible(Choices(group.takes_subject_date), r_date_mm_yyyy)
    const c_k_unary_date_yyyy_mm_dd =
      Reversible(Choices(group.takes_subject_date), r_date_yyyy_mm_dd)
    // Unary keyword with two subjects
    // Used to search for photo credits of a specific animal
    const c_k_unary_credit_author_and_name =
      Reversible(Sequence(Choices(group.takes_subject_author), r_name), r_name)
    const c_k_unary_credit_author_and_id =
      Reversible(Sequence(Choices(group.takes_subject_author), r_name), r_id)
    // Groups of tags or keywords or unary items
    const c_k_group_ids = Repeat(r_id)
    const c_k_group_tags = Repeat(Choices(group.tags, 2))
    const c_k_group_tags_name = Reversible(Repeat(Choices(group.tags, 2)), r_name)
    const c_k_group_tags_id = Reversible(Repeat(Choices(group.tags, 2)), r_id)
    // Binary keywords
    // var c_k_binary_logical = Choices(group.binary_logic)
    // Start of the parsing logic, a list of prioritized forms of search queries
    const START = Prio(
      r_id,
      r_date_yyyy_mm_dd,    // Search by exact dates
      r_date_aa_bb_yyyy,
      r_date_aa_bb_cc,      // Search by partial dates
      r_date_mm_yyyy,
      r_date_aa_bb,
      c_k_zeroary,
      c_k_group_tags,       // Search for many tags at once
      c_k_group_tags_name,  // Tags followed by a name-string
      c_k_group_tags_id,    // Tags followed by id-number
      c_k_group_ids,        // Sequence of panda IDs
      c_k_unary_credit_author_and_name,   // credit <author> <panda-name>
      c_k_unary_credit_author_and_id,     // credit <author> <panda-id>
      c_k_unary_year,       // Unary keywords followed by year-number
      c_k_unary_number,     // Unary keywords followed by id-number
      c_k_unary_date_yyyy_mm_dd,    // Unary keywords followed by an exact date
      c_k_unary_date_aa_bb_yyyy,
      c_k_unary_date_aa_bb_cc,      // Unary keywords followed by a partial date
      c_k_unary_date_mm_yyyy,
      c_k_unary_date_aa_bb,
      c_k_unary_name,       // Unary keywords followed by a name-string
      // TODO: don't have parse tree techniques to detect these
      // Sequence('(', THIS, ')'),   // Bracketed expressions
      // Sequence(THIS, c_k_binary_logical, THIS),
      r_name
    )
    // Keywords are newline separated
    this.grammar = new Grammar(START, '^[^\n]+')
  }

  /** 
   * After performing the parse, navigate through the tree and do subsequent
   * node type classification and resolution. These node types will identify
   * where the query resolution code should do graph searches and build sets of
   * results to display.
   */
  classify(tree) {
    const subject_nodes = this.filter(tree, this.tests.subject)
    const keyword_nodes = this.filter(tree, this.tests.keyword)
    if (subject_nodes.length == 1 && keyword_nodes.length == 0) {
      this.classify_subject_only(subject_nodes[0])
    } else if (subject_nodes.length == 0 && keyword_nodes.length == 1) {
      this.classify_keyword_only(keyword_nodes[0])
    } else if (subject_nodes.length == 0 && keyword_nodes.length > 1) {
      this.classify_plural(keyword_nodes)
    } else {
      this.classify_plural(subject_nodes)
    }
  }

  classify_keyword_only(keyword_node) {
    if (keyword_node.type == "tag") {
      keyword_node.parent.type = "set_tag"
    } else {
      keyword_node.parent.type = "set_keyword"
    }
  }

  classify_subject_only(subject_node) {
    subject_node.parent.type = "set_subject"
  }

  classify_plural(plural_nodes) {
    // Get the container nodes, and classify those values
    const container_nodes = plural_nodes
      .map(n => this.walk_to_subject_container(n))
    // Finally, given what's in the containers, resolve what the keywords are
    for (const container_node of container_nodes) {
      const value_nodes = this.filter(container_node, this.tests.singular)
      // Resolve keyword types into something more specific based on the subject
      this.node_type_specific_ids(container_node, value_nodes)
    }
  }

  /** Flatten results from something in a tree like form, to an array */
  flatten(input) {
    const array = []
    while(input.length) {
      const value = input.shift()
      if (Array.isArray(value))
        input = value.concat(input)
      else
        array.push(value)
    }
    return array
  }

  /**
   * Filter all nodes of a tree and return a list of nodes that match a given
   * condition that we care about. Tests are an array of dict, and each dict
   * has field names and values. If any one of the tests match, it's a node we
   * want.
   */
  filter(node, tests) {
    const results = []
    outer: for (const test of tests) {
      for (const field in test) {
        if (node.hasOwnProperty(field)) {
          const value = test[field]
          if (node[field] == value) {
            results.push(node)
            break outer   // Don't add matching result more than once
          }
        }  
      }
    }
    // Do my children match?
    results = results.concat(node.children.map(c =>
      this.filter(c, tests)))
    return this.flatten(results)
  }

  /** 
   * Takes the result from parsing a grammar, and builds a parse tree with our
   * own node details and formatting, based on jsleri's
   */
  generate(parse_input) {
    if (this.grammar == undefined)
      this.build_grammar()
    const result = this.grammar.parse(parse_input)
    const start = result.tree
    if (result.tree.hasOwnProperty("children"))
      start = result.tree.children[0]
    const tree = this.node_props(
      start, this.get_children(start.children))
    // Double-link nodes in this tree to their parents
    this.link_parents(tree)
    // Do higher-level classification of the nodes in the tree, to prepare for
    // building results sets
    this.classify(tree)
    return tree
  }

  /** Convert jsleri parse tree to our desired format, one child at a time */
  get_children(children) {
    return children.map(c =>
      this.node_props(c, this.get_children(c.children)))
  }

  /** 
   * Add parent node connectivity to the tree after the basic tree is generated
   */
  link_parents(current) {
    current.children.forEach(c => c['parent'] = current)
    current.children.forEach(c => this.link_parents(c))
  }

  /** Define our ideal tree node, using jsleri's as a base */
  node_props(node, children) {
    return {
      'start': node.start,
      'end': node.end,
      'type': this.node_type(node, children),
      'str': node.str,
      'children': children
    }
  }

  /** 
   * Identify the nodes by simple types, for later processing into query sets.
   * This is the first-level of parse-tree node identification.
   */
  node_type(node, children) {
    if (children == undefined)
      return   // No need to update anything
    if (children.length != 0)
      return "composite"
    if (node.element.hasOwnProperty("keyword")) {
      if (group.tags.includes(node.element.keyword))
        return "tag"
      else
        return "keyword"   // All other query logic in result gathering
    }
    if (node.element.hasOwnProperty("re")) {
      if (node.element.re == regex.id)
        return "subject_id"
      if (node.element.re == regex.name)
        return "subject_name"
      if (node.element.re == regex.year)
        return "subject_year"
      if (Object.values(regex.date).indexOf(node.element.re) != -1)
        return "subject_date"
    }
  }

  /** 
   * Starting with subject nodes, go up the tree and categorize nodes based on
   * their children. Figure out what a node is based on its composite types.
   * This is the second-level of parse-tree node identification.
   */
  node_type_composite_ids(node) {
    const singulars = this.filter(node, this.tests.singular).map(n => n.type).sort()
    if (singulars.length == 1)
      return "contains"
    // Unary parse structures
    if (singulars.length == 2) {
      if (singulars[0] == "keyword" && singulars[1] == "keyword")
        return "set_keywords"
      if (singulars[0].indexOf("subject") == 0 && singulars[1] == "tag")
        return "set_tag_subject"
      if (singulars[0] == "keyword" && singulars[1].indexOf("subject") == 0)
        return "set_keyword_subject"
      if (singulars[0] == "tag" && singulars[1] == "tag")
        return "set_tag_intersection"
      if (singulars[0].indexOf("subject") == 0 && singulars[1].indexOf("subject") == 0)
        return "set_only_subjects"
    }
    // Handle the credit <author> <panda-name-or-id-filter> form
    // TODO: if we have more of this "filter style form" change this logic
    if (singulars.length == 3) {
      if (singulars[0] == "keyword" &&
          singulars[1].indexOf("subject") == 0 &&
          singulars[2].indexOf("subject") == 0) {
        return "set_credit_photos_filtered"
      }
    }
    // Handle binary parse structures
    if (singulars.length > 2) {
      if (distinct(singulars).length == 1 && singulars[0] == "tag")
        return "set_tag_intersection"
      if (distinct(singulars).length == 2 && 
          singulars[0].indexOf("subject") == 0 &&
          singulars[1] == "tag") {
        return "set_tag_intersection_subject"
      }
      if (distinct(singulars).length == 1 && singulars[0].indexOf("subject") == 0)
        return "set_only_subjects"
    }
    // Fallback for things we don't recognize
    return "composite"
  }

  /** 
   * Identify nodes intended to form a set of results. Based on the combination
   * of nodes, and possibly order, choose by default whether or not a keyword
   * is parsed as a type or a tag, disambiguating. This is the third-level of
   * parse-tree node identification.
   */
  node_type_specific_ids(container_node, value_nodes) {
    if (container_node.type == "set_keywords") {
      const keywords = value_nodes.map(n => n.str)
      // Many keyword combinations will not have valid results, but we want to
      // do some processing if we see certain types together. Examples:
      // 1) If all are tags: search set should be intersection of all tags
      const keywords_tags = keywords.filter(k => group.tags.includes(k))
      if (keywords.length == keywords_tags.length) {
        container_node.type = "set_matching_tags_photos"
        value_nodes.forEach(n => n.type = "tag")
      }
      // TODO: how to handle the invalid case?
    }
    if (container_node.type == "set_keyword_subject") {
      const keyword_node = this.filter(container_node, this.tests.keyword)[0]
      const subject_node = this.filter(container_node, this.tests.subject)[0]
      // Some keyword-subject combinations will not have valid results, but we
      // want to process certain types of results together. Examples, from most
      // specific to least specific:
      //  1) (baby)+(year): baby is a type, year is the subject. Get all babies
      if ((group.baby.includes(keyword_node.str)) && 
          (subject_node.type == "subject_year")) {
        container_node.type = "set_babies_year_list"
        keyword_node.type = "type"
      }
      //  2) (baby)+(name or id): baby is a tag, name is the intended panda.
      //     Get baby photos
      else if ((group.baby.includes(keyword_node.str)) &&
               (subject_node.type == "subject_name")) {
        container_node.type = "set_baby_subject"
        keyword_node.type = "tag"
      }
      //  3) (credit)+(any subject): subject is an author name. Author search
      else if (group.credit.includes(keyword_node.str)) {
        container_node.type = "set_credit_photos"
        subject_node.type = "subject_author"
      }
      //  4) (family-term)+(year or id): keyword plus an id.
      //     Get pandas of "relation"
      else if ((group.family.includes(keyword_node.str)) &&
               (subject_node.type == "subject_year")) {
        container_node.type = "set_family_list"
        subject_node.type = "subject_panda_id"
      }
      //  5) (group.year_subject)+(year or id): keyword plus a year
      else if ((group.takes_subject_year.includes(keyword_node.str)) &&
               (subject_node.type == "subject_id")) {
        container_node.type = "set_keyword_year"
        subject_node.type = "subject_year"
      }
      //  6) (group.year_subject)+(year or id): keyword plus a date
      else if ((group.takes_subject_date.includes(keyword_node.str)) &&
               (subject_node.type == "subject_date")) {
        container_node.type = "set_keyword_date"
        subject_node.type = "subject_date"
      }
      //  7) (nearby)+(year or id): id of a zoo. Get zoos near the given one.
      else if ((group.nearby.includes(keyword_node.str)) &&
               (subject_node.type == "subject_id")) {
        container_node.type = "set_nearby_zoo"
        subject_node.type = "subject_zoo_id"
      }
      //  8) (panda)+(year or id): keyword plus an id.
      //     Get the panda matching the id.
      else if ((group.panda.includes(keyword_node.str)) && 
               ((subject_node.type == "subject_id") || 
                (subject_node.type == "subject_year"))) {
        container_node.type = "set_panda_id"
        keyword_node.type = "type"
        subject_node.type = "subject_panda_id"
      }
      //  9) (zoo)+(year or id): keyword plus an id.
      //     Get the zoo matching the id.
      else if ((group.zoo.indexOf(keyword_node.str) != -1) && 
               ((subject_node.type == "subject_id") || 
                (subject_node.type == "subject_year"))) {
        container_node.type = "set_zoo_id"
        keyword_node.type = "type"
        subject_node.type = "subject_zoo_id"
      }
    }
  }

  /**
   * Start with leaf nodes containing type: "subject_*" in the parse tree, and
   * then work your way up until you're looking at the parser's stanza where it
   * parsed that subject in context of another keyword. Re-classify any nodes
   * you run into along the way.
   */
  walk_to_subject_container(node) {
    const parent_type = this.node_type_composite_ids(node.parent)
    node.parent.type = parent_type   // Set parent node types as we walk
    if (parent_type.indexOf("contains") == 0) {
      return this.walk_to_subject_container(node.parent)
    } else {
      return node.parent
    }
  }
}

/** 
 * Singleton instance of the redpandafinder parser tree class. Used to navigate
 * the parser trees jsleri constructs, for determining what the correct action
 * is for responding to a search query.
 */
export const tree = new Tree()

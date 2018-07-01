# Red Panda Lineage
----

# Design Rationales

## Data Formats

### Everything Is Text

The Red Panda Lineage dataset is managed as a series of folders and text files. Inside the `pandas/` folder, each `.txt` file represents one panda. Inside the `zoos/` folder, each `.txt` file represents one zoo. The [schema docs](https://github.com/wwoast/redpanda-lineage/blob/master/docs/SCHEMAS.md) outline what our format is. 

The intent is for anyone with a text editor to easily be able to contribute to the dataset. Unfortunately, it is burdensome to contribute for people that don't understand software development workflows with GitHub, partly because `git` itself has a high barrier to understanding, and partly because this dataset quickly grew to hundreds of text files, which requires a development-grade text editing strategy to effectively manage. 

### Text Format

All text files follow a loose standard typically used by `.ini` files, and supported by the Python `configparser` library. This `.ini` standard is limited to `key: value` pairs, without hierarchies or complex data types for values. This is intended to keep the schemas as simple to write and understand as possible, while still supporting enough flexibility for new keys (field types) to be added as the lineage dataset evolves. 

### Community

Hopefully the data curated by this project will be usable by a community of red panda supporters and appreciators. To better foster community outreach and engagement, rather than embed media into this dataset, we want to link to content online, and encourage the regular updating and inclusion of links to new media content on YouTube, Instagram, Twitter, and elsewhere. We will seek permission for any content we link within the Red Panda Lineage dataset.

----

## Hosting and Deployment

### Background: Why GitHub

GitHub and its related tools are near the forefront of how collaborative workflows are evolving. Most GitHub public projects allow anyone with development expertise to contribute fixes and updates back to the software they use. The key facet that enables collaboration is the _Code Review_ process.

  * GitHub accounts provide accountability and identification
  * Project owners publicly review changes submitted as self-contained branches
  * Discussion with contributors happens in public
  * Contributions can be revised and refined before merging into the `master` branch
  * Integration checks can offer a level of "machine review" above and beyond peer review 
  * The `master` branch is _protected_ from unreviewed contributions

All of these facets of the collaboration workflow are provided by GitHub absolutely free. The only curiosity in our use of GitHub is the "source code" being a dataset of Red Pandas and the Zoos they live in.

### Automatic Machine Review

For data consistency and analysis, GitHub's hooks for third party _Continuous Integration_ (CI) tooling is highly useful. Source code contributions, prior to being accepted, commonly run a large battery of automated tests, to better guarantee that no-one did a typo or made a mistake in their logic. 

In the case of our Red Panda Lineage, _CI_ tests all contributed data to ensure that it follows a strict standard format, which better ensures consistent behavior from any software that consumes our data at a later point. Our _CI_ tools take all the input files, and write a single output dataset, `redpanda.json`, intended to be downloaded as part of a website that offers Red Panda searching. 

### A JSON Dataset, Built for Web Applications, and Always Up-To-Date

Since the entire dataset is designed to be downloaded as part of a search website, any user searches will query the locally-downloaded JSON data and finish almost instantly. On modern computers, datasets with many thousands of items can be easily stored in RAM, and there's no need to wait for a remote database to answer your questions. We don't expect a red panda dataset to grow larger than what a modest computer or smartphone can keep in memory.

Taking advantage of a static JSON dataset, and the Dagoba client-side graph database library, all search page behavior can occur in the browser, which means that static hosting is an option. GitHub itself offers static web hosting through its GitHub Pages feature. The Red Panda Lineage project leverages GitHub pages, not only for documentation and web content, but to store the latest-available copy of the `redpanda.json` dataset. Every time content is merged into the `master` branch, the `redpanda.json` dataset is updated automatically by the _CI_ tooling. 

----

# Implementation Strategy

## Red Panda Search Forms

A fully usable, GitHub-hosted search page for the Red Panda data is being developed as part of this repository, in the `forms/` folder. Being built by red panda fans for red panda fans, the forms should illustrate the family relationships between related animals, and help visitors verify which animals they've taken photos of, or visited in zoos.

### Search Query Processing

Having a site focused on Red Panda searching makes it straightforward to process unstructured text to terms automatically keyed on types like "panda" or "zoo". The process will have many steps though, so we should order them and think about them separately.

  1. Operator Detection
  2. Panda/Zoo "Subject" name construction
  3. Language identification
  4. Term Type Matching
  5. Final Query Searching

A potential red panda community is largely Japanese, English, Chinese, or Hindi speaking, so we hope to support all of those languages eventually. Since the data I'm building from is mostly Japanese zoos, I'm supporting Japanese and English first. 

### Operators

Any terms that dictate the logic of the search must be processed first. Given this is a geneaology searching tool, we treat family relationships as if they were operators as well, and many of these operators will have language-specific aliases like "mom" and "mother".

  * Type Operators:
    * English: `panda`, `zoo`
  * Sub-Type Operators:
    * Unary:
      * English: `alive`, `dead`, `in`, `born (before, after, on, around)`, `died (before, after, on, around)`
    * Binary:
      * `born (between)`, `died (between)`
  * Text Glob Operators:
    * `*`, `?`
  * Boolean Operators:
    * Unary:
      * English: `not`
    * Binary:
      * English: `and`, `or`, `nor`
  * Family Operators:
    * Unary:
      * English: `aunt`, `brother`, `cousin`, `children`, `dad`, `grandma`, `grandpa`, `litter`, `mate`, `mom`, `nephew`, `niece`, `parents`, `relatives`, `siblings`, `uncle`
    * Binary:
      * English: `children`, `relatives`, `siblings`
    * N-Ary:
      * `relatives`, `siblings`
  

#### Order of Operations

The type operators are only for scoping how specific a term is, or whether it needs resolution. Since these will make subsequent steps faster, and have no other effects on search results, type operators should be processed first.

Next, the sub-type operators can be resolved. These do impact the search results, because the arguments only apply to a specific type. The `in` operator only takes a `zoo` argument, so we assume that arguments to that operator are zoos. This is similar for `alive`, `dead`, or the existence of relationship operators, which all imply their subjects are animals. And the `born` and `died` operators imply the argument is a date.

Now, the text glob operators can try and fill in values for strings that could match a panda name or a zoo name. The text glob processing stage has the same functionality requirements as "Subject" name construction -- you search for a term as if it was a panda or a zoo, and whichever has more matches, that's what you assume the type is. If this heuristic turns out to be incorrect, as long as the search interface makes it clear what type was chosen for a given term, 

Next, we need to process the boolean operators, to decide what nodes (zoos or pandas) are valid subjects to return relationship results based on.

Finally, we process the relationship operators, to see where from our graph nodes we go in or out to find the family members we want.

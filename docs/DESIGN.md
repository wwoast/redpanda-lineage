# Red Panda Lineage
----

# Design Rationales

## Data Formats

### Everything Is Text

The Red Panda Lineage dataset is managed as a series of folders and text files. Inside the `pandas/` folder, each `.txt` file represents one panda. Inside the `zoos/` folder, each `.txt` file represents one zoo. The [schema docs](https://github.com/wwoast/redpanda-lineage/blob/master/docs/SCHEMAS.md) outline what our format is. 

The intent is for anyone with a text editor to easily be able to contribute to the dataset. Unfortunately, it is burdensome to contribute for people that don't understand software development workflows with GitHub, partly because `git` itself has a high barrier to understanding, and partly because this dataset quickly grew to hundreds of text files, which requires a development-grade text editing strategy to effectively manage. 

### Simple Text Format + Schema Expansion

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

A fully usable, GitHub-hosted search page for the Red Panda data is being developed as part of this repository, in the `search/` folder. Being built by red panda fans for red panda fans, the forms should illustrate the family relationships between related animals, and help visitors verify which animals they've taken photos of, or visited in zoos.

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

Now, the text glob operators can try and fill in values for strings that could match a panda name or a zoo name. The text glob processing stage has the same functionality requirements as "Subject" name construction -- you search for a term as if it was a panda or a zoo, and whichever has more matches, that's what you assume the type is. If this heuristic turns out to be incorrect, as long as the search interface makes it clear what type was chosen for a given term, the user can tune follow-up queries with
manual sub-types to correct the bad automatic heuristic.

Next, we need to process the boolean operators, to decide what nodes (zoos or pandas) are valid subjects to return relationship results based on.

Finally, we process the relationship operators, to see where from our graph nodes we go in or out to find the family members we want.

----

## Search Result Sorting and Related Results

In Dagoba's naive tree search, when you search for siblings of a panda, you'll get the animal's brothers and sisters twice in the dataset: once from following the mother's links, and once from following the father's links. Knowing this, you wouldn't expect Dagoba to have any notion of domain-relevant sorting of graph search results would be either.

What is the desired order of search results? And what related information might a user want to see when searching for a panda? Let's talk about this based on what a user might expect, oriented around different search workflows.

### Single Panda Result

```
Found one panda, {name}, and its family at {zoo}. 
```

If you search for a single panda, either by its id-number, or by specifying both a name and a zoo, you expect to have one clear match for your animal. However, a single result for the search page isn't terribly useful, especially since this is a site about families of red pandas. So if the search you perform returns just a single panda, it makes sense to also return, in order:

* Any litter mates the panda has, regardless of which zoo they're at
* The panda's mother and father
* Any siblings the panda has that you might see at the same zoo, up to a limit of three
  * Any more than three could get a summary card of siblings, rather than result cards
* Any children for this panda you'd see at the same zoo
  * Any more than three could get a summary card of siblings, rather than result cards
* A zoo card with information about the zoo (last)

This way, you get an appreciation for the family traits and similarities, as well as context on which pandas at a zoo are related to each other.

Color text for these search results should indicate any pandas' relationships to the one you searched for (mothers, fathers, brothers, sisters, children).

Eventually single-panda results will also display timeline-related data for a panda, such as when major family events happened or when they moved zoos, as well as additional information like nicknames, exact species, and maybe preferred foods. 

### Multiple Pandas with the Same Name

```
Found {number} pandas with {name}. Results are sorted from youngest to oldest.
```

If you search for a panda by name, and there are multiple pandas with that name, the search results should only provide the list of pandas whose names match what you searched for. Ideally, the sorting order would be based on what zoos are most popular, but this isn't something we can reasonably track in the lineage database. It's most likely that pandas you want are on display, which means we should sort based first on youthfulness, and then display any pandas who have passed away afterwards, also in order of age.

### Search for a Zoo

```
Found {number} pandas currently at {zoo}. Results are sorted from oldest to youngest. 
```

If you search for a zoo, you likely want to see all the pandas a zoo currently has. In this case, we'll display a single result card for every panda in the dataset, organized by birthday from oldest to youngest, and leaving out any pandas that have passed away at this zoo.

It gets tricky to search for pandas that were at a zoo, or may have been born at a zoo but have moved. It's worth thinking about what a reasonable search workflow for these queries might be, as they're not captured by the search operators very well. We may end up prompting the user for what kind of search they want to perform, and based on their selection, either return an entire set of pandas for a zoo, alive or dead, or return a set of data for all pandas born at a particular zoo. A query supplement might pop up that says:

```
Search instead for all pandas ever born at {zoo}.
Search instead for all pandas that ever lived at {zoo}.
```

Until timeline data is well fleshed-out, the "all pandas that ever lived at {zoo}" search will be impossible, as we can't account for pandas currently that were neither born nor died at a zoo, but lived there for a brief time.

### Search for a Panda's Children or Litter

```
{name} has been {gender-noun} to {number} panda cubs. Results are sorted from oldest to youngest.
{name} has {number} direct siblings in {gender-noun} litter.
```

If you search for a panda's children, you should get first a summary of the panda {name} you searched for, and then you should get a list of the children from oldest to youngest. Regardless of whether the children are alive or not, they should be in the search results. Similar rules should work for litter-mates, and while there is still a need for date-sorting for litter-mates born on consecutive days, the date information is not relevant to that search.

### Search for a Panda's Siblings

```
{name} has {number} litter-mates, {number} direct siblings, and {number} half-siblings.
```

Sibling searches are interesting, because chances are you want to know whether the panda is one of twins or triplets, as well as whether they have any full or half siblings. The ordering priority here should be litter-mates first, followed by direct siblings, oldest to youngest, and lastly including half-siblings, oldest to youngest.

### Search with No Results

```
No results for {name}, but here is a random zoo that may be of interest.
No results for {name}, but here is a random panda to make you happy!
No results for {name}, but today is {birthday-panda}'s birthday!
```

Heuristically, we should be able to determine whether someone was searching for a zoo or for a panda using some kind of word analysis. Based on that, if we think a zoo was searched for, we can offer a random zoo from the dataset, from a country which matches the currently configured language for the user. If we think a panda was searched for, we can offer a single random panda that lives in a zoo relevant for the currently configured language.

If there is a panda with a birthday in the dataset, we could opt to show a birthday panda instead of doing the normal "no results" behavior.

### Search for a Panda's Extended Family

```
Found {number} results for {family-type} relations to {name}.
```

As for other family searches, the priority should be on listing family members at the exact same zoo first, followed by others that no longer live at the same zoo, and followed lastly by others that are no longer alive.

### Boolean Gobbledy-Gook Searches

```
Found {number} results for a complex query. Results are sorted from youngest to oldest.
```

If someone wants to mix and match operators and give the domain-specific language a hard time, we should default to a search result strategy that orders pandas from youngest to oldest, with alive and dead pandas interleaved in the search results.

----

## Single Page Application Routing

Since all resources for this website are loaded in the browser after the first page visit, there's no strong concept of loading resources over the network. However, we still want clicking through the web interface to activate things related to the browser's history, forward, and back buttons. Additionally, we want URLs that are visited to clearly represent what pandas or conditions we searched for. These types of issues in a single-page web application are often handled by a routing library.

However, by utilizing ''hash links'', such as the common `<a href="#next-section">` style links the web has supported since the beginning, you can write a really solid single-page-application routing strategy without any fancy application routing libraries. After all, ''hash links'' don't require network calls, and neither does the red panda lineage page once you've loaded it for the first time! 

Hash links don't look quite as pretty as visiting a domain and subfolders, but they also don't deceive users about what's a network resource versus a local one. Most importantly, you can still bookmark hash links and copy/paste them into messages to your friends.

### Routing Hierarchy

 * `#panda` links will scope to individual animal references
 * `#zoo` links will scope to individual zoo references
 * `#query` links will scope to results in the style of search query processing, which may include many results
 * `#timeline` links will scope to full biography and timeline info for an individual animal

### Routing Strategies For Known Entities (Pandas, Zoos)

Since all links in the a page of panda results will be ''hash links'', we need to differentiate between two different flavors of links for different use cases:

 * Traditional ''hash links'' which scroll forward to find an `#identifier` in the page.
   * I'm calling these ''in links'' since they don't cause the entire page to redraw
   * Their format will use underscores: `<a href="#panda_4">` will find Lychee in the search results
 * Links which load information for a specific panda, and wipe any existing search results.
   * I'm calling these ''go links'' since they'll appear to work very similarly to traditional off-page links
   * Their format will use slashes, like a folder: `<a href="#panda/4">` will load Lychee's detailed information

All of these links need to specify exact matches for zoos or pandas to function properly, so the routes will only support ID numbers for entities.

Go links should also encode the current displayed panda photo in the search results, so that when loading the detailed panda information (which includes a photo carousel), the larger photo loaded will match the smaller one displayed previously. So in practice, many Panda ''go links'' will look like `<a href="#timeline/4/photo/1">`. 

### Routing Strategy for Queries

A query URI should specify the exact search performed, so that it can be directly linked. If the query can be expressed as a  UTF-8 string, the fact that it's a ''hash link'' should mean the web server won't try to do any unexpected processing or routing on its own. Example: `<a href="#query/panda: lychee OR panda: hao">`

Queries may be complex and arbitrary enough that we need to start worrying about misuse or malformed input, for something like a cross-site scripting (XSS) attempt. So an upper-limit on query length should be enforced, something like 50 characters or so. This will also prevent the graph database from trying to load results for a large number of animals, which due to graph traversing, can be multiple times larger than the initial dataset!
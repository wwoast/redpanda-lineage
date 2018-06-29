# Red Panda Lineage
----

## Data Structure

### Everything Is Text

The Red Panda Lineage dataset is managed as a series of folders and text files. Inside the `pandas/` folder, each `.txt` file represents one panda. Inside the `zoos/` folder, each `.txt` file represents one zoo. The [schema docs](https://github.com/wwoast/redpanda-lineage/blob/master/docs/SCHEMAS.md) outline what our format is. 

The intent is for anyone with a text editor to easily be able to contribute to the dataset. Unfortunately, it is burdensome to contribute for people that don't understand software development workflows with GitHub, partly because `git` itself has a high barrier to understanding, and partly because this dataset quickly grew to hundreds of text files, which requires a development-grade text editing strategy to effectively manage. 

### Text Format

All text files follow a loose standard typically used by `.ini` files. This standard is limited to `key=value` pairs, without hierarchies or complex data types for values. This is intended to keep the schemas as simple to write and understand as possible, while allowing for new keys (field types) to be added as the lineage dataset evolves.

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

In the case of our Red Panda Lineage, _CI_ tests all contributed data to ensure that it follows a strict standard format, which better ensures consistent behavior from any software that consumes our data at a later point. Our _CI_ tools take all the input files, and write a single output database in JSON format, intended to be downloaded as part of a website that offers Red Panda searching. 

### A Dataset Built for the Web

Since the entire database is designed to be downloaded as part of this website, any searches in the Red Panda search website will finish almost instantly. On modern computers, databases with many thousands of items can be easily stored in RAM, and there's no need to wait for a remote database to answer your questions. We don't expect a red panda database to grow larger than what a modest computer or smartphone can keep in memory.

----

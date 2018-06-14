# Red Panda Lineage
### Heavily Work-In-Progress Red Panda Dataset 
##### Justin Fairchild, June 2018

<img src="https://raw.githubusercontent.com/wwoast/redpanda-lineage/master/docs/images/readme/header.jpg" width="512" />

## Contribute To The Dataset!

If you love Red Pandas and want to contribute to a public family tree, look into our [Contribution Instructions](https://github.com/wwoast/redpanda-lineage/blob/master/docs/INSTRUCTIONS.md)!

----

## Overview

The global red panda population is estimated at under 10,000 animals, and between 500-1000 of these animals are distributed across zoos worldwide.

With the goal of producing a web interface for viewing pandas and their offspring, I hope to create a flat-file human-editable dataset of pandas. A small group of passionate red panda lovers will manually curate this dataset by making updates or commits to this repository.

When a commit is accepted, Travis CI will run the bundled Python scripts, and publish a single JSON file to the _GitHub pages_ branch of this repository. This file will be queryable using the [Dagoba](https://github.com/dxnn/dagoba) graph query language, allowing a fully browser-based red panda lineage viewer to be written.

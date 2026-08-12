# Red Panda Lineage

[![Red Pandas](https://img.shields.io/badge/dynamic/json.svg?query=$._totals.pandas&label=red%20pandas&uri=https%3A%2F%2Fredpandafinder.com%2Fexport%2Fredpanda.json)](https://redpandafinder.com/export/redpanda.json)
[![Zoos](https://img.shields.io/badge/dynamic/json.svg?query=$._totals.zoos&label=zoos&uri=https%3A%2F%2Fredpandafinder.com%2Fexport%2Fredpanda.json)](https://redpandafinder.com/export/redpanda.json)

[![Kokin](https://raw.githubusercontent.com/wwoast/redpanda-lineage/master/docs/images/readme/header.jpg)](https://raw.githubusercontent.com/wwoast/redpanda-lineage/master/pandas/0011_kushiro/0023_kokin.txt)

[Search the Dataset (redpandafinder.com)](https://redpandafinder.com)

[Download the dataset (JSON)](https://wwoast.github.io/redpanda-lineage/export/redpanda.json)

## Contribute To The Dataset!

If you love Red Pandas and want to contribute to a public family tree, look into our [Contribution Instructions](https://github.com/wwoast/redpanda-lineage/blob/master/docs/INSTRUCTIONS.md)!

## Summary

The global red panda population is estimated at under 10,000 animals, and around 1000 of these animals are distributed across zoos worldwide.

The Red Panda Lineage dataset is a flat-file human-editable dataset of pandas. A small group of passionate red panda lovers manually curates this dataset by making updates or commits to this repository.

When a commit is accepted, Github Actions will run the bundled Python scripts, and publish a single JSON file to the _GitHub pages_ branch of this repository. This file is queryable using the [Dagoba](https://github.com/dxnn/dagoba) graph query language, allowing a fully [browser-based red panda lineage viewer](https://redpandafinder.com) to be written. Peek at our [Design Documentation](https://github.com/wwoast/redpanda-lineage/blob/master/docs/DESIGN.md) for more details.

## Updates

As of August 12, 2026, the `redpanda.json` format has seen significant changes.

* `.txt` fields with a numeric suffixes become arrays of values
  *  `location.X` => an array of `location` objects
  *  `photo.X` and `photo.X.subfield` => array of `photo` objects 
* `.txt` fields with a language prefix become objects keyed by language values
  * `en.name` and `ja.name` => one `name` object with `en` and `ja` values
  * `en.othernames` and `ja.othernames` => one `othernames` object with `en` and `ja` lists
* Nodes in the graph now have a `type` parameter for _type discrimination_
  * TypeScript knows whether branching logic uses `NodePanda`, `NodeZoo`, or other node types

The underlying `.txt` file format is unchanged, because that format is simple to hand-type and manually review. But the JSON file now has a much simpler structure, intended for processing into consistent objects by a strongly-typed language, such as TypeScript.

Currently TypeScript is only used for building the JSON file, but I intend to use it for the entire _redpandafinder_ codebase. I hope these changes improve the code quality and data consistency for anyone working with the _redpanda-lineage_ JSON data.

## Credits

This Red Panda Lineage dataset was started by _wumpwoast_ (Justin Fairchild) in June 2018, with the help and support of _firefoxpanda88_ and _daniele.tokyo_, a beautiful redesign by _[washimumu](https://ressapanda.com)_, and dedication of Red Panda fans in Japan and world-wide on Instagram and YouTube.

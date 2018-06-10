# Red Panda Lineage
### Heavily Work-In-Progress Red Panda Dataset 
##### Justin Fairchild, June 2018

## How to Contribute to the Red Panda Lineage

To make contributions to this dataset, you'll be using tools similar to what software developers use. Don't be afraid -- we'll teach you how, even if you don't know how to write code at all!


## Windows Users

TOWRITE: find a decent source code GUI tool that non-technical people could use. Atom? SublimeText? It needs to have Git integration, and work regardless of newline styles.


## Mac Users

TOWRITE: ideally its the same GUI as Mac users have, but test it.


## Technical / Terminal Users

TOWRITE: basic Git workflow at the terminal, with pictures
Include any standards we want to enforce for commits


## Background: Why GitHub

GitHub and its related tools are used by software developers for managing software source code. Most GitHub public projects allow anyone with expertise to contribute fixes and updates back to the software they use. The key facet that makes this work is _Code Review_ -- project owners can review and communicate with contributors, allowing contributions to be revised and refined before they are merged into the main source code.

GitHub gives us an identification layer (contributors' GitHub accounts) for free, and an entire platform for managing contributions. In our case, the "source code" is a dataset of Red Pandas, and the Zoos they live in.

The other facet of what makes GitHub useful as a tool is called _Continuous Integration_ (often called _CI_ for short). Source code contributions, prior to being accepted, often get checked against a battery of automated tests and standards, to guarantee that no-one did a typo or made a mistake with some bit of data. Part of these checks include testing whether the source code compiles into a proper computer program or not.

In the case of our Red Panda Lineage, _CI_ will test all contributed data to ensure that it follows a strict standard format, which ensures that whatever software that consumes our data will behave in a consistent way. Our _CI_ tools take all the input files and write a single output database that is small enough to be downloaded by a web browser viewing a Red Panda search website. Once the database file is downloaded, any searches in the Red Panda search website will complete almost immediately.

On modern computers, databases with many thousands of items can be easily stored in RAM, and there's no need to wait for a remote database to answer your questions. We don't expect a red panda database to grow larger than what a modest computer or smartphone can keep in RAM.

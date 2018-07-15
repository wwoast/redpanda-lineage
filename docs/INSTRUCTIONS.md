# Red Panda Lineage

## How to Contribute to the Red Panda Lineage

[![Get Ready, Lychee](https://raw.githubusercontent.com/wwoast/redpanda-lineage/master/docs/images/instructions/lychee-get-ready.jpg)](https://raw.githubusercontent.com/wwoast/redpanda-lineage/master/pandas/0001_ichikawa/0004_lychee.txt)
 
To make contributions to this dataset, you'll be using tools similar to what software developers use. Don't be afraid -- we'll teach you how, even if you don't know how to write code at all!

## Getting Started: Windows and Mac Users

To work with the Red Panda lineage dataset, you only need three things:

 * A [UTF-8 supporting](https://www.wikipedia.org/wiki/UTF-8) text editor with a good file-browsing sidebar.
   * On Windows, [Notepad++](https://notepad-plus-plus.org) is a good simple choice. Unfortunately the regular Windows Notepad doesn't save Japanese text properly without deep Windows tweaks.
   * [Atom](https://atom.io/) supports Mac and Windows, but is more complex.
   * [Visual Studio Code](https://code.visualstudio.com) is nice if you're comfortable with code editors!
 * The [GitHub Desktop](https://desktop.github.io) software
 * A free [GitHub Account](https://github.com/join).

When you run [GitHub Desktop](https://desktop.github.io) for the first time, you'll have the option to sign up for a GitHub account. After you sign up and log into GitHub Desktop, you'll be given the option to check out a repository.

Search for `wwoast/redpanda-lineage`, and click Clone. Now you have a personal copy of the entire Red Panda dataset downloaded to your home folder, under `Documents/GitHub`. 

<img src="https://raw.githubusercontent.com/wwoast/redpanda-lineage/master/docs/images/instructions/windows-default-folders.png" /> 

To recap, you've downloaded GitHub Desktop, signed in with your account, and know where the `redpanda-lineage` folder is on your computer. Now, open some files in your new text editor and you'll be off to a good start!

## Creating A Branch to Work From

[![Time to Work, Lychee](https://raw.githubusercontent.com/wwoast/redpanda-lineage/master/docs/images/instructions/lychee-start-working-now.jpg)](https://raw.githubusercontent.com/wwoast/redpanda-lineage/master/pandas/0001_ichikawa/0004_lychee.txt)

GitHub repositories are managed like open projects. Any guest or contributor can clone the repository, giving them a full _working copy_ on their own computer. However, to contribute changes from your _working copy_ back to our `master` branch, you'll need to follow some guidelines.

<img src="https://raw.githubusercontent.com/wwoast/redpanda-lineage/master/docs/images/instructions/create-new-branch-1.png" /> 
<img src="https://raw.githubusercontent.com/wwoast/redpanda-lineage/master/docs/images/instructions/create-new-branch-2.png" />

The `wwoast/redpanda-lineage` GitHub repository has any number of secondary branches in flight at a time. Branches typically represent the collected work of a single contributor towards a single goal. Their branch might add a new zoo to the dataset, and a handful of pandas that live at that zoo. Bundling those changes into a branch makes it easier to organize and review changes to the dataset, so that eventually that branch can be merged into the global `master` branch.

To contribute to the Red Panda Lineage dataset, start by using GitHub Desktop to create a branch of your own. The new branch will be created within the _working copy_ repository on your computer.

<img src="https://raw.githubusercontent.com/wwoast/redpanda-lineage/master/docs/images/instructions/select-a-branch.png" />

Now that your branch is made and selected, we're ready to do the important work of documenting new red pandas and zoos!

## Preparing Your Tools

All panda and zoo editing starts in your _working copy_ of the `redpanda-lineage` repository. Recall this is in your `Documents/Github` folder inside your user's home directory.

Assuming you're on Windows, open up the Notepad++ editor you downloaded earlier. From the File menu, select _Open Folder as Workspace_. Select the `redpanda-lineage` folder. Now, in the left pane, you'll see the `/pandas` and `/zoos` folders. Underneath those you'll see subfolders for every zoo we've recorded pandas for.

It's critical to keep a "workspace view" or "sidebar" of your files as you edit this dataset, **so you know what pandas or zoos already exist in the dataset**. In particular:

 * When adding a new panda file, you don't want to re-use the ID number of an existing panda
 * When adding a new panda for an existing zoo, you want to see at a glance if the panda is already in the dataset

A typical workflow for updating the database is to have three applications open: a web browser for data retrieval, the GitHub Desktop app for managing changes to your branch, and your text editor inset in the GitHub Desktop window's dead space.

<img src="https://raw.githubusercontent.com/wwoast/redpanda-lineage/master/docs/images/instructions/explorer-example.png" />

## Adding Pandas to the Dataset

Each panda is a single `.txt` file in the `/pandas` folder, with a unique Panda ID number. Each zoo is a single `.txt` file in the `/zoos` folder, with a unique Zoo ID number. **Adding to the Red Panda Lineage dataset is just a matter of copying an existing panda or zoo file, changing the contents inside of it, and submitting your new files as a branch to GitHub for review.**

Let's take a look at one of our panda files, [`pandas/0001_ichikawa/0004_lychee.txt`](https://github.com/wwoast/redpanda-lineage/blob/master/pandas/0001_ichikawa/0004_lychee.txt). This is the information we have on file for Lychee, a male red panda at Ichikawa Zoo. Fields are arranged alphabetically, and while some are obvious, let's discuss what each field means. 

### `_id`: Red Panda ID Numbers

The `_id` is a unique identification number, starting at `1` and going up. The `_id` is represented both in the file as well as in the filename of the panda. So that filenames sort cleanly, the filename ID is padded to four digits (Examples: `0004`, `1215`, `0036`). 

When adding a new red panda, take the next highest number that's not used. To see the next available Red Panda number, check the [red panda JSON data](https://wwoast.github.io/redpanda-lineage/export/redpanda.json) for the `_totals` at the top of the file. The [shields](http://shields.io/#your-badge) below also show the latest version of this `_totals` data:

[![Red Pandas](https://img.shields.io/badge/dynamic/json.svg?query=$._totals.pandas&label=red%20pandas&uri=https%3A%2F%2Fwwoast.github.io%2Fredpanda-lineage%2Fexport%2Fredpanda.json)](https://wwoast.github.io/redpanda-lineage/export/redpanda.json)
[![Zoos](https://img.shields.io/badge/dynamic/json.svg?query=$._totals.zoos&label=zoos&uri=https%3A%2F%2Fwwoast.github.io%2Fredpanda-lineage%2Fexport%2Fredpanda.json)](https://wwoast.github.io/redpanda-lineage/export/redpanda.json)


### `children`: ID Numbers for Children of a Red Panda

The `children` field is a list of this red panda's immediate family. Rather than names, which are not unique, these children values are `_id` numbers in other Red Panda files.

We don't track parent relationships, because the family tree can be fully constructed just with children and sibling relationships.

### `birthplace` and `zoo`: ID Numbers for Zoos

Pandas in our dataset have a birthplace and zoo/home recorded in their datasets. These are ID numbers as well, but for files in the `zoos/` folder. You'll notice that the subfolders of the `pandas/` directory reference both zoo names, as well as the zoo ID numbers.

### `birthday` and `death`: ID Numbers for Zoos

Dates in the Red Panda Lineage dataset are always in `YYYY`/`MM`/`DD` form. The `death` section can be omitted for pandas that are still alive, or be listed as `death: unknown` for a panda that passed away at an undetermined date.

### Unknowns are Not Recorded

Aside from `birthday` and `death` values, any item in a zoo or red panda entry that is marked as `none` or `unknown` is not transferred into the output JSON database. This keeps the output dataset slightly smaller.

## Preparing Your Branch for Review

You make changes to the files, save your changes, and call your work done for the day.

Before you finish, return to the GitHub Desktop app. The app will have noticed all the changes you made to the Red Panda dataset. A set of changes to files can be recorded in your local working copy as a _commit_. Commits work similar to a bookmark, and your _commit message_ should be a short note that details the work you've done so far.

<img src="https://raw.githubusercontent.com/wwoast/redpanda-lineage/master/docs/images/instructions/commit-to-branch-short.png" /> 

While you can make any number of commits as you do your work, we also recommend _pushing_ your branch to GitHub often. A _push_ makes a remote copy of your branch, and shows other Red Panda Dataset collaborators what changes you intend on contributing. Plus, now your data is saved to the Internet, in case your computer encounters technical difficulties!

Once you've pushed your branch up to GitHub, you can submit your changes for inclusion into the `master` database. When you're ready for us to review your changes, you visit [our repository on GitHub](https://github.com/wwoast/redpanda-lineage) and open a _Pull Request_ or *_PR_*, similar to you asking us "please pull the changes from my branch into the `master` branch".

<img src="https://raw.githubusercontent.com/wwoast/redpanda-lineage/master/docs/images/instructions/pull-request.png" /> 

When you push a new branch to GitHub, the website helpfully indicates that you might want a PR for that new branch you just pushed with a big _notice_ bar and a green _Pull Request_ button. Click that bar and fill out the subsequent form, and you'll have started the _Pull Request_ process.

<img src="https://raw.githubusercontent.com/wwoast/redpanda-lineage/master/docs/images/instructions/pull-request-message.png" /> 

Be aware that we may need to ask you follow-up questions or recommend changes, so keep refreshing your PR or maybe even bookmark it in your browser.

## The Peer Review Process

We use a _Continuous Integration_ tool called *Travis CI* to run automated checks against every single piece of data pushed to the Red Panda Lineage dataset. If there are problems with your commit, the software will see the problem automatically and suggest what changes are necessary. This tool runs the `build.py` program at the top-level of our repository.

Occasionally your commit will have a problem with your commits after you try and submit your PR, with a red "X" near the _Travis CI_ status. If you navigate through to see the details in _Travis CI_, you'll get to a screen where the text output of `build.py` describes what went wrong. 

<img src="https://raw.githubusercontent.com/wwoast/redpanda-lineage/master/docs/images/instructions/commit-problem.png" /> 
<img src="https://raw.githubusercontent.com/wwoast/redpanda-lineage/master/docs/images/instructions/failed-ci.png" /> 

If you have a Mac or Linux system, you can run this tool yourself to validate your data prior to submitting changes upstream, or even making commits. Otherwise, just keep pushing your branches to GitHub, and *Travis CI* will happily run the `build.py` checks for you.

Once the automated checks are done, you still need one of the dataset administrators to approve and merge your changes. If we don't merge your PR quickly, there is the chance your red panda ID numbers may get stale and need to be updated. Feel free to comment on your PR if you want attention. If we still fail to respond, reach out to _wumpwoast_ [via Instagram](https://instagram.com/wumpwoast).

## Troubleshooting

[![Harumaki, the Troublemaker](https://raw.githubusercontent.com/wwoast/redpanda-lineage/master/docs/images/instructions/harumaki-troubleshooter.jpg)](https://raw.githubusercontent.com/wwoast/redpanda-lineage/master/pandas/0001_ichikawa/0001_harumaki.txt)

 * If you forget to make a branch...
 * If you need to refactor from the master branch
 * Other things that people could mess up!

## Appendix: Technical / Terminal Users

If you're a command-line user, and you have Git, here's a quick sample of what a typical dataset session might look like

```
git clone https://github.com/wwoast/redpanda-lineage.git
git checkout -b maruyama-zoo
vim pandas/0001_ichikawa/0004_lychee.txt
git commit -a -m "changed lychee's birthday"
git push origin maruyama-zoo
```

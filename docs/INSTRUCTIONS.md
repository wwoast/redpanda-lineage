# Red Panda Lineage
### Heavily Work-In-Progress Red Panda Dataset 
##### Justin Fairchild, June 2018

## How to Contribute to the Red Panda Lineage
 
<img src="https://raw.githubusercontent.com/wwoast/redpanda-lineage/master/docs/images/instructions/lychee-get-ready.jpg" /> 

To make contributions to this dataset, you'll be using tools similar to what software developers use. Don't be afraid -- we'll teach you how, even if you don't know how to write code at all!

----

## Getting Started: Windows and Mac Users

To work with the Red Panda lineage dataset, you only need four things:

 * The Windows Explorer / Mac Finder, for viewing files and folders
 * A text editor. Even Windows Notepad will do! 
 * The [GitHub Desktop](https://desktop.github.io) software
 * A free [GitHub Account](https://github.com/join).

Most people have used the first two things already. When you run [GitHub Desktop](https://desktop.github.io) for the first time, you'll have the option to sign up for a GitHub account.

 * TODO: picture of GitHub signup process

Once you've signed up and logged into GitHub Desktop, you'll be given the option to check out a repository. Search for `wwoast/redpanda-lineage`, and click Clone, and you'll have a copy of the Red Panda dataset downloaded to your home folder, under `Documents/GitHub`.

<img src="https://raw.githubusercontent.com/wwoast/redpanda-lineage/master/docs/images/instructions/windows-default-folders.jpg" /> 

We're off to a great start!

----

## Creating A Branch to Work From

 * TODO: another picture of Lychee

GitHub repositories are managed like open projects. Any guest or contributor can clone the repository, giving them a full _working copy_ on their own computer. However, to contribute changes from your _working copy_ back to our `master` branch, you'll need to follow some guidelines.

<img src="https://raw.githubusercontent.com/wwoast/redpanda-lineage/master/docs/images/instructions/create-new-branch-1.png" /> 
<img src="https://raw.githubusercontent.com/wwoast/redpanda-lineage/master/docs/images/instructions/create-new-branch-2.png" />

The `wwoast/redpanda-lineage` GitHub repository has any number of secondary branches in flight at a time. Branches typically represent the collected work of a single contributor, bundled up and ready to review for merging into our `master`. If you plan on contributing to the `master` branch, start by using GitHub Desktop to create a branch of your own. This will be created based on your downloaded _clone_ of the master branch.

<img src="https://raw.githubusercontent.com/wwoast/redpanda-lineage/master/docs/images/instructions/select-a-branch.png" />

Now that your branch is made, you can go edit panda files or create new subfolders in the `pandas/` or `zoos/` folders. 

----

## Adding or Modifying Pandas in the Dataset

Head over to your Windows Explorer or Mac Finder, and browse to the `pandas/` folder. You'll see subfolders for every zoo we've recorded pandas for. The purpose of the folders and filenames is for _human review_, to help us all ensure that:

 * If we add a new panda file, it doesn't have a duplicate ID number to an existing panda
 * If we want to add a panda for a particular zoo, we know at a glance whether the panda is already in the dataset or not

Take a look at [`pandas/0001_ichikawa/0004_lychee.txt`](https://github.com/wwoast/redpanda-lineage/blob/master/pandas/0001_ichikawa/0004_lychee.txt). This is the information we have on file for Lychee, a male red panda at Ichikawa Zoo. Most of the data is self-explanatory, but you'll need to understand the dataset conventions for your updates to be accepted. 

#### `_id`: Red Panda ID Numbers

The `_id` is just a unique identification number, starting at *1* and going up. The `_id` is represented both in the file as well as in the filename of the panda. So that filenames sort cleanly in Explorer, pad the filename id to four digits (Examples: 0004, 1215, 0036). When adding a new red panda, take the next highest number already available.

To see the next available Red Panda number, visit (TOWRITE: JSON URI).

#### `children`: ID Numbers for Children of a Red Panda

TODO: track siblings in a litter!

The `children` field is a list of this red panda's immediate family. Rather than names, which are not unique, these children values represent `_id` numbers for other Red Panda files. 

Keeping the Explorer or Finder windows open as you make changes is very useful. At a glance, you can see the IDs and names of a panda just in the filename, and combined with your other resources online, this should be enough to jog your memory and assist in validating whatever data we already have.

We don't track parents relationships, because the family tree can be fully constructed just with children and sibling relationships.

#### `birthplace` and `zoo`: ID Numbers for Zoos

Pandas in our dataset have a birthplace and zoo/home recorded in their datasets. These are ID numbers as well, but for files in the `zoos/` folder. You'll notice that the subfolders of the `pandas/` directory reference both zoo names, as well as the zoo ID numbers.

----

## Preparing Your Branch for Review

 * TODO: Picture of Sora or Hao or Mugi in a tree

You make changes to the files, save your changes, and call your work done for the day.

Before you finish, return to the GitHub Desktop app. The app will have noticed all the changes you made to the Red Panda dataset. A set of changes to files can be recorded in your local working copy as a _commit_. Commits work similar to a bookmark, and your _commit message_ should be a short note that details the work you've done so far.

 * TODO: Pictures of doing a commit and a push

While you can make any number of commits as you do your work, we also recommend _pushing_ your branch to GitHub often. A _push_ makes a remote copy of your branch, and shows other Red Panda Dataset collaborators what changes you intend on contributing. Plus, now your data is saved to the Internet, in case your computer encounters technical difficulties!

----

## Troubleshooting

<img src="https://raw.githubusercontent.com/wwoast/redpanda-lineage/master/docs/images/instructions/harumaki-troubleshooter.jpg" />

 * If you forget to make a branch...
 * If you need to refactor from the master branch
 * Other things that people could mess up!

----

## Technical / Terminal Users

TOWRITE: basic Git workflow at the terminal, with pictures
Include any standards we want to enforce for commits

----

## Background: Why GitHub

GitHub and its related tools are used by software developers for managing software source code. Most GitHub public projects allow anyone with expertise to contribute fixes and updates back to the software they use. The key facet that makes this work is _Code Review_ -- project owners can review and communicate with contributors, allowing contributions to be revised and refined before they are merged into the main source code.

GitHub gives us an identification layer (contributors' GitHub accounts) for free, and an entire platform for managing contributions. In our case, the "source code" is a dataset of Red Pandas, and the Zoos they live in.

The other facet of what makes GitHub useful as a tool is called _Continuous Integration_ (often called _CI_ for short). Source code contributions, prior to being accepted, often get checked against a battery of automated tests and standards, to guarantee that no-one did a typo or made a mistake with some bit of data. Part of these checks include testing whether the source code compiles into a proper computer program or not.

In the case of our Red Panda Lineage, _CI_ will test all contributed data to ensure that it follows a strict standard format, which ensures that whatever software that consumes our data will behave in a consistent way. Our _CI_ tools take all the input files and write a single output database that is small enough to be downloaded by a web browser viewing a Red Panda search website. Once the database file is downloaded, any searches in the Red Panda search website will complete almost immediately.

On modern computers, databases with many thousands of items can be easily stored in RAM, and there's no need to wait for a remote database to answer your questions. We don't expect a red panda database to grow larger than what a modest computer or smartphone can keep in RAM.

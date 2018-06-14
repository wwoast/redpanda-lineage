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
 * A modern [UTF-8 supporting](https://www.wikipedia.org/wiki/UTF-8) text editor, such as [Notepad++](https://notepad-plus-plus.org) 
 * The [GitHub Desktop](https://desktop.github.io) software
 * A free [GitHub Account](https://github.com/join).

Most people have used the first two things already. When you run [GitHub Desktop](https://desktop.github.io) for the first time, you'll have the option to sign up for a GitHub account.

Once you've signed up and logged into GitHub Desktop, you'll be given the option to check out a repository. Search for `wwoast/redpanda-lineage`, and click Clone, and you'll have a copy of the Red Panda dataset downloaded to your home folder, under `Documents/GitHub`.

<img src="https://raw.githubusercontent.com/wwoast/redpanda-lineage/master/docs/images/instructions/windows-default-folders.png" /> 

To recap, you've downloaded GitHub Desktop, signed in with your account, and know where the `redpanda-lineage` folder is on your computer. That's a pretty good start!

----

## Creating A Branch to Work From

<img src="https://raw.githubusercontent.com/wwoast/redpanda-lineage/master/docs/images/instructions/lychee-start-working.jpg" /> 

GitHub repositories are managed like open projects. Any guest or contributor can clone the repository, giving them a full _working copy_ on their own computer. However, to contribute changes from your _working copy_ back to our `master` branch, you'll need to follow some guidelines.

<img src="https://raw.githubusercontent.com/wwoast/redpanda-lineage/master/docs/images/instructions/create-new-branch-1.png" /> 
<img src="https://raw.githubusercontent.com/wwoast/redpanda-lineage/master/docs/images/instructions/create-new-branch-2.png" />

The `wwoast/redpanda-lineage` GitHub repository has any number of secondary branches in flight at a time. Branches typically represent the collected work of a single contributor, bundled up and ready to review for merging into our `master`. If you plan on contributing to the `master` branch, start by using GitHub Desktop to create a branch of your own. This will be created based on your downloaded _clone_ of the master branch.

<img src="https://raw.githubusercontent.com/wwoast/redpanda-lineage/master/docs/images/instructions/select-a-branch.png" />

Now that your branch is made and selected, we're ready to do the important work of documenting new red pandas and zoos!

----

## Adding or Modifying Pandas in the Dataset

All panda and zoo editing starts in your _working copy_ of the `redpanda-lineage` repository. *Recall this is in your `Documents/Github` folder inside your user's home directory*.

Open up Notepad++. Then from the File menu, select _Open Folder as Workspace_. Select the `redpanda-lineage` folder. In the left pane, you'll see the `/pandas` and `/zoos` folders. Underneath those you'll see subfolders for every zoo we've recorded pandas for. Having a left pane or "workspace view" as you edit this dataset is highly recommended, for a high-level view of which pandas and zoos are already in the dataset. The folders and filename standards are intended to assist _human review_, to help us all ensure that:

 * If we add a new panda file, it doesn't have a duplicate ID number to an existing panda
 * If we want to add a panda for a particular zoo, we know at a glance whether the panda is already in the dataset or not

Let's take a look at [`pandas/0001_ichikawa/0004_lychee.txt`](https://github.com/wwoast/redpanda-lineage/blob/master/pandas/0001_ichikawa/0004_lychee.txt). This is the information we have on file for Lychee, a male red panda at Ichikawa Zoo. Most of the data is self-explanatory, but you'll need to understand the dataset conventions for your updates to be accepted. 

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

<img src="https://raw.githubusercontent.com/wwoast/redpanda-lineage/master/docs/images/instructions/commit-to-branch-short.png" /> 

While you can make any number of commits as you do your work, we also recommend _pushing_ your branch to GitHub often. A _push_ makes a remote copy of your branch, and shows other Red Panda Dataset collaborators what changes you intend on contributing. Plus, now your data is saved to the Internet, in case your computer encounters technical difficulties!

----

## The Peer Review Process

So you've pushed your branch up to GitHub. When you're ready for us to review your changes, you visit [our repository on GitHub](https://github.com/wwoast/redpanda-lineage) and open a _Pull Request_ or *_PR_*, similar to you asking us "please pull the changes from my branch into the `master` branch".

When you push a new branch to GitHub, the website helpfully indicates that you might want a PR for that new branch you just pushed with a big green bar. Click that bar and fill out the subsequent form, and you'll have started the _Pull Request_ process. Be aware that we may need to ask you follow-up questions or recommend changes, so keep refreshing your PR or maybe even bookmark it in your browser.

If we don't merge your PR quickly, there is the chance your red panda ID numbers may get stale and need to be updated. Feel free to comment on your PR if you want attention. If we still fail to respond, reach out to _wumpwoast_ [via Instagram](https://instagram.com/wumpwoast).

----

## Troubleshooting

<img src="https://raw.githubusercontent.com/wwoast/redpanda-lineage/master/docs/images/instructions/harumaki-troubleshooter.jpg" />

 * If you forget to make a branch...
 * If you need to refactor from the master branch
 * Other things that people could mess up!

----

## Appendix: Technical / Terminal Users

If you're a command-line user, and you have Git, here's a quick sample of what a typical dataset session might look like

```
git clone https://github.com/wwoast/redpanda-lineage.git
git checkout -b maruyama-zoo
vim pandas/0001_ichikawa/0004_lychee.txt
git commit -a -m "changed lychee's birthday"
git push origin maruyama-zoo
```

# Red Panda Lineage
----

### Schemas 

#### /pandas

This is the main dataset for red pandas, and where the graph database is
generated from. Each panda will be stored in a single flat-text file, with
the panda's name as the filename (either English or Japanese).

Photo and Video URIs are intended to aid in identification of the animal.
We'll have a timeline strategy later to track arbitrary photos/videos/events
from a panda's life in a time-ordered way. There's no upper limit on the
number of photos that can appear in a panda file.

```
pandas/0001_ichikawa/0001_harumaki.txt
```

```
[panda]
# panda ids are monotonic-ascending numbers assigned by hand
_id: <panda-id-number> 
birthday: <YYYY/MM/DD string|unknown>
birthplace: <zoo-id-number|unknown> 
children: <ids-for-panda-children>
commitdate: <YYYY/MM/DD this file was first added to this repository>
# Each name field can have at max 100 characters
en.name: Harumaki
en.nicknames: <common nicknames with comma separator|none>
en.othernames: <alternate spellings|none>
gender: <m|f|unknown>
jp.name: ハルマキ
jp.nicknames: <utf8-strings with comma separator|none>
# first name in jp.othernames list used as furigana, or alternate kanji spelling
jp.othernames: <utf8-strings with comma separator, first string is furigana|none>
language.order: <list-of-language-prefixes-most-meaningful-for-this-entity>
litter: <ids-for-panda-siblings-born-in-same-litter>
location.1: <zoo-id-number>, <date-arrived-at-zoo>
location.2: <zoo-id-number>, <date-arrived-at-zoo>
location.3: ...
photo.1: <url>
photo.1.author: <name or instagram handle of the photographer>
photo.1.commitdate: <YYYY/MM/DD this photo first appeared in the repository>
photo.1.link: <link to webpage or instagram homepage>
# tags in alphabetical order
photo.1.tags: <comma-separated-strings, or omitted if none>
photo.2: ...
video.1: <url>
video.1.author: ...
zoo: <zoo-names-translated-into-zoo-id> 
```

#### /zoos

To make it simpler to write panda files, the Zoo information is split off into
a separate folder and schema. Note that in the final compiled graph of zoos and
pandas, the zoos are distinguished from pandas by their negative ID numbers,
while pandas have positive ID numbers. Hackity hack!

```
zoos/japan/0001_ichikawa.txt
```

```
[zoo]
# zoo ids are monotonic-ascending numbers assigned by hand
_id: <zoo-id-number>
commitdate: <YYYY/MM/DD this first appeared in this repository>
en.address: <google maps address info from google.com> 
en.location: Chiba Prefecture, Japan
en.name: Ichikawa Zoological and Botanical Gardens 
jp.address: <google maps address info from google.jp>
jp.location: <utf8-string>
jp.name: <utf8-string>
language.order: <list-of-language-prefixes-most-meaningful-for-this-entity>
map: <google-maps-shortlink-to-this-location>
photo.1: ...
video.1: ...
website: <url-of-zoo-website> 
```

#### /media

For each zoo, there are lists of media files that contain more than a single
animal, taken at the zoo indicated in the file's directory paths. The _id for
media files takes a different format than zoos and pandas, one that might 
become the standard format later on since it's not an awful hack.

```
media/japan/0001_ichikawa/meito-tell.txt
```

```
[media]
# panda names in alphabetical order
_id: media.<zoo-id>.<en-name-of-panda>-<en-name-of-panda>-...
# panda ids in numerical order
panda.tags: <panda-id-1>, <panda-id-2>
photo.1: <url>
photo.1.author: <name or instagram handle of the photographer>
photo.1.commitdate: <YYYY/MM/DD this photo first appeared in the repository>
photo.1.link: <link to webpage or instagram homepage>
# tags in alphabetical order
photo.1.tags: <comma-separated-strings, or omitted if none>
# pixel coordinate locations of panda's faces in each photo.
# the X and Y values are always divisible by 5.
# when names are shown for media photos, the name cooresponding to the
# lowest (left-most) X-value is shown first.
photo.1.tags.<panda-id-1>.location: X1, Y1
photo.1.tags.<panda-id-2>.location: X2, Y2
```
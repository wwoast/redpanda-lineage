## /pandas

This is the main dataset for red pandas, and where the graph database is
generated from. Each panda will be stored in a single flat-text file, with
the panda's name as the filename (either English or Japanese).

```
[panda]
_id: <monotonic-ascending-number, assign one if none given> 
birthday: <date string> 
birthplace: <zoo-names-translated-into-zoo-id> 
children: <list-of-names-translated-into-panda-ids, alert on name collisions> 
en.name: harumaki 
en.nicknames: <common nicknames>
en.othernames: <alternate spellings> 
gender: <m|f, or japanese male/female terms>
jp.name: <utf8-string>
jp.nicknames: <utf8-strings with comma separator>
jp.othernames: <utf8-strings with comma separator>
litter: <list-of-names-translated-into-panda-ids, alert on name collisions> 
zoo: <zoo-names-translated-into-zoo-id> 
```
 
## /zoos

To make it simpler to write panda files, the Zoo information is split off into
a separate folder and schema. Note that in the final compiled graph of zoos and
pandas, the zoos are distinguished from pandas by their negative ID numbers,
while pandas have positive ID numbers. Hackity hack!

```
[zoo]
_id: <monotonic-ascending-number, assign one if none given> 
en.address: <google maps address info> 
en.location: chiba prefecture, japan 
en.name: ichikawa zoological park and gardens 
jp.location: <utf8-string> 
jp.name: <utf8-string>
website: <url> 
```

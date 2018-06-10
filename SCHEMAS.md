## /pandas

This is the main dataset for red pandas, and where the graph database is
generated from. Each panda will be stored in a single flat-text file, with
the panda's name as the filename (either English or Japanese).

```
id: <monotonic-ascending-number, assign one if none given> 

birthday: <date string> 
birthplace: <zoo-names-translated-into-zoo-id> 
children: <list-of-names-translated-into-panda-ids, alert on name collisions> 
zoo: <zoo-names-translated-into-zoo-id> 
 
en.name: harumaki 
 
jp.name: <utf8-string> 
```
 
## /zoos

To make it simpler to write panda files, the Zoo information is split off into
a separate folder and schema.

```
id: <monotonic-ascending-number, assign one if none given> 
 
geolocation: <google maps location identifier> 
website: <url> 
 
en.location: chiba prefecture, japan 
en.name: ichikawa zoological park and gardens 
 
jp.location: <utf8-string> 
jp.name: <utf8-string>
```

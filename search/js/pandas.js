/*
    Logic for a Red Panda database search form.
    Built with love and Dagoba.js :)  
*/

/*
    The Panda search form namespace
*/
var Pandas = {};   // Namespace
Pandas.def = {};   // Default values

Pandas.P = {};     // Prototype

Pandas.init = function() {
  /* Create a Pandas search object, and do the initial database import.
  
  XMLHttpRequest the JSON panda data once all basic scripts have loaded.
  Then return the big chunk of data, along with our query functions.
  */ 
  var db_url = "https://wwoast.github.io/redpanda-lineage/export/redpanda.json";
 
  var pandas = Object.create(Pandas.P); 
  var request = new XMLHttpRequest();
  request.open('GET', db_url);
  request.responseType = 'json';
  request.send();
  request.onload = function() {
    pandas.db = request.response;
  }

  return pandas;
}

/*
    Operator Definitions and aliases, organized into stages (processing order), and then
    by alphabetical operator order, and then in the alternate languages for searching that
    we're trying to support
*/
Pandas.ops = {
  "type": {
    "panda": ['panda', 'red panda', 'パンダ', 'レッサーパンダ'],
    "zoo": ['zoo', '動物園']
  },
  "subtype": {
    "alive": ['alive', 'living'],
    "born": ['born'],
    "dead": ['dead'],
    "died": ['died'],
    "in": ['in']
  },
  "glob": {
    "*": ['*'],
    "?": ['?']
  },
  "boolean": {
    "and": ['and'],
    "or": ['or'],
    "not": ['not'],
    "nor": ['nor']
  },
  "family": {
    "aunt": ['aunt'],
    "brother": ['brother'],
    "cousin": ['cousin'],
    "children": ['children'],
    "dad": ['dad', 'father', 'papa'],
    "grandma": ['grandma', 'grandmother'],
    "grandpa": ['grandpa', 'grandfather'],
    "litter": ['litter'],
    "mate": ['husband', 'mate', 'wife'],
    "mom": ['mom', 'mother'],
    "nephew": ['nephew'],
    "niece": ['niece'],
    "parents": ['parents'],
    "relatives": ['relative', 'relatives'],
    "siblings": ['sibling', 'siblings'],
    "uncle": ['uncle']
  }
}

/*
    Defaults for a panda or zoo if a piece of information is missing
*/
Pandas.def.age = {
  "cn": {
    "year": "年",
    "years": "年",
    "month": "月",
    "months": "月",
    "day": "天",
    "days": "天"
  },
  "en": {
    "year": "year",
    "years": "years",
    "month": "month",
    "months": "months",
    "day": "day",
    "days": "days"
  },
  "jp": {
    "year": "年",
    "years": "年",
    "month": "月",
    "months": "月",
    "day": "日",
    "days": "日"
  }
}

Pandas.def.animal = {
  "_id": "0",
  "birthday": "1970/1/1",
  "birthplace": "0",
  "children": "0",
  "death": "1970/1/1",
  "en.name": "Panda Not Found",
  "en.nicknames": "No Nicknames Recorded",
  "en.othernames": "No Alternate Names Recorded",
  "gender": "Unknown",
  "jp.name": "パンダが見つかりませんでした",
  "jp.nicknames": "ニックネームは記録されていません",
  "jp.othernames": "代わりのスペルは記録されていません",
  "litter": "0",
  "photo.1": "/images/no-panda.jpg",
  "photo.2": "/images/no-panda.jpg",
  "photo.3": "/images/no-panda.jpg",
  "photo.4": "/images/no-panda.jpg",
  "photo.5": "/images/no-panda.jpg",
  "video.1": "/images/no-panda.jpg",
  "video.2": "/images/no-panda.jpg",
  "video.3": "/images/no-panda.jpg",
  "video.4": "/images/no-panda.jpg",
  "video.5": "/images/no-panda.jpg",
  "zoo": "0"
}

Pandas.def.date = {
  "cn": "YYYY-MM-DD",
  "en": "MM/DD/YYYY",
  "jp": "YYYY年MM月DD日"
}

Pandas.def.gender = {
  "Female": {
    "cn": "女",
    "en": "female",
    "jp": "メス"
  },
  "Male": {
    "cn": "男",
    "en": "male",
    "jp": "オス"
  }
}

// Used for slip-ins in Panda dossiers for brothers/sisters/moms
Pandas.def.relations = {
  "aunt": {
    "cn": "姑媽",
    "en": "aunt",
    "jp": "叔母"
  },
  "brother": {
    "cn": "兄",
    "en": "brother",
    "jp": "兄"
  },
  "cousin": {
    "cn": "表姐",
    "en": "cousin",
    "jp": "いとこ"
  },
  "father": {
    "cn": "父",
    "en": "father",
    "jp": "父"
  },
  "grandfather": {
    "cn": "祖父",
    "en": "grandfather",
    "jp": "おじいちゃん"
  },
  "grandmother": {
    "cn": "祖母",
    "en": "grandmother",
    "jp": "おばあちゃん"
  },
  "mother": {
    "cn": "母",
    "en": "mother",
    "jp": "母"
  },
  "nephew": {
    "cn": "外甥",
    "en": "nephew",
    "jp": "甥"
  },
  "niece": {
    "cn": "侄女",
    "en": "niece",
    "jp": "姪"
  },
  "sister": {
    "cn": "妹妹",
    "en": "sister",
    "jp": "姉"
  },
  "uncle": {
    "cn": "叔叔",
    "en": "uncle",
    "jp": "叔父"
  }
}

Pandas.def.species = {
  "cn": [
    "Ailurus fulgens fulgens",
    "Ailurus fulgens styani"
  ],
  "en": [
    "Ailurus fulgens fulgens",
    "Ailurus fulgens styani"
  ],
  "jp": [
    "西レッサーパンダ",
    "シセンレッサーパンダ"
  ]
}

Pandas.def.unknown = {
  "cn": "不明",
  "en": "unknown",
  "jp": "未詳"
}

Pandas.def.zoo = {
  "_id": "0",
  "en.address": "No Google Maps Address Recorded",
  "en.location": "No City, District, or State Info Listed",
  "en.name": "Zoo Not Found",
  "jp.address": "Googleマップのアドレスが記録されていません",
  "jp.location": "市区町村の情報が表示されていない",
  "jp.name": "動物園が見つかりません",
  "photo.1": "No Photo Listed",
  "photo.2": "No Photo Listed",
  "video.1": "No Video Listed",
  "video.2": "No Video Listed",
  "website": "https://www.worldwildlife.org/"
}

/*
    Methods for searching on Red Pandas
*/
// Find a panda's dad
Pandas.searchPandaDad = function(idnum) {
  var nodes = G.v(idnum).in("family").filter(function(vertex) {
    return vertex.gender == "Male";
  }).run();
  return nodes[0];
}

// Find a panda by an arbitrary field in the red panda database
Pandas.searchPandaField = function(query, field) {
  var search = {};
  search[field] = query;
  var nodes = G.v(search).run();
  return nodes;
}

// Find a single panda by id number
Pandas.searchPandaId = function(idnum) {
  var node = G.v(idnum).run();
  return node[0];
}

// Find a panda's direct litter
Pandas.searchLitter = function(idnum) {
  var nodes = G.v(idnum).in("litter").run();
  return nodes;
}

// Find a panda's mother
Pandas.searchPandaMom = function(idnum) {
  var nodes = G.v(idnum).in("family").filter(function(vertex) {
    return vertex.gender == "Female";
  }).run();
  return nodes[0];
}

// Find a panda by English name
Pandas.searchPandaName = function(name) {
  var nodes = G.v({"en.name": name}).run();
  return nodes;
}

// Find a panda's littermates. Search for all pandas with the
// same parents and the same birthday.
Pandas.searchLitter = function(idnum) {
  var birthday = G.v(idnum).run()[0].birthday;
  var nodes = G.v(idnum).as("me").in("family").out("family").unique().except("me").filter(function(vertex) {
    return vertex.birthday == birthday;  // TODO: check only the year and month
  }).run();
  return nodes;
}

// Find a pandas's direct siblings, with both the same mother and same father.
Pandas.searchDirectSiblings = function(idnum) {
  return;   // TODO
}

// Find just a panda's half siblings, not the ones with the same mother and father
Pandas.searchHalfSiblings = function(idnum) {
  return;   // TODO
}

// Find a panda's siblings, not including littermates.
Pandas.searchNonLitterSiblings = function(idnum) {
  var birthday = G.v(idnum).run()[0].birthday;
  var nodes = G.v(idnum).as("me").in("family").out("family").unique().except("me").filter(function(vertex) {
    return vertex.birthday != birthday;  // TODO: check only the year and month
  }).run();
  return nodes;
}

// Find a panda's siblings, defined as the intersection of children 
// by the same mother and father panda, but excluding the initial panda
// we started the search from.
Pandas.searchSiblings = function(idnum) {
  var nodes = G.v(idnum).as("me").in("family").out("family").unique().except("me").run();
  return nodes;
}

// Zoos are stored with negative numbers, but are tracked in the database by
// their positive ID numbers. So convert the ID before searching
Pandas.searchZooId = function(idnum) {
  var node = G.v((parseInt(idnum) * -1).toString()).run();
  return node;
}

/*
    Methods for sorting the output of Panda searches
*/
Pandas.sortYoungestToOldest = function(nodes) {
  return nodes.sort(function(a, b) {
    return new Date(a.birthday) < new Date(b.birthday);
  });
}

Pandas.sortOldestToYoungest = function(nodes) {
  return nodes.sort(function(a, b) {
    return new Date(a.birthday) > new Date(b.birthday);
  });
}

/*
    Getters and formatters for Red Panda details, with sensible defaults
*/
// Given an animal's birthday, return their age up to today or the day they died.
Pandas.age = function(animal, language) {
  var birth = animal['birthday'];
  if (birth == undefined) {
    return Pandas.def.unknown[language];
  }
  var birthday = new Date(birth);
  var death = animal['death'];
  // If the animal's date of death is listed as "unknown", this means the animal
  // passed at an undetermined date, so its age is also unknown.
  if (death == "unknown") {
    return Pandas.def.unknown[language];
  }
  var endday = (death == undefined ? new Date() : new Date(death));
  var ms_per_day = 1000 * 60 * 60 * 24;
  var age_days = (endday - birthday)/ms_per_day;
  var age_years = Math.floor(age_days / 365);
  var age_months = Math.floor(age_days / 30);
  // Date heuristics: Print the age in days if younger than 100 days old.
  // Otherwise, print the age in terms of months and years, up to two years,
  // where you should just print the age in years.
  if (age_days < 2) {
    return age_days.toString() + " " + Pandas.def.age[language]['day'];
  } else if (age_days <= 100) {
    return age_days.toString() + " " + Pandas.def.age[language]['days'];
  } else if (age_days <= 365) {
    return age_months.toString() + " " + Pandas.def.age[language]['months'];
  } else if (age_days <= 395) {
    return "1" + " " + Pandas.def.age[language]['year'];
  } else if (age_days <= 425) {
    return "1" + " " + Pandas.def.age[language]['year'] + " " + 
           age_months.toString() + Pandas.def.age[language]['month'];
  } else if (age_days <= 730) {
    return "1" + " " + Pandas.def.age[language]['year'] + " " + 
           age_months.toString() + Pandas.def.age[language]['months'];
  } else {
    return age_years.toString() + " " + Pandas.def.age[language]['years'];
  }
}

// Given an animal, return their birthday, formatted to the correct locale.
Pandas.birthday = function(animal, language) {
  return Pandas.date(animal, 'birthday', language);
}

// Given an animal and a language, return one of the panda's date fields
// in the local format. The database always tracks dates in YYYY/MM/DD format.
Pandas.date = function(animal, field, language) {
  var date = animal[field];
  if (date == undefined) {
    return Pandas.def.unknown[language];
  }
  var format = Pandas.def.date[language];
  [ year, month, day ] = date.split("/");
  format = format.replace("YYYY", year);
  format = format.replace("MM", month);
  format = format.replace("DD", day);
  return format;
}

// Given a field that doesn't have language information associated with it,
// return either the field if it exists, or some reasonable default.
Pandas.field = function(animal, field) {
  return animal[field] == undefined ? Pandas.def.animal[field] : animal[field];
}

// Given an animal and a language, return the proper gender string.
Pandas.gender = function(animal, language) {
  var gender = animal["gender"];
  return gender == "undefined" ? Pandas.def.unknown[language] 
                               : Pandas.def.gender[gender][language];
}

// Given an animal and a chosen language, return details for a red panda.
Pandas.myName = function(animal, language) {
  var field = language + ".name";
  return animal[field] == undefined ? Pandas.def.animal[field] : animal[field];
}

// Given an animal and a field name, return details about a zoo.
// Though zoos are stored in the text filees related to an animal, 
// when moved into Dagoba they become edges to zoo nodes.
// Proper "fields" might be 'birthplace' or 'zoo'.
Pandas.myZoo = function(animal, field) {
  var zoo = G.v(animal['_id']).out(field).run();
  return zoo == [] ? Pandas.def.zoo : zoo[0];
}

// Given an animal and a chosen language, return nicknames.
Pandas.nicknames = function(animal, language) {
  var field = language + ".nicknames";
  return animal[field] == undefined ? Pandas.def.animal[field] : animal[field];
}

// Given an animal and a chosen language, return alternate names, such as
// alternative Hiragana/Katakana/Kanji spellings of names.
Pandas.othernames = function(animal, language) {
  var field = language + ".othernames";
  return animal[field] == undefined ? Pandas.def.animal[field] : animal[field];
}

// Given an animal, choose a single photo to display as its profile photo.
// The index can be a number between 1 and 5, or it can be "random".
Pandas.profilePhoto = function(animal, index) {
  // Find the available photo indexes between one and ten
  var photos = {
     "photo.1": Pandas.field(animal,  "photo.1"),
     "photo.2": Pandas.field(animal,  "photo.2"),
     "photo.3": Pandas.field(animal,  "photo.3"),
     "photo.4": Pandas.field(animal,  "photo.4"),
     "photo.5": Pandas.field(animal,  "photo.5"),
     "photo.6": Pandas.field(animal,  "photo.6"),
     "photo.7": Pandas.field(animal,  "photo.7"),
     "photo.8": Pandas.field(animal,  "photo.8"),
     "photo.9": Pandas.field(animal,  "photo.9"),
    "photo.10": Pandas.field(animal, "photo.10")
  }
  // Filter out any keys that have the default value
  photos = Object.keys(photos).reduce(function(filtered, key) {
    if (photos[key] != Pandas.def.animal[key]) {
      filtered[key] = photos[key];
    }
    return filtered;
  }, {});
  // If photo.(index) not in the photos dict, choose one of the available keys
  // at random from the set of remaining valid images.
  var choice = "photos." + index.toString(); 
  if (photos[choice] == undefined) {
    var space = Object.keys(photos).length;
    var index = Math.floor(Math.random() * space) + 1;
    choice = Object.keys(photos)[index];
  }
  // Return not just the chosen photo but the author and link as well
  var desired = {
     "photo": photos[choice],
    "credit": animal[choice + ".author"],
      "link": animal[choice + ".link"]
  }
  return desired;
}

// Given a zoo found with Pandas.location(), return the name of the zoo.
Pandas.zooName = function(zoo, language) {
  var field = language + ".name";
  return zoo[field] == undefined ? Pandas.def.zoo[field] : zoo[field];
}

// Given a zoo found with Pandas.location(), return an arbitrary field.
// Useful for anything that's just a URI, like videos or photos.
Pandas.zooField = function(zoo, field) {
  return zoo[field] == undefined ? Pandas.def.zoo[field] : zoo[field];
}

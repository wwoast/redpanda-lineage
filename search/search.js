/*
    Logic for a Red Panda database search form.
    Built with love and Dagoba.js :)  
*/

/*
    The Panda search form namespace
*/
var Pandas = {};   // Namespace

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
  "sub-type": {
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
Pandas.searchPandaId = function(idnum) {
  var node = G.v(idnum).run();
  console.log(node[0]['en.name']);
  return node;
}

Pandas.searchPandaName = function(query) {
  var nodes = G.v({"en.name": query}).run();
  return nodes;
}

// Zoos are stored with negative numbers, but are tracked in the database by
// their positive ID numbers. So convert the ID before searching
Pandas.searchZooId = function(idnum) {
  var node = G.v(str(int(idnum) * -1)).run();
  return node;
}

// Search for each term in the graph database and infer what it is.
Pandas.resolveQueryTerms = function(query) {
  return null;
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
  if (death == undefined) {
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
    return str(age_days) + " " + Pandas.def.age[language]['day'];
  } else if (age_days <= 100) {
    return str(age_days) + " " + Pandas.def.age[language]['days'];
  } else if (age_days <= 365) {
    return str(age_months) + " " + Pandas.def.age[language]['months'];
  } else if (age_days <= 395) {
    return "1" + " " + Pandas.def.age[language]['year'];
  } else if (age_days <= 425) {
    return "1" + " " + Pandas.def.age[language]['year'] + " " + 
           str(age_months) + Pandas.def.age[language]['month'];
  } else if (age_days <= 730) {
    return "1" + " " + Pandas.def.age[language]['year'] + " " + 
           str(age_months) + Pandas.def.age[language]['months'];
  } else {
    return age_years + " " + Pandas.def.age[language]['years'];
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
  format.replace("YYYY", year);
  format.replace("MM", month);
  format.replace("DD", day);
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
  return gender == "undefined" ? Pandas.def.unknown[launguage] 
                               : Pandas.def.gender[gender][language];
}

// Given an animal and a field name, return details about a zoo. 
// Supported fields include the birthplace and zoo fields, which are both Zoo IDs.
Pandas.location = function(animal, field) {
  return animal[field] == undefined ? Pandas.def.zoo 
                                    : Pandas.searchZooId(animal[field]);
}

// Given an animal and a chosen language, return details for a red panda.
Pandas.name = function(animal, language) {
  var field = language + ".name";
  return animal[field] == undefined ? Pandas.def.animal[field] : animal[field];
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

// Given an animal, choose a photo to display as its profile photo. The index
// can be a number between 1 and 5, or it can be "random".
Pandas.profile_photo = function(animal, index) {
  // Find the available photo indexes between one and five
  var photo_index = {
    "photo.1": Pandas.field(animal, "photo.1"),
    "photo.2": Pandas.field(animal, "photo.2"),
    "photo.3": Pandas.field(animal, "photo.3"),
    "photo.4": Pandas.field(animal, "photo.4"),
    "photo.5": Pandas.field(animal, "photo.5")
  }
  photo_index.filter(function() {
    // TODO: filter out unknown or unverified photos
  });
  // TODO: Of remaining available photos, choose one of the keys at random
  if (!(index >= 1 && index <= 5)) {
    index = Math.floor(Math.random() * 5) + 1;
  }
  return null;  // TODO
}

// Given a zoo found with Pandas.location(), return the name of the zoo.
Pandas.zoo_name = function(zoo, language) {
  var field = language + ".name";
  return zoo[field] == undefined ? Pandas.def.zoo[field] : zoo[field];
}

// Given a zoo found with Pandas.location(), return an arbitrary field.
// Useful for anything that's just a URI, like videos or photos.
Pandas.zoo_field = function(zoo, field) {
  return zoo[field] == undefined ? Pandas.def.zoo[field] : zoo[field];
}

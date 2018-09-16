/*
    Logic for a Red Panda database search form.
    Built with love and Dagoba.js :)  
*/

/*
    The Panda search form namespace
*/
var Pandas = {};   // Namespace
Pandas.def = {};   // Default values
Pandas.loaded = new Event('panda_data');

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
    window.dispatchEvent(Pandas.loaded);   // Report the data has loaded
  }

  return pandas;
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
    "year": "歳",
    "years": "歳",
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
  "photo.6": "/images/no-panda.jpg",
  "photo.7": "/images/no-panda.jpg",
  "photo.8": "/images/no-panda.jpg",
  "photo.9": "/images/no-panda.jpg",
  "photo.10": "/images/no-panda.jpg",
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

// Used for missing mothers and fathers, where capitalization is needed
Pandas.def.no_name = {
  "cn": "不明",
  "en": "Unknown",
  "jp": "未詳"
}

// Used for determining what languages are selectable. Don't add new languages
// to this set until we're ready with panda data in that language. We look for
// ISO-639-1 codes in the navigator.languages value, and map it to a language
// definition used within this project's code.
Pandas.def.languages = {
  "en": "en",
  "ja": "jp"
}

// Character ranges
Pandas.def.ranges = {
  "en": [
    /^[\u0020-\u007f]/,   // Basic Latin
    /^[\u00a0-\u00ff]/,   // Latin-1 Supplement
    /^[\u0100-\u017f]/,   // Latin Supplement A,
    /^[\u0180-\u024f]/    // Latin Supplement B
  ],
  "jp": [
    /^[\u3000-\u303f]/,   // Japanese punctuation
    /^[\u3040-\u309f]/,   // Japanese hiragana
    /^[\u30a0-\u30ff]/,   // Japanese katakana,
    /^[\uff00-\uffef]/,   // Japanese full-width romanji and half-width katakana
    /^[\u4e00-\u9faf]/    // CJK unified Kanji set
  ]
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
  "children": {
    "cn": "孩子",
    "en": "children",
    "jp": "子供"
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
  "litter": {
    "cn": "litter",
    "en": "litter",
    "jp": "双子"   /* "同腹仔" */
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
  "parents": {
    "cn": "父母",
    "en": "parents",
    "jp": "両親"
  },
  "sister": {
    "cn": "妹妹",
    "en": "sister",
    "jp": "姉"
  },
  "siblings": {
    "cn": "兄弟姐妹",
    "en": "siblings",
    "jp": "兄弟"
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
    Utility functions and generators for doing panda processing
*/
// Generates a valid index to a photo for a panda entity, up to the
// point that said entity doesn't have a defined photo in its data.
// TODO: rewrite Pandas.profilePhoto in terms of this
Pandas.photoGeneratorEntity = function*(entity) {
  var index = 0;
  while (index < index + 1) {
    index++;
    if (entity["photo." + index] == undefined) {
      return;
    }
    yield "photo." + index;
  }
}

// Generates a valid index to a photo for a panda entity, up to the
// max index.
// TODO: max index should be in the dataset, representing
// the most photos a single panda entity has recorded. 
Pandas.photoGeneratorMax = function*(max) {
  var index = 0;
  while (index < index + 1) {
    index++;
    if (index > max) {
      return;
    }
    yield "photo." + index;
  }
}

/*
    Methods for searching on Red Pandas
*/
// Find a pandas's direct siblings, with both the same mother and same father.
Pandas.searchDirectSiblings = function(idnum) {
  return;   // TODO
}

// Find just a panda's half siblings, not the ones with the same mother and father
Pandas.searchHalfSiblings = function(idnum) {
  return;   // TODO
}

// Find a panda's littermates. Search for all pandas with the
// same parents and the same birthday.
Pandas.searchLitter = function(idnum) {
  var nodes = G.v(idnum).in("litter").run();
  return nodes;
}

// Find a panda's siblings, not including littermates.
Pandas.searchNonLitterSiblings = function(idnum) {
  var birthday = G.v(idnum).run()[0].birthday;
  var nodes = G.v(idnum).as("me").in("family").out("family").unique().except("me").filter(function(vertex) {
    var my_date = new Date(birthday);
    var their_date = new Date(vertex.birthday);
    var timeDiff = Math.abs(my_date.getTime() - their_date.getTime());
    var diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
    if ( diffDays > 2 ) {
      return true;
    } else {
      return false;
    }
  }).run();
  return nodes;
}

// Find a value in a set of Panda's old names
Pandas.searchOldnames = function(name) {
  var nodes = G.v().filter(function(animal) {
    var languages = Object.values(Pandas.def.languages);
    // Valid "otherfields" for supported languages
    var otherfields = languages.map(function(l) {
      return l + ".oldnames";
    });
    for (var i in otherfields) {
      field = otherfields[i];
      if (animal[field] != undefined) {
        othernames = animal[field].split(',');
        if (othernames.indexOf(name) != -1) {
          return animal;
        }
      }
    }
  }).run();
  return nodes;
}

// Find a value in a set of Panda's othernames
Pandas.searchOthernames = function(name) {
  var nodes = G.v().filter(function(animal) {
    var languages = Object.values(Pandas.def.languages);
    // Valid "otherfields" for supported languages
    var otherfields = languages.map(function(l) {
      return l + ".othernames";
    });
    for (var i in otherfields) {
      field = otherfields[i];
      if (animal[field] != undefined) {
        othernames = animal[field].split(',');
        if (othernames.indexOf(name) != -1) {
          return animal;
        }
      }
    }
  }).run();
  return nodes;
}

// Find a panda's children
Pandas.searchPandaChildren = function(idnum) {
  var nodes = G.v(idnum).out("family").run();
  return nodes;
}

// Find a panda's dad
Pandas.searchPandaDad = function(idnum) {
  var nodes = G.v(idnum).in("family").filter(function(vertex) {
    return vertex.gender == "Male";
  }).run();
  return nodes;
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
  return node;
}

// Find a panda's mother
Pandas.searchPandaMom = function(idnum) {
  var nodes = G.v(idnum).in("family").filter(function(vertex) {
    return vertex.gender == "Female";
  }).run();
  return nodes;
}

// Find a panda by any name field. TODO: suport arbitrary language names, not just en and jp
Pandas.searchPandaName = function(name) {
  var en_nodes = G.v({"en.name": name}).run();
  var jp_nodes = G.v({"jp.name": name}).run();
  var on_nodes = Pandas.searchOthernames(name);
  var old_nodes = Pandas.searchOldnames(name);
  var nodes = en_nodes.concat(jp_nodes).concat(on_nodes).concat(old_nodes).filter(function(value, index, self) { 
    return self.indexOf(value) === index;  // Am I the first value in the array?
  });
  return nodes;
}

// Find all pandas at a given zoo. Zoo IDs are negative numbers
Pandas.searchPandaZoo = function(idnum) {
  var nodes = G.v(idnum).in("zoo").run();
  return nodes;
}

// Find all pandas at a given zoo that are still alive
Pandas.searchPandaZooCurrent = function(idnum) {
  var nodes = G.v(idnum).in("zoo").filter(function(vertex) {
    return vertex.death == undefined;
  }).run();
  return nodes;
}

// Find all pandas that were either born at, or lived at a given zoo
Pandas.searchPandaZooBornLived = function(idnum) {
  var lived = G.v(idnum).in("zoo").run();
  var born = G.v(idnum).in("birthplace").run();
  var nodes = lived.concat(born).filter(function(value, index, self) { 
    return self.indexOf(value) === index;  // Am I the first value in the array?
  });
  return nodes;
}

// Find all nodes with a particular photo credit.
// TODO: populate MAX from the database somehow
Pandas.searchPhotoCredit = function(author) {
  var photo_fields = Pandas.photoGeneratorMax;
  var nodes = [];
  // Gets zoo photos
  var query = {};
  query["photo.author"] = author;
  var search = G.v(query).run();
  if (search != []) {
    nodes = nodes.concat(search);
  }
  // Gets panda photos
  for (let field_name of photo_fields(10)) {
    var query = {};
    query[field_name + ".author"] = author;
    var search = G.v(query).run();
    if (search != []) {
      nodes = nodes.concat(search);
    }
  }
  // Return any unique nodes that matched one of these searches
  return nodes.filter(function(value, index, self) { 
    return self.indexOf(value) === index;
  });
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
  if (parseInt(idnum) > 0) {
    idnum = parseInt(idnum * -1).toString();
  }
  var nodes = G.v(idnum).run();
  return nodes;
}

// Search for a word in the Zoo's name or location, and return
// any nodes that match one of the strings therein.
Pandas.searchZooName = function(zoo_name_str) {
  // Get the matches against any of the valid zoo strings we care about
  var languages = Object.values(Pandas.def.languages);
  var fields = ["location", "name"];
  var wants = [];
  // Convolve the desired fields with the possible language options
  languages.forEach(function(lang) {
    fields.forEach(function(field) {
      wants.push(lang + "." + field);
    });
  });
  var location_nodes = G.v().filter(function(vertex) {
    // Start with just the zoo ID nodes
    if (vertex["_id"] > 0)
      return false;
    // Match the input string against any of the possible zoo name or location fields
    var matches = []
    wants.forEach(function(want) {
      if (vertex[want] != undefined) {  // Node doesn't exist? We don't care
        if (vertex[want].indexOf(zoo_name_str) != -1) {
          matches.push(vertex);
        }
      }
    });
    return (matches.length > 0);
  }).run();
  // TODO: Have a counting heuristic. Zoos in both sets that match
  // should be returned. For now just try returning the nodes we have.
  return location_nodes;
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
  if ((birth == undefined) || (birth == "unknown")) {
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
  // Specify whether you say "day" or "days" in the age string
  var pluralize = function(count, time_word, language) {
    return (count < 2) ? Pandas.def.age[language][time_word]
                       : Pandas.def.age[language][time_word + "s"]
  }
  var spacing = function(language) {
    return (language == "jp") ? '' : " ";
  }
  // Date heuristics: Print the age in days if younger than 100 days old.
  // Otherwise, print the age in terms of months and years, up to two years,
  // where you should just print the age in years.
  if (age_days <= 100) {
    return (Math.floor(age_days)).toString() + spacing(language) + pluralize(age_days, "day", language);
  } else if (age_days <= 365) {
    return age_months.toString() + spacing(language) + Pandas.def.age[language]['months'];
  } else if (age_days <= 395) {
    return "1" + spacing(language) + Pandas.def.age[language]['year'];
  } else if (age_days <= 730) {
    return "1" + spacing(language) + Pandas.def.age[language]['year'] + " " + 
           (age_months - 12).toString() + spacing(language) + pluralize((age_months - 12).toString(), "month", language);
  } else {
    return age_years.toString() + spacing(language) + Pandas.def.age[language]['years'];
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
  if ((date == undefined) || (date == "unknown")) {
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
  return gender == undefined ? Pandas.def.unknown[language] 
                             : Pandas.def.gender[gender][language];
}

// Return the language order as an array
Pandas.language_order = function(entity) {
  var ordering = entity["language.order"];
  return ordering.replace(" ", "").split(',');
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
// The index can be a number between 1 and 10, or it can be "random".
// TODO: support more than the max of 10
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
  var choice = "photo." + index.toString(); 
  if (photos[choice] == undefined) {
    var space = Object.keys(photos).length;
    var index = Math.floor(Math.random() * space);
    choice = Object.keys(photos)[index];
  }
  // If there were still no valid photos, because the panda has no photos
  // listed, return the default for one.
  if (photos == {}) {
    choice = 1;
    photos[choice] = Pandas.field(animal, "photo.1");
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

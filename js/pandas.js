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
  Relative db_url is appended to the hostname being visited.
  */ 
  var db_url = "https://redpandafinder.com/export/redpanda.json";
 
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
  "photo.1": "images/no-panda-portrait.jpg",
  "species": "-1",
  "video.1": "images/no-panda-portrait.jpg",
  "zoo": "0"
}

Pandas.def.date = {
  "cn": "YYYY-MM-DD",
  "en": "MM/DD/YYYY",
  "jp": "YYYY年MM月DD日",
  "earliest_year": "1970"
}

Pandas.def.date_season = {
  "cn": "SEASON YYYY",
  "en": "SEASON YYYY",
  "jp": "SEASON YYYY",
  "earliest_year": "1970"
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
    /[\u0020-\u007f]/,   // Basic Latin
    /[\u00a0-\u00ff]/,   // Latin-1 Supplement
    /[\u0100-\u017f]/,   // Latin Supplement A,
    /[\u0180-\u024f]/    // Latin Supplement B
  ],
  "jp": [
    /[\u3000-\u303f]/,   // Japanese punctuation
    /[\u3040-\u309f]/,   // Japanese hiragana
    /[\u30a0-\u30ff]/,   // Japanese katakana,
    /[\uff00-\uffef]/,   // Japanese full-width romanji and half-width katakana
    /[\u4e00-\u9faf]/    // CJK unified Kanji set
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
    "Ailurus fulgens styani",
    "Ailurus fulgens"
  ],
  "en": [
    "Ailurus fulgens fulgens",
    "Ailurus fulgens styani",
    "Ailurus fulgens"
  ],
  "jp": [
    "西レッサーパンダ",
    "シセンレッサーパンダ",
    "未詳レッサーパンダ"
  ]
}

Pandas.def.unknown = {
  "cn": "不明",
  "en": "unknown",
  "jp": "未詳"
}

// Slightly different default zoo listing, to account for wild-born animals
Pandas.def.wild = {
  "_id": "wild.0",
  "en.address": "Captured or Rescued Wild Animal",
  "en.location": "No City, District, or State Info Listed",
  "en.name": "Zoo Not Found",
  "jp.address": "TOWRITE",
  "jp.location": "市区町村の情報が表示されていない",
  "jp.name": "動物園が見つかりません",
  "photo.1": "images/no-zoo.jpg",
  "video.1": "images/no-zoo.jpg",
  "website": "https://www.worldwildlife.org/"
}

Pandas.def.zoo = {
  "_id": "0",
  "en.address": "No Google Maps Address Recorded",
  "en.location": "No City, District, or State Info Listed",
  "en.name": "Zoo Not Found",
  "jp.address": "Googleマップのアドレスが記録されていません",
  "jp.location": "市区町村の情報が表示されていない",
  "jp.name": "動物園が見つかりません",
  "photo.1": "images/no-zoo.jpg",
  "video.1": "images/no-zoo.jpg",
  "website": "https://www.worldwildlife.org/"
}

/*
    Utility functions and generators for doing panda processing
*/
// Valid panda IDs are numeric and non-zero
Pandas.checkId = function(input) {
  return (isFinite(input) && input != Pandas.def.animal['_id']);
}

// Generates a valid index to a location for a panda entity, up to the
// point that said entity doesn't have a defined historical location in its data
Pandas.locationGeneratorEntity = function*(entity, index=0) {
  while (index < index + 1) {
    index++;
    if (entity["location." + index] == undefined) {
      return;
    }
    yield "location." + index;
  }
}

// Generates a valid index to a photo for a panda entity, up to the
// point that said entity doesn't have a defined photo in its data.
Pandas.photoGeneratorEntity = function*(entity, index=0) {
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
Pandas.photoGeneratorMax = function*() {
  var index = 0;
  var max = P.db["_photo"]["entity_max"];
  while (index < index + 1) {
    index++;
    if (index > max) {
      return;
    }
    yield "photo." + index;
  }
}

// Shuffle an array
Pandas.shuffle = function(array) {
  for (var i = array.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var temp = array[i];
      array[i] = array[j];
      array[j] = temp;
  }
  return array;
}

/*
    Methods for searching on Red Pandas
*/
// Shorthand for getting all the animals
Pandas.allAnimals = function() {
  var animals = G.v().filter(function(vertex) {
    return vertex["_id"] > 0;
  }).run();
  return animals;
}

Pandas.allAnimalsAndMedia = function() {
  var vertices = G.v().filter(function(vertex) {
    return ((vertex["_id"] > 0) || 
            (vertex["_id"].indexOf("media") != -1));
  }).run();
  return vertices;
}

// Find all panda babies born within a calendar year.
Pandas.searchBabies = function(year) {
  // Default search is for the most recent year we recorded a birth in
  var baby_year = P.db["_totals"]["last_born"];
  // Process whatever comes in as a year value. If > 1970, call it a year
  if (parseInt(year) > parseInt(Pandas.def.date.earliest_year)) {
    baby_year = year;
  }
  var nodes = G.v().filter(function(vertex) {
    var their_date = new Date(vertex.birthday);
    var their_year = their_date.getFullYear();
    return their_year == baby_year;
  }).unique().run();
  return Pandas.sortYoungestToOldest(nodes);
}

// Find all pandas born today, given parameters:
//   keep_living: panda must still be alive
//   photo_count: panda must have at least this many photos
Pandas.searchBirthday = function(keep_living=true, photo_count=20) {
  var today = new Date();
  var nodes = G.v().filter(function(vertex) {
    var birthday = new Date(vertex.birthday);
    return ((birthday.getDate() == today.getDate()) &&
            (birthday.getMonth() == today.getMonth()))
  }).filter(function(vertex) {
    if (keep_living == true) {
      return (vertex.death == undefined);
    } else {
      return true;   // Get everyone
    }
  }).filter(function(vertex) {
    if (photo_count > 0) {
      return vertex["photo." + photo_count] != undefined;
    }
  }).run();
  return Pandas.sortOldestToYoungest(nodes);
}

// Find all panda babies that died within a calendar year.
Pandas.searchDead = function(year) {
  // Default search is for the most recent year we recorded a birth in
  var died_year = P.db["_totals"]["last_died"];
  // Process whatever comes in as a year value. If > 1970, call it a year
  if (parseInt(year) > parseInt(Pandas.def.date.earliest_year)) {
    died_year = year;
  }
  var nodes = G.v().filter(function(vertex) {
    var their_date = new Date(vertex.death);
    var their_year = their_date.getFullYear();
    return their_year == died_year;
  }).unique().run();
  return Pandas.sortYoungestToOldest(nodes);
}

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
        othernames = animal[field].split(',').map(x => x.trim());
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
        othernames = animal[field].split(',').map(x => x.trim());
        if (othernames.indexOf(name) != -1) {
          return animal;
        }
      }
    }
  }).run();
  return nodes;
}

// Find a panda by either name or id
Pandas.searchPanda = function(input_string) {
  if (Pandas.checkId(input_string) == true) {
    return Pandas.searchPandaId(input_string);
  } else {
    return Pandas.searchPandaName(input_string);
  }
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

// Find instances of a panda's ID in both the animal vertices
// and in the media (group) photos.
Pandas.searchPandaMedia = function(query) {
  var animals = Pandas.searchPanda(query);
  // Get an array of graph result arrays, and flatten them
  var media = [].concat.apply([], 
    animals.map(x => x._id).map(function(id) {
      // Search for graph nodes that have "panda.tags" values
      // that match the ids of any animal in the original 
      // searchPanda list.
      var nodes = G.v().filter(function(vertex) {
        if (Object.keys(vertex).indexOf("panda.tags") != -1) {
          return vertex["panda.tags"].split(",")
                     .map(x => x.trim())
                     .indexOf(id) != -1;
        }
      }).run();
      return nodes;
    })
  );
  return animals.concat(media);
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
  return Pandas.sortYoungestToOldest(nodes);
}

// Given a panda, search for photos tagged with any of a list of tags.
// May return photo info only, or the entire animal
// TOWRITE: usable for zoo entities too, fix
Pandas.searchPandaPhotoTags = function(animal, tags, mode) {
  var photo_fields = Pandas.photoGeneratorMax;
  var output = [];
  // Gets panda photos
  for (let field_name of photo_fields()) {
    if (animal[field_name] == undefined) {
      break;
    }
    for (let tag of tags) {
      let photo_author = field_name + ".author";
      let photo_link = field_name + ".link";
      let photo_tags = field_name + ".tags";
      let photo_index = field_name.split(".")[1];
      if (animal[photo_tags] == undefined) {
        continue;
      }
      if (animal[photo_tags].split(",").map(x => x.trim()).indexOf(tag) != -1) {
        if (mode == "animal") {
          return [animal];
        } else {
          var bundle = {
            "id": animal["_id"],
            "photo": animal[field_name],
            "photo.author": animal[photo_author],
            "photo.index": photo_index,
            "photo.link": animal[photo_link],
            "photo.tags": tags   // Not the original tags, but the ones searched for
          }
          output.push(bundle);
          if (mode == "singleton") {
            // Only want the first photo of each tag found
            return output;
          }
        }
      }  
    }
  }
  // If no photos exist, we need default information to feed the photo generators.
  // Make sure the empty bundle still tracks the valid panda id.
  if (output.length == 0) {
    if (mode != "animal") {
      var empty_bundle = {
        "id": animal["_id"],
        "photo": Pandas.def.animal["photo.1"],
        "photo.author": Pandas.def.unknown[L.display],
        "photo.index": Pandas.def.animal["_id"],
        "photo.link": Pandas.def.unknown[L.display],
        "photo.tags": Pandas.def.unknown[L.display]
      }
      output.push(empty_bundle);
    }
  }
  return output;
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
  for (let field_name of photo_fields()) {
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

// Find profile photos for all animals listed
Pandas.searchPhotoProfile = function(animal_list) {
  return Pandas.searchPhotoTags(animal_list, ["profile"], mode="singleton", fallback="first");
}

// Find profile photos for an animal's children
Pandas.searchPhotoProfileChildren = function(idnum) {
  var children = Pandas.sortOldestToYoungest(Pandas.searchPandaChildren(idnum));
  return Pandas.searchPhotoProfile(children);
}

// Find profile photos for an animal's family
Pandas.searchPhotoProfileImmediateFamily = function(idnum) {
  var me = Pandas.searchPandaId(idnum);
  var mom = Pandas.searchPandaMom(idnum);
  var dad = Pandas.searchPandaDad(idnum);
  var litter = Pandas.searchLitter(idnum);
  var family = me.concat(mom).concat(dad).concat(litter);
  return Pandas.searchPhotoProfile(family);
}

// Find profile photos for an animal's siblings
Pandas.searchPhotoProfileSiblings = function(idnum) {
  var nonLitterSiblings = Pandas.searchNonLitterSiblings(idnum);
  var litter = Pandas.searchLitter(idnum);
  var siblings = Pandas.sortOldestToYoungest(nonLitterSiblings.concat(litter));
  return Pandas.searchPhotoProfile(siblings);
}

// Get all photos with a specific set of tags from a list of animals.
// Useful modes here include:
//   "photos" (just return photos) and 
//   "singleton" (for only one photo of each tag)
// Fallback strategies include:
//   "none": return a null photo entry
//   "first": if no tag available, choose the first photo in the set
Pandas.searchPhotoTags = function(animal_list, tags, mode, fallback) {
  // Iterate per animal
  var output = [];
  for (let animal of animal_list) {
    var set = Pandas.searchPandaPhotoTags(animal, tags, mode);
    if (fallback == "first") {
      if ((set.length == 1) && (Object.values(Pandas.def.unknown).indexOf(set[0]["photo.author"]) != -1)) {
        set = [Pandas.profilePhoto(animal, "1")];
      }
    }
    output = output.concat(set);
  }
  // Filter out any cases where photo results with no matches were returned
  return output.filter(x => x["photo.index"] != "0");
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
  // Wild animals or other situations may have id == 0
  if (parseInt(idnum) == 0) {
    return [Pandas.def.wild];
  }
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
    Methods for sorting the output of Panda searches.
    Birthday searches use Unix epoch time and do javascript value sort.
*/
Pandas.sortYoungestToOldest = function(nodes) {
  return nodes.sort(function(a, b) {
    time_a = parseInt(new Date(a.birthday).getTime());
    time_b = parseInt(new Date(b.birthday).getTime());
    if (time_a < time_b) {
      return 1;
    } else if (time_a > time_b) {
      return -1;
    } else {
      return 0;
    }
  });
}

Pandas.sortOldestToYoungest = function(nodes) {
  return nodes.sort(function(a, b) {
    time_a = parseInt(new Date(a.birthday).getTime());
    time_b = parseInt(new Date(b.birthday).getTime());
    if (time_a > time_b) {
      return 1;
    } else if (time_a < time_b) {
      return -1;
    } else {
      return 0;
    }
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
  var age_months = Math.floor(age_days / 31);
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

// Return just a panda's age in years (for birthday messages/etc)
Pandas.ageYears = function(animal) {
  var birth = animal['birthday'];
  if ((birth == undefined) || (birth == "unknown")) {
    return Pandas.def.unknown[language];
  }
  var birthday = new Date(birth);
  var endday = new Date();
  var ms_per_day = 1000 * 60 * 60 * 24;
  var age_days = (endday - birthday)/ms_per_day;
  var age_years = Math.floor(age_days / 365);
  return age_years.toString();
}

// Given an animal, return their birthday, formatted to the correct locale.
Pandas.birthday = function(animal, language) {
  return Pandas.date(animal, 'birthday', language);
}

// Given an animal and a language, return one of the panda's date fields
// in the local format.
Pandas.date = function(animal, field, language) {
  var date = animal[field];
  if ((date == undefined) || (date == "unknown")) {
    return Pandas.def.unknown[language];
  }
  return Pandas.formatDate(date, language);
}

// Given a field that doesn't have language information associated with it,
// return either the field if it exists, or some reasonable default.
Pandas.field = function(animal, field, mode="animal") {
  if (animal[field] != undefined) {
    return animal[field];
  } else if (Pandas.def[mode][field] != undefined ) {
    return Pandas.def[mode][field];
  } else if (field.indexOf("photo.") == 0) {
    return Pandas.def[mode]["photo.1"];
  } else if (field.indexOf("video.") == 0) {
    return Pandas.def[mode]["video.1"];
  } else {
    return undefined;
  }
}

// Given a date string, format the date as per the locale settings.
// The database tracks dates in YYYY/MM/DD format for zoo animals.
// For wild animal sightings, it tracks dates less granularly, since
// pandas are endangered and we need to protect their whereabouts.
Pandas.formatDate = function(date, language) {
  if ((date == undefined) || (date == "unknown")) {
    return Pandas.def.unknown[language];
  }
  if ((date.split("/").length == 2) &&
      (L.gui[date.split("/")[1].toLowerCase()] != undefined)) {
    return Pandas.formatSeason(date, language);
  }
  var format = Pandas.def.date[language];
  [ year, month, day ] = date.split("/");
  format = format.replace("YYYY", year);
  format = format.replace("MM", month);
  format = format.replace("DD", day);
  return format;
}

// Given a date string with a year and a season, format that date
Pandas.formatSeason = function(date, language) {
  if ((date == undefined) || (date == "unknown")) {
    return Pandas.def.unknown[language];
  }
  [ year, season ] = date.split("/");
  season = season.toLowerCase();
  var format = Pandas.def.date_season[language];
  format = format.replace("YYYY", year);
  format = format.replace("SEASON", L.gui[season][language]);
  return format;
}

// Given a date string, return just the year
Pandas.formatYear = function(date, language) {
  if ((date == undefined) || (date == "unknown")) {
    return Pandas.def.unknown[language];
  }
  [ year, month, day ] = date.split("/");
  return year;
}

// Given an animal and a language, return the proper gender string.
Pandas.gender = function(animal, language) {
  var gender = animal["gender"];
  return gender == undefined ? Pandas.def.unknown[language] 
                             : Pandas.def.gender[gender][language];
}

// Given an animal from a media/ file with tag info that indicates
// pixel location in a photo, generate a string describing which
// pandas are in the photo
Pandas.groupMediaCaption = function(entity, photo_index) {
  var tag_index = photo_index + ".tags";
  var pandaTags = entity["panda.tags"].replace(/ /g, "").split(",");
  var output_string = Pandas.def.animal[L.display + ".name"];
  var animals = [];
  for (let id of pandaTags) {
    // Must be a numeric non-negative panda ID
    var panda = Pandas.searchPandaId(id)[0];
    var [x, y] = entity[tag_index + "." + id + ".location"].replace(/ /g, "").split(",");
    var info = {
      "name": panda[L.display + ".name"],
      "x": parseInt(x),
      "y": parseInt(y)
    }
    animals.push(info);
  }
  // Sort animals list by x values. Chrome requires the return value to be 
  // one, zero, or minus one, to determine sorting.
  animals = animals.sort((a, b) => a['x'] > b['x'] ? 1: -1);
  // Read off their names into the output string and return
  if (animals.length > 0) {
    var connector = Language.L.messages["and"][L.display];
    if ((animals.length > 2) && (L.display == "en")) {
      connector = Language.L.messages["comma"][L.display];
      output_string = animals.map(x => x.name).join(connector);
      var last_animal = animals[animals.length-1];
      output_string = output_string.replace(connector + last_animal.name, 
                                            Language.L.messages["and"][L.display] + last_animal.name);
    } else {  
      output_string = animals.map(x => x.name).join(connector);
    }
  }
  return output_string;
}

// If both animals don't share parents, and neither animal's parents
// are in an undefined/unknown situation, they are half siblings
Pandas.halfSiblings = function(animal, sibling) {
  var animal_mom = Pandas.searchPandaMom(animal["_id"])[0];
  var animal_dad = Pandas.searchPandaDad(animal["_id"])[0];
  var sibling_mom = Pandas.searchPandaMom(sibling["_id"])[0];
  var sibling_dad = Pandas.searchPandaDad(sibling["_id"])[0];
  // If the sibling is older than one of your parents, they must be a half sibling.
  // If one of the parents is missing, do this as a heuristic to determine whether
  // someone is a half-sibling or not.
  var sibling_year = -1;
  if (sibling["birthday"] != Pandas.def.animal["birthday"]) {
    sibling_year = parseInt(Pandas.formatYear(sibling["birthday"], L.display));
  }
  var mymom_year = -2;
  if (animal_mom != undefined) {
    mymom_year = parseInt(Pandas.formatYear(animal_mom["birthday"], L.display));
  }
  var mydad_year = -2;
  if (animal_dad != undefined) {
    mydad_year = parseInt(Pandas.formatYear(animal_dad["birthday"], L.display));
  }
  if (((animal_mom == undefined) || (animal_dad == undefined) || 
       (sibling_mom == undefined) || (sibling_dad == undefined)) &&
      ((sibling_year <= mymom_year) || (sibling_year <= mydad_year))) {
    return true;
  }
  // Otherwise, return based on whether the parents match, and omit the half-sibling
  // marker if one of the moms or dads happens to not be defined.
  return (!((animal_mom == sibling_mom) && (animal_dad == sibling_dad)) &&
           ((animal_mom != undefined) && (animal_dad != undefined)) &&
           ((sibling_mom != undefined) && (sibling_dad != undefined)));
}

// Return the language order as an array
Pandas.language_order = function(entity) {
  var ordering = entity["language.order"];
  if (ordering == undefined) {
    return Language.L.default.order;
  } else {
    return ordering.replace(/ /g, "").split(',');
  }
}

// Returns a list of locations valid for a zoo animal.
Pandas.locationList = function(animal) {
  var locations = [];
  // Find the available photo indexes between one and ten
  var location_fields = Pandas.locationManifest(animal);
  // Return not just the chosen photo but the author and link as well
  for (let location_field in location_fields) {
    var [field_name, index] = location_field.split(".");
    var next_field = field_name + "." + (parseInt(index) + 1).toString();
    var end_date = undefined;
    if (animal[next_field] != undefined) {
      var [_, next_start] = animal[next_field].split(",").map(x => x.trim());
      end_date = next_start;
    } else {
      if (animal["death"] != undefined) {
        end_date = animal["death"];
      }
    }
    var [zoo_index, start_date]= animal[location_field].split(",").map(x => x.trim());
    // If there was a wild animal, fill in defaults for the dates
    if (zoo_index == 0) {
      start_date = Pandas.def.animal["birthday"];
      end_date = Pandas.def.animal["birthday"];
    }
    var location = {
          "zoo": zoo_index,
   "start_date": start_date,
     "end_date": end_date,
    }
    locations.push(location);
  }
  // If there were no location. fields, use the zoo field, birthday, and date of death.
  // If a wild animal, use a wild field instead of the zoo field
  if ((locations.length == 0) && (Pandas.myWild(animal, "wild") != undefined)) {
    locations = Pandas.locationWild(animal);
  }
  if ((locations.length == 0) && (Pandas.myZoo(animal, "zoo") != undefined)) {
    locations = Pandas.locationZoo(animal);
  }
  return locations;
}

// Return a list of location fields an animal has for historical zoo info
Pandas.locationManifest = function(animal) {
  // Find the available photo indexes between one and ten
  var locations = {};
  var location_fields = Pandas.locationGeneratorEntity;
  // Gets panda locations
  for (let field_name of location_fields(animal)) {
    locations[field_name] = Pandas.field(animal, field_name);
  }
  return locations;
}

// When a panda doesn't have a list of wild locations as location.X fields, use
// the wild field, birthday, and date of death to fill in the necessary details
Pandas.locationWild = function(animal) {
  var end_date = undefined;
  if (animal["death"] != undefined) {
    end_date = animal["death"];
  }
  var locations = [{
    "zoo": Pandas.myWild(animal, "wild"),
    "start_date": Pandas.def.date[L],
    "end_date": Pandas.def.date[L]
  }];
  return locations;
}

// When a panda doesn't have a list of zoo locations as location.X fields, use
// the zoo, birthday, and date of death to fill in the necessary details
Pandas.locationZoo = function(animal) {
  var end_date = undefined;
  if (animal["death"] != undefined) {
    end_date = animal["death"];
  }
  var locations = [{
    "zoo": Pandas.myZoo(animal, "zoo"),
    "start_date": animal["birthday"],
    "end_date": animal["death"]
  }];
  return locations;
}

// Given an animal and a chosen language, return details for a red panda.
Pandas.myName = function(animal, language) {
  var field = language + ".name";
  return animal[field] == undefined ? Pandas.def.animal[field] : animal[field];
}

// Given an animal and a field name, return wild location info.
// Though wild locations are stored in the text files related 
// to an animal, when moved into Dagoba they become edges to 
// "wild" nodes. Proper "fields" might be 'birthplace' or 'wild',
// but we cannot assume the birthplace of wild animals.
Pandas.myWild = function(animal, field) {
  var wild = G.v(animal['_id']).out(field).run();
  return wild == [] ? Pandas.def.wild : wild[0];
}

// Given an animal and a field name, return details about a zoo.
// Though zoos are stored in the text files related to an animal, 
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

// Find all available photos for a specific animal
Pandas.photoManifest = function(entity, mode="animal") {
  // Find the available photo indexes between one and ten
  var photos = {};
  var photo_fields = Pandas.photoGeneratorEntity;
  // Gets panda or zoo photos
  for (let field_name of photo_fields(entity)) {
    photos[field_name] = Pandas.field(entity, field_name, mode);
  }
  // Filter out any keys that have the default value for either
  // an animal or a zoo
  photos = Object.keys(photos).reduce(function(filtered, key) {
    if ((photos[key] != Pandas.def.animal[key]) && 
        (photos[key] != Pandas.def.zoo[key])) {
      filtered[key] = photos[key];
    }
    return filtered;
  }, {});
  return photos;
}

// Given an animal, choose a single photo to display as its profile photo.
Pandas.profilePhoto = function(animal, index, mode="animal") {
  // Find the available photo indexes
  var photos = Pandas.photoManifest(animal, mode);
  // If photo.(index) not in the photos dict, choose one of the available keys
  // at random from the set of remaining valid images.
  var choice = "photo." + index.toString(); 
  if (photos[choice] == undefined) {
    var space = Object.keys(photos).length;
    var index = Math.floor(Math.random() * space);
    choice = Object.keys(photos)[index];
  }
  // If there were still no valid photos, because the panda has no photos
  // listed, return the default for one. Cannot check if == {} because
  // Javascript is ridiculous
  if (Object.keys(photos).length === 0) {
    choice = "photo.1";
    photos[choice] = Pandas.field(animal, choice, mode);
  }
  // Return not just the chosen photo but the author and link as well
  var desired = {
        "id": animal["_id"],
     "photo": photos[choice],
    "credit": animal[choice + ".author"],
     "index": choice.replace("photo.", ""),
      "link": animal[choice + ".link"]
  }
  return desired;
}

// Given an animal species id, return the full species name
Pandas.species = function(animal, language) {
  // 0th value in Pandas.def.species is fulgens
  // 1th vlue in Pandas.def.species is styani
  // The panda files list the species as a number that is off by one from this
  if (animal["species"] == undefined) {
    return Pandas.def.unknown[language];
  }
  var idx = parseInt(animal["species"]) - 1;
  return Pandas.def.species[language][idx];
}

// Given a wild location found with Pandas.location, return the wild location name.
Pandas.wildName = function(wild, language) {
  var field = language + ".name";
  return wild[field] == undefined ? Pandas.def.wild[field] : wild[field];
}

// Given a wild location found with Pandas.location(), return an arbitrary field.
// Useful for anything that's just a URI, like videos or photos.
Pandas.wildField = function(wild, field) {
  return wild[field] == undefined ? Pandas.def.wild[field] : wild[field];
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

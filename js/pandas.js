/*
    Logic for a Red Panda database search form.
    Built with love and Dagoba.js :)  
*/

/*
    Object for storing and searching the redpanda.json graph database
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
  },
  "np": {
    "year": "बर्ष",
    "years": "बर्ष",
    "month": "महिना",
    "months": "महिना",
    "day": "दिन",
    "days": "दिनहरु"
  }
}

Pandas.def.animal = {
  "_id": "0",
  "birthday": "1970/1/1",
  "birthplace": "0",
  "children": "0",
  "cn.name": "TOWRITE",
  "cn.nicknames": "TOWRITE",
  "cn.othernames": "TOWRITE",
  "death": "1970/1/1",
  "en.name": "Panda Not Found",
  "en.nicknames": "No Nicknames Recorded",
  "en.othernames": "No Alternate Names Recorded",
  "gender": "Unknown",
  "jp.name": "パンダが見つかりませんでした",
  "jp.nicknames": "ニックネームは記録されていません",
  "jp.othernames": "代わりのスペルは記録されていません",
  "litter": "0",
  "np.name": "निगल्या पोनिया फेला परेन",
  "np.nicknames": "उपनामहरू फेला परेन",
  "np.othernames": "अरु नामहरु फेला परेन",
  "photo.1": "images/no-panda-portrait.jpg",
  "species": "-1",
  "video.1": "images/no-panda-portrait.jpg",
  "zoo": "0"
}

Pandas.def.date = {
  "cn": "YYYY-MM-DD",
  "en": "MM/DD/YYYY",
  "jp": "YYYY年MM月DD日",
  "np": "YYYY-MM-DD",
  "earliest_year": "1970"
}

Pandas.def.date_season = {
  "cn": "SEASON YYYY",
  "en": "SEASON YYYY",
  "jp": "SEASON YYYY",
  "np": "SEASON YYYY",
  "earliest_year": "1970"
}

Pandas.def.gender = {
  "Female": {
    "cn": "女",
    "en": "female",
    "jp": "メス",
    "np": "महिला"
  },
  "Male": {
    "cn": "男",
    "en": "male",
    "jp": "オス",
    "np": "नर"
  }
}

// Used for missing mothers and fathers, where capitalization is needed
Pandas.def.no_name = {
  "cn": "不明",
  "en": "Unknown",
  "jp": "未詳",
  "np": "अज्ञात"
}

// Missing or undescribed authors
Pandas.def.authors = {
  "anonymous": {
    "cn": "匿名",
    "en": "anonymous",
    "jp": "匿名",
    "np": "बेनामी" 
  },
  "uncredited": {
    "cn": "沒有信用",
    "en": "uncredited",
    "jp": "信用されていない",
    "np": "अप्रत्याशित"
  }
}

// Used for determining what languages are selectable. Don't add new languages
// to this set until we're ready with panda data in that language. We look for
// ISO-639-1 codes in the navigator.languages value, and map it to a language
// definition used within this project's code. The ordering here determines the
// appearance of the buttons in the language menu.
Pandas.def.languages = {
  "en": "en",
  "ja": "jp",
  "zh": "cn",
  "ne": "np"
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
  ],
  "np": [
    /[\u0900-\u0954]/    // Devanghari unicode range
  ]
}

// Used for slip-ins in Panda dossiers for brothers/sisters/moms
Pandas.def.relations = {
  "aunt": {
    "cn": "姑媽",
    "en": "aunt",
    "jp": "叔母",
    "np": "काकी"
  },
  "brother": {
    "cn": "兄",
    "en": "brother",
    "jp": "兄",
    "np": "भाई"
  },
  "children": {
    "cn": "孩子",
    "en": "children",
    "jp": "子供",
    "np": "बच्चाहरु"
  },
  "cousin": {
    "cn": "表姐",
    "en": "cousin",
    "jp": "いとこ",
    "np": "भान्जा"
  },
  "father": {
    "cn": "父",
    "en": "father",
    "jp": "父",
    "np": "बुबा"
  },
  "grandfather": {
    "cn": "祖父",
    "en": "grandfather",
    "jp": "おじいちゃん",
    "np": "हजुरबुबा"
  },
  "grandmother": {
    "cn": "祖母",
    "en": "grandmother",
    "jp": "おばあちゃん",
    "np": "हजुरआमा"
  },
  "litter": {
    "cn": "轿子",
    "en": "litter",
    "jp": "双子",   /* "同腹仔" */
    "np": "रोटी"
  },
  "mother": {
    "cn": "母",
    "en": "mother",
    "jp": "母",
    "np": "आमा"
  },
  "nephew": {
    "cn": "外甥",
    "en": "nephew",
    "jp": "甥",
    "np": "भतिजा"
  },
  "niece": {
    "cn": "侄女",
    "en": "niece",
    "jp": "姪",
    "np": "भान्जी" 
  },
  "parents": {
    "cn": "父母",
    "en": "parents",
    "jp": "両親",
    "np": "अभिभावक"
  },
  "sister": {
    "cn": "妹妹",
    "en": "sister",
    "jp": "姉",
    "np": "बहिनी"
  },
  "siblings": {
    "cn": "兄弟姐妹",
    "en": "siblings",
    "jp": "兄弟",
    "np": "भाइबहिनीहरू"
  },
  "uncle": {
    "cn": "叔叔",
    "en": "uncle",
    "jp": "叔父",
    "np": "काका"
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
  ],
  "np": [
    "Ailurus fulgens fulgens",
    "Ailurus fulgens styani",
    "Ailurus fulgens"
  ]
}

Pandas.def.unknown = {
  "cn": "不明",
  "en": "unknown",
  "jp": "未詳",
  "np": "अज्ञात"
}

// Slightly different default zoo listing, to account for wild-born animals
Pandas.def.wild = {
  "_id": "wild.0",
  "cn.address": "TOWRITE",
  "cn.location": "TOWRITE",
  "cn.name": "TOWRITE",
  "en.address": "Captured or Rescued Wild Animal",
  "en.location": "No City, District, or State Info Listed",
  "en.name": "Zoo Not Found",
  "jp.address": "TOWRITE",
  "jp.location": "市区町村の情報が表示されていない",
  "jp.name": "動物園が見つかりません",
  "np.address": "जंगली जनावर कब्जा वा बचाव",
  "np.location": "कुनै स्थान जानकारी छैन",
  "np.name": "चिडियाखाना फेला परेन",
  "photo.1": "images/no-zoo.jpg",
  "video.1": "images/no-zoo.jpg",
  "website": "https://www.worldwildlife.org/"
}

Pandas.def.zoo = {
  "_id": "0",
  "closed": "1970/1/1",
  "cn.address": "TOWRITE",
  "cn.location": "TOWRITE",
  "cn.name": "TOWRITE",
  "en.address": "No Google Maps Address Recorded",
  "en.location": "No City, District, or State Info Listed",
  "en.name": "Zoo Not Found",
  "jp.address": "Googleマップのアドレスが記録されていません",
  "jp.location": "市区町村の情報が表示されていない",
  "jp.name": "動物園が見つかりません",
  "np.address": "कुनै ठेगाना सूचीबद्ध छैन",
  "np.location": "कुनै स्थान जानकारी छैन",
  "np.name": "चिडियाखाना फेला परेन",
  "photo.1": "images/no-zoo.jpg",
  "video.1": "images/no-zoo.jpg",
  "website": "https://www.worldwildlife.org/"
}

/*
    Utility functions and generators for doing panda processing
*/
Pandas.arrayContentsEqual = function(a, b) {
  // Sort the input arrays so we get consistent comparisons
  var arr1 = a.sort();
  var arr2 = b.sort();
  // Check if the arrays are the same length
	if (arr1.length !== arr2.length) return false;
	// Check if all items exist and are in the same order
	for (var i = 0; i < arr1.length; i++) {
		if (arr1[i] !== arr2[i]) return false;
	}
	// Otherwise, return true
	return true;
}

// Valid panda IDs are numeric and non-zero
Pandas.checkId = function(input) {
  return (isFinite(input) && input != Pandas.def.animal['_id']);
}

// Filter for distinct animals
Pandas.distinct = function(list) {
  var unique = (value, index, self) => {
    return self.indexOf(value) === index;
  }
  return list.filter(unique);
}

// Remove elements from the second list from the first
Pandas.removeElements = function(list, removals) {
  return list.filter(function(item) {
    if (removals.indexOf(item) > -1) {
      return false;
    } else {
      return true;
    }
  });
}

// Remove elements from the second list from the first, as long as 
// some dictionary item matches (typically the animal or zoo id)
Pandas.removeElementsWithMatchingField = function(list, removals, field) {
  var removals_field = removals.map(x => x[field]);
  return list.filter(function(item) {
    if (removals_field.indexOf(item[field]) > -1) {
      return false;
    } else {
      return true;
    }
  });
}

// Generates a valid index to a link for a link entity, up to the
// point that said entity doesn't have a defined link in its data.
Pandas.linkGeneratorEntity = function*(entity, index=0) {
  if (entity == undefined) {
    return;
  }
  while (index < index + 1) {
    index++;
    if (entity["link." + index] == undefined) {
      return;
    }
    yield "link." + index;
  }
}

// Generates a valid index to a location for a panda entity, up to the
// point that said entity doesn't have a defined historical location in its data
Pandas.locationGeneratorEntity = function*(entity, index=0) {
  if (entity == undefined) {
    return;
  }
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
  if (entity == undefined) {
    return;
  }
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

// If given no argument, return a random number. Otherwise
// return a repeatable random value.
Pandas.prngValue = function(input, count) {
  let seed = undefined;
  if (input == undefined) {
    // If no inputs given, we want a truly random value
    return Math.random();
  } 
  if (count == undefined) {
    count = 1;
  }
  // Otherwise, take a chain of random values
  var next_input = input;
  for (let i = 0; i <= count; i++) {
    seed = Pandas.seededPrng(next_input);
    // Since good inputs to prng should be integers, convert to integer
    next_input = parseInt(seed.toString().split(".")[1])
  }
  return seed;
}

// Seeded PRNG for the random choice function
Pandas.seededPrng = function(input) {
  return Pandas.seededPrngInner(Pandas.prngHash(input))();
}

// Mulberry32 seeded PRNG for the random choice function.
// Call using Pandas.seededPrng(seed)();
Pandas.seededPrngInner = s=>t=>
(s=s+1831565813|0,t=Math.imul(s^s>>>15,1|s),t=t+Math.imul(t^t>>>7,61|t)^t,
(t^t>>>14)>>>0)/2**32;

// Burtleburtle hash that uniformly distributes bits in integer inputs
Pandas.prngHash = n=>
(n=61^n^n>>>16,n+=n<<3,n=Math.imul(n,668265261),n^=n>>>15)>>>0;

// Get random items from the array, trying our best not to 
// select the same item more than once.
Pandas.randomChoice = function(array, count) {
  return Pandas.randomChoiceSeed(array, undefined, count);
}

// Do random choices given an input seed. 
// If seed_input is undefined, choose a random seed instead.
Pandas.randomChoiceSeed = function(array, seed_input, count) {
  let seed = undefined;
  var seen = {};
  // If you want just all the array items, return a shuffle instead
  if (count >= array.length) {
    return Pandas.shuffleWithSeed(array, seed_input);
  }
  var n = count;
  for (let i = 1; i <= n; i++) {
    seed = Pandas.prngValue(seed_input, i);
    var random = Math.floor(seed * array.length);
    if (random in seen) {
      n = n + 1;   // Don't choose duplicate array indexes
    } else {
      seen[random] = array[random];
    }
  }
  return Object.values(seen);
}

// Shuffle an array randomly
Pandas.shuffle = function(array) {
  return Pandas.shuffleWithSeed(array, undefined);
}

// Shuffle an array with a seed
Pandas.shuffleWithSeed = function(array, seed_input) {
  // Get a chosen-random value, or a truly random one 
  // if seed_input is undefined
  let seed = Pandas.prngValue(seed_input, 1);
  for (let i = array.length - 1; i > 0; i--) {
    var j = Math.floor(seed * (i + 1));
    var temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
  return array;
}

// Enforce uniqueness on members of array-dicts, based on a field.
// Force a shuffle before choosing unique values, to add variety
// when displaying unique values
Pandas.unique = function(array, field) {
  array = Pandas.shuffle(array);
  var seen = {};
  for (let i = 0; i < array.length; i++) {
    value = array[i][field];
    if (value in seen) {
      array.splice(i, 1);
      i--;
    } else {
      seen[value] = true;
    }
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

// Find all pandas that died within a calendar year.
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

// Find all links stored in a single panda database [links] file
Pandas.searchLinks = function(idstr) {
  var nodes = G.v().filter(function(vertex) {
    return (vertex["_id"] == "links." + idstr);
  }).run();
  // Instead of returning the nodes, return a dictionary 
  // corresponding to all the links in that file.
  return nodes[0];
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

// Replaced searchOldnames and searchOthernames with a more generic function,
// that can eventually support hiragana/katakana swapping.
Pandas.searchPandaNameFields = function(input, name_fields=undefined) {
  var inputs = [];
  // If the name is English, capitalize every space-separated name.
  if (Language.testString(input, "Latin") == true) {
    input = Language.capitalNames(input);
  }
  // If the name is Hiragana or Katakana, search for animals with the other name.
  if (Language.testString(input, "Hiragana") == true) {
    inputs.push(Language.hiraganaToKatakana(input));
  }
  if (Language.testString(input, "Katakana") == true) {
    inputs.push(Language.katakanaToHiragana(input));
  }
  // Guarantee that we at least have the original input string
  inputs.unshift(input);
  // Choose which name fields to search against
  if (name_fields == undefined) {
    // Default searches for one of a Panda's possible names.
    // Add "nicknames" if you want to search for that too.
    name_fields = ["name", "oldnames", "othernames"];
  }
  var nodes = G.v().filter(function(animal) {
    var languages = Object.values(Pandas.def.languages);
    // Valid per-language name fields
    var collected_fields = [];
    for (let name_field of name_fields) {
      collected_fields = collected_fields.concat(
        languages.map(function(l) {
          return l + "." + name_field;
        })
      );
    }
    for (let field of collected_fields) {
      if (animal[field] != undefined) {
        name_list = animal[field].split(',').map(x => x.trim());
        for (let wanted of inputs) {
          if (name_list.indexOf(wanted) != -1) {
            return animal;
          }
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

// Find any panda entry with photos
Pandas.searchPandaAnyPhoto = function() {
  var nodes = G.v().filter(function(vertex) {
    return ((vertex["photo.1"] != undefined) && 
            (vertex["gender"] != undefined))
  }).run();
  return nodes;
}

// Find any panda or media entry with photos
Pandas.searchPandaAnyPhotoMedia = function() {
  var nodes = G.v().filter(function(vertex) {
    return ((vertex["photo.1"] != undefined) && 
            (vertex["website"] == undefined))
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

// Find instances of a panda's ID in both the animal vertices
// and in the media (group) photos. Optionally, only return
// group information for animals.
Pandas.searchPandaMedia = function(query, only_media=false) {
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
  if (only_media == true) {
    return media;
  } else {
    return animals.concat(media);
  }
}

// Find instances of panda media photos for a list of animals.
// Only return entities that contain all of the animals
// in the input list.
Pandas.searchPandaMediaIntersect = function(id_list) {
  // Search for graph nodes that have "panda.tags" values
  // that match the ids of any animal in the original 
  // searchPanda list.
  var nodes = G.v().filter(function(vertex) {
    if (Object.keys(vertex).indexOf("panda.tags") != -1) {
      var panda_tags = vertex["panda.tags"].split(",")
                         .map(x => x.trim());
      return Pandas.arrayContentsEqual(id_list, panda_tags);
    }
  }).run();
  return nodes; 
}

// Find a panda's mother
Pandas.searchPandaMom = function(idnum) {
  var nodes = G.v(idnum).in("family").filter(function(vertex) {
    return vertex.gender == "Female";
  }).run();
  return nodes;
}

// Find a panda by any name field.
Pandas.searchPandaName = function(name) {
  var nodes = Pandas.searchPandaNameFields(name);
  var nodes = nodes.filter(function(value, index, self) { 
    return self.indexOf(value) === index;  // Am I the first value in the array?
  });
  return Pandas.sortYoungestToOldest(nodes);
}

// Given a panda, search for photos searched with ALL of a list of tags.
// Returns photo info only.
Pandas.searchPandaPhotoTagsIntersect = function(animal, tags) {
  var photo_fields = Pandas.photoGeneratorMax;
  var output = [];
  for (let field_name of photo_fields()) {
    if (animal[field_name] == undefined) {
      break;
    }
    let photo_author = field_name + ".author";
    let photo_link = field_name + ".link";
    let photo_tags = field_name + ".tags";
    let photo_index = field_name.split(".")[1];
    if (animal[photo_tags] == undefined) {
      continue;
    }
    var photo_tag_list = animal[photo_tags].split(",").map(x => x.trim());
    // Is the search tag list a subset of the photo_tag_list
    var contains = !(tags.some(val => photo_tag_list.indexOf(val) === -1));
    if (contains == true) {
      var bundle = {
        "id": animal["_id"],
        "photo": animal[field_name],
        "photo.author": animal[photo_author],
        "photo.index": photo_index,
        "photo.link": animal[photo_link],
        "photo.tags": tags   // Not the original tags, but the ones searched for
      }
      output.push(bundle);
    }
  }
  return output;
}

// Given a panda, search for photos tagged with any of a list of tags.
// May return photo info only, or the entire animal
// TODO: usable for zoo entities too, fix
Pandas.searchPandaPhotoTagsUnion = function(animal, tags, mode) {
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

// Find all pandas born (and living) at a given zoo. 
// For interleaving with other results, make a date object from 
// their birthday for the sort_time
Pandas.searchPandaZooBorn = function(idnum, months=6) {
  var born = G.v(idnum).in("birthplace").filter(function(vertex) {
    return vertex.death == undefined;   // Gotta be alive
  }).filter(function(vertex) {
    // Compare all panda birthdays node dates with current time.
    var current_time = new Date();
    var birth_time = new Date(vertex["birthday"]);
    var ms_per_month = 1000 * 60 * 60 * 24 * 31;
    var ms_in_period = months * ms_per_month;
    if (ms_in_period == 0) {
      // Get all born if months == 0
      vertex["sort_time"] = birth_time; 
      return vertex;
    }
    if (current_time - birth_time < ms_in_period) {
      vertex["sort_time"] = birth_time;
      // Info about why this animal appeared in results
      vertex["search_context"] = {
        "query": "born",
        "at": idnum
      }
      return vertex;
    } else {
      return false;
    }
  }).run();
  return born;
}

// Find all pandas that were either born at, or lived at a given zoo
Pandas.searchPandaZooBornLived = function(idnum, search_context=false) {
  if (idnum > 0) {
    idnum = idnum * -1;
  }
  var compare_id = idnum * -1;
  var lives = G.v(idnum).in("zoo").run();
  var born = G.v(idnum).in("birthplace").run();
  var was_here = G.v().filter(function(vertex) {
    // Gets panda locations and finds zoo matches
    var location_fields = Pandas.locationGeneratorEntity;
    for (let field_name of location_fields(vertex)) {
      var location = Pandas.field(vertex, field_name);
      var zoo_id = location.split(", ")[0];
      // Matching zoo values will be positive ids in location fields
      if (zoo_id == compare_id) {
        return vertex;
      }
    }
    return false;
  }).run();
  var nodes = lives.concat(born).concat(was_here).filter(function(value, index, self) { 
    return self.indexOf(value) === index;  // Am I the first value in the array?
  });
  if (search_context == true) {
    // Inject valid date ranges for this animal at the given zoo
    nodes = nodes.filter(function(vertex) {
      var location_fields = Pandas.locationGeneratorEntity;
      var date_ranges = [];
      var current_range = undefined;
      for (let field_name of location_fields(vertex)) {
        var location = Pandas.field(vertex, field_name);
        [zoo_id, date] = location.split(", ");
        // Matching zoo values will be positive ids in location fields
        if (zoo_id == compare_id) {
          current_range = [date];
        } else if (current_range != undefined) {
          current_range.push(date);
          date_ranges.push(current_range);
          current_range = undefined;
        }
      }
      // Catch a range going on until today
      if (current_range != undefined) {
        date_ranges.push(current_range);
      }
      // Sort by first arrival time in the list
      if (date_ranges.length == 0) {
        vertex["sort_time"] = new Date(vertex.birthday);
      } else {
        vertex["sort_time"] = new Date(date_ranges[0][0]);
      }
      vertex["search_context"] = {
        "query": "born_or_lived",
        "ranges": date_ranges,
        "at": idnum
      }
      return vertex;
    });
  }
  nodes = Pandas.sortByDate(nodes, "sort_time", "ascending");
  return nodes;
}

// Find all pandas born at a given zoo any time.
// Set search_context to true if you want the results to add a "born" zoo listing
Pandas.searchPandaZooBornRecords = function(idnum, search_context=false) {
  if (idnum > 0) {
    idnum = idnum * -1;   // HACK: zoo records
  }
  var nodes = G.v(idnum).in("birthplace").filter(function(vertex) {
    if (search_context == true) {
      vertex["search_context"] = {
        "query": "born_at",
        "at": idnum
      }
    }
    return vertex;
  }).run();
  // HACK: good enough for year sorting
  nodes = Pandas.sortByName(nodes, "birthday").reverse();
  return nodes;
}

// Find all pandas at a given zoo that are alive, and arrived recently
Pandas.searchPandaZooArrived = function(idnum, months=6) {
  var compare_id = idnum * -1;
  var nodes = G.v(idnum).in("zoo").filter(function(vertex) {
    return vertex.death == undefined;   // Gotta be alive
  }).filter(function(vertex) {
    // If their arrival date was within six months, keep in the list
    var location_fields = Pandas.locationGeneratorEntity;
    var last_location = null;
    for (let field_name of location_fields(vertex)) {
      var location = Pandas.field(vertex, field_name);
      [zoo_id, move_date] = location.split(", ");
      if (zoo_id != compare_id) {
        last_location = zoo_id;
        continue;   // Ignore location values not at this zoo
      }
      // Compare all zoo node dates with current time.
      var current_time = new Date();
      var move_time = new Date(move_date);
      var ms_per_month = 1000 * 60 * 60 * 24 * 31;
      var ms_in_period = months * ms_per_month;
      if (ms_in_period == 0) {
        // Get all arrived if months == 0
        vertex["sort_time"] = move_time;
        // Info about why this animal appeared in results
        vertex["search_context"] = {
          "query": "arrived",
          "from": parseInt(last_location) * -1,
          "move_date": move_date
        }
        return vertex;
      }
      if (current_time - move_time < ms_in_period) {
        vertex["sort_time"] = move_time;
        // Info about why this animal appeared in results
        vertex["search_context"] = {
          "query": "arrived",
          "from": parseInt(last_location) * -1,
          "move_date": move_date
        }
        return vertex;   // Less than N months?
      }
      last_location = zoo_id;
    }
  }).run();
  nodes = Pandas.sortByDate(nodes, "sort_time", "descending");
  // TODO: iterating backwards on location fields would fix
  // if there was a quick back-and-forth travel
  return nodes;
}

// Find all pandas at a given zoo that are still alive
Pandas.searchPandaZooCurrent = function(idnum) {
  var nodes = G.v(idnum).in("zoo").filter(function(vertex) {
    return vertex.death == undefined;
  }).run();
  return nodes;
}

// Find all pandas that left a zoo in the last six months
// Use the location tag
Pandas.searchPandaZooDeparted = function(idnum, months=6) {
  var compare_id = idnum * -1;
  var nodes = [];
  var nodes = G.v().filter(function(vertex) {
    // Departed animals aren't at the desired zoo currently
    return vertex["zoo"] != idnum;
  }).filter(function(vertex) {
    // Gets panda locations. We want the date of the next zoo
    // the animal was based at. If that date is less than 6 months 
    // ago, return in list.
    var at_zoo_previously = false;
    var zoo_post_move = '';
    var location_fields = Pandas.locationGeneratorEntity;
    for (let field_name of location_fields(vertex)) {
      var location = Pandas.field(vertex, field_name);
      [zoo_id, move_date] = location.split(", ");
      if (zoo_id != compare_id && at_zoo_previously == false) {
        continue;
      }
      if (zoo_id == compare_id) {
        at_zoo_previously = true;
        continue;
      } else {
        zoo_post_move = move_date;
      }
      // Compare all zoo node dates with current time.
      var current_time = new Date();
      var move_time = new Date(zoo_post_move);
      var ms_per_month = 1000 * 60 * 60 * 24 * 31;
      var ms_in_period = months * ms_per_month;
      if (ms_in_period == 0) {
        // Get all departed if months == 0
        vertex["sort_time"] = move_time; 
        // Info about why this animal appeared in results
        vertex["search_context"] = {
          "query": "departed",
          "to": parseInt(zoo_id) * -1,
          "move_date": move_date
        }
        return vertex;
      }
      if (current_time - move_time < ms_in_period) {
        vertex["sort_time"] = move_time;
        // Info about why this animal appeared in results
        vertex["search_context"] = {
          "query": "departed",
          "to": parseInt(zoo_id) * -1,
          "move_date": move_date
        }
        return vertex;   // Less than N months?
      } else {
        // This move didn't happen recently. Start the move
        // calculations from scratch again, continuing through
        // the list of animal locations
        at_zoo_previously = false;
        zoo_post_move = '';
      }
    }
  }).run();
  nodes = Pandas.sortByDate(nodes, "sort_time", "descending");
  // TODO: does this logic work with multiple arrival/returns?
  return nodes;
}

Pandas.searchPandaZooDied = function(idnum, months=6) {
  if (idnum > 0) {
    idnum = idnum * -1;   // HACK: zoo records
  }
  var nodes = G.v(idnum).in("zoo").filter(function(vertex) {
    return vertex.death != undefined;   // Gotta be dead
  }).filter(function(vertex) {
    // Compare all panda anniversary dates with current time.
    var current_time = new Date();
    var anniversary = new Date(vertex["death"]);
    var ms_per_month = 1000 * 60 * 60 * 24 * 31;
    var ms_in_period = months * ms_per_month;
    if (ms_in_period == 0) {
      // Get all died if months == 0
      vertex["sort_time"] = anniversary;
      // Info about why this animal appeared in results
      vertex["search_context"] = {
        "query": "died"
      }
      return vertex;
    }
    if (current_time - anniversary < ms_in_period) {
      vertex["sort_time"] = anniversary;
      // Info about why this animal appeared in results
      vertex["search_context"] = {
        "query": "died"
      }
      return vertex;
    } else {
      return false;
    }
  }).run();
  nodes = Pandas.sortByDate(nodes, "sort_time", "descending");
  return nodes;
}

// Find all nodes with a particular photo credit.
// Optionally, filter by a list of panda ids.
Pandas.searchPhotoCredit = function(author, filter_ids=[]) {
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
  return nodes.filter(function(value, index, self) {
    // Return any unique nodes that matched one of these searches
    return self.indexOf(value) === index;
  }).filter(function(value, index, self) {
    // Filter by desired panda ids
    if (filter_ids.length == 0) {
      return true;
    } else {
      return filter_ids.indexOf(value["_id"]) != -1;
    }
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
    var set = [];
    if (mode == "photos" || mode == "union" || mode == "singleton") {
      set = Pandas.searchPandaPhotoTagsUnion(animal, tags, mode);
    }
    if (mode == "intersect") {
      set = Pandas.searchPandaPhotoTagsIntersect(animal, tags);
    }
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
  if (Language.testString(zoo_name_str, "Latin") == true) {
    zoo_name_str = Language.capitalNames(zoo_name_str);
  }
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
// Sort Japanese panda names by determining the hiragana-equivalent name
// for each animal in the dataset.
Pandas.sortByNameJapanese = function(nodes) {
  var hiragana_generate = function(name) {
    var hiragana = Pandas.def.ranges['jp'][1];   // Hiragana range regex
    var katakana = Pandas.def.ranges['jp'][2];   // Katakana range regex
    if (hiragana.test(name) == true) {
      return name;
    }
    if (katakana.test(name) == true) {
      return Language.katakanaToHiragana(name);
    }
  }

  var build_name_list = function(node, name_field, othername_field) {
    var name_list = [];
    if (name_field in node) {
      name_list = name_list.concat(node[name_field]);
    }
    if (othername_field in node) {
      name_list = name_list.concat(node[othername_field].split(", "));
    }
    return name_list;
  }

  var name_field = "jp.name";
  var othername_field = "jp.othernames";
  var sort_name = "jp.sortname";

  var connector = Language.L.messages["and"][L.display]
  nodes = nodes.map(function(node) {
    // Determine which panda is first in the photo, and sort by
    // its hiragana name in the "othernames" list if necessary
    if (node["_id"].indexOf("media.") == 0) {
      var panda_ids = node["panda.tags"].split(", ");
      var animals = panda_ids.map(function(id) {
        var panda = Pandas.searchPandaId(id)[0];
        return panda;
      })
      // Sort only by the first name in the photo
      var first_group_name = node[name_field].split(connector)[0];
      var animal = animals.filter(animal => animal[name_field] == first_group_name)[0];
      var name_list = build_name_list(animal, name_field, othername_field);
      node[sort_name] = name_list.map(function(name) {
        return hiragana_generate(name);
      }).filter(name => name != undefined)[0];
    } else {
      // Sort by the first hiragana name, from the "othernames"
      // list if necessary. Find the first hiragana or katakana string.
      var name_list = build_name_list(node, name_field, othername_field);
      node[sort_name] = name_list.map(function(name) {
        return hiragana_generate(name);
      }).filter(name => name != undefined)[0];
    }
    return node;
  });
  return Pandas.sortByName(nodes, sort_name);
}

// Sort a list of pandas by their desired "Lang.name" field.
// Works for non-group entities (pandas and zoos).
Pandas.sortByName = function(nodes, name_field) {
  return nodes.sort(function(a, b) {
    if (a[name_field] > b[name_field]) {
      return 1;
    } else if (a[name_field] < b[name_field]) {
      return -1;
    } else {
      return 0;
    }
  });
}

// Sort a list of pandas including groups. This must include the list of
// specific photos you're pulling out of the group file, because the group
// name is based on the arrangement of pandas in the photo.
Pandas.sortByNameWithGroups = function(nodes, photo_list, name_field) {
  nodes = nodes.map(function(node) {
    if (node["_id"].indexOf("media.") == 0) {
      // Media file. Get the group caption based on your desired photo in the list
      desired_index = photo_list.filter(photo => 
        photo.photo == node["photo." + photo.index])[0].index;
      node[name_field] = Pandas.groupMediaCaption(node, "photo." + desired_index);
    }
    return node;
  });
  if (L.display == "jp") {
    return Pandas.sortByNameJapanese(nodes);
  } else {
    return Pandas.sortByName(nodes, name_field);
  }
}

Pandas.sortByDate = function(nodes, field_name, mode="descending") {
  // Pandas.sortByName lexicographic sort should work for numbers too,
  // but to get recent ordering, reverse the list
  if (mode == "descending") {
    return Pandas.sortByName(nodes, field_name).reverse();
  } else {
    return Pandas.sortByName(nodes, field_name);
  }
}

Pandas.sortPhotosByName = function(photo_list, name_field) {
  // photo lists don't have names. So rebuild the animals list and then
  // arrange the set of items based on the animal list.
  var animals = photo_list.map(photo => Pandas.searchPandaId(photo.id)[0]);
  animals = Pandas.sortByNameWithGroups(animals, photo_list, name_field);
  var output_list = animals.map(animal =>
    photo_list.filter(photo => photo.id == animal["_id"])[0]);
  return output_list;
}

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
  } else if (age_days <= 403) {
    // 403/31 == 13, lowest number that is still cleanly one year and less than one month
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

// Given an animal from a media/file with tag info that indicates
// pixel location in a photo, generate a string describing which
// pandas are in the photo.
Pandas.groupMediaCaption = function(entity, photo_index) {
  var tag_index = photo_index + ".tags";
  var pandaTags = entity["panda.tags"].replace(/ /g, "").split(",");
  var output_string = Pandas.def.animal[L.display + ".name"];
  var animals = [];
  for (let id of pandaTags) {
    // Must be a numeric non-negative panda ID
    var panda = Pandas.searchPandaId(id)[0];
    var [x, y] = entity[tag_index + "." + id + ".location"].replace(/ /g, "").split(",");
    var name = Language.fallback_name(panda);
    var info = {
      "name": name,
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
      var match = new RegExp(connector + last_animal.name + "$");
      var replace = Language.L.messages["and"][L.display] + last_animal.name;
      output_string = output_string.replace(match, replace);
    } else {  
      output_string = animals.map(x => x.name).join(connector);
    }
  }
  // Replace "baby, baby, baby" with group term
  if ((Parse.values(Language.L.polyglots["baby"]).indexOf(animals[0].name) != -1) &&
      (Pandas.unique(animals, "name").length == 1)) {
    output_string = Language.L.gui["babies"][L.display];
  }
  return output_string;
}

// If both animals don't share parents, and neither animal's parents
// are in an undefined/unknown situation, they are half siblings.
// Also, if a panda has multiple "possible" moms or dads, it's impossible
// to truly say whether you have a haf sibling or not.
Pandas.halfSiblings = function(animal, sibling) {
  // Indeterminate mom/dad check means your half sibling calculations
  // are impossible. You just can't know for sure.
  if (Pandas.indeterminateSiblings(animal["_id"], sibling["_id"]) == true) {
    return false;
  }
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
  // Conditions where you can defer half-sibling relationships based on whether
  // your siblings are older than either your mom or dad
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

// Check whether this animal's child has more than one parent of the same
// gender listed.
Pandas.indeterminateParent = function(parent_id, child_id) {
  var parent_gender = Pandas.searchPandaId(parent_id)[0].gender;
  if (parent_gender = "m") {
    return Pandas.searchPandaDad(child_id).length > 1;
  } else {
    return Pandas.searchPandaMom(child_id).length > 1;
  }
}

// If an animal has more than one possible parent, it can make it hard
// to determine parent or sibling relationships. 
Pandas.indeterminateSiblings = function(animal_id, sibling_id) {
  var animal_moms = Pandas.searchPandaMom(animal_id);
  var animal_dads = Pandas.searchPandaDad(animal_id);
  var sibling_moms = Pandas.searchPandaMom(sibling_id);
  var sibling_dads = Pandas.searchPandaDad(sibling_id);

  if ((animal_moms.length > 1) || (animal_dads.length > 1) ||
      (sibling_moms.length > 1) || (sibling_dads.length > 1)) {
    return true;
  }
  return false;
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

// Get a list of photos given a list of photo locators
Pandas.locatorsToPhotos = function(locators) {
  photos = [];
  for (let locator of locators) {
    photos.push(Pandas.locatorToPhoto(locator));
  }
  return photos;
}

// Locators are of the form "entity.EID.photo.PID". Resolve these into the
// corresponding animal photo.
Pandas.locatorToPhoto = function(locator) {
  var parts = locator.split(".");
  var photo_id = parts[parts.length - 1];
  // Given the entity type, convert to the proper media/panda/zoo
  var entity_type = parts[0];
  var entity_id = undefined;
  var entity = undefined;
  if (entity_type == "media") {
    entity_id = parts[0] + "." + parts[1] + "." + parts[2];
    entity = Pandas.searchPandaId(entity_id)[0];
  }
  else if (entity_type == "zoo") {
    entity_id = parseInt(parts[1] * -1).toString();
    entity = Pandas.searchZooId(entity_id)[0];
  }
  else {
    entity_id = parts[1];
    entity = Pandas.searchPandaId(entity_id)[0];
  }
  // Get the photo for this entity
  var choice = "photo." + photo_id;
  var desired = {
        "id": entity["_id"],
     "photo": entity[choice],
    "credit": entity[choice + ".author"],
     "index": photo_id,
      "link": entity[choice + ".link"],
      "type": entity_type
  }
  return desired;
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

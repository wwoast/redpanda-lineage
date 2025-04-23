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
  var db_url = "/export/redpanda.json";
 
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
  "en": {
    "year": "year",
    "years": "years",
    "month": "month",
    "months": "months",
    "day": "day",
    "days": "days"
  },
  "es": {
    "year": "año",
    "years": "años",
    "month": "mes",
    "months": "meses",
    "day": "día",
    "days": "días"
  },
  "ja": {
    "year": "歳",
    "years": "歳",
    "month": "月",
    "months": "月",
    "day": "日",
    "days": "日"
  },
  "ko": {
    "year": "세",
    "years": "세",
    "month": "개월",
    "months": "개월",
    "day": "일",
    "days": "일"
  },
  "ne": {
    "year": "बर्ष",
    "years": "बर्ष",
    "month": "महिना",
    "months": "महिना",
    "day": "दिन",
    "days": "दिनहरु"
  },
  "pt": {
    "year": "ano",
    "years": "anos",
    "month": "mês",
    "months": "meses",
    "day": "dia",
    "days": "dias"
  },
  "zh": {
    "year": "年",
    "years": "年",
    "month": "月",
    "months": "月",
    "day": "天",
    "days": "天"
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
  "es.name": "Panda no encontrado",
  "es.nicknames": "No se registraron apodos",
  "es.othernames": "No se registraron nombres alternativos",
  "gender": "Unknown",
  "ja.name": "パンダが見つかりませんでした",
  "ja.nicknames": "ニックネームは記録されていません",
  "ja.othernames": "代わりのスペルは記録されていません",
  "ko.name": "판다를 찾을 수 없습니다",
  "ko.nicknames": "등록된 별명이 없습니다",
  "ko.othernames": "등록된 다른 이름이 없습니다",
  "litter": "0",
  "ne.name": "निगल्या पोनिया फेला परेन",
  "ne.nicknames": "उपनामहरू फेला परेन",
  "ne.othernames": "अरु नामहरु फेला परेन",
  "photo.1": "images/no-panda-portrait.jpg",
  "pt.name": "Panda não encontrado",
  "pt.nicknames": "Nenhum apelido registrado",
  "pt.othernames": "Nenhum nome alternativo registrado",
  "species": "-1",
  "video.1": "images/no-panda-portrait.jpg",
  "zh.name": "TOWRITE",
  "zh.nicknames": "TOWRITE",
  "zh.othernames": "TOWRITE",
  "zoo": "0"
}

Pandas.def.date = {
  "earliest_year": "1970",
  "en": "MM/DD/YYYY",
  "es": "DD/MM/YYYY",
  "ja": "YYYY年MM月DD日",
  "ko": "YYYY년MM월DD일",
  "ne": "YYYY-MM-DD",
  "pt": "DD/MM/YYYY",
  "zh": "YYYY-MM-DD"
}

Pandas.def.date_season = {
  "earliest_year": "1970",
  "en": "SEASON YYYY",
  "es": "SEASON YYYY",
  "ja": "SEASON YYYY",
  "ko": "SEASON YYYY",
  "ne": "SEASON YYYY",
  "pt": "SEASON YYYY",
  "zh": "SEASON YYYY"
}

Pandas.def.gender = {
  "Female": {
    "en": "female",
    "es": "hembra",
    "ja": "メス",
    "ko": "여",
    "ne": "महिला",
    "pt": "fêmea",
    "zh": "女"
  },
  "Male": {
    "en": "male",
    "es": "macho",
    "ja": "オス",
    "ko": "남",
    "ne": "नर",
    "pt": "macho",
    "zh": "男"
  }
}

// Used for missing mothers and fathers, where capitalization is needed
Pandas.def.no_name = {
  "en": "Unknown",
  "es": "Desconocido",
  "ja": "未詳",
  "ko": "알 수 없음",
  "ne": "अज्ञात",
  "pt": "Desconhecido(a)",
  "zh": "不明"
}

// Missing or undescribed authors
Pandas.def.authors = {
  "anonymous": {
    "en": "anonymous",
    "es": "anónimo",
    "ja": "匿名",
    "ko": "익명",
    "ne": "बेनामी",
    "pt": "anônimo",
    "zh": "匿名"
  },
  "uncredited": {
    "en": "uncredited",
    "es": "sin acreditar",
    "ja": "信用されていない",
    "ko": "공로 미기재",
    "ne": "अप्रत्याशित",
    "pt": "não creditado",
    "zh": "沒有信用"
  }
}

// Used for determining what languages are selectable. Don't add new languages
// to this set until we're ready with panda data in that language. We look for
// ISO-639-1 codes in the navigator.languages value, and map it to a language
// definition used within this project's code. The ordering here determines the
// appearance of the buttons in the language menu.
Pandas.def.languages = [
  "en", "ja", "zh", "ne", "pt", "es", "ko"
]

// Character ranges
Pandas.def.ranges = {
  "en": [
    /[\u0020-\u007f]/,   // Basic Latin
    /[\u00a0-\u00ff]/,   // Latin-1 Supplement
    /[\u0100-\u017f]/,   // Latin Supplement A,
    /[\u0180-\u024f]/    // Latin Supplement B
  ],
  "ja": [
    /[\u3000-\u303f]/,   // Japanese punctuation
    /[\u3040-\u309f]/,   // Japanese hiragana
    /[\u30a0-\u30ff]/,   // Japanese katakana,
    /[\uff00-\uffef]/,   // Japanese full-width romanji and half-width katakana
    /[\u4e00-\u9faf]/    // CJK unified Kanji set
  ],
  "ko": [
    /[\uAC00-\uD7AF]/,  // Hangul Syllables (가-힣)
    /[\u1100-\u11FF]/,  // Hangul Jamo (초성, 중성, 종성)
    /[\u3130-\u318F]/,  // Hangul Compatibility Jamo
    /[\u3200-\u33FF]/,  // Korean symbols and punctuation
  ],
  "ne": [
    /[\u0900-\u0954]/    // Devanghari unicode range
  ]
}

// Used for slip-ins in Panda dossiers for brothers/sisters/moms
Pandas.def.relations = {
  "aunt": {
    "en": "aunt",
    "es": "tía",
    "ja": "叔母",
    "ko": "이모",
    "ne": "काकी",
    "pt": "tia",
    "zh": "姑媽"
  },
  "brother": {
    "en": "brother",
    "es": "hermano",
    "ja": "兄",
    "ko": "형제",
    "ne": "भाई",
    "pt": "irmão",
    "zh": "兄"
  },
  "children": {
    "en": "children",
    "es": "niños",
    "ja": "子供",
    "ko": "자녀",
    "ne": "बच्चाहरु",
    "pt": "filhos(as)",
    "zh": "孩子"
  },
  "cousin": {
    "en": "cousin",
    "es": "primo",
    "ja": "いとこ",
    "ko": "사촌",
    "ne": "भान्जा",
    "pt": "primo(a)",
    "zh": "表姐"
  },
  "father": {
    "en": "father",
    "es": "padre",
    "ja": "父",
    "ko": "아빠",
    "ne": "बुबा",
    "pt": "pai",
    "zh": "父"
  },
  "grandfather": {
    "en": "grandfather",
    "es": "abuelo",
    "ja": "おじいちゃん",
    "ko": "할아버지",
    "ne": "हजुरबुबा",
    "pt": "avô",
    "zh": "祖父"
  },
  "grandmother": {
    "en": "grandmother",
    "es": "abuela",
    "ja": "おばあちゃん",
    "ko": "할머니",
    "ne": "हजुरआमा",
    "pt": "avó",
    "zh": "祖母"
  },
  "litter": {
    "en": "litter",
    "es": "camada",
    "ja": "双子",   /* "同腹仔" */
    "ko": "쌍둥이",
    "ne": "रोटी",
    "pt": "ninhada",
    "zh": "轿子"
  },
  "mother": {
    "en": "mother",
    "es": "madre",
    "ja": "母",
    "ko": "엄마",
    "ne": "आमा",
    "pt": "mãe",
    "zh": "母"
  },
  "nephew": {
    "en": "nephew",
    "es": "sobrino",
    "ja": "甥",
    "ko": "조카(남)",
    "ne": "भतिजा",
    "pt": "sobrinho",
    "zh": "外甥"
  },
  "niece": {
    "en": "niece",
    "es": "sobrina",
    "ja": "姪",
    "ko": "조카(여)",
    "ne": "भान्जी",
    "pt": "sobrinha",
    "zh": "侄女"
  },
  "parents": {
    "en": "parents",
    "es": "padres",
    "ja": "両親",
    "ko": "부모",
    "ne": "अभिभावक",
    "pt": "pais",
    "zh": "父母"
  },
  "sister": {
    "en": "sister",
    "es": "hermana",
    "ja": "姉",
    "ko": "자매",
    "ne": "बहिनी",
    "pt": "irmã",
    "zh": "妹妹"
  },
  "siblings": {
    "en": "siblings",
    "es": "hermanos",
    "ja": "兄弟",
    "ko": "형제자매",
    "ne": "भाइबहिनीहरू",
    "pt": "irmãos(ãs)",
    "zh": "兄弟姐妹"
  },
  "uncle": {
    "en": "uncle",
    "es": "tío",
    "ja": "叔父",
    "ko": "삼촌",
    "ne": "काका",
    "pt": "tio",
    "zh": "叔叔"
  }
}

Pandas.def.species = {
  "en": [
    "Ailurus fulgens fulgens",
    "Ailurus fulgens styani",
    "Ailurus fulgens"
  ],
  "es": [
    "Ailurus fulgens fulgens",
    "Ailurus fulgens styani",
    "Ailurus fulgens"
  ],
  "ja": [
    "西レッサーパンダ",
    "シセンレッサーパンダ",
    "未詳レッサーパンダ"
  ],
  "ko": [
    "Ailurus fulgens fulgens",
    "Ailurus fulgens styani",
    "Ailurus fulgens"
  ],
  "ne": [
    "Ailurus fulgens fulgens",
    "Ailurus fulgens styani",
    "Ailurus fulgens"
  ],
  "pt": [
    "Ailurus fulgens fulgens",
    "Ailurus fulgens styani",
    "Ailurus fulgens"
  ],
  "zh": [
    "Ailurus fulgens fulgens",
    "Ailurus fulgens styani",
    "Ailurus fulgens"
  ]
}

Pandas.def.unknown = {
  "en": "unknown",
  "es": "desconocido",
  "ja": "未詳",
  "ko": "알 수 없음",
  "ne": "अज्ञात",
  "pt": "desconhecido",
  "zh": "不明"
}

// Slightly different default zoo listing, to account for wild-born animals
Pandas.def.wild = {
  "_id": "wild.0",
  "en.address": "Captured or Rescued Wild Animal",
  "en.location": "No City, District, or State Info Listed",
  "en.name": "Zoo Not Found",
  "es.address": "Animal Salvaje Capturado o Rescatado",
  "es.location": "No Se Incluye Información de Ciudad, Distrito o Estado",
  "es.name": "Zoo No Encontrado",
  "ja.address": "TOWRITE",
  "ja.location": "市区町村の情報が表示されていない",
  "ja.name": "動物園が見つかりません",
  "ko.address": "포획되거나 구조된 야생 동물",
  "ko.location": "도시, 지역 또는 주 정보가 없습니다",
  "ko.name": "동물원을 찾을 수 없습니다",
  "ne.address": "जंगली जनावर कब्जा वा बचाव",
  "ne.location": "कुनै स्थान जानकारी छैन",
  "ne.name": "चिडियाखाना फेला परेन",
  "photo.1": "images/no-zoo.jpg",
  "pt.address": "Animal selvagem capturado ou resgatado",
  "pt.location": "Nenhuma informação de cidade, distrito ou estado listada",
  "pt.name": "Zoológico não encontrado",
  "video.1": "images/no-zoo.jpg",
  "website": "https://www.worldwildlife.org/",
  "zh.address": "TOWRITE",
  "zh.location": "TOWRITE",
  "zh.name": "TOWRITE"
}

Pandas.def.zoo = {
  "_id": "0",
  "closed": "1970/1/1",
  "en.address": "No Google Maps Address Recorded",
  "en.location": "No City, District, or State Info Listed",
  "en.name": "Zoo Not Found",
  "es.address": "No Se Registró Ninguna Dirección de Google Maps",
  "es.location": "No Se Incluye Información de Ciudad, Distrito o Estado",
  "es.name": "Zoo No Encontrado",
  "ja.address": "Googleマップのアドレスが記録されていません",
  "ja.location": "市区町村の情報が表示されていない",
  "ja.name": "動物園が見つかりません",
  "ko.address": "Google 지도 주소가 기록되지 않았습니다",
  "ko.location": "도시, 지역 또는 주 정보가 없습니다",
  "ko.name": "동물원을 찾을 수 없습니다",
  "ne.address": "कुनै ठेगाना सूचीबद्ध छैन",
  "ne.location": "कुनै स्थान जानकारी छैन",
  "ne.name": "चिडियाखाना फेला परेन",
  "photo.1": "images/no-zoo.jpg",
  "pt.address": "Nenhum endereço do Google Maps registrado",
  "pt.location": "Nenhuma informação de cidade, distrito ou estado listada",
  "pt.name": "Zoológico não encontrado",
  "video.1": "images/no-zoo.jpg",
  "website": "https://www.worldwildlife.org/",
  "zh.address": "TOWRITE",
  "zh.location": "TOWRITE",
  "zh.name": "TOWRITE"

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

// Process author links that are intended to point at other sources, such as
// Instagram. The Instagram URLs will fall back to an author profile page if
// the link is private.
Pandas.authorLink = function(author, link) {
  if (!link) {
    return link;
  } else if (link.indexOf("ig://") == 0) {
    var ig_locator = link.split("/").at(-1)
    var inline_author = link.split("/").at(-2)
    if (!inline_author)
      return `https://www.instagram.com/${author}/p/${ig_locator}`;
    else
      return `https://www.instagram.com/${inline_author}/p/${ig_locator}`;
  } else {
    return link;
  }
}

// Valid panda IDs are numeric and non-zero
Pandas.checkId = function(input) {
  return (isFinite(input) && input != Pandas.def.animal['_id']);
}

// For wildcard date values, we do some date checks by
// converting Date objects to year-month-day dicts
Pandas.date_to_ymd = function(date) {
  return {
    "year": date.getFullYear(),
    "month": date.getMonth() + 1,
    "day": date.getDate()
  }
}

// Match a birthday against a date-ymd dict, allowing for if
// the check field (y m or d) is "any", match against the other
// values.
Pandas.date_ymd_compare_field = function(birthday, input, check) {
  if (input[check] == "any") {
    return true;
  } else {
    return (birthday[check] == input[check]);
  }
}

Pandas.date_ymd_compare = function(birthday_ymd, input_ymd) {
  return ((Pandas.date_ymd_compare_field(birthday_ymd, input_ymd, "day")) &&
          (Pandas.date_ymd_compare_field(birthday_ymd, input_ymd, "month")) &&
          (Pandas.date_ymd_compare_field(birthday_ymd, input_ymd, "year")));
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
  // Logic to handle small arrays
  if (array.length <= 1) {
    return array;
  }
  // Logic to handle when asking for too many items
  if (array.length < count) {
    count = array.length;
  }
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

Pandas.searchBirthdayList = function(input_date) {
  // Find all pandas that have a certain birthday.
  // Used for date searches, unlike other birthday functions which
  // are for showing birthday pandas on the front page.
  var input_ymd = Pandas.parseDate(input_date, L.display);
  // Make sure we're using a 4-digit year, assume > 2000
  if (input_ymd["year"] < 2000) {
    input_ymd["year"] = input_ymd["year"] + 2000;
  }
  var nodes = G.v().filter(function(vertex) {
    return vertex["_id"] > 0;   // Just animals
  }).filter(function(vertex) {
    var birthday = new Date(vertex.birthday);
    var birthday_ymd = Pandas.date_to_ymd(birthday);
    return Pandas.date_ymd_compare(birthday_ymd, input_ymd);
  }).run();
  // TODO: make litter mates show up next to each other
  return Pandas.sortOldestToYoungest(nodes);
}

// Find all pandas born today, given parameters:
//   keep_living: panda must still be alive
//   photo_count: panda must have at least this many photos
Pandas.searchBirthdayToday = function(keep_living=true, photo_count=20) {
  var today = new Date();
  var nodes = G.v().filter(function(vertex) {
    return vertex["_id"] > 0;   // Just animals
  }).filter(function(vertex) {
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

// Return ids for any panda that has photos, whose birthday it is,
// and who has litter mates with the exact same birthday.
Pandas.searchBirthdayLitterIds = function(keep_living=true, photo_count=20) {
  var today = new Date();
  var litter_ids = G.v().filter(function(vertex) {
    return vertex["_id"] > 0;   // Just animals
  }).filter(function(vertex) {
    var birthday = new Date(vertex.birthday);
    return ((birthday.getDate() == today.getDate()) &&
            (birthday.getMonth() == today.getMonth()));
  }).filter(function(vertex) {
    if (photo_count > 0) {
      return vertex["photo." + photo_count] != undefined;
    }
  }).in("litter").filter(function(vertex) {
    // Litter mates for this search must have the exact same
    // birthday as today. Sometimes they're born a day apart
    var birthday = new Date(vertex.birthday);
    return ((birthday.getDate() == today.getDate()) &&
            (birthday.getMonth() == today.getMonth()));
  }).filter(function(vertex) {
    // Filter out any animals in litters are passed away
    if (keep_living == true) {
      return (vertex.death == undefined);
    } else {
      return true;   // Get everyone
    }        
  }).run().map(x => x._id);
  litter_ids = Pandas.distinct(litter_ids);
  return litter_ids;
}

// Find all pandas born today, given parameters:
//   keep_living: panda must still be alive
//   photo_count: panda must have at least this many photos
//   max_count: get a random sample of birthdays
// Bias towards pandas with littermates in this random sample,
// so if a panda appears in the set, so will its littermates.
Pandas.searchBirthdayLitterBias = function(keep_living=true, photo_count=20, max_count=5) {
  var initial_set = Pandas.searchBirthdayToday(keep_living, photo_count);
  var initial_ids = Pandas.shuffle(initial_set.map(x => x._id));
  var litter_ids = Pandas.searchBirthdayLitterIds(keep_living, photo_count);
  // Find all pandas we can remove from the random sample,
  // for not having any litter mates
  var has_litters = initial_ids.filter(function(x) {
    return litter_ids.indexOf(x) !== -1;
  });
  var no_litters = initial_ids.filter(function(x) {
    return litter_ids.indexOf(x) == -1;
  });
  has_litters = Pandas.distinct(has_litters);
  // Get the id of a single animal that has a litter born on
  // this date, and include them all in the output. Have fallbacks
  // in case we don't have any litter birthdays
  var chosen_year = -1;
  var chosen_id = -1;
  var chosen_litter_ids = [];
  if (has_litters.length > 0) {
    // TODO: ONLY ONE SET OF LITTERS IN THE BIRTHDAY FRONT PAGE. :/ Refactor.
    chosen_id = Pandas.randomChoice(has_litters, 1)[0];
    var chosen_animal = Pandas.searchPandaId(chosen_id)[0];
    chosen_litter_ids = Pandas.searchLitter(chosen_id)
      .filter(function(x) {
        return x.birthday = chosen_animal.birthday;
      }).filter(function(vertex) {
        // Filter out any animals in litters are passed away
        if (keep_living == true) {
          return (vertex.death == undefined);
        } else {
          return true;   // Get everyone
        }        
      }).map(x => x._id);
    chosen_litter_ids.unshift(chosen_id);
    chosen_year = parseInt(chosen_animal.birthday.split("/")[0]);
  }
  // Insert the litter mate into the list next to their sibling.
  var s2_ids = [];
  var after_litter = [];
  var remaining_count = max_count - chosen_litter_ids.length;
  if (no_litters.length < remaining_count) {
    // Don't display a birthday panda unless it can be with their
    // litter-mate. We could backfill the no_litters with litter 
    // pandas, but it means litter mates wouldn't be shown
    remaining_count = no_litters.length;
  }
  // Add animals from the no-litter list
  for (var i = 0; i < remaining_count; i++) {
    var current_id = no_litters[i];
    var current_year = parseInt(Pandas.searchPandaId(current_id)[0].birthday.split("/")[0]);
    if (current_year <= chosen_year) {
      s2_ids.unshift(current_id);      
    } else if ((current_year == chosen_year) && 
         s2_ids.indexOf(chosen_id) == -1) {
      s2_ids = s2_ids.concat(chosen_litter_ids);
      s2_ids.unshift(current_id);
    } else {
      after_litter.unshift(current_id);
    }
  }
  // Add back the litter members if they're not there
  if (s2_ids.indexOf(chosen_id) == -1) {
    s2_ids = s2_ids.concat(chosen_litter_ids);
  }
  // Add back animals younger than the displayed litter
  if (after_litter.length > 0) {
    s2_ids = s2_ids.concat(after_litter);
  }
  var final_animals = s2_ids.map(x => Pandas.searchPandaId(x)[0]);
  // Good enough for year sort
  final_animals = Pandas.sortByName(final_animals, "birthday");
  return final_animals;
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

Pandas.searchDiedList = function(input_date) {
  var died_date_ymd = Pandas.parseDate(input_date, L.display);
  // Make sure we're using a 4-digit year, assume > 2000
  if (died_date_ymd["year"] < 2000) {
    died_date_ymd["year"] = died_date_ymd["year"] + 2000;
  }
  var nodes = G.v().filter(function(vertex) {
    return (vertex["photo.1"] != undefined);
  }).filter(function (vertex) {
    var their_date = new Date(vertex.death);
    var their_date_ymd = Pandas.date_to_ymd(their_date);
    return Pandas.date_ymd_compare(their_date_ymd, died_date_ymd);
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
    var languages = Pandas.def.languages;
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
        name_list = animal[field].split(", ");
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
          return vertex["panda.tags"].split(", ").indexOf(id) != -1;
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
      var panda_tags = vertex["panda.tags"].split(", ");
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
    var photo_tag_list = animal[photo_tags].split(", ");
    // Is the search tag list a subset of the photo_tag_list
    var contains = !(tags.some(val => photo_tag_list.indexOf(val) === -1));
    if (contains == true) {
      var bundle = {
        "id": animal["_id"],
        "photo": animal[field_name],
        "photo.author": animal[photo_author],
        "photo.index": photo_index,
        "photo.link": Pandas.authorLink(animal[photo_author], animal[photo_link]),
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
      if (animal[photo_tags].split(", ").indexOf(tag) != -1) {
        if (mode == "animal") {
          return [animal];
        } else {
          var bundle = {
            "id": animal["_id"],
            "photo": animal[field_name],
            "photo.author": animal[photo_author],
            "photo.index": photo_index,
            "photo.link": Pandas.authorLink(animal[photo_author], animal[photo_link]),
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
      // Fallback to profile photo if possible
      if ((set.length == 1) && (Object.values(Pandas.def.unknown).indexOf(set[0]["photo.author"]) != -1)) {
        set = [Pandas.profilePhoto(animal, "1")];
      }
      // If no profile photo either, return empty set
      if ((set.length == 1) && (Object.values(Pandas.def.unknown).indexOf(set[0]["photo.author"]) != -1)) {
        set = [];
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
  var languages = Pandas.def.languages;
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
    var hiragana = Pandas.def.ranges['ja'][1];   // Hiragana range regex
    var katakana = Pandas.def.ranges['ja'][2];   // Katakana range regex
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

  var name_field = "ja.name";
  var othername_field = "ja.othernames";
  var sort_name = "ja.sortname";

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
  if (L.display == "ja") {
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
    return (language == "ja") ? '' : " ";
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
  var pandaTags = entity["panda.tags"].split(", ");
  var output_string = Pandas.def.animal[L.display + ".name"];
  var animals = [];
  for (let id of pandaTags) {
    // Must be a numeric non-negative panda ID
    var panda = Pandas.searchPandaId(id)[0];
    var [x, y] = entity[tag_index + "." + id + ".location"].split(", ");
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
    // HACK: Assume latin languages do comma-replacement the same way
    if ((animals.length > 2) && (Language.alphabets.latin.indexOf(L.display) != -1)) {
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
  // TODO: replace "baby, baby & mom" with "babies & mom"
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
    return ordering.split(", ");
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
      var [_, next_start] = animal[next_field].split(", ");
      end_date = next_start;
    } else {
      if (animal["death"] != undefined) {
        end_date = animal["death"];
      }
    }
    var [zoo_index, start_date]= animal[location_field].split(", ");
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
      "link": Pandas.authorLink(entity[choice + ".author"], entity[choice + ".link"]),
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

// Parse a date based on the observed values, falling back to a
// language-specific date format as appropriate.
Pandas.parseDate = function(date, language) {
  // Whatever the non-numeric date delimiters are, replace it with slash.
  // Then chop off any delimiters at the beginning or end of the string.
  date = date.replace(/[^\d]/g, '/');
  date = date.replace(/^\//, '');
  date = date.replace(/\/$/, '');
  // Now figure out how many numbers are in the date we're dealing with
  var nums = date.split("/").map(x => parseInt(x));
  if (nums.length == 2) {
    // Either month/day or month/year
    if (nums[0] > 31) {    // Almost certainly YYYY/MM
      return {"year": nums[0], "month": nums[1], "day": "any"};
    } else if (nums[1] > 31) {    // Almost certainly MM/YYYY
      return {"year": nums[1], "month": nums[0], "day": "any"};
    } else {
      // no four-digit year, so assume MM/DD based on locale
      var locale = Language.L.date_locale["mm_dd"][language].split("_");
      if (locale[0] == "mm") {
        return {"year": "any", "month": nums[0], "day": nums[1]};
      } else {
        return {"year": "any", "month": nums[1], "day": nums[0]};
      }
    }
  } else if (nums.length == 3) {
    // Some form of month/day/year
    var locale = Language.L.date_locale["yy_mm_dd"][language].split("_");
    if (nums[0] > 31) {    // Almost certainly YYYY/MM/DD
      return {"year": nums[0], "month": nums[1], "day": nums[2]};
    } else if (nums[2] > 31) {
      if (nums[0] > 12) {    // Almost certainly DD/MM/YYYY
        return {"year": nums[2], "month": nums[1], "day": nums[0]};
      } else if (nums[1] > 12) {    // Almost certainly MM/DD/YYYY
        return {"year": nums[2], "month": nums[0], "day": nums[1]};
      } else {
        if (locale[0] == "mm") {
          return {"year": nums[2], "month": nums[0], "day": nums[1]};
        } else {
          return {"year": nums[2], "month": nums[1], "day": nums[0]};
        }
      }
    } else {   // All two-digit values for dates, so use the locale
      var locale = Language.L.date_locale["yy_mm_dd"][language].split("_");
      if (locale[0] == "mm") {
        return {"year": nums[2], "month": nums[0], "day": nums[1]};
      } else if (locale[0] == "dd") {
        return {"year": nums[2], "month": nums[1], "day": nums[0]};
      } else {
        return {"year": nums[0], "month": nums[1], "day": nums[2]};
      }
    }
  } else {   // Who knows what this is
    return { "year": -1, "month": -1, "day": -1};
  }
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
      "link": Pandas.authorLink(animal[choice + ".author"], animal[choice + ".link"])
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

/*
    Language fallback methods
*/

var Language = {};   // Namespace

Language.L = {};     // Prototype

Language.init = function() {
  var language = Object.create(Language.L);
  // The current displayed language in the page, and stored in the 
  // browser's localStorage API
  language.display = undefined;
  language.storage = window.localStorage;
  return language;
}

/*
   Language elements translatable in the GUI
*/
// TODO: do we need localized emojis for various things?
Language.L.emoji = {
  "animal": "🐼",
   "alien": "👽",
   "arrow": "➡",
  "author": "✍️",
"birthday": "🎂",
  "bamboo": "🎍",
    "baby": "👶🏻", 
    "born": "👼",
     "boy": "👦🏻",
  "camera": "📷",
    "died": "🌈",
    "edit": "📝",
  "father": "👨🏻",
  "female": "♀️",
    "gift": "🍎",
    "girl": "👧🏻",
    "home": "🏡",
"language": "‍👁️‍🗨️",
    "link": "🦉",
    "logo": "🐯🐻",
    "male": "♂️",
     "map": "🗺️",
   "media": "🖼",
   "money": "💸",
  "mother": "👩🏻",
 "no_more": "🚫",
 "profile": "💟",
  "random": "🎲",
  "search": "🔍",
"star_dad": "👨‍🎤",
"star_mom": "👩‍🎤",
   "story": "🎍",
     "top": "⬆",
"timeline": "📰",
  "travel": "✈️",
 "website": "🌐",
     "wip": "🚧",
     "zoo": "🦁"
}

// TODO: key on other language versions of country names
// TODO: language flag should key on the browser advertised locale (USA flag vs. UK flag)
Language.L.flags = {
  "Argentina": "🇦🇷",
     "Bhutan": "🇧🇹",
     "Canada": "🇨🇦",
      "Chile": "🇨🇱",
      "China": "🇨🇳",
    "Germany": "🇩🇪",
      "India": "🇮🇳",
      "Japan": "🇯🇵",
     "Mexico": "🇲🇽",
      "Nepal": "🇳🇵",
"South Korea": "🇰🇷",
     "Taiwan": "🇹🇼",
   "Thailand": "🇹🇭",
         "UK": "🇬🇧",
        "USA": "🇺🇸"
}

// TODO: use this.display to auto grab the right emoji for the current language,
// or allow overriding given an input language provided at the function call
Language.L.gui = {
  "about": {
    "cn": "關於",
    "en": "About",
    "jp": "概要"
  },
  "children": {
    "cn": Pandas.def.relations.children["cn"],
    "en": "Children",   // Capitalization
    "jp": Pandas.def.relations.children["jp"]
  },
  "father": {
    "cn": "父親",
    "en": "Father",
    "jp": "父"
  },
  "flag": {
    "cn": Language.L.flags["China"],
    "en": Language.L.flags["USA"],
    "jp": Language.L.flags["Japan"]
  },
  "footerLink": {
    "cn": "Red Panda Lineage",
    "en": "Red Panda Lineage",
    "jp": "Red Panda Lineage"
  },
  "home": {
    "cn": "主頁",
    "en": "Home",
    "es": "Home",
    "jp": "ホーム"
  },
  "language": {
    "cn": {
      "cn": "漢語",
      "en": "英語",
      "es": "西班牙語",
      "jp": "日語",
      "kr": "朝鮮語"
    },
    "en": {
      "cn": "Chinese",
      "en": "English",
      "es": "Spanish",
      "jp": "Japanese",
      "kr": "Korean"
    },
    "es": {
      "cn": "Chino",
      "en": "Ingles",
      "es": "Español",
      "jp": "Japonés",
      "kr": "Coreano"
    },
    "jp": {
      "cn": "中国語",
      "en": "英語",
      "es": "スペイン語",
      "jp": "日本語",
      "kr": "韓国語"
    }
  },
  "loading": {
    "cn": "Loading...",
    "en": "Loading...",
    "jp": "ローディング"
  },
  "litter": {
    "cn": Pandas.def.relations.litter["cn"],
    "en": "Litter",   // Capitalization
    "jp": Pandas.def.relations.litter["jp"]
  },
  "links": {
    "cn": "鏈接",
    "en": "Links",
    "jp": "リンク"
  },
  "me": {
    "cn": "我",
    "en": "Me",
    "jp": "私"
  },
  "media": {
    "cn": "媒體",
    "en": "Media",
    "jp": "メディア"
  },
  "mother": {
    "cn": "母親",
    "en": "Mother",
    "jp": "母"
  },
  "nicknames": {
    "cn": "暱稱",
    "en": "Nicknames",
    "jp": "ニックネーム"
  },
  "othernames": {
    "cn": "其他名稱",
    "en": "Other Names",
    "jp": "他の名前"
  },
  "parents": {
    "cn": Pandas.def.relations.parents["cn"],
    "en": "Parents",   // Capitalization
    "jp": Pandas.def.relations.parents["jp"]
  },
  "profile": {
    "cn": "剖面",
    "en": "Profile",
    "jp": "プロフィール"
  },
  "random": {
    "cn": "隨機",
    "en": "Random",
    "jp": "適当"
  },
  "search": {
    "cn": "搜索...",
    "en": "Search...",
    "jp": "サーチ..."
  },
  "siblings": {
    "cn": Pandas.def.relations.siblings["cn"],
    "en": "Siblings",   // Capitalization
    "jp": Pandas.def.relations.siblings["jp"]
  },
  "since_date": {
    "cn": "TOWRITE <INSERTDATE>",
    "en": "Since <INSERTDATE>",
    "jp": "<INSERTDATE>から"
  },
  "timeline": {
    "cn": "TOWRITE",
    "en": "Timeline",
    "jp": "タイムライン"
  },
  "title": {
    "cn": "TOWRITE",
    "en": "Red Panda Finder",
    "jp": "レッサーパンダのファインダー"
  },
  "top": {
    "cn": "頂",
    "en": "Top",
    "jp": "上"
  },
  "twin": {
    "cn": "雙生",
    "en": "Twin",
    "jp": "双子"
  },
  "triplet": {
    "cn": "三重",
    "en": "Triplet",
    "jp": "三つ子"
  }
}

Language.L.messages = {
  "credit": {
    "cn": "TOWRITE",
    "en": [Language.L.emoji.gift + " ",
           "<INSERTUSER>",
           " has contributed ",
           "<INSERTNUMBER>",
           " photos."],
    "jp": [Language.L.emoji.gift + " ",
           "<INSERTUSER>",
           "は",
           "<INSERTNUMBER>",
           "枚の写真を寄稿しました。"]
  },
  "footer": {
    "cn": "TOWRITE",
    "en": ["All information courtesy of the ",
           "<INSERTLINK>",
           " and red panda fans worldwide. ",
          "Any media linked from this dataset remains property of its creator. ",
          "Layout and design © 2019 Justin Fairchild."],
    "jp": ["<INSERTLINK>", 
           "、世界中のレッサーパンダファンのすべての情報提供。",
           "このデータセットからリンクされたメディアはすべて、作成者の所有物です。",
           "設計©2019 Justin Fairchild"]
  },
  "profile_babies": {
    "cn": ["TOWRITE"],
    "en": ["<INSERTNAME>",
           " has ",
           "<INSERTBABIES>",
           " children."],
    "jp": ["<INSERTNAME>",
           "の子供",
           "<INSERTBABIES>",
           "人"]
  },
  "profile_brothers": {
    "cn": ["TOWRITE"],
    "en": ["<INSERTNAME>",
           " has ",
           "<INSERTBROTHERS>",
           " brothers."],
    "jp": ["<INSERTNAME>",
           "には",
           "<INSERTBROTHERS>",
           "人の兄弟がいます"]
  },
  "profile_brothers_babies": {
    "cn": ["TOWRITE"],
    "en": ["<INSERTNAME>",
           " has ",
           "<INSERTSISTERS>",
           " brothers and ",
           "<INSERTBABIES>",
           " baby siblings."],
    "jp": ["<INSERTNAME>",
           "には",
           "<INSERTBROTHERS>",
           "人の兄弟と",
           "<INSERTBABIES>",
           "人の赤ちゃんの兄弟がいます"]
  },
  "profile_children": {
    "cn": ["TOWRITE"],
    "en": ["<INSERTNAME>",
           " has ",
           "<INSERTTOTAL>",
           " children: ",
           "<INSERTDAUGHTERS>",
           " girls and ",
           "<INSERTSONS>",
           " boys!"],
    "jp": ["<INSERTNAME>",
           "には",
           "<INSERTTOTAL>",
           "人の子供がいます：",
           "<INSERTDAUGHTERS>",
           "人の女の子と",
           "<INSERTSONS>",
           "人の男の子"]
  },
  "profile_children_babies": {
    "cn": ["TOWRITE"],
    "en": ["<INSERTNAME>",
           " has ",
           "<INSERTTOTAL>",
           " children: ",
           "<INSERTDAUGHTERS>",
           " girls, ",
           "<INSERTSONS>",
           " boys, and ",
           "<INSERTBABIES>",
           " very young children!"],
    "jp": ["<INSERTNAME>",
           "には",
           "<INSERTTOTAL>",
           "人の子供がいます：",
           "<INSERTDAUGHTERS>",
           "人の女の子と、",
           "<INSERTSONS>",
           "人の男の子、および",
           "<INSERTBABIES>",
           "人の子供"]
  },
  "profile_daughters": {
    "cn": ["TOWRITE"],
    "en": ["<INSERTNAME>",
           " has ",
           "<INSERTDAUGHTERS>",
           " daughters."],
    "jp": ["<INSERTNAME>",
           "には",
           "<INSERTDAUGHTERS>",
           "人の娘がいます"]
  },
  "profile_daughters_babies": {
    "cn": ["TOWRITE"],
    "en": ["<INSERTNAME>",
           " has ",
           "<INSERTDAUGHTERS>",
           " daughters and ",
           "<INSERTBABIES>",
           " very young children!"],
    "jp": ["<INSERTNAME>",
           "には",
           "<INSERTDAUGHTERS>",
           "人の娘と",
           "<INSERTBABIES>",
           "人の子供がいます"]
  },
  "profile_family": {
    "cn": ["TOWRITE"],
    "en": ["<INSERTNAME>",
           "'s Immediate Family"],
    "jp": ["<INSERTNAME>",
           "の直近の家族"]
  },
  "profile_sisters": {
    "cn": ["TOWRITE"],
    "en": ["<INSERTNAME>",
           " has ",
           "<INSERTSISTERS>",
           " sisters."],
    "jp": ["<INSERTNAME>",
           "には",
           "<INSERTSISTERS>",
           "の姉妹がいます"]
  },
  "profile_sisters_babies": {
    "cn": ["TOWRITE"],
    "en": ["<INSERTNAME>",
           " has ",
           "<INSERTSISTERS>",
           " sisters and ",
           "<INSERTBABIES>",
           " baby siblings."],
    "jp": ["<INSERTNAME>",
           "には",
           "<INSERTSISTERS>",
           "の姉妹と",
           "<INSERTBABIES>",
           "人の赤ちゃんの兄弟がいます"]
  },
  "profile_siblings": {
    "cn": ["TOWRITE"],
    "en": ["<INSERTNAME>",
           " has ",
           "<INSERTTOTAL>",
           " siblings: ",
           "<INSERTSISTERS>",
           " sisters and ",
           "<INSERTBROTHERS>",
           " brothers!"],
    "jp": ["<INSERTNAME>",
           "には",
           "<INSERTTOTAL>",
           "人の兄弟がいます。",
           "<INSERTSISTERS>",
           "人の姉妹と",
           "<INSERTBROTHERS>",
           "人の兄弟"]
  },
  "profile_siblings_babies": {
    "cn": ["TOWRITE"],
    "en": ["<INSERTNAME>",
           " has ",
           "<INSERTTOTAL>",
           " siblings: ",
           "<INSERTSISTERS>",
           " sisters, ",
           "<INSERTBROTHERS>",
           " brothers, and ",
           "<INSERTBABIES>",
           " baby siblings!"],
    "jp": ["<INSERTNAME>",
           "には",
           "<INSERTTOTAL>",
           "人の兄弟がいます：",
           "<INSERTSISTERS>",
           "人の姉妹、",
           "<INSERTBROTHERS>",
           "人の兄弟、および",
           "<INSERTBABIES>",
           "人の赤ちゃんの兄弟"]
  },
  "profile_sons": {
    "cn": ["TOWRITE"],
    "en": ["<INSERTNAME>",
           " has ",
           "<INSERTSONS>",
           " sons."],
    "jp": ["<INSERTNAME>",
           "の息子は",
           "<INSERTSONS>",
           "人です"]
  },
  "profile_sons_babies": {
    "cn": ["TOWRITE"],
    "en": ["<INSERTNAME>",
           " has ",
           "<INSERTSONS>",
           " sons and ",
           "<INSERTBABIES>",
           " very young children!"],
    "jp": ["<INSERTNAME>",
           "には",
           "<INSERTSONS>",
           "人の息子と",
           "<INSERTBABIES>",
           "人の子供がいます"]
  },
  "profile_where": {
    "cn": ["TOWRITE"],
    "en": ["Where has ",
           "<INSERTNAME>",
           " lived?"],
    "jp": ["<INSERTNAME>",
           "はどこに住んでいましたか？"]
  },
}

// TODO: fold into Language.L.gui
Language.L.no_result = {
  "cn": "沒有發現熊貓",
  "en": "No Pandas Found",
  "jp": "パンダが見つかりません"
}

/*
   Language selection functions
*/
// Map a browser specified language to one of our supported options.
Language.L.default = function() {
  // Read language settings from browser's Accept-Language header
  Object.keys(Pandas.def.languages).forEach(function(option) {
    if ((navigator.languages.indexOf(option) != -1) &&
        (this.display == undefined)) {
      this.display = Pandas.def.languages[option];
    }
  });
  // Read language cookie if it's there
  var test = this.storage.getItem("language");
  if (test != null) {
    if (Object.values(Pandas.def.languages).indexOf(test) != -1) {
      this.display = test;
    }
  }  
  // Fallback to English
  if (this.display == undefined) {
    this.display = "en";
  }
}

// Do language fallback for anything reporting as "unknown" or "empty" in a zoo or animal object
Language.L.fallbackEntity = function(entity) {
  var output = entity;
  var order = Language.currentOrder(Pandas.language_order(entity), this.display);
  // Default values that we want to ignore if we can
  var default_animal = Language.saveEntityKeys(Pandas.def.animal, order);
  var default_zoo = Language.saveEntityKeys(Pandas.def.zoo, order);
  var empty_values = [undefined].concat(Object.values(Pandas.def.unknown))
                                .concat(Object.values(default_animal))
                                .concat(Object.values(default_zoo));
  // Derive the zoo/panda language-translatable keys by getting a list of
  // the separate language keys from the original object, and adding a
  // synthetic list of keys that would apply for the current display language
  var language_entity = Language.listDisplayKeys(entity, order, this.display);
  // Start replacing this language's value with an available value in the
  // language.order list. Just stuff it in the original entity's key.
  for (var key of language_entity) {
    if (Language.fallback_blacklist.indexOf(key) != -1) {
      continue;  // Ignore blacklist fields
    }
    if (empty_values.indexOf(entity[key]) != -1) {
      for (language of order) {
        if (language == L.display) {
          continue;  // Don't take replacement values from current language
        }
        [ _, desired ] = key.split('.');
        var new_key = language + "." + desired;
        if (empty_values.indexOf(entity[new_key]) == -1) {
          // Put this language's value in the displayed output
          output[key] = entity[new_key];
          break;
        }
      } // If no available non-empty strings in other languages, do nothing
    }
  }
  return output;
}

// Do language fallback for anything reporting as "unknown" or "empty" in an info block
Language.L.fallbackInfo = function(info, original) {
  var bundle = info;
  var order = Language.currentOrder(info.language_order, this.display);
  // Default values that we want to ignore if we can
  var default_animal = Language.saveEntityKeys(Pandas.def.animal, order);
  var default_zoo = Language.saveEntityKeys(Pandas.def.zoo, order);
  var empty_values = [undefined].concat(Object.values(Pandas.def.unknown))
                                .concat(Object.values(default_animal))
                                .concat(Object.values(default_zoo));
  // Derive the info-block language-translatable keys by getting a list of
  // the separate language keys from the original object, slicing off
  // the lanugage prefix, and de-duplicating.
  var language_info = Language.listInfoKeys(original, order);
  // Start replacing this language's value with an available value in the
  // language.order list. Just stuff it in the original info blob's key.
  for (var key of language_info) {
    if (Language.fallback_blacklist.indexOf(key) != -1) {
      continue;  // Ignore blacklist fields
    }
    if (empty_values.indexOf(info[key]) != -1) {
      for (language of order) {
        if (language == this.display) {
          continue;  // Don't take replacement values from current language
        }
        var new_key = language + "." + key;
        if (empty_values.indexOf(original[new_key]) == -1) {
          // Put this language's value in the displayed output
          bundle[key] = original[new_key];
          break;
        }
      } // If no available non-empty strings in other languages, do nothing
    }
  }

  // Replace nested zoo or birthplace text for panda entities similarly
  if ((info.zoo != undefined) && (info.zoo != Pandas.def.zoo)) {
    bundle.zoo = this.fallbackEntity(info.zoo);
  }
  if ((info.birthplace != undefined) && (info.birthplace != Pandas.def.zoo)) {
    bundle.birthplace = this.fallbackEntity(info.birthplace);
  }
  return bundle;
}

// Update all GUI elements based on the currently chosen language
Language.L.update = function() {
  var update_ids = ['languageButton', 'aboutButton', 'randomButton', 'linksButton',
                    'profileButton', 'mediaButton', 'timelineButton'];
  var existing_elements = update_ids.map(x => document.getElementById(x)).filter(x => x != undefined);
  // Any buttons in the page? Redraw with correct language settings
  for (let element of existing_elements) {
    var id = element.id;
    var lookup = id.replace("Button", "");
    [icon, text] = element.childNodes[0].childNodes;
    if (id == "languageButton") {
      icon.innerText = this.gui.flag[this.display];   // Replace flag icon
      text.innerText = this.gui[lookup][this.display][this.display]   // Replace language icon text
    } else {
      text.innerText = this.gui[lookup][this.display];   // Replace icon text
    }
  }
  // Update the placeholder text for a search bar
  if (document.forms['searchForm'] != undefined) {
    if (P.db == undefined) {
      document.forms['searchForm']['searchInput'].placeholder = this.gui.loading[this.display];
    } else {
      document.forms['searchForm']['searchInput'].placeholder = "➤ " + this.gui.search[this.display];
    }
  }
  // Change the page title
  document.title = this.gui.title[this.display];
  // Write localStorage for your chosen language. This is better than a cookie
  // since the server never has to see what language you're using in each request.
  this.storage.setItem('language', this.display);
}

/*
    Language helper and utility functions
*/
// Calculate the current fallback language order for a given info block or entity.
// Key here is adding the current display language to the list, so that if a dataset
// doesn't include info for a language, we can overwrite that info anyways!
Language.currentOrder = function(current_list, current_language) {
  return current_list.concat(current_language).filter(function(value, index, self) { 
    return self.indexOf(value) === index;  // Remove duplicates in the array
  });
}

// Determine if altname is not worth displaying for furigana by calculating
// its Levenshtein distance. Courtesy of https://gist.github.com/rd4k1
Language.editDistance = function(a, b){
  if(!a || !b) return (a || b).length;
  var m = [];
  for(var i = 0; i <= b.length; i++){
    m[i] = [i];
    if(i === 0) continue;
    for(var j = 0; j <= a.length; j++){
      m[0][j] = j;
      if(j === 0) continue;
      m[i][j] = b.charAt(i - 1) == a.charAt(j - 1) ? m[i - 1][j - 1] : Math.min(
        m[i-1][j-1] + 1,
        m[i][j-1] + 1,
        m[i-1][j] + 1
      );
    }
  }
  return m[b.length][a.length];
};

// For fallback functions, don't replace these fields
Language.fallback_blacklist = ["othernames", "nicknames"];

// Given a list of keys we're doing language translations for, add a set
// for the current displayed language
Language.listDisplayKeys = function(entity, order, current_language) {
  var entity_keys = Language.listEntityKeys(entity, order);
  var language_keys = entity_keys.map(function(key) {
    [_, primary] = key.split('.');
    return current_language + "." + primary;
  });
  return entity_keys.concat(language_keys).filter(function(value, index, self) {
    return self.indexOf(value) === index;  // De-duplicate language keys
  });
}

// Get the valid language-translatable keys in a zoo or animal object
// like the ones in the Pandas.* methods
Language.listEntityKeys = function(entity, order) {
  var obj_langs = order.concat(Object.values(Pandas.def.languages));  // Dupes not important
  var filtered = Object.keys(entity).filter(function(key) {
    // List the language-specific keys in a zoo or animal
    [lang, primary] = key.split('.');
    return (obj_langs.indexOf(lang) != -1);
  });
  return filtered;
}

// Get the valid language-translatable keys in an info block from one of
// its panda/zoo entities, like you have in blocks created by Show.acquire*Info
Language.listInfoKeys = function(entity, order) {
  return Language.listEntityKeys(entity, order).map(function(key) {
    [language, desired] = key.split('.');
    return desired;
  }).filter(function(value, index, self) {
    return self.indexOf(value) === index;
  });
}

// Only keep the keys in a panda or zoo object that are meaningfully 
// translatable to different languages
Language.saveEntityKeys = function(entity, order) {
  var filtered = Language.listEntityKeys(entity, order).reduce(function(obj, key) {
    // Only keep JSON values with those matching keys
    obj[key] = entity[key];
    return obj;
  }, {});
  return filtered; 
}

// Only keep the keys in an info block that are meaningfully 
// translatable to different languages
Language.saveInfoKeys = function(info, order) {
  var filtered = Language.listInfoKeys(info, order).reduce(function(obj, key) {
    // Only keep JSON values with those matching keys
    obj[key] = info[key];
    return obj;
  }, {});
  return filtered;
}

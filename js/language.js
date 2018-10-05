/*
    Language fallback methods
*/

var Language = {};   // Namespace

Language.L = {};     // Prototype

Language.init = function() {
  var language = Object.create(Language.L);
  return language;
}

// For fallback functions, don't replace these fields
Language.fallback_blacklist = ["othernames", "nicknames"];

// The current displayed language in the page
Language.display = undefined;

/*
   Language selection functions
*/
// Map a browser specified language to one of our supported options.
Language.default = function(lang_object) {
  // Read language settings from browser's Accept-Language header
  Object.keys(Pandas.def.languages).forEach(function(option) {
    if ((navigator.languages.indexOf(option) != -1) &&
        (lang_object.display == undefined)) {
      lang_object.display = Pandas.def.languages[option];
    }
  });
  // Read language cookie if it's there
  if (document.cookie.length > 0) {
    var test = document.cookie.split("=")[1];
    if (Object.values(Pandas.def.languages).indexOf(test) != -1) {
      lang_object.display = test;
    }
  }  
  // Fallback to English
  if (lang_object.display == undefined) {
    lang_object.display = "en";
  }
}

// Update all GUI elements based on the currently chosen language
// For now, just do the language button itself
Language.update = function(lang_object) {
  var languageButton = document.getElementById('languageButton');
  [ langIcon, langText ] = languageButton.childNodes[0].childNodes;
  langIcon.innerText = Show.gui.flag[lang_object.display];
  langText.innerText = Show.gui.language[lang_object.display];
  var aboutButton = document.getElementById('aboutButton');
  [ langIcon, langText ] = aboutButton.childNodes[0].childNodes;
  langText.innerText = Show.gui.about[lang_object.display];
  var randomButton = document.getElementById('randomButton');
  [ langIcon, langText ] = randomButton.childNodes[0].childNodes;
  langText.innerText = Show.gui.random[lang_object.display];
  var linksButton = document.getElementById('linksButton');
  [ langIcon, langText ] = linksButton.childNodes[0].childNodes;
  langText.innerText = Show.gui.links[lang_object.display];
  // Update the placeholder text for a search bar
  if (P.db == undefined) {
    document.forms['searchForm']['searchInput'].placeholder = Show.gui.loading[lang_object.display];
  } else {
    document.forms['searchForm']['searchInput'].placeholder = "➤ " + Show.gui.search[lang_object.display];
  }
  // Change the page title
  document.title = Show.gui.title[lang_object.display];
  // Write a cookie for your chosen language
  document.cookie = "language=" + lang_object.display;
}

/*
    Language helper and utility functions
*/
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

/*
    Fallback Language functions
*/
// Calculate the current fallback language order for a given info block or entity.
// Key here is adding the current display language to the list, so that if a dataset
// doesn't include info for a language, we can overwrite that info anyways!
Language.currentOrder = function(current_list, current_language) {
  return current_list.concat(current_language).filter(function(value, index, self) { 
    return self.indexOf(value) === index;  // Remove duplicates in the array
  });
}

// Do language fallback for anything reporting as "unknown" or "empty" in an info block
Language.fallbackInfo = function(info, original) {
  var bundle = info;
  var order = Language.currentOrder(info.language_order, L.display);
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
        if (language == L.display) {
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
    bundle.zoo = Language.fallbackEntity(info.zoo);
  }
  if ((info.birthplace != undefined) && (info.birthplace != Pandas.def.zoo)) {
    bundle.birthplace = Language.fallbackEntity(info.birthplace);
  }
  return bundle;
}

// Do language fallback for anything reporting as "unknown" or "empty" in a zoo or animal object
Language.fallbackEntity = function(entity) {
  var output = entity;
  var order = Language.currentOrder(Pandas.language_order(entity), L.display);
  // Default values that we want to ignore if we can
  var default_animal = Language.saveEntityKeys(Pandas.def.animal, order);
  var default_zoo = Language.saveEntityKeys(Pandas.def.zoo, order);
  var empty_values = [undefined].concat(Object.values(Pandas.def.unknown))
                                .concat(Object.values(default_animal))
                                .concat(Object.values(default_zoo));
  // Derive the zoo/panda language-translatable keys by getting a list of
  // the separate language keys from the original object, and adding a
  // synthetic list of keys that would apply for the current display language
  var language_entity = Language.listDisplayKeys(entity, order, L.display);
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
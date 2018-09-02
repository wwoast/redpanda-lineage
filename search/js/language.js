/*
    Language fallback methods
*/

var Language = {};   // Namespace

Language.L = {};     // Prototype

Language.init = function() {
  var language = Object.create(Language.L);
  var display = undefined;
  return language;
}

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
  // Redisplay results in the correct language, but only if the Pandas
  // content has already been loaded.
  if ((window.location.hash.length > 0) && (P.db != undefined)) {
    outputResults();
  }
  // Write a cookie for your chosen language
  document.cookie = "language=" + lang_object.display;
}

/*
    Fallback Language functions
*/
// TOWRITE: Zoo fallback and animal fallback logic
// Do language fallback for anything reporting as "unknown" or "empty"
Language.infoFallback = function(info, original) {
  var bundle = info;
  var order = info.language_order;
  var blacklist = ["othernames", "nicknames"];  // Don't replace these fields
  // Get the valid language-translatable keys in an object
  function language_entity_keys(entity) {
    var obj_langs = order.concat(Object.values(Pandas.def.languages));  // Dupes not important
    var filtered = Object.keys(entity).filter(function(key) {
      // List the language-specific keys
      [lang, primary] = key.split('.');
      return (obj_langs.indexOf(lang) != -1);
    });
    return filtered;
  }
  // Get the valid language-translatable keys in an info block
  function language_info_keys(info) {
    return language_entity_keys(original).map(function(key) {
      [language, desired] = key.split('.');
      return desired;
    }).filter(function(value, index, self) {
      return self.indexOf(value) === index;
    });
  }
  // Only keep the keys that are translatable to different languages
  function save_entity_language_keys(entity) {
    var filtered = language_entity_keys(entity).reduce(function(obj, key) {
      // Only keep JSON values with those matching keys
      obj[key] = entity[key];
      return obj;
    }, {});
    return filtered; 
  }
  function save_info_language_keys(info) {
    var filtered = language_info_keys(info).reduce(function(obj, key) {
      // Only keep JSON values with those matching keys
      obj[key] = info[key];
      return obj;
    }, {});
    return filtered;     
  }
  // Default values that we want to ignore if we can
  var default_animal = save_entity_language_keys(Pandas.def.animal);
  var default_zoo = save_entity_language_keys(Pandas.def.zoo);
  var empty_values = [undefined].concat(Object.values(Pandas.def.unknown))
                                .concat(Object.values(default_animal))
                                .concat(Object.values(default_zoo));
  var input = save_info_language_keys(info);
  // Derive the info-block language-translatable keys by getting a list of
  // the seprate language keys from the original object, slicing off
  // the lanugage prefix, and de-duplicating.
  var language_info = language_info_keys(info);
  // Start replacing this language's value with an available value in the
  // language.order list. Just stuff it in the original info blob's key.
  for (var key of language_info) {
    if (blacklist.indexOf(key) != -1) {
      continue;  // Ignore blacklist fields
    }
    if (empty_values.indexOf(input[key]) != -1) {
      for (language of order) {
        if (language == info.language) {
          continue;  // Don't take replacement values from current language
        }
        var new_key = language + "." + key;
        if (empty_values.indexOf(original[new_key]) == -1) {
          // Put this language's value in the displayed output
          bundle[key] = original[new_key];
        }
      } // If no available non-empty strings in other languages, do nothing
    }
  }
  return bundle;
}

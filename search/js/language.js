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
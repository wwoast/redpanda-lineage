/*
    Mobile meta-tag support for various phone/tablet font scales
*/
(function() {
  if ( navigator.platform === "iPad" ) {
          var scale = 1.2;
          document.write('<meta name="viewport" content="width=device-width; initial-scale='+scale+'; minimum-scale='+scale+'; maximum-scale='+scale+'; user-scalable=0;" />');

  } else if ( navigator.platform === "iPhone" ) {
          var scale = 1.0;
          document.write('<meta name="viewport" content="width=device-width; initial-scale='+scale+'; minimum-scale='+scale+'; maximum-scale='+scale+'; user-scalable=0;" />');

  } else if ( navigator.userAgent.indexOf("Android") != -1 ) {
          var scale = 1.2;
          document.write('<meta name="viewport" content="width=device-width; initial-scale-'+scale+'; minimum-scale='+scale+'; maximum-scale='+scale+'; user-scalable=0; target-densitydpi="device-dpi"; />');
  } else {
          return;
  }
})();

/*
    Global objects usable by forms, and things that operate as the page loads
*/
var P;   // Pandas
var Q;   // Query stack
var G;   // Lineage graph
var L;   // Language methods and current language

/*
    Once page has loaded, add new event listeners for search processing
*/
document.addEventListener("DOMContentLoaded", function() {
  P = Pandas.init();
  Q = Query.init();
  L = Language.init();
  G = Dagoba.graph();

  Language.default(L);     // Set default language
  checkHashes();           // See if we started on the links or about pages
  Language.update(L);      // Update buttons, displayed results, and cookie state
  redrawPage(Show.page);   // Ready to redraw? Let's go.

  // Once the panda data is loaded, create the graph
  window.addEventListener('panda_data', function() {
    P.db.vertices.forEach(G.addVertex.bind(G));
    P.db.edges   .forEach(G.addEdge  .bind(G));
    // Enable search bar once the page has loaded
    var placeholder = "➤ " + Show.gui.search[L.display];
    document.forms['searchForm']['searchInput'].disabled = false;
    document.forms['searchForm']['searchInput'].placeholder = placeholder;
    document.getElementById('searchInput').focus();  // Set text cursor

    // If a hashlink was bookmarked, bring up the results of it
    if ((window.location.hash.length > 0) && 
        (Show.routes.fixed.includes(window.location.hash) == false)) {
      outputResults();
    }

    // Fixes TypeSquare unsetting the input typeface in its own javascript
    setTimeout(function() {
      document.getElementById('searchInput').style.fontFamily = "sans-serif";
    }, 0);
  });

  document.getElementById('logoButton').addEventListener("click", function() {
    // Return to the empty search page
    Show.lastSearch = "#home";
    outputHome();
    window.location = "#home";
    Show.page = outputHome;
  });

  document.getElementById('languageButton').addEventListener("click", function() {
    var language = L.display;
    var options = Object.values(Pandas.def.languages);
    var choice = options.indexOf(language);
    choice = (choice + 1) % options.length;
    var new_language = options[choice];
    L.display = new_language;
    Language.update(L, Show.page);
    redrawPage(Show.page);
  });  

  document.getElementById('aboutButton').addEventListener("click", function() {
    if (Show.page == outputAbout) {
      // Check the last query done and return to it, if it was a query
      if (Show.routes.fixed.includes(Show.lastSearch) == false) {
        window.location = Show.lastSearch;
      } else {
        window.location = "#home";
      }
    } else {
      // Only save the last page if it wasn't one of the other fixed buttons
      if (Show.routes.fixed.includes(window.location.hash) == false) {
        Show.lastSearch = window.location.hash;
      }
      window.location = "#about";
      if ((Show.about.language != L.display) && (Show.about.language != undefined)) {
        fetchAboutPage();
      } else {
        outputAbout();
        Show.page = outputAbout;
      }
    }
  });

  document.getElementById('randomButton').addEventListener("click", function() {
    // Show a random panda from the database when the dice is clicked
    Show.page = outputResults;
    var pandaIds = P.db.vertices.filter(entity => entity._id > 0).map(entity => entity._id);
    window.location = "#query/" + pandaIds[Math.floor(Math.random() * pandaIds.length)];
  });

  document.getElementById('linksButton').addEventListener("click", function() {
    if (Show.page == outputLinks) {
      // Check the last query done and return to it, if it was a query
      if (Show.routes.fixed.includes(Show.lastSearch) == false) {
        window.location = Show.lastSearch;
      } else {
        window.location = "#home";
      }
    } else {
      // Only save the last page if it wasn't one of the other fixed buttons
      if (Show.routes.fixed.includes(window.location.hash) == false) {
        Show.lastSearch = window.location.hash;
      }
      window.location = "#links";
      if ((Show.links.language != L.display) && (Show.links.language != undefined)) {
        fetchLinksPage();
      } else {
        outputLinks();
        Show.page = outputLinks;
      }
    }
  });

  document.getElementById('searchForm').addEventListener("submit", function() {
    Show.page = outputResults;
    document.getElementById('searchInput').blur();   // Make iOS keyboard disappear after submitting.
    var query = (document.getElementById('searchInput').value).trim();
    Query.lexer.parse(query);  // TODO: onhashchange, race for results?
    window.location = "#query/" + query;
    // Refocus text cursor after a search is performed
    setTimeout(function() {
      document.getElementById('searchInput').focus();
    }, 0);
  });

  // Last but not least, fetch the about page and links page contents for each language
  fetchAboutPage();
  fetchLinksPage();
});

// When a hashlink is clicked from a non-links or non-about page, it should
// output results for pandas.
window.addEventListener('hashchange', function() {
  if (Show.routes.fixed.includes(window.location.hash) == false) {
    outputResults();
    Show.page = outputResults;
  } else if (window.location.hash == "#home") {
    outputHome();
    Show.page = outputHome;
  }
});

// Once the about-page content is loaded, decide whether to display the
// contents or just keep them stashed.
window.addEventListener('about_loaded', function() {
  if (window.location.hash == "#about") {
    outputAbout();
    Show.page = outputAbout;
  }
});

// Once the links-page content is loaded, decide whether to display the
// contents or just keep them stashed.
window.addEventListener('links_loaded', function() {
  if (window.location.hash == "#links") {
    outputLinks();
    Show.page = outputLinks;
  }
});

/*
    Display modes for the site
*/
// On initial page load, look for specific hashes that represent special buttons
// and immediately load that page if necessary.
function checkHashes() {
  if (Show.routes.dynamic.includes(window.location.hash.split('/')[0])) {
    Show.page = outputResults;
  } else if (window.location.hash == "#about") {
    Show.page = outputAbout;
  } else if (window.location.hash == "#links") {
    Show.page = outputLinks;
  } else {
    Show.page = outputHome;
  }
}

// Fetch the about page contents
function fetchAboutPage() {
  var base = "https://wwoast.github.io/redpanda-lineage/search/fragments/";
  var specific = L.display + "/about.html";
  var fetch_url = base + specific;
  var request = new XMLHttpRequest();
  request.open('GET', fetch_url);
  request.responseType = 'document';
  request.send();
  request.onload = function() {
    Show.about.content = request.response.getElementById('hiddenContentFrame');
    Show.about.language = L.display;   // What language the content was loaded in
    window.dispatchEvent(Show.about.loaded);   // Report the data has loaded
  }
}

// Fetch the links page contents
function fetchLinksPage() {
  var base = "https://wwoast.github.io/redpanda-lineage/search/fragments/";
  var specific = L.display + "/links.html";
  var fetch_url = base + specific;
  var request = new XMLHttpRequest();
  request.open('GET', fetch_url);
  request.responseType = 'document';
  request.send();
  request.onload = function() {
    Show.links.content = request.response.getElementById('hiddenContentFrame');
    Show.links.language = L.display;   // What language the content was laoaded in
    window.dispatchEvent(Show.links.loaded);   // Report the data has loaded
  }
}

// Displays the about page when the button is clicked. Load content from a static
// file based on the given language, and display it in a #contentFrame.about
function outputAbout() {
  if (Show.about.language == undefined) {
    fetchAboutPage();   // Direct link
  } else if (Show.about.language != L.display) {
    fetchAboutPage();   // Language change event
  } else {
    var old_content = document.getElementById('contentFrame');
    swapContents(old_content, Show.about.content);
    redrawFooter();
  }
}

// Output just the base search bar with no footer.
// TODO: random content to entice new visitors :)
function outputHome() {
  var old_content = document.getElementById('contentFrame');
  var new_content = document.createElement('img');
  new_content.src = "images/jiuzhaigou.jpg";
  new_content.className = "fullFrame";
  new_content.id = "contentFrame";
  swapContents(old_content, new_content);
  removeFooter();
}

// Displays the about page when the button is clicked. Load content from a static
// file based on the given language, and display it in a #contentFrame.links
function outputLinks() {
  if (Show.links.language == undefined) {
    fetchLinksPage();   // Direct link
  }
  else if (Show.links.language != L.display) {
    fetchLinksPage();   // Language change event
  } else {
    var old_content = document.getElementById('contentFrame');
    swapContents(old_content, Show.links.content);
    redrawFooter();
  }
}

// This is the main panda search results function. When the URL #hash changes, process
// it as a change in the search text and present new content in the #contentFrame.
// Based on Query.env.output, there are a handful of different output modes
function outputResults() {
  // window.location.hash doesn't decode UTF-8. This does, fixing Japanese search
  var input = decodeURIComponent(window.location.hash);
  // Start by just displaying info for one panda by id search
  var results = Query.hashlink(input);
  results = results instanceof Array ? results : [results];   // Guarantee array
  var content_divs = [];
  var new_content = document.createElement('div');
  new_content.id = "hiddenContentFrame";
  switch(Query.env.output) {
    case "entities":
      content_divs = outputSearchResultEntities(results);
      break;
    case "photos":
      content_divs = outputSearchResultPhotos(results);
      new_content.style.textAlign = "center";   // Align photos centered in each row
      break;
  }
  var shrinker = document.createElement('div');
  shrinker.className = "shrinker";
  content_divs.forEach(function(content_div) {
    shrinker.appendChild(content_div);
  });
  new_content.appendChild(shrinker);

  // Append the new content into the page and then swap it in
  var old_content = document.getElementById('contentFrame');
  swapContents(old_content, new_content);
  redrawFooter();
}

// Given a search for pandas and zoos, output entity divs
function outputSearchResultEntities(results) {
  var content_divs = [];
  results.forEach(function(entity) {
    if (entity["_id"] < 0) {
      // Zoos get the Zoo div and pandas for this zoo
      content_divs.push(Show.zooInformation(entity, L.display));
      animals = Pandas.sortOldestToYoungest(Pandas.searchPandaZooCurrent(entity["_id"]));
      animals.forEach(function(animal) {
        content_divs.push(Show.pandaInformation(animal, L.display, undefined));
      });
    } else {
      content_divs.push(Show.pandaInformation(entity, L.display, undefined));
    }
  });
  if (results.length == 0) {
    // No results? On desktop, bring up a sad panda
    content_divs.push(Show.displayEmptyResult(L.display));
  }
  return content_divs;
}

function outputSearchResultPhotos(results) {
  var content_divs = [];
  results.forEach(function(entity) {
    if (entity["_id"] < 0) {
      // Zoos have a single photo to get
      content_divs.push(Show.zooPhotoCredits(entity, L.display));
    } else {
      // Pandas have multiple photos, and you'll need to filter on the credited photo
      content_divs = content_divs.concat(Show.pandaPhotoCredits(entity, Query.env.credit, L.display));
    }
  });
  // Write some HTML with summary information for the user and the number of photos
  var header = Show.credit(Query.env.credit, content_divs.length, L.display);
  content_divs.unshift(header);
  // HACK: revert to results mode
  Query.env.clear();
  return content_divs;
}

// Redraw page after an updateLanguage event or similar
function redrawPage(callback) {
  // Redisplay results in the correct language, but only if the Pandas
  // content has already been loaded.
  if ((window.location.hash.length > 0) && (P.db != undefined) && (callback == outputResults)) {
    callback();
  }
  // For non-panda-results page, don't worry if the database is there or not
  if ((window.location.hash.length > 0) && (callback != outputResults)) {
    callback();
  }
}

// Add the footer at the bottom of the page
function redrawFooter() {
  var body = document.getElementsByTagName('body')[0];
  var footer_test = body.lastElementChild;
  if (footer_test.className != "footer") {
    // If no footer exists, add one in
    var footer = Show.footer(L.display);
    body.appendChild(footer);
  } else {
    // Redraw the footer for language event changes
    var footer = Show.footer(L.display);
    body.replaceChild(footer, footer_test);
  }
}

// Remove the footer if returning to the home page
function removeFooter() {
  var body = document.getElementsByTagName('body')[0];
  var footer_test = body.lastElementChild;
  if (footer_test.className == "footer") {
    body.removeChild(footer_test);
  }
}

// Swap in a new contents frame for an old contents frame. Also double-check that
// the footer is still the bottom of the page.
function swapContents(old_content, new_content) {
  // Append the new content into the page and then swap it in
  var body = document.getElementsByTagName('body')[0];
  // Place the new content right after the old content
  old_content.parentNode.insertBefore(new_content, old_content.nextSibling);
  old_content.style.display = "none";
  new_content.style.display = "block";
  body.removeChild(old_content);
  new_content.id = 'contentFrame';
}

/*
    Presentation logic
*/
var Show = {};   // Namespace

Show.S = {};     // Prototype

Show.init = function() {
  var show = Object.create(Show.S);
  return show;
}

Show.page = outputResults;   // Default mode is to show panda results
Show.lastSearch = '#home';   // When un-clicking Links/About, go back to the last panda search

Show.about = {};
Show.about.content = undefined;   // About page content
Show.about.language = undefined;   // Language the content was loaded in
Show.about.loaded = new Event('about_loaded');

Show.emoji = {
  "animal": "🐼",
   "alien": "👽",
   "arrow": "➡",
"birthday": "🎂",
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
    "male": "♂️",
     "map": "🗺️",
   "money": "💸",
  "mother": "👩🏻",
  "random": "🎲",
"star_dad": "👨‍🎤",
"star_mom": "👩‍🎤",
   "story": "🎍",
     "top": "⬆",
  "travel": "✈️",
 "website": "🌐",
     "zoo": "🦁"
}

// TODO: key on other language versions of country names
Show.flags = {
  "Bhutan": "🇧🇹",
  "Canada": "🇨🇦",
   "China": "🇨🇳",
   "India": "🇮🇳",
   "Japan": "🇯🇵",
  "Mexico": "🇲🇽",
   "Nepal": "🇳🇵",
  "Taiwan": "🇹🇼",
     "USA": "🇺🇸"
}

Show.gui = {
  "about": {
    "cn": "關於",
    "en": "About",
    "jp": "概要"
  },
  "credit": {
    "cn": "TOWRITE",
    "en": [Show.emoji.gift + " ",
           "<INSERTUSER>",
           " has contributed ",
           "<INSERTNUMBER>",
           " photos."],
    "jp": [Show.emoji.gift + " ",
           "<INSERTUSER>",
           "は",
           "<INSERTNUMBER>",
           "枚の写真を寄稿しました。"]
  },
  "children": {
    "cn": Pandas.def.relations.children["cn"],
    "en": "Children",   // Capitalization
    "jp": Pandas.def.relations.children["jp"]
  },
  "flag": {
    "cn": Show.flags["China"],
    "en": Show.flags["USA"],
    "jp": Show.flags["Japan"]
  },
  "footer": {
    "cn": "TOWRITE",
    "en": ["All information courtesy of the ",
           "<INSERTLINK>",
           " and red panda fans worldwide. ",
          "Any media linked from this dataset remains property of its creator. ",
          "Layout and design © 2018 Justin Fairchild."],
    "jp": ["<INSERTLINK>", 
           "、世界中のレッサーパンダファンのすべての情報提供。",
           "このデータセットからリンクされたメディアはすべて、作成者の所有物です。",
           "設計©2018 Justin Fairchild"]
  },
  "footerLink": {
    "cn": "TOWRITE",
    "en": "Red Panda Lineage",
    "jp": "Red Panda Lineage"
  },
  "language": {
    "cn": "漢語",
    "en": "English",
    "jp": "日本語"
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
  "parents": {
    "cn": Pandas.def.relations.parents["cn"],
    "en": "Parents",   // Capitalization
    "jp": Pandas.def.relations.parents["jp"]
  },
  "random": {
    "cn": "隨機",
    "en": "Random",
    "jp": "適当"
  },
  "search": {
    "cn": "Search...",
    "en": "Search...",
    "jp": "サーチ..."
  },
  "siblings": {
    "cn": Pandas.def.relations.siblings["cn"],
    "en": "Siblings",   // Capitalization
    "jp": Pandas.def.relations.siblings["jp"]
  },
  "title": {
    "cn": "TOWRITE",
    "en": "Red Panda Family",
    "jp": "レッサーパンダのファミリー"
  }
}

Show.links = {};
Show.links.content = undefined;   // Links page content
Show.links.language = undefined;   // Language the content was loaded in
Show.links.loaded = new Event('links_loaded');

Show.no_result = {
  "cn": "沒有發現熊貓",
  "en": "No Pandas Found",
  "jp": "パンダが見つかりません"
}

// Hashlink routes that map to non-search-results content
Show.routes = {
  "dynamic": [
    "#credit",
    "#panda",
    "#query",
    "#zoo"
  ],
  "fixed": [
    "#about",    // The about page
    "#home",     // The empty query page
    "#links"     // The links page
  ]
}

/*
    Presentation-level data, separated out from final website layout
*/
// Given an animal and a language, obtain the immediate information that would
// be displayed in an information card about the panda, including its zoo and
// its relatives.
Show.acquirePandaInfo = function(animal, language) {
  var photo_index = Query.env.specific == undefined ? "random" : Query.env.specific;
  var picture = Pandas.profilePhoto(animal, photo_index);   // TODO: all photos for carousel
  var bundle = {
            "age": Pandas.age(animal, language),
       "birthday": Pandas.birthday(animal, language),
     "birthplace": Pandas.myZoo(animal, "birthplace", language),
       "children": Pandas.searchPandaChildren(animal["_id"]),
          "death": Pandas.date(animal, "death", language),
            "dad": Pandas.searchPandaDad(animal["_id"])[0],
         "gender": Pandas.gender(animal, language),
       "get_name": language + ".name",
       "language": language,
 "language_order": Pandas.language_order(animal),
         "litter": Pandas.searchLitter(animal["_id"]),
            "mom": Pandas.searchPandaMom(animal["_id"])[0],
           "name": Pandas.myName(animal, language),
     "othernames": Pandas.othernames(animal, language),
          "photo": picture['photo'],
   "photo_credit": picture['credit'],
     "photo_link": picture['link'],
       "siblings": Pandas.searchNonLitterSiblings(animal["_id"]),
            "zoo": Pandas.myZoo(animal, "zoo")
  }
  bundle = Language.fallbackInfo(bundle, animal);  // Any defaults here?
  return bundle;
}

// Given a zoo, return an address, location, link to a website, and information
// about the number of pandas (living) that are at the zoo
Show.acquireZooInfo = function(zoo, language) {
  var animals = Pandas.searchPandaZooCurrent(zoo["_id"]);
  var recorded = Pandas.searchPandaZooBornLived(zoo["_id"]);
  var bundle = {
       "animals": animals,
       "address": Pandas.zooField(zoo, language + ".address"),
  "animal_count": animals.length,
      "get_name": language + ".name",
      "language": language,
"language_order": Pandas.language_order(zoo),
      "location": Pandas.zooField(zoo, language + ".location"),
          "name": Pandas.zooField(zoo, language + ".name"),
         "photo": Pandas.zooField(zoo, "photo"),
  "photo_credit": Pandas.zooField(zoo, "photo.author"),
    "photo_link": Pandas.zooField(zoo, "photo.link"),
      "recorded": recorded,
"recorded_count": recorded.length,
       "website": Pandas.zooField(zoo, "website")
  }
  bundle = Language.fallbackInfo(bundle, zoo);  // Any defaults here?
  return bundle;
}

// Construct an animal link as per parameters. Options include
// whether to do a mom/dad/boy/girl icon, or whether to do a 
// link within the page, versus a page wipe and redisplay.
// Default link text requires a language translation.
// Examples:
//    https://domain/search/index.html#panda/Lychee
//    https://domain/search/index.html#panda/4
Show.animalLink = function(animal, link_text, language, options) {
  // Don't print content if the input id is zero. If these are
  // fill-in links for moms or dads, use the Aladdin Sane icons :)
  if (animal['_id'] == Pandas.def.animal['_id']) {
    var alien = Show.emoji.alien;
    if (options.indexOf("mom_icon") != -1) {
      alien = Show.emoji.star_mom;
    }
    if (options.indexOf("dad_icon") != -1) {
      alien = Show.emoji.star_dad;
    }
    return Show.emptyLink(alien + " " + link_text);
  }

  // Set up values for other functions working properly
  // Gender search requires doing a table search by language.
  var gender = Pandas.gender(animal, language);
  var a = document.createElement('a');
  var inner_text = link_text;
  // Option to display gender face
  if (options.indexOf("child_icon") != -1) {
    inner_text = Show.displayChildIcon(gender) + " " + inner_text;
  }
  // Moms and dads have older faces
  if (options.indexOf("mom_icon") != -1) {
    inner_text = Show.emoji.mother + " " + inner_text;
  }
  if (options.indexOf("dad_icon") != -1) {
    inner_text = Show.emoji.father + " " + inner_text;
  }
  // Half siblings indicator
  if (options.indexOf("half_icon") != -1) {
    inner_text = inner_text + " " + "½"
  }
  if ((options.indexOf("live_icon") != -1) && ("death" in animal)) {
    a.className = "passedAway";
    inner_text = inner_text + " " + Show.emoji.died;
  }
  a.innerText = inner_text;
  if (options.indexOf("in_link") != -1) {
    // in_link: that finds a location on the displayed data
    a.href = "#panda" + "_" + animal['_id'];
  } else {
    // go_link: creates a new results frame based on desired data
    a.href = "#panda" + "/" + animal['_id'];
  }
  return a;
}

// If link is to an undefined item or the zero ID, return a spacer
// TODO: final page layout
Show.emptyLink = function(output_text) {
  var a = document.createElement('a');
  a.innerText = output_text;
  a.href = '#not_sure_yet';
  return a;
}

// Read from info.othernames, and if it's not a language default, 
// add an alternate spelling to the name information.
Show.furigana = function(name, othernames) {
  if (othernames == Pandas.def.animal["jp.othernames"]) {
    return false;
  }
  othernames = othernames.split(',')   // Guarantee array
  othernames = othernames.filter(function(option) {
    if (Language.editDistance(name, option) > 1) {
      return option;
    }
  });
  if (othernames.length == 0) {
    return false;
  }
  var chosen = othernames[0];
  var p = document.createElement('p');
  p.className = "furigana";
  p.innerText = "(" + chosen + ")";
  return p;
}

// Construct a location string based on recorded location info for a zoo.
// This will optionally replace a country name with a flag, which takes
// less horizontal space and conforms to the general in-flow emoji style
// of the display logic elsewhere in the search results.
Show.homeLocation = function(zoo, desired_text, language, options) {
  // Don't print content if the input id is zero
  if (zoo['_id'] == Pandas.def.zoo['_id']) {
    return Pandas.def.zoo[language + ".location"];
  }
  var output_text = desired_text;
  if (options.indexOf("map_icon") != -1) {
    output_text = Show.emoji.map + " " + output_text;
  }
  if ("country_flag" in options) {
    // Replace any country names in location details with a flag
    var countries = Object.keys(Show.flags).filter(function(key) {
      if (output_text.indexOf(key) != -1) {
        return key;
      }
    });
    countries.forEach(function(place) {
      output_text.replace(place, Show.flags[place]);
    });
  }
  return output_text;
}

// Construct a zoo link as per design docs. Examples:
//    https://domain/search/index.html#zoo/1
// Show.zooLink = function(zoo, link_text, options) {
Show.zooLink = function(zoo, link_text, language, options) {
  // Don't print content if the input id is zero
  if (zoo['_id'] == Pandas.def.zoo['_id']) {
    return Show.emptyLink(Pandas.def.zoo[language + ".name"]);
  }
  var a = document.createElement('a');
  var inner_text = link_text;
  // Options processing
  if (options.indexOf("home_icon") != -1) {
    inner_text = Show.emoji.home + " " + inner_text;
  }
  if (options.indexOf("map_icon") != -1) {
    inner_text = Show.emoji.map + " " + inner_text;
  }
  a.innerText = inner_text;
  if (options.indexOf("in_link") != -1) {
    // in_link: that finds a location on the displayed data
    a.href = "#zoo" + "_" + zoo['_id'];
  } else {
    // go_link: creates a new results frame based on desired data
    a.href = "#zoo" + "/" + zoo['_id'];
  }
  return a;
}

/*
    Displayed output in the webpage
*/
// Draw a header for crediting someone's photos contribution 
// with the correct language
Show.credit = function(credit, count, language) {
  var p = document.createElement('p');
  for (var i in Show.gui.credit[language]) {
    var field = Show.gui.credit[language][i];
    if (field == "<INSERTUSER>") {
      field = credit;
      var msg = document.createElement('i');
      msg.innerText = field;
      p.appendChild(msg);
    } else if (field == "<INSERTNUMBER>") {
      field = count;
      var msg = document.createElement('b');
      msg.innerText = field;
      p.appendChild(msg);
    } else {
      var msg = document.createTextNode(field);
      p.appendChild(msg);
    }
  }
  var shrinker = document.createElement('div');
  shrinker.className = "shrinker";
  shrinker.appendChild(p);
  var footer = document.createElement('div');
  footer.className = "creditSummary";
  footer.appendChild(shrinker);
  return footer;
}

// If the panda search result returned nothing, output a card
// with special "no results" formatting.
Show.displayEmptyResult = function(language) {
  var message = document.createElement('div');
  message.className = 'overlay';
  message.innerText = Show.no_result[language];
  var image = document.createElement('img');
  image.src = "images/no-panda.jpg";
  var result = document.createElement('div');
  result.className = 'emptyResult';
  result.appendChild(image);
  result.appendChild(message);
  return result;
}

// Male and female icons next to pandas used for panda links.
// This uses unlocalized m/f/unknown gender values, and displays
// an alien face if the gender is not determined as a joke
Show.displayChildIcon = function(gender) {
  if (Object.values(Pandas.def.gender.Male).indexOf(gender) != -1) {
    return Show.emoji.boy;
  } else if (Object.values(Pandas.def.gender.Female).indexOf(gender) != -1) {
    return Show.emoji.girl;
  } else {
    return Show.emoji.baby;
  }
}

// Use localized alt-text, and display SVG gender information
// so that padding can work consistently on mobile.
Show.displayGender = function(info) {
  var language = info.language;
  var img = document.createElement('img');
  if (info.gender == Pandas.def.gender.Male[language]) {
    img.src = "images/male.svg";
  } else if (info.gender == Pandas.def.gender.Female[language]) {
    img.src = "images/female.svg";
  } else {
    img.src = "images/unknown.svg";
  }
  img.alt = info.gender;
  var gender = document.createElement('div');
  gender.className = "gender";
  gender.appendChild(img);
  return gender;
}

// Display panda children in the family section
Show.displayPandaChildren = function(info) {
  var heading = document.createElement('h4');
  heading.className = "childrenHeading" + " " + info.language;
  heading.innerText = Show.gui.children[info.language];
  var ul = document.createElement('ul');
  ul.className = "pandaList";
  for (index in Pandas.sortOldestToYoungest(info.children)) {
    var animal = info.children[index];
    var children_link = Show.animalLink(animal, animal[info.get_name], 
                                        info.language, ["child_icon", "live_icon"])
    var li = document.createElement('li');
    li.appendChild(children_link);
    ul.appendChild(li);
  }
  var children = document.createElement('div');
  children.className = 'children';
  children.appendChild(heading);
  children.appendChild(ul);
  return children;
}

// The dossier of information for a single panda.
// This is the purple main information stripe for a panda.
Show.displayPandaDetails = function(info) {
  var language = info.language;
  var born = document.createElement('p');
  born.innerText = Show.emoji.born + " " + info.birthday;
  // If still alive, print their current age
  var second = document.createElement ('p');
  if (info.death == Pandas.def.unknown[language]) {
    second.innerText = "(" + info.age + ")";
  } else {
    second.innerText = Show.emoji.died + " " + info.death;
  }
  var zoo = document.createElement('p');
  var zoo_link = Show.zooLink(info.zoo, info.zoo[language + ".name"], language, ["home_icon"]);
  zoo.appendChild(zoo_link);
  var location = document.createElement('p');
  location.innerText = Show.homeLocation(info.zoo, info.zoo[language + ".location"],
                                         language, ["map_icon", "country_flag"]);
  var credit_link = document.createElement('a');
  credit_link.href = info.photo_link;
  credit_link.innerText = Show.emoji.camera + " " + info.photo_credit;
  var credit = document.createElement('p');
  credit.appendChild(credit_link);
  var details = document.createElement('div');
  details.className = "pandaDetails";
  details.appendChild(born);
  if ((info.age != undefined) && (info.age != "unknown")) {
    details.appendChild(second);
  }
  details.appendChild(zoo);
  details.appendChild(location);
  if (info.photo_credit != undefined) {
    details.appendChild(credit);
    // See how many other panda photos this user has posted
    var other_photos = document.createElement('p');
    var credit_count_link = document.createElement('a');
    credit_count_link.href = "#credit/" + info.photo_credit;
    credit_count_link.innerText = Show.emoji.gift + " " + P.db._photo.credit[info.photo_credit];
    other_photos.appendChild(credit_count_link);
    details.appendChild(other_photos);
  }
  return details;
}

// Display lists of family information, starting with parents,
// then adding immediate littermates, and finally including the
// other siblings, ordered by birthday. This is the pink stripe
// at the bottom of a family dossier.
Show.displayPandaFamily = function(info) {
  var family = document.createElement('div');
  family.className = "family";
  if ((info.dad == undefined && info.mom == undefined) &&
      (info.litter.length == 0) &&
      (info.siblings.length == 0) &&
      (info.children.length == 0))  {
    return family;   // No documented family
  }
  if (info.dad != undefined || info.mom != undefined) {
    var parents = Show.displayPandaParents(info);
    family.appendChild(parents);
  }
  if (info.litter.length > 0) {
    var litter = Show.displayPandaLitter(info);
    family.appendChild(litter);
  }
  if (info.siblings.length > 0) {
    var siblings = Show.displayPandaSiblings(info);
    family.appendChild(siblings);
  }
  if (info.children.length > 0) {
    var children = Show.displayPandaChildren(info);
    family.appendChild(children);
  }
  // TODO: media queries. If four columns on mobile, swap
  // litter and siblings columns to get better balancing.
  // Four columns means the litter should be defined
  if ((family.children.length == 4) &&
      (window.matchMedia("(max-width: 670px)").matches == true)) {
    family.childNodes[2].parentNode.insertBefore(family.childNodes[2], family.childNodes[1]);
  }
  return family;
}

// Do the littermates info in the family section
Show.displayPandaLitter = function(info) {
  var heading = document.createElement('h4');
  heading.className = "litterHeading" + " " + info.language;
  heading.innerText = Show.gui.litter[info.language];
  var ul = document.createElement('ul');
  ul.className = "pandaList";
  for (index in Pandas.sortOldestToYoungest(info.litter)) {
    var animal = info.litter[index];
    var litter_link = Show.animalLink(animal, animal[info.get_name], 
                                      info.language, ["child_icon", "live_icon"])
    var li = document.createElement('li');
    li.appendChild(litter_link);
    ul.appendChild(li);
  }
  var litter = document.createElement('div');
  litter.className = 'litter';
  litter.appendChild(heading);
  litter.appendChild(ul);
  return litter;
}

// Do mom and dad's info in the family section
Show.displayPandaParents = function(info) {
  var heading = document.createElement('h4');
  heading.className = "parentsHeading" + " " + info.language;
  heading.innerText = Show.gui.parents[info.language];
  var ul = document.createElement('ul');
  ul.className = "pandaList";
  var mom_li = document.createElement('li');
  var mom_link = "";
  if (info.mom != undefined) {
    mom_link = Show.animalLink(info.mom, info.mom[info.get_name],
                               info.language, ["mom_icon", "live_icon"]);
  } else {
    mom_link = Show.animalLink(Pandas.def.animal, Pandas.def.no_name[info.language],
                               info.language, ["mom_icon"])
  }
  mom_li.appendChild(mom_link);
  ul.appendChild(mom_li);
  var dad_li = document.createElement('li');
  var dad_link = "";
  if (info.dad != undefined) {
    dad_link = Show.animalLink(info.dad, info.dad[info.get_name], 
                               info.language, ["dad_icon", "live_icon"]);
  } else {
    dad_link = Show.animalLink(Pandas.def.animal, Pandas.def.no_name[info.language],
                               info.language, ["dad_icon"])
  }
  dad_li.appendChild(dad_link);
  ul.appendChild(dad_li);
  var parents = document.createElement('div');
  parents.className = 'parents';
  parents.appendChild(heading);
  parents.appendChild(ul);
  return parents;
}

// Do the non-litter siblings info in the family section
Show.displayPandaSiblings = function(info) {
  var heading = document.createElement('h4');
  heading.className = "siblingsHeading" + " " + info.language;
  heading.innerText = Show.gui.siblings[info.language];
  var ul = document.createElement('ul');
  ul.className = "pandaList";
  for (index in Pandas.sortOldestToYoungest(info.siblings)) {
    var animal = info.siblings[index];
    var options = ["child_icon", "live_icon"];
    var test_mom = Pandas.searchPandaMom(animal["_id"])[0];
    var test_dad = Pandas.searchPandaDad(animal["_id"])[0];
    if (!((test_mom == info.mom) && (test_dad == info.dad)) &&
         ((test_mom != undefined) && (test_dad != undefined)) &&
         ((info.mom != undefined) && (info.dad != undefined))) {
      options.push("half_icon");
    }
    var siblings_link = Show.animalLink(animal, animal[info.get_name], 
                                        info.language, options);
    var li = document.createElement('li');
    li.appendChild(siblings_link);
    ul.appendChild(li);
  }
  var siblings = document.createElement('div');
  siblings.className = 'siblings';
  siblings.appendChild(heading);
  siblings.appendChild(ul);
  return siblings;
}

// Display the name and gender symbol for a single panda in the "title bar"
Show.displayPandaTitle = function(info) {
  var language = info.language;
  var gender = Show.displayGender(info);
  var name_div = document.createElement('div');
  name_div.className = 'pandaName';
  // In Japanese, display one of the "othernames" as furigana
  if (language == "jp") {
    name_div.innerText = info.name;
    var furigana = Show.furigana(info.name, info.othernames);
    if (furigana != false) {
      name_div.appendChild(furigana);
    }
  } else {
    name_div.innerText = info.name;
  }
  var title_div = document.createElement('div');
  title_div.className = "pandaTitle";
  title_div.appendChild(gender);
  title_div.appendChild(name_div);
  return title_div;
}

// If the media exists for a panda, display it. If it's missing,
// display a placeholder empty frame that takes up the same amount
// of space on the page.
Show.displayPhoto = function(info, frame_class, fallback) {
  var image = document.createElement('img');
  if (info.photo == undefined) {
    image.src = fallback;
  } else {
    image.src = info.photo;
  }
  image.onerror = "this.src='" + fallback + "'";
  var div = document.createElement('div');
  div.className = frame_class;
  div.appendChild(image);
  return div;
}

// The dossier of information for a single zoo.
// This is the purple main information stripe for a zoo.
Show.displayZooDetails = function(info) {
  var language = info.language;
  var counts = document.createElement('p');
  var count_text = {
    "en": [ 
      info.animal_count,
      "current red pandas, and",
      info.recorded_count,
      "recorded in the database."
    ].join(' '),
    "jp": [
      "現在",
      info.animal_count,
      "頭のレッサーパンダがいます。(データベースには",
      info.recorded_count,
      "頭の記録があります)"
    ].join('')
  }
  counts.innerText = Show.emoji.animal + " " + count_text[language];
  var address = document.createElement('p');
  address.innerText = Show.emoji.travel + " " + info.address;
  var zoo_page = document.createElement('p');
  var zoo_link = document.createElement('a');
  zoo_link.href = info.website;
  zoo_link.innerText = Show.emoji.website + " " + info.name;
  zoo_page.appendChild(zoo_link);
  var details = document.createElement('div');
  details.className = "zooDetails";
  details.appendChild(counts);
  details.appendChild(address);
  details.appendChild(zoo_page);
  // Photo details are optional for zoos, so don't show the
  // photo link if there's no photo included in the dataset
  if (info.photo != undefined) {
    var photo_page = document.createElement('p');
    var photo_link = document.createElement('a');
    photo_link.href = info.photo_link;
    photo_link.innerText = Show.emoji.camera + " " + info.photo_credit;
    photo_page.appendChild(photo_link);
    details.appendChild(photo_page);
  }
  return details;
}

// Display the name of a zoo in the "title bar"
Show.displayZooTitle = function(info) {
  var name_div = document.createElement('div');
  name_div.className = 'zooName';
  // No furigana for zoo names
  name_div.innerText = info.name;
  var title_div = document.createElement('div');
  title_div.className = "pandaTitle";
  title_div.appendChild(name_div);
  return title_div;
}

// Draw a footer with the correct language
Show.footer = function(language) {
  var p = document.createElement('p');
  var top_link = document.createElement('a');
  top_link.className = "emojiLink";
  top_link.id = "pageTop";
  top_link.href = "javascript:;";
  top_link.innerText = Show.emoji.top;
  // anchor tags get used for JS redraws, so don't use an anchor tag for
  // top-of-page scroll events. This fixes the language button after clicking pageTop.
  top_link.addEventListener("click", function() {
    window.scrollTo(0, 0);
  });
  p.appendChild(top_link);
  for (var i in Show.gui.footer[language]) {
    var field = Show.gui.footer[language][i];
    if (field == "<INSERTLINK>") {
      var rpl = document.createElement('a');
      rpl.href = "https://github.com/wwoast/redpanda-lineage";
      rpl.innerText = Show.gui.footerLink[language];
      p.appendChild(rpl);
    } else {
      var msg = document.createTextNode(field);
      p.appendChild(msg);
    }
  }
  var shrinker = document.createElement('div');
  shrinker.className = "shrinker";
  shrinker.appendChild(p);
  var footer = document.createElement('div');
  footer.className = "footer";
  footer.appendChild(shrinker);
  return footer;
}

// Display a text dossier of information for a panda. Most missing
// elements should not be displayed, but a few should be printed 
// regardless, such as birthday / time of death. 
// The "slip_in" value is a contextual reference to the initial search,
// something like "Melody's brother" or "Harumaki's mom".
Show.pandaInformation = function(animal, language, slip_in) {
  var info = Show.acquirePandaInfo(animal, language);
  var photo = Show.displayPhoto(info, 'pandaPhoto', 'images/no-panda.jpg');
  var title = Show.displayPandaTitle(info);
  var details = Show.displayPandaDetails(info); 
  var family = Show.displayPandaFamily(info);
  var dossier = document.createElement('div');
  dossier.className = "pandaDossier";
  dossier.appendChild(title);
  dossier.appendChild(details);
  dossier.appendChild(family);
  var result = document.createElement('div');
  result.className = "pandaResult";
  result.appendChild(photo);
  result.appendChild(dossier);
  return result; 
}

// Take an animal, and return a list of divs for all the photos of that animal
// that match the username that was searched. Used for making reports of all
// the photos in the website contributed by a single author.
Show.pandaPhotoCredits = function(animal, credit, language) {
  var content_divs = [];
  var photos = [];
  var info = Show.acquirePandaInfo(animal, language);
  var photo_indexes = Pandas.photoGeneratorEntity;
  for (let field_name of photo_indexes(animal)) {
    if (animal[field_name + ".author"] == credit) {
      photos.push({"image": animal[field_name], "index": field_name});
    }
  }
  for (let item of photos) {
    var photo = item.image;
    var index = item.index.split(".")[1];
    var img_link = document.createElement('a');
    // Link to the original instagram media
    img_link.href = photo.replace("/media/?size=m", "");
    var img = document.createElement('img');
    img.src = photo.replace('/?size=m', '/?size=t');
    img_link.appendChild(img);
    var caption_link = document.createElement('a');
    caption_link.href = "#panda/" + animal._id + "/photo/" + index;
    var caption = document.createElement('h5');
    caption.className = "caption";
    caption.innerText = info.name;
    caption_link.appendChild(caption);
    var container = document.createElement('div');
    container.className = "photoSample";
    container.appendChild(img_link);
    container.appendChild(caption_link);
    content_divs.push(container);
  }
  return content_divs;
}

// Display information for a zoo relevant to the red pandas
Show.zooInformation = function(zoo, language) {
  var info = Show.acquireZooInfo(zoo, language);
  var photo = Show.displayPhoto(info, 'zooPhoto', 'images/no-zoo.jpg');
  var title = Show.displayZooTitle(info);
  var details = Show.displayZooDetails(info);
  var dossier = document.createElement('div');
  dossier.className = "zooDossier";
  dossier.appendChild(title);
  dossier.appendChild(details);
  var result = document.createElement('div');
  result.className = "zooResult";
  result.appendChild(photo);
  result.appendChild(dossier);
  return result;
}

// Take a zoo, and return the photo. Assumes that you have a match
// that match the username that was searched. Used for making reports of all
// the photos in the website contributed by a single author.
Show.zooPhotoCredits = function(zoo, language) {
  var info = Show.acquireZooInfo(zoo, language);
  var img_link = document.createElement('a');
  // Link to the original instagram media
  img_link.href = zoo.photo.replace("/media/?size=m", "");
  var img = document.createElement('img');
  img.src = zoo.photo;
  img_link.appendChild(img);
  var caption_link = document.createElement('a');
  caption_link.href = "#zoo/" + zoo._id;
  var caption = document.createElement('h5');
  caption.className = "caption";
  caption.innerText = info.name;
  caption_link.appendChild(caption);
  var container = document.createElement('div');
  container.className = "photoSample";
  container.appendChild(img_link);
  container.appendChild(caption_link);
  return container;
}

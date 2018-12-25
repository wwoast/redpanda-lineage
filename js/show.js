/*
    Mobile meta-tag support for various phone/tablet font scales
*/
(function() {
  if ( navigator.platform === "iPad" ) {
    var scale = 1.2;
    document.write('<meta name="viewport" content="width=device-width, initial-scale='+scale+', minimum-scale='+scale+', maximum-scale='+scale+', user-scalable=0" />');
  } else if ( navigator.platform === "iPhone" ) {
    var scale = 1.0;
    document.write('<meta name="viewport" content="width=device-width, initial-scale='+scale+', minimum-scale='+scale+', maximum-scale='+scale+', user-scalable=0" />');
  } else if ( navigator.userAgent.indexOf("Android") != -1 ) {
    var scale = 1.0;
    document.write('<meta name="viewport" content="width=device-width, initial-scale-'+scale+', minimum-scale='+scale+', maximum-scale='+scale+', user-scalable=0, target-densitydpi="device-dpi" />');
  } else {
    return;
  }
})();

/*
    Global objects usable by forms, and things that operate as the page loads
*/
var P;   // Pandas
var Q;   // Query stack
var L;   // Language methods and current language
var T;   // Touch object
var G;   // Lineage graph

/*
    Once page has loaded, add new event listeners for search processing
*/
document.addEventListener("DOMContentLoaded", function() {
  P = Pandas.init();
  Q = Query.init();
  L = Language.init();
  T = Touch.init();
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
        // Add event listeners to the newly created About page buttons
        sectionButtonEventHandlers("aboutPageMenu");
        // Display correct subsection of the about page (class swaps)
        // Default: usage instructions appear non-hidden.
        showSection(Show.subMenu.getItem("aboutPageMenu"));
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
        // Add event listeners to the newly created About page buttons
        sectionButtonEventHandlers("linksPageMenu");
        // Display correct subsection of the about page (class swaps)
        // Default: usage instructions appear non-hidden.
        showSection(Show.subMenu.getItem("linksPageMenu"));
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

  // Fetch the about page and links page contents for each language
  fetchAboutPage();
  fetchLinksPage();

  // If a previous page was seen, load it
  var last_seen = window.localStorage.getItem("last_seen");
  var current_hash = window.location.hash;
  if ((last_seen != null) && (current_hash.length == 0)) {
    window.location.hash = last_seen;
  }
});

// When a hashlink is clicked from a non-links or non-about page, it should
// output results for pandas. Save the hashlink as a value to be loaded if the page
// is closed.
window.addEventListener('hashchange', function() {
  if (Show.routes.fixed.includes(window.location.hash) == false) {
    outputResults();
    Show.page = outputResults;
  } else if (window.location.hash == "#home") {
    outputHome();
    Show.page = outputHome;
  }
  window.localStorage.setItem("last_seen", window.location.hash);
});

// Once the about-page content is loaded, decide whether to display the
// contents or just keep them stashed.
window.addEventListener('about_loaded', function() {
  if (window.location.hash == "#about") {
    outputAbout();
    // Add event listeners to the newly created About page buttons
    sectionButtonEventHandlers("aboutPageMenu");
    // Display correct subsection of the about page (class swaps)
    // Default: usage instructions appear non-hidden.
    showSection(Show.subMenu.getItem("aboutPageMenu"));
    Show.page = outputAbout;
  }
});

// Once the links-page content is loaded, decide whether to display the
// contents or just keep them stashed.
window.addEventListener('links_loaded', function() {
  if (window.location.hash == "#links") {
    outputLinks();
    // Add event listeners to the newly created About page buttons
    sectionButtonEventHandlers("linksPageMenu");
    // Display correct subsection of the about page (class swaps)
    // Default: usage instructions appear non-hidden.
    showSection(Show.subMenu.getItem("linksPageMenu"));
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

// Fetch the about page contents, and add the event listeners for how buttons
// load different sections of the about page.
function fetchAboutPage() {
  var base = "/fragments/";
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
  var base = "/fragments/";
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
    Show.subMenuDefaults();   // Initialize submenus if necessary
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

// Displays the links page when the button is clicked. Load content from a static
// file based on the given language, and display it in a #contentFrame.links
function outputLinks() {
  if (Show.links.language == undefined) {
    fetchLinksPage();   // Direct link
  }
  else if (Show.links.language != L.display) {
    fetchLinksPage();   // Language change event
  } else {
    Show.subMenuDefaults();   // Initialize submenus if necessary
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

// Add the footer at the bottom of the page, including a footer menu (TODO)
function redrawFooter() {
  var body = document.getElementsByTagName('body')[0];
  var footer_test = body.lastElementChild;
  if (footer_test.className != "footer") {
    // If no footer exists, add one in
    var bottomMenu = Show.bottomMenu(L.display);
    var footer = Show.footer(L.display);
    body.appendChild(bottomMenu);
    body.appendChild(footer);
  } else {
    // Also replace the footer menu
    var bottomMenu_test = document.getElementById("pageBottom");
    // Redraw the footer for language event changes
    var bottomMenu = Show.bottomMenu(L.display);
    var footer = Show.footer(L.display);
    body.replaceChild(bottomMenu, bottomMenu_test);
    body.replaceChild(footer, footer_test);
  }
}

// Remove the footer and bottom menu if returning to the home page
function removeFooter() {
  var body = document.getElementsByTagName('body')[0];
  var footer_test = body.lastElementChild;
  if (footer_test.className == "footer") {
    var bottomMenu_test = document.getElementById("pageBottom");
    body.removeChild(bottomMenu_test);
    body.removeChild(footer_test);
  }
}

// Swap in a new contents frame for an old contents frame. 
// After calling this, double-check that the footer 
// is still the bottom of the page.
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

// The about page and links page have menus with buttons that
// cause subsections to appear or disappear as needed.
function sectionButtonEventHandlers(section_menu_id) {
  var menu = document.getElementById(section_menu_id);
  // Find all button subelements of the menu
  var buttons = document.getElementsByClassName("sectionButton");
  // For each button, add an event handler to show the section
  // related to the button's id. Example:
  //    aboutPage_button => shows aboutPage
  for (var button of buttons) {
    button.addEventListener('click', function() {
      var show_section_id = this.id.split("_")[0];
      var menu_id = this.parentNode.id;
      showSection(show_section_id);
      // TODO: set new uri representing sub-page
      // Set subMenu state. This is used to validate
      // what page to show and how the menu will be colored.
      Show.subMenu.setItem(menu_id, show_section_id);
    });
  }
}

// For pages with hidden sections, get a list of the section
// containers, and hide all of them but the one provided.
// This requires an id convention where sections are id'ed "name" and the
// buttons that activate those sections are id'ed "name_button"
function showSection(section_id) {
  var desired = document.getElementById(section_id);
  var desired_button = document.getElementById(section_id + "_button");
  // Find currently shown section and hide it
  var sections = document.getElementsByClassName("section");
  var shown = [].filter.call(sections, function(el) {
    return el.classList.contains("hidden") == false;
  })[0];
  // Turn off the existing shown section, and "unselect" its button
  if (shown != undefined) {
    var shown_button = document.getElementById(shown.id + "_button");
    shown.classList.add("hidden");
    shown_button.classList.remove("selected");
  }
  // Remove the hidden class on the desired section, and "select" its button
  desired.classList.remove("hidden");
  desired_button.classList.add("selected");
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
Show.about.content = undefined;    // About page content
Show.about.language = undefined;   // Language the content was loaded in
Show.about.loaded = new Event('about_loaded');

Show.emoji = {
  "animal": "🐼",
   "alien": "👽",
   "arrow": "➡",
  "author": "✍️",
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
 "no_more": "🚫",
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
  "Argentina": "🇦🇷",
     "Bhutan": "🇧🇹",
     "Canada": "🇨🇦",
      "Chile": "🇨🇱",
      "China": "🇨🇳",
      "India": "🇮🇳",
      "Japan": "🇯🇵",
     "Mexico": "🇲🇽",
      "Nepal": "🇳🇵",
"South Korea": "🇰🇷",
     "Taiwan": "🇹🇼",
   "Thailand": "🇹🇭",
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
  "home": {
    "cn": "TOWRITE",
    "en": "Home",
    "jp": "ホメパゲ"
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
    "en": "Red Panda Finder",
    "jp": "レッサーパンダのファインダー"
  },
  "top": {
    "cn": "TOWRITE",
    "en": "Top",
    "jp": "上"
  }
}

Show.links = {};
Show.links.content = undefined;    // Links page content
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

// Use session storage (lost when browser closes) for menu state.
// Potential values are for the menus on the about and links page, so the
// chosen sub-page will reappear when theses pages are regenerated.
//   "aboutPageMenu" can be set to (usage|pandas|contributions)
//   "linksPageMenu" can be set to (community|zoos|friends)
Show.subMenu = window.sessionStorage;

/*
    Presentation-level data, separated out from final website layout
*/
// Given an animal and a language, obtain the immediate information that would
// be displayed in an information card about the panda, including its zoo and
// its relatives.
Show.acquirePandaInfo = function(animal, language) {
  var chosen_index = Query.env.specific == undefined ? "random" : Query.env.specific;
  var picture = Pandas.profilePhoto(animal, chosen_index);   // TODO: all photos for carousel
  var bundle = {
            "age": Pandas.age(animal, language),
       "birthday": Pandas.birthday(animal, language),
     "birthplace": Pandas.myZoo(animal, "birthplace", language),
       "children": Pandas.searchPandaChildren(animal["_id"]),
          "death": Pandas.date(animal, "death", language),
            "dad": Pandas.searchPandaDad(animal["_id"])[0],
         "gender": Pandas.gender(animal, language),
       "get_name": language + ".name",
             "id": animal["_id"],
       "language": language,
 "language_order": Pandas.language_order(animal),
         "litter": Pandas.searchLitter(animal["_id"]),
            "mom": Pandas.searchPandaMom(animal["_id"])[0],
           "name": Pandas.myName(animal, language),
     "othernames": Pandas.othernames(animal, language),
          "photo": picture['photo'],
   "photo_credit": picture['credit'],
    "photo_index": picture['index'],
     "photo_link": picture['link'],
 "photo_manifest": Pandas.photoManifest(animal),
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
           "map": Pandas.zooField(zoo, "map"),
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
//    https://domain/index.html#panda/Lychee
//    https://domain/index.html#panda/4
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

// Used to fade the dogear menu for selecting photos
Show.fade = function(el) {
  var op = 1;  // initial opacity
  if (el.style.display == "none" || el.style.display == "") {
    el.style.display = "block";
  } else {
    el.style.opacity = op;  // Reset the opacity and let exisitng fade just run
    return;
  }
  var timer = setInterval(function () {
    if (op <= 0.05){
      clearInterval(timer);
      el.style.display = 'none';
    }
    el.style.opacity = op;
    el.style.filter = 'alpha(opacity=' + op * 100 + ")";
    op -= 0.10;
  }, 40);
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

// Create a link to a location in Google Maps. This replaces the
// older content from Show.homeLocation, but I may want to make use
// of that function in the future.
Show.locationLink = function(zoo, language) {
  // Don't print content if the input id is zero
  if (zoo['_id'] == Pandas.def.zoo['_id']) {
    return Pandas.def.zoo[language + ".location"];
  }
  var link_text = Show.emoji.map + " " + Show.flags[zoo.flag];
  var google_search = zoo['map'];
  var a = document.createElement('a');
  a.href = google_search;
  a.innerText = link_text;
  a.target = "_blank";   // Open in new tab
  return a;
}

// Set submenu defaults
Show.subMenuDefaults = function() {
  if (Show.subMenu.getItem("aboutPageMenu") == null) {
    Show.subMenu.setItem("aboutPageMenu", "usageGuide");
  }
  if (Show.subMenu.getItem("linksPageMenu") == null) {
    Show.subMenu.setItem("linksPageMenu", "redPandaCommunity");
  }
}

// Construct a zoo link as per design docs. Examples:
//    https://domain/index.html#zoo/1
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
// Draw menu buttons for the bottom menu, or potentially elsewhere.
Show.button = function(id, button_icon, button_text) {
  var button = document.createElement('button');
  button.className = "menu";
  button.id = id;
  var content = document.createElement('div');
  content.className = "buttonContent";
  var icon_div = document.createElement('div');
  icon_div.className = 'icon';
  icon_div.innerText = button_icon;
  var text_div = document.createElement('div');
  text_div.className = 'text';
  text_div.innerText = button_text;
  content.appendChild(icon_div);
  content.appendChild(text_div);
  button.appendChild(content);
  return button;
}

// Draw a bottom menu, for when there are panda search results
Show.bottomMenu = function(language) {
  var menu_div = document.createElement('div');
  menu_div.className = "bottomMenu";
  menu_div.id = "pageBottom";
  var shrinker = document.createElement('div');
  shrinker.className = "shrinker";
  // Currently there are top and home buttons
  // Top button
  var top_icon = Show.emoji.top;
  var top_text = Show.gui.top[language];
  var top_button = Show.button("topButton", top_icon, top_text);
  top_button.addEventListener("click", function() {
    // anchor tags get used for JS redraws, so don't use an anchor tag for
    // top-of-page scroll events. This fixes the language button after clicking pageTop.
    window.scrollTo(0, 0);
  });
  // Home button
  var home_icon = Show.emoji.home;
  var home_text = Show.gui.home[language];
  var home_button = Show.button("homeButton", home_icon, home_text);
  // In mobile mode, logo button at the top doesn't exist so add a home button
  // to the footer bar menu.
  home_button.addEventListener("click", function() {
    // Return to the empty search page
    Show.lastSearch = "#home";
    outputHome();
    window.location = "#home";
    Show.page = outputHome;
  });
  shrinker.appendChild(top_button);
  shrinker.appendChild(home_button);
  menu_div.appendChild(shrinker);
  return menu_div;
}

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
// This uses unlocalized m/f/unknown gender values
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
  // Zoo link is the animal's home zoo, linking to a search 
  // for all living pandas at the given zoo.
  var zoo = document.createElement('p');
  var zoo_link = Show.zooLink(info.zoo, info.zoo[language + ".name"], language, ["home_icon"]);
  zoo.appendChild(zoo_link);
  // Location shows a map icon and a flag icon, and links to
  // a Google Maps search for the "<language>.address" field
  var location = document.createElement('p');
  var location_link = Show.locationLink(info.zoo, language);
  location.appendChild(location_link);
  // Give credit for the person that took this photo
  var credit_link = document.createElement('a');
  credit_link.id = info.id + "/author/" + info.photo_index;   // Carousel
  credit_link.href = info.photo_link;
  credit_link.target = "_blank";   // Open in new tab
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
    credit_count_link.id = info.id + "/counts/" + info.photo_index;   // Carousel
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

// If the media exists for an entity, display it. If it's missing,
// display a placeholder empty frame that takes up the same amount
// of space on the page.
Show.displayPhoto = function(photo, entity_id, photo_id, frame_class, fallback) {
  var image = document.createElement('img');
  if (photo == undefined) {
    image.src = fallback;
  } else {
    image.src = photo;
    image.id = entity_id + "/photo/" + photo_id;   // For carousel
    image.className = entity_id + "/photo";
  }
  image.onerror = "this.src='" + fallback + "'";
  var div = document.createElement('div');
  div.className = frame_class;
  div.appendChild(image);
  // Preload the next and previous images to avoid double-reflow problems
  if (frame_class == "pandaPhoto") {
    var preloads = Show.displayPhotoPreload(entity_id, photo_id);
    for (var preload of preloads) {
      var pre_img = document.createElement('img');
      pre_img.className = "pandaPhoto preload";
      pre_img.src = preload;
      div.appendChild(pre_img);
    }
  }
  // Return the new div
  Show.displayPhotoTouch(image);
  return div;
}

// The hover over or swipe menu for photo navigation
Show.displayPhotoNavigation = function(animal_id, photo_id) {
  var span_link = document.createElement('a');
  span_link.className = "navigatorLink";
  span_link.id = animal_id + "/navigator";
  span_link.href = "javascript:;";
  var span = document.createElement('span');
  span.className = "navigator";
  // Clickable dogears when you have a carousel of more than one photo
  if (Show.photoCount(animal_id) < 2) {
    span.innerText = Show.emoji.no_more;
  } else {
    span.innerText = photo_id;
    span_link.addEventListener('click', function() {  // Left click event
      Show.photoNext(animal_id);
    });
    span_link.addEventListener('contextmenu', function(e) {   // Right click event
      e.preventDefault();   // Prevent normal context menu from firing
      Show.photoPrevious(animal_id);
    });
  }
  span_link.appendChild(span);
  return span_link;
}

// Preload one photo ahead, and one photo behind, into the page without displaying them. 
// This makes it so that only a single page reflow occurs when navigating images.
Show.displayPhotoPreload = function(entity_id, photo_id) {
  var imgs = [];
  var default_photo = Pandas.def.animal["photo.1"];
  var prev_photo = "photo." + (parseInt(photo_id) - 1).toString();
  var next_photo = "photo." + (parseInt(photo_id) + 1).toString();
  var count = Show.photoCount(entity_id);
  var last_photo = "photo." + count.toString();
  var animal = Pandas.searchPandaId(entity_id)[0];
  if (Pandas.field(animal, prev_photo) != default_photo) {
    imgs.push(animal[prev_photo]);
  } else {
    imgs.push(animal[last_photo]);  // Before first item is the last photo in the list
  }
  if (Pandas.field(animal, next_photo) != default_photo) {
    imgs.push(animal[next_photo]);
  } else {
    imgs.push(animal["photo.1"]);  // After last item is back to the first
  }
  // If any of the photos we tried to preload are undefined, remove them from the preload list
  return imgs.filter(function( element ) {
    return element !== undefined;
  });
}

// Touchable carousels for every loaded photo.
Show.displayPhotoTouch = function(photo) {
  photo.addEventListener('touchstart', function(event) {
    Touch.start(event, T, photo.id);
  }, true);
  photo.addEventListener('touchend', function(event) {
    Touch.end(event, T);
  }, true);
  photo.addEventListener('touchmove', function(event) {
    Touch.move(event, T);
  }, true);
  photo.addEventListener('touchcancel', function(event) {
    Touch.cancel(T);
  }, true);
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
  var address_link = document.createElement('a');
  address_link.innerText = Show.emoji.travel + " " + info.address;
  address_link.href = info.map;
  address_link.target = "_blank";   // Open in new tab
  address.appendChild(address_link);
  var zoo_page = document.createElement('p');
  var zoo_link = document.createElement('a');
  zoo_link.href = info.website;
  zoo_link.target = "_blank";   // Open in new tab
  zoo_link.innerText = Show.emoji.website + " " + info.name;
  zoo_page.appendChild(zoo_link);
  var details = document.createElement('div');
  details.className = "zooDetails";
  details.appendChild(counts);
  details.appendChild(address);
  details.appendChild(zoo_page);
  // Photo details are optional for zoos, so don't show the
  // photo link if there's no photo included in the dataset
  if (info.photo != Pandas.def.zoo["photo"]) {
    var photo_page = document.createElement('p');
    var photo_link = document.createElement('a');
    photo_link.href = info.photo_link;
    photo_link.innerText = Show.emoji.camera + " " + info.photo_credit;
    photo_page.appendChild(photo_link);
    details.appendChild(photo_page);
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
// TODO: The "slip_in" value is a contextual reference to the initial search,
// something like "Melody's brother" or "Harumaki's mom".
Show.pandaInformation = function(animal, language, slip_in) {
  var info = Show.acquirePandaInfo(animal, language);
  var photo = Show.displayPhoto(info.photo, info.id, info.photo_index, 'pandaPhoto', 'images/no-panda.jpg');
  var span = Show.displayPhotoNavigation(info.id, info.photo_index);
  photo.appendChild(span);
  photo.addEventListener('mouseover', function() {
    span.style.display = "block";
  });
  photo.addEventListener('mouseout', function() {
    span.style.display = "none";
  });
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
  for (let field_name of photo_indexes(animal, 0)) {
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
    img_link.target = "_blank";   // Open in new tab
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

// Utility function to get the current number of photos.
Show.photoCount = function(animal_id) {
  var animal = Pandas.searchPandaId(animal_id)[0];
  var photo_manifest = Pandas.photoManifest(animal);
  var max_index = Object.values(photo_manifest).length;
  return max_index;
}

// Navigation input event -- load the next photo in the carousel
Show.photoNext = function(animal_id) {
  var current_photo = document.getElementsByClassName(animal_id + "/photo")[0];
  var current_photo_id = current_photo.id.split("/")[2];
  Show.photoSwap(current_photo, parseInt(current_photo_id) + 1);
}

// Navigation input event -- load the previous photo in the carousel
Show.photoPrevious = function(animal_id) {
  var current_photo = document.getElementsByClassName(animal_id + "/photo")[0];
  var current_photo_id = current_photo.id.split("/")[2];
  Show.photoSwap(current_photo, parseInt(current_photo_id) - 1);
}

// Switch the currently displayed photo to the next one in the list
Show.photoSwap = function(photo, desired_index) {
  var span_link = photo.parentNode.childNodes[photo.parentNode.childNodes.length - 1];
  var [animal_id, _, photo_id] = photo.id.split("/");
  var animal = Pandas.searchPandaId(animal_id)[0];
  var photo_manifest = Pandas.photoManifest(animal);
  var max_index = Object.values(photo_manifest).length;
  var new_index = 1;   // Fallback value
  if (desired_index < 1) {
    new_index = max_index;
  } else if (desired_index > max_index) {
    new_index = (desired_index % max_index);
  } else {
    var new_index = desired_index;
  }
  var chosen = "photo." + new_index.toString();
  var new_choice = photo_manifest[chosen];
  var new_container = Show.displayPhoto(new_choice, animal_id, new_index.toString(), 
                                        "pandaPhoto", "images/no-panda.jpg");
  var new_photo = new_container.childNodes[0];
  // Replace the span navigation id if we have an actual carousel
  if (max_index > 1) {
    span_link.childNodes[0].innerText = new_index.toString();
  } else {
    return;  // No carousel, no need to actually swap photos
  }
  // Update existing photo element with info from the frame we switched to
  photo.src = new_photo.src;
  photo.id = new_photo.id;
  photo.className = new_photo.className;
  Show.displayPhotoTouch(new_photo);
  var photo_info = Pandas.profilePhoto(animal, new_index);
  // Replace the animal credit info
  var credit_link = document.getElementById(animal_id + "/author/" + photo_id);
  credit_link.id = animal_id + "/author/" + new_index;
  credit_link.href = photo_info["link"];
  credit_link.target = "_blank";   // Open in new tab
  credit_link.innerText = Show.emoji.camera + " " + photo_info["credit"];
  // And the photographer credit's apple points
  var apple_link = document.getElementById(animal_id + "/counts/" + photo_id);
  apple_link.id = animal_id + "/counts/" + new_index;
  apple_link.href = "#credit/" + photo_info["credit"];
  apple_link.innerText = Show.emoji.gift + " " + P.db._photo.credit[photo_info["credit"]];
}

// Display information for a zoo relevant to the red pandas
Show.zooInformation = function(zoo, language) {
  var info = Show.acquireZooInfo(zoo, language);
  var photo = Show.displayPhoto(info.photo, zoo._id, "1", 'zooPhoto', 'images/no-zoo.jpg');
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
  img_link.target = "_blank";   // Open in new tab
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

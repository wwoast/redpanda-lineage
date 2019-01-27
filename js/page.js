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

  L.default();     // Set default language
  checkHashes();   // See if we started on the links or about pages
  L.update();      // Update buttons, displayed results, and cookie state
  redrawPage(Page.current);   // Ready to redraw? Let's go.

  // Once the panda data is loaded, create the graph
  window.addEventListener('panda_data', function() {
    P.db.vertices.forEach(G.addVertex.bind(G));
    P.db.edges   .forEach(G.addEdge  .bind(G));
    // Enable search bar once the page has loaded
    var placeholder = "➤ " + L.gui.search[L.display];
    document.forms['searchForm']['searchInput'].disabled = false;
    document.forms['searchForm']['searchInput'].placeholder = placeholder;
    document.getElementById('searchInput').focus();  // Set text cursor

    // If a hashlink was bookmarked, bring up the results of it
    if ((window.location.hash.length > 0) && 
        (Page.routes.fixed.includes(window.location.hash) == false)) {
      outputResults();
    }

    // Fixes TypeSquare unsetting the input typeface in its own javascript
    setTimeout(function() {
      document.getElementById('searchInput').style.fontFamily = "sans-serif";
    }, 0);
  });

  document.getElementById('logoButton').addEventListener("click", function() {
    // Return to the empty search page
    Page.lastSearch = "#home";
    outputHome();
    window.location = "#home";
    Page.current = outputHome;
  });

  document.getElementById('languageButton').addEventListener("click", function() {
    var language = L.display;
    var options = Object.values(Pandas.def.languages);
    var choice = options.indexOf(language);
    choice = (choice + 1) % options.length;
    var new_language = options[choice];
    L.display = new_language;
    L.update();
    redrawPage(Page.current);
  });  

  document.getElementById('aboutButton').addEventListener("click", function() {
    if (Page.current == outputAbout) {
      // Check the last query done and return to it, if it was a query
      if (Page.routes.fixed.includes(Page.lastSearch) == false) {
        window.location = Page.lastSearch;
      } else {
        window.location = "#home";
      }
    } else {
      // Only save the last page if it wasn't one of the other fixed buttons
      if (Page.routes.fixed.includes(window.location.hash) == false) {
        Page.lastSearch = window.location.hash;
      }
      window.location = "#about";
      if ((Page.about.language != L.display) && (Page.about.language != undefined)) {
        Page.about.fetch();
      } else {
        outputAbout();
        // Add event listeners to the newly created About page buttons
        sectionButtonEventHandlers("aboutPageMenu");
        // Display correct subsection of the about page (class swaps)
        // Default: usage instructions appear non-hidden.
        showSection(Page.subMenu.getItem("aboutPageMenu"));
        Page.current = outputAbout;
      }
    }
  });

  document.getElementById('randomButton').addEventListener("click", function() {
    // Show a random panda from the database when the dice is clicked
    Page.current = outputResults;
    var pandaIds = P.db.vertices.filter(entity => entity._id > 0).map(entity => entity._id);
    window.location = "#query/" + pandaIds[Math.floor(Math.random() * pandaIds.length)];
  });

  document.getElementById('linksButton').addEventListener("click", function() {
    if (Page.current == outputLinks) {
      // Check the last query done and return to it, if it was a query
      if (Page.routes.fixed.includes(Page.lastSearch) == false) {
        window.location = Page.lastSearch;
      } else {
        window.location = "#home";
      }
    } else {
      // Only save the last page if it wasn't one of the other fixed buttons
      if (Page.routes.fixed.includes(window.location.hash) == false) {
        Page.lastSearch = window.location.hash;
      }
      window.location = "#links";
      if ((Page.links.language != L.display) && (Page.links.language != undefined)) {
        Page.links.fetch();
      } else {
        outputLinks();
        // Add event listeners to the newly created About page buttons
        sectionButtonEventHandlers("linksPageMenu");
        // Display correct subsection of the about page (class swaps)
        // Default: usage instructions appear non-hidden.
        showSection(Page.subMenu.getItem("linksPageMenu"));
        Page.current = outputLinks;
      }
    }
  });

  document.getElementById('searchForm').addEventListener("submit", function() {
    Page.current = outputResults;
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
  Page.about.fetch();
  Page.links.fetch();

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
  if (Page.routes.fixed.includes(window.location.hash) == false) {
    outputResults();
    Page.current = outputResults;
  } else if (window.location.hash == "#home") {
    outputHome();
    Page.current = outputHome;
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
    showSection(Page.subMenu.getItem("aboutPageMenu"));
    Page.current = outputAbout;
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
    showSection(Page.subMenu.getItem("linksPageMenu"));
    Page.current = outputLinks;
  }
});

var Page = {};   // Namespace

Page.P = {};     // Prototype

Page.init = function() {
  var page = Object.create(Page.P);
  return page;
}

/*
    Logic related to the "About" page.
    Loads language-specific content over an XHR
*/
Page.about = {};
Page.about.content = undefined;    // About page content
// Fetch the about page contents, and add the event listeners for how buttons
// load different sections of the about page.
Page.about.fetch = function() {
  var base = "/fragments/";
  var specific = L.display + "/about.html";
  var fetch_url = base + specific;
  var request = new XMLHttpRequest();
  request.open('GET', fetch_url);
  request.responseType = 'document';
  request.send();
  request.onload = function() {
    Page.about.content = request.response.getElementById('hiddenContentFrame');
    Page.about.language = L.display;   // What language the content was loaded in
    window.dispatchEvent(Page.about.loaded);   // Report the data has loaded
  }
}
Page.about.language = undefined;   // Language the content was loaded in
Page.about.loaded = new Event('about_loaded');

Page.current = outputResults;   // Default mode is to show panda results.
Page.lastSearch = '#home';      // When un-clicking Links/About, go back to the last panda search

/*
    Logic related to the Links page.
    Loads language-specific content over an XHR
*/
Page.links = {};
Page.links.content = undefined;    // Links page content
// Fetch the links page contents
Page.links.fetch = function() {
  var base = "/fragments/";
  var specific = L.display + "/links.html";
  var fetch_url = base + specific;
  var request = new XMLHttpRequest();
  request.open('GET', fetch_url);
  request.responseType = 'document';
  request.send();
  request.onload = function() {
    Page.links.content = request.response.getElementById('hiddenContentFrame');
    Page.links.language = L.display;   // What language the content was laoaded in
    window.dispatchEvent(Page.links.loaded);   // Report the data has loaded
  }
}

Page.links.language = undefined;   // Language the content was loaded in
Page.links.loaded = new Event('links_loaded');

// Hashlink routes that map to non-search-results content
Page.routes = {
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
Page.subMenu = window.sessionStorage;

/*
    Display modes for the site
*/
// On initial page load, look for specific hashes that represent special buttons
// and immediately load that page if necessary.
function checkHashes() {
  if (Page.routes.dynamic.includes(window.location.hash.split('/')[0])) {
    Page.current = outputResults;
  } else if (window.location.hash == "#about") {
    Page.current = outputAbout;
  } else if (window.location.hash == "#links") {
    Page.current = outputLinks;
  } else {
    Page.current = outputHome;
  }
}

// Displays the about page when the button is clicked. Load content from a static
// file based on the given language, and display it in a #contentFrame.about
function outputAbout() {
  if (Page.about.language == undefined) {
    Page.about.fetch();   // Direct link
  } else if (Page.about.language != L.display) {
    Page.about.fetch();   // Language change event
  } else {
    Page.subMenuDefaults();   // Initialize submenus if necessary
    var old_content = document.getElementById('contentFrame');
    swapContents(old_content, Page.about.content);
    Page.redrawFooter();
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
  if (Page.links.language == undefined) {
    Page.links.fetch();   // Direct link
  }
  else if (Page.links.language != L.display) {
    Page.links.fetch();   // Language change event
  } else {
    Page.subMenuDefaults();   // Initialize submenus if necessary
    var old_content = document.getElementById('contentFrame');
    swapContents(old_content, Page.links.content);
    Page.redrawFooter();
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
  // Call layout adjustment functions to shrink any names that are too long
  Layout.shrinkNames();
  Page.redrawFooter();
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
      content_divs.push(Gallery.zooPhotoCredits(entity, L.display));
    } else {
      // Pandas have multiple photos, and you'll need to filter on the credited photo
      content_divs = content_divs.concat(Gallery.pandaPhotoCredits(entity, Query.env.credit, L.display));
    }
  });
  // Write some HTML with summary information for the user and the number of photos
  var header = Page.credit(Query.env.credit, content_divs.length, L.display);
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
Page.redrawFooter = function() {
  var body = document.getElementsByTagName('body')[0];
  var footer_test = body.lastElementChild;
  if (footer_test.className != "footer") {
    // If no footer exists, add one in
    var bottomMenu = Page.bottomMenu(L.display);
    var footer = Page.footer(L.display);
    body.appendChild(bottomMenu);
    body.appendChild(footer);
  } else {
    // Also replace the footer menu
    var bottomMenu_test = document.getElementById("pageBottom");
    // Redraw the footer for language event changes
    var bottomMenu = Page.bottomMenu(L.display);
    var footer = Page.footer(L.display);
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
Page.swapContents = function(old_content, new_content) {
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
      Page.subMenu.setItem(menu_id, show_section_id);
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

// Draw a bottom menu, for when there are panda search results
Page.bottomMenu = function(language) {
  var menu_div = document.createElement('div');
  menu_div.className = "bottomMenu";
  menu_div.id = "pageBottom";
  var shrinker = document.createElement('div');
  shrinker.className = "shrinker";
  // Currently there are top and home buttons
  // Top button
  var top_icon = L.emoji.top;
  var top_text = L.gui.top[language];
  var top_button = Page.button("topButton", top_icon, top_text);
  top_button.addEventListener("click", function() {
    // anchor tags get used for JS redraws, so don't use an anchor tag for
    // top-of-page scroll events. This fixes the language button after clicking pageTop.
    window.scrollTo(0, 0);
  });
  // Home button
  var home_icon = L.emoji.home;
  var home_text = L.gui.home[language];
  var home_button = Page.button("homeButton", home_icon, home_text);
  // In mobile mode, logo button at the top doesn't exist so add a home button
  // to the footer bar menu.
  home_button.addEventListener("click", function() {
    // Return to the empty search page
    Page.lastSearch = "#home";
    outputHome();
    window.location = "#home";
    Page.current = outputHome;
  });
  shrinker.appendChild(top_button);
  shrinker.appendChild(home_button);
  menu_div.appendChild(shrinker);
  return menu_div;
}

// Draw menu buttons for the bottom menu, or potentially elsewhere.
Page.button = function(id, button_icon, button_text) {
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

// Draw a header for crediting someone's photos contribution 
// with the correct language
Page.credit = function(credit, count, language) {
  var p = document.createElement('p');
  for (var i in L.gui.credit[language]) {
    var field = L.gui.credit[language][i];
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

// Draw a footer with the correct language
Page.footer = function(language) {
  var p = document.createElement('p');
  for (var i in L.gui.footer[language]) {
    var field = L.gui.footer[language][i];
    if (field == "<INSERTLINK>") {
      var rpl = document.createElement('a');
      rpl.href = "https://github.com/wwoast/redpanda-lineage";
      rpl.innerText = L.gui.footerLink[language];
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

// Set submenu defaults
Page.subMenuDefaults = function() {
  if (Page.subMenu.getItem("aboutPageMenu") == null) {
    Page.subMenu.setItem("aboutPageMenu", "usageGuide");
  }
  if (Page.subMenu.getItem("linksPageMenu") == null) {
    Page.subMenu.setItem("linksPageMenu", "redPandaCommunity");
  }
}

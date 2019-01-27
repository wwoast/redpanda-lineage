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
  Page.routes.check();   // See if we started on the links or about pages
  L.update();      // Update buttons, displayed results, and cookie state
  Page.redraw(Page.current);   // Ready to redraw? Let's go.

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
      Page.results.render();
    }

    // Fixes TypeSquare unsetting the input typeface in its own javascript
    setTimeout(function() {
      document.getElementById('searchInput').style.fontFamily = "sans-serif";
    }, 0);
  });

  document.getElementById('logoButton').addEventListener("click", function() {
    // Return to the empty search page
    Page.lastSearch = "#home";
    Page.home.render();
    window.location = "#home";
    Page.current = Page.home.render;
  });

  document.getElementById('languageButton').addEventListener("click", function() {
    var language = L.display;
    var options = Object.values(Pandas.def.languages);
    var choice = options.indexOf(language);
    choice = (choice + 1) % options.length;
    var new_language = options[choice];
    L.display = new_language;
    L.update();
    Page.redraw(Page.current);
  });

  document.getElementById('aboutButton').addEventListener("click", function() {
    if (Page.current == Page.about.render) {
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
        Page.about.render();
        // Add event listeners to the newly created About page buttons
        Page.Page.sections.buttonEventHandlers("aboutPageMenu");
        // Display correct subsection of the about page (class swaps)
        // Default: usage instructions appear non-hidden.
        Page.sections.show(Page.sections.menu.getItem("aboutPageMenu"));
        Page.current = Page.about.render;
      }
    }
  });

  document.getElementById('randomButton').addEventListener("click", function() {
    // Show a random panda from the database when the dice is clicked
    Page.current = Page.results.render;
    var pandaIds = P.db.vertices.filter(entity => entity._id > 0).map(entity => entity._id);
    window.location = "#query/" + pandaIds[Math.floor(Math.random() * pandaIds.length)];
  });

  document.getElementById('linksButton').addEventListener("click", function() {
    if (Page.current == Page.links.render) {
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
        Page.links.render();
        // Add event listeners to the newly created About page buttons
        Page.Page.sections.buttonEventHandlers("linksPageMenu");
        // Display correct subsection of the about page (class swaps)
        // Default: usage instructions appear non-hidden.
        Page.sections.show(Page.sections.menu.getItem("linksPageMenu"));
        Page.current = Page.links.render;
      }
    }
  });

  document.getElementById('searchForm').addEventListener("submit", function() {
    Page.current = Page.results.render;
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
    Page.results.render();
    Page.current = Page.results.render;
  } else if (window.location.hash == "#home") {
    Page.home.render();
    Page.current = Page.home.render;
  }
  window.localStorage.setItem("last_seen", window.location.hash);
});

// Once the about-page content is loaded, decide whether to display the
// contents or just keep them stashed.
window.addEventListener('about_loaded', function() {
  if (window.location.hash == "#about") {
    Page.about.render();
    // Add event listeners to the newly created About page buttons
    Page.sections.buttonEventHandlers("aboutPageMenu");
    // Display correct subsection of the about page (class swaps)
    // Default: usage instructions appear non-hidden.
    Page.sections.show(Page.sections.menu.getItem("aboutPageMenu"));
    Page.current = Page.about.render;
  }
});

// Once the links-page content is loaded, decide whether to display the
// contents or just keep them stashed.
window.addEventListener('links_loaded', function() {
  if (window.location.hash == "#links") {
    Page.links.render();
    // Add event listeners to the newly created About page buttons
    Page.sections.buttonEventHandlers("linksPageMenu");
    // Display correct subsection of the about page (class swaps)
    // Default: usage instructions appear non-hidden.
    Page.sections.show(Page.sections.menu.getItem("linksPageMenu"));
    Page.current = Page.links.render;
  }
});

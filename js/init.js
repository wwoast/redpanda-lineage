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

  L.defaultDisplayLanguage();   // Set default display language
  Page.routes.check();   // See if we started on the links or about pages
  L.update();      // Update buttons, displayed results, and cookie state
  Page.redraw(Page.current);   // Ready to redraw? Let's go.

  // Once the panda data is loaded, create the graph
  window.addEventListener('panda_data', function() {
    P.db.vertices.forEach(G.addVertex.bind(G));
    P.db.edges   .forEach(G.addEdge  .bind(G));
    // If available on the page, enable search bar once the page has loaded
    Show.searchBar.enable();

    // Determine what page content to display
    if (Page.routes.memberOf(Page.routes.profile, window.location.hash)) {
      Page.profile.render();
    } else if ((window.location.hash.length > 0) && 
        (Page.routes.memberOf(Page.routes.fixed, window.location.hash)) == false) {
      Page.results.render();
    } else if ((window.location.hash.length == 0) || 
        (window.location.hash == "#home")) {
      Page.home.render();
    }
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
  var mode = window.location.hash.split("/")[0];
  if (mode == "#home") {
    Page.home.render();
    Page.current = Page.home.render;
  } else if (mode == "#about") {
    Page.about.hashchange();
  } else if (mode == "#links") {
    Page.links.hashchange();
  } else if (Page.routes.results.includes(mode)) {
    Page.results.render();
    Page.current = Page.results.render;
  } else if (Page.routes.profile.includes(mode)) {
    Page.profile.render();
    Page.current = Page.profile.render;
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
    // Determine desktop or mobile, and display relevant instructions
    Page.about.instructions(Layout.media);
    Layout.media.addListener(Page.about.instructions);
    // Add a tag list
    Page.about.tags();  
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

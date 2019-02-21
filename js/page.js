var Page = {};   // Namespace

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
Page.about.render = function() {
  // Displays the about page when the button is clicked. Load content from a static
  // file based on the given language, and display it in a #contentFrame.about
  if (Page.about.language == undefined) {
    Page.about.fetch();   // Direct link
  } else if (Page.about.language != L.display) {
    Page.about.fetch();   // Language change event
  } else {
    Page.sections.menuDefaults();   // Initialize submenus if necessary
    var old_content = document.getElementById('contentFrame');
    Page.swap(old_content, Page.about.content);
    Page.footer.redraw("results");
  }
  Show["results"].menus.top();
  Show["results"].searchBar();   // Ensure the search bar comes back
  Page.color("results");
}

/* Manage the background color of the page. Profiles/Results page have different 
   colors. This mostly impacts how things look when you try and scroll on mobile
   and you reach the end of touch-scrolling content. */
Page.color = function(class_name) {
  var body = document.getElementsByTagName('body')[0];
  body.classList.remove("results");
  body.classList.remove("profile");
  body.classList.add(class_name);
}

Page.footer = {};
Page.footer.redraw = function(page_mode="results") {
  // Add the footer at the bottom of the page
  var body = document.getElementsByTagName('body')[0];
  var footer_test = body.lastElementChild;
  if (footer_test.id != "footer") {
    // No footer exists, and no bottom menu either. Add both
    var footer = Page.footer.render(L.display, page_mode);
    var menu = Show[page_mode].menus.bottom();
    body.appendChild(menu);
    body.appendChild(footer);
  } else {
    // Redraw the footer for language event changes
    var footer = Page.footer.render(L.display, page_mode);
    var bottomMenu = Show[page_mode].menus.bottom();
    // If bottom menu isn't there, add it
    if (footer_test.previousElementSibling.id != "pageBottom") {
      body.insertBefore(bottomMenu, footer_test);
    }
    // Replace footer menu itself
    body.replaceChild(footer, footer_test);
  }
}
Page.footer.remove = function() {
  // Remove the footer and bottom menu if returning to the home page
  var body = document.getElementsByTagName('body')[0];
  var footer_test = body.lastElementChild;
  if (footer_test.id == "footer") {
    // TODO: top and bottom menu operations should be by id
    var bottomMenu_test = document.getElementsByClassName("bottomMenu")[0];
    body.removeChild(bottomMenu_test);
    body.removeChild(footer_test);
  }
}
Page.footer.render = function(language, class_name) {
  // Draw a footer with the correct language and color (class)
  var p = document.createElement('p');
  for (var i in L.messages.footer[language]) {
    var field = L.messages.footer[language][i];
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
  footer.classList.add(class_name);
  footer.id = "footer";
  footer.appendChild(shrinker);
  return footer;
}

/*
    Logic for drawing the landing page. Nothing much here yet. TODO: add more! :)
*/
Page.home = {};
Page.home.render = function() {
  // Output just the base search bar with no footer.
  var old_content = document.getElementById('contentFrame');
  var new_content = document.createElement('img');
  new_content.src = "images/jiuzhaigou.jpg";
  new_content.className = "fullFrame";
  new_content.id = "contentFrame";
  Page.swap(old_content, new_content);
  Show["results"].menus.top();
  Page.footer.remove();
  Show["results"].searchBar();   // Ensure the search bar comes back
  Page.color("results");
}

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
Page.links.render = function() {
  // Displays the links page when the button is clicked. Load content from a static
  // file based on the given language, and display it in a #contentFrame.links
  if (Page.links.language == undefined) {
    Page.links.fetch();   // Direct link
  }
  else if (Page.links.language != L.display) {
    Page.links.fetch();   // Language change event
  } else {
    Page.sections.menuDefaults();   // Initialize submenus if necessary
    var old_content = document.getElementById('contentFrame');
    Page.swap(old_content, Page.links.content);
    Page.footer.redraw("results");
  }
  Show["results"].menus.top();
  Show["results"].searchBar();   // Ensure the search bar comes back
  Page.color("results");
}

/*
    The profiles page display details, media, or timelines for an individual panda
*/
Page.profile = {};
Page.profile.render = function() {
  // window.location.hash doesn't decode UTF-8. This does, fixing Japanese search
  var input = decodeURIComponent(window.location.hash);
  // Start by just displaying info for one panda by id search
  var results = Page.routes.behavior(input);
  results = results instanceof Array ? results : [results];   // Guarantee array
  var profile_div = Show.profile.panda(results[0], L.display);
  var where_divs = Show.profile.where(results[0], L.display);
  var family_divs = Show.profile.family(results[0], L.display);
  var children_divs = Show.profile.children(results[0], L.display);
  var siblings_divs = Show.profile.siblings(results[0], L.display);
  // Generate new content frames
  var shrinker = document.createElement('div');
  shrinker.className = "shrinker";
  shrinker.appendChild(profile_div);
  for (let content_div of where_divs.concat(family_divs)
                                    .concat(children_divs)
                                    .concat(siblings_divs)) {
    shrinker.appendChild(content_div);
  }
  var new_content = document.createElement('div');
  new_content.className = "profile";
  new_content.id = "contentFrame";
  new_content.appendChild(shrinker);
  // Append the new content into the page and then swap it in
  var old_content = document.getElementById('contentFrame');
  Page.swap(old_content, new_content);
  Show["profile"].menus.top();
  Page.footer.redraw("profile");
  Page.color("profile");
  // Add a search bar but hide it until the bottomMenu search button is clicked
  Show.profile.search.render();

}

/*
    Logic related to checking page routes, which are all implemented as #hashlinks
*/
Page.routes = {};
Page.routes.behavior = function(input) {
  // Each hashlink determines a different behavior for the page rendering.
  // Do a task based on what the route is.
  if (input.indexOf("#credit/") == 0) {
    // link for a page of photo credits for a specific author
    Query.env.credit = input.slice(8);
    Query.env.preserve_case = true;   // Don't adjust case for author searches
    Query.env.output = "photos";      // Set output mode for a photo list
    return Query.resolver.subject(Query.env.credit, "credit", L.display);
  } else if ((input.indexOf("#panda/") == 0) &&
             (input.split("/").length == 4)) {
    // link for a panda result with a chosen photo.
    var uri_items = input.slice(7);
    var [ panda, _, photo_id ] = uri_items.split("/");
    Query.env.specific = photo_id;
    return Query.resolver.subject(panda, "panda", L.display);    
  } else if ((input.indexOf("#panda/") == 0) &&
             (input.split("/").length == 2)) {
    // link for a single panda result. TODO: maybe do a detailed page
    var panda = input.slice(7);
    return Query.resolver.subject(panda, "panda", L.display);
  } else if ((input.indexOf("#profile/") == 0) &&
             (input.split("/").length == 4)) {
    // link for a panda profile result with a chosen photo.
    var uri_items = input.slice(9);
    var [ panda, _, photo_id ] = uri_items.split("/");
    Query.env.specific = photo_id;
    return Query.resolver.subject(panda, "panda", L.display);    
  } else if ((input.indexOf("#profile/") == 0) &&
             (input.split("/").length == 2)) {
    // link for a single panda profile result.
    var panda = input.slice(9);
    return Query.resolver.subject(panda, "panda", L.display);
  } else if (input.indexOf("#query/") == 0) {
    // process a query.
    var terms = input.slice(7);
    var results = Query.lexer.parse(terms);
    return (results == undefined) ? [] : results;
  } else if (input.indexOf("#timeline/") == 0) {
    // show full info and timeline for a panda. TODO
    var panda = input.slice(10);
    return Query.resolver.subject(panda, "panda", L.display);
  } else if (input.indexOf("#zoo/") == 0) {
    // link for a single zoo result.
    var zoo = input.slice(5);
    return Query.resolver.subject(zoo, "zoo", L.display);
  } else {
    // Don't know how to process the hashlink, so do nothing
    return false;
  }
}
Page.routes.check = function() {
  // On initial page load, look for specific hashes that represent special buttons
  // and immediately load that page if necessary.
  var mode = window.location.hash.split('/')[0];
  if (Page.routes.profile.includes(mode)) {
    Page.current = Page.profile.render;
  } else if (Page.routes.dynamic.includes(mode)) {
    Page.current = Page.results.render;
  } else if (window.location.hash == "#about") {
    Page.current = Page.about.render;
  } else if (window.location.hash == "#links") {
    Page.current = Page.links.render;
  } else {
    Page.current = Page.home.render;
  }
}
Page.routes.dynamic = [
  "#credit",
  "#media",
  "#panda",
  "#profile",
  "#query",
  "#timeline",
  "#zoo"
];
Page.routes.fixed = [
  "#about",    // The about page
  "#home",     // The empty query page
  "#links"     // The links page
];
Page.routes.no_footer = [
  "#home"
];
Page.routes.profile = [
  "#media",
  "#profile",
  "#timeline"
];
Page.routes.results = [
  "#about",
  "#credit",
  "#home",
  "#links",
  "#panda",
  "#query",
  "#zoo"
];
Page.routes.memberOf = function(routeList, current_route) {
  // Determine if the current page route includes one of the routes
  // specified in the different routes lists above.
  for (let route of routeList) {
    if (current_route.indexOf(route) != -1) {
      return true;
    }
  }
  return false;
}

/*
    Logic related to the results page output. The main render function chooses between
    other results rendering modes, and we'll likely add many more as time goes on.
*/
Page.results = {};
Page.results.entities = function(results) {
  // Given a search for pandas and zoos, output entity divs
  var content_divs = [];
  results.forEach(function(entity) {
    if (entity["_id"] < 0) {
      // Zoos get the Zoo div and pandas for this zoo
      content_divs.push(Show.results.zoo(entity, L.display));
      animals = Pandas.sortOldestToYoungest(Pandas.searchPandaZooCurrent(entity["_id"]));
      animals.forEach(function(animal) {
        content_divs.push(Show.results.panda(animal, L.display, undefined));
      });
    } else {
      content_divs.push(Show.results.panda(entity, L.display, undefined));
    }
  });
  if (results.length == 0) {
    // No results? On desktop, bring up a sad panda
    content_divs.push(Show.emptyResult(L.display));
  }
  return content_divs;
}
Page.results.photos = function(results) {
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
  var header = Show.message.credit(Query.env.credit, content_divs.length, L.display);
  content_divs.unshift(header);
  // HACK: revert to results mode
  Query.env.clear();
  return content_divs;
}
Page.results.render = function() {
  // window.location.hash doesn't decode UTF-8. This does, fixing Japanese search
  var input = decodeURIComponent(window.location.hash);
  // Start by just displaying info for one panda by id search
  var results = Page.routes.behavior(input);
  results = results instanceof Array ? results : [results];   // Guarantee array
  var content_divs = [];
  var new_content = document.createElement('div');
  new_content.id = "hiddenContentFrame";
  switch(Query.env.output) {
    case "entities":
      content_divs = Page.results.entities(results);
      break;
    case "photos":
      content_divs = Page.results.photos(results);
      new_content.style.textAlign = "center";   // Align photos centered in each row
      break;
  }
  var shrinker = document.createElement('div');
  shrinker.className = "shrinker";
  content_divs.forEach(function(content_div) {
    shrinker.appendChild(content_div);
  });
  new_content.appendChild(shrinker);
  // Redraw the search bar if necessary
  Show["results"].searchBar();
  // Append the new content into the page and then swap it in
  var old_content = document.getElementById('contentFrame');
  Page.swap(old_content, new_content);
  // Call layout adjustment functions to shrink any names that are too long
  Layout.shrinkNames();
  Show["results"].menus.top();
  Page.footer.redraw("results");
  Page.color("results");
}

/*
    Shared logic relating to the about/links page, both of which track sections
    that are displayed at some point or another
*/
Page.sections = {};
Page.sections.buttonEventHandlers = function(section_menu_id) {
  // The about page and links page have menus with buttons that
  // cause subsections to appear or disappear as needed.
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
      Page.sections.show(show_section_id);
      // TODO: set new uri representing sub-page
      // Set subMenu state. This is used to validate
      // what page to show and how the menu will be colored.
      Page.sections.menu.setItem(menu_id, show_section_id);
    });
  }
}
// Use session storage (lost when browser closes) for menu state.
// Potential values are for the menus on the about and links page, so the
// chosen sub-page will reappear when theses pages are regenerated.
//   "aboutPageMenu" can be set to (usage|pandas|contributions)
//   "linksPageMenu" can be set to (community|zoos|friends)
Page.sections.menu = window.sessionStorage;
Page.sections.menuDefaults = function() {
  // Set submenu defaults
  if (Page.sections.menu.getItem("aboutPageMenu") == null) {
    Page.sections.menu.setItem("aboutPageMenu", "usageGuide");
  }
  if (Page.sections.menu.getItem("linksPageMenu") == null) {
    Page.sections.menu.setItem("linksPageMenu", "redPandaCommunity");
  }
}
Page.sections.show = function(section_id) {
  // For pages with hidden sections, get a list of the section
  // containers, and hide all of them but the one provided.
  // This requires an id convention where sections are id'ed "name" and the
  // buttons that activate those sections are id'ed "name_button"
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
    Miscellaneous stuff that I don't know how to organize yet
*/
// Stores callback to the current page render function for redraws.
// Default mode is to show panda results.
Page.current = Page.results.render;

// Redraw page after an updateLanguage event or similar
Page.redraw = function(callback) {
  // TODO: rewrite this logic to be less tied to results/profile callback function checks
  // Redisplay results in the correct language, but only if the Pandas
  // content has already been loaded.
  if ((window.location.hash.length > 0) && (P.db != undefined) && (callback == Page.results.render)) {
    callback();
  }
  // Redisplay profile info in the correct language, but only if the Pandas
  // content has already been loaded.
  if ((window.location.hash.length > 0) && (P.db != undefined) && (callback == Page.profile.render)) {
    callback();
  }
  // For non-panda-results page, don't worry if the database is there or not
  if ((window.location.hash.length > 0) && (callback != Page.results.render) && (callback != Page.profile.render)) {
    callback();
  }
  if ((window.location.hash.length == 0) && (callback == Page.home.render)) {
    callback();
  }
}

// Swap in a new contents frame for an old contents frame. 
// After calling this, double-check that the footer 
// is still the bottom of the page.
Page.swap = function(old_content, new_content) {
  // Append the new content into the page and then swap it in
  var body = document.getElementsByTagName('body')[0];
  // Place the new content right after the old content
  old_content.parentNode.insertBefore(new_content, old_content.nextSibling);
  old_content.style.display = "none";
  new_content.style.display = "block";
  body.removeChild(old_content);
  new_content.id = 'contentFrame';
}

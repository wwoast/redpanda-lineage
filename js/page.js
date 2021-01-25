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
Page.about.fetchImages = function() {
  // Find all image links on instagram, and replace their URIs with fetches
  var replace_images = document.getElementsByClassName("replace");
  for (var img of replace_images) {
    if (img.src.indexOf("https://www.instagram.com/p/") == 0) {
      var shortcode = img.src.split("/")[4];
      var size = img.src.split("/")[6].split("=")[1];
      var ig_url = "ig://" + shortcode + "/" + size;
      Gallery.url.process(img, ig_url);
    }
  }
}
Page.about.hashchange = function() {
  // The about page hashchange results in needing to draw or fetch the
  // about page and initialize its menus, or at the very least, scroll
  // to the top of the page.
  if ((Page.about.language != L.display) && (Page.about.language != undefined)) {
    Page.about.fetch();
  } else {
    Page.about.render();
    // Add event listeners to the newly created About page buttons
    Page.about.sections.buttonEventHandlers();
    // Display correct subsection of the about page (class swaps)
    // Default: usage instructions appear non-hidden.
    Page.about.sections.show(Page.stored.getItem("aboutPageMenu"));
    // Determine desktop or mobile, and display relevant instructions
    Page.about.instructions(Layout.media);
    Layout.media.addListener(Page.about.instructions);
    // Add a tag list
    Page.about.tags();
    Page.current = Page.about.render;
  }
  window.scrollTo(0, 0);   // Go to the top of the page
}
Page.about.instructions = function() {
  // Event listener callback for showing either mobile, or PC-mode instructions
  if (Layout.media.matches) {
    document.getElementsByClassName("pandaAbout onlyDesktop")[0].style.display = "none";
    document.getElementsByClassName("pandaAbout onlyMobile")[0].style.display = "block";
  } else {
    document.getElementsByClassName("pandaAbout onlyMobile")[0].style.display = "none";
    document.getElementsByClassName("pandaAbout onlyDesktop")[0].style.display = "block";
  }
}
Page.about.language = undefined;   // Language the content was loaded in
Page.about.loaded = new Event('about_loaded');
Page.about.render = function() {
  // No need for paging on the about page
  Query.env.paging.display_button = false;
  // Displays the about page when the button is clicked. Load content from a static
  // file based on the given language, and display it in a #contentFrame.about
  if (Page.about.language == undefined) {
    Page.about.fetch();   // Direct link
  } else if (Page.about.language != L.display) {
    Page.about.fetch();   // Language change event
  } else {
    Page.about.sections.menuDefaults();   // Initialize submenus if necessary
    var old_content = document.getElementById('contentFrame');
    Page.swap(old_content, Page.about.content);
    Page.footer.redraw("results");
  }
  Show["results"].menus.language();
  Show["results"].menus.top();
  Show["results"].searchBar();   // Ensure the search bar comes back
  Page.color("results");
  // Re-enable scroll restoration for just the about page
  if (history.scrollRestoration) {
    history.scrollRestoration = 'auto';
  }
}
Page.about.routing = function() {
  // When someone clicks the about button, either show the about page,
  // or return to the last page shown before the about page
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
  }
}
Page.about.sections = {};
Page.about.sections.buttonEventHandlers = function() {
  // Find all button subelements of the menu
  var buttons = document.getElementsByClassName("sectionButton");
  // For each button, add an event handler to show the section
  // related to the button's id. Example:
  //    aboutPage_button => shows aboutPage
  for (var button of buttons) {
    button.addEventListener('click', function() {
      var show_section_id = this.id.split("_")[0];
      Page.about.sections.show(show_section_id);
      // TODO: set new uri representing sub-page
      // Set subMenu state. This is used to validate
      // what page to show and how the menu will be colored.
      Page.stored.setItem("aboutPageMenu", show_section_id);
    });
  }
}
// Use session storage (lost when browser closes) for menu state.
// Potential values are for the menus on the about and links page, so the
// chosen sub-page will reappear when theses pages are regenerated.
//   "aboutPageMenu" can be set to (usage|pandas|contributions)
//   "linksPageMenu" can be set to (community|zoos|friends)
Page.about.sections.menuDefaults = function() {
  if (Page.stored.getItem("aboutPageMenu") == null) {
    Page.stored.setItem("aboutPageMenu", "usageGuide");
  }
}
Page.about.sections.show = function(section_id) {
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
  // Fetch images from IG if necessary
  Page.about.fetchImages();
}
Page.about.tags = function() {
  // Take all available tags for this language, and draw an unordered list.
  var container = document.getElementsByClassName("pandaAbout aboutTags")[0];
  if (container.hasChildNodes() == true) {
    return;
  }
  var tagList = document.createElement('ul');
  tagList.classList.add("tagList");
  tagList.classList.add("multiColumn");
  for (let key in Language.L.tags) {
    let tag = Language.L.tags[key];
    let thisEmoji = tag["emoji"];
    let thisTag = tag[Page.about.language][0];
    var tagLi = document.createElement('li');
    var tagLink = document.createElement('a');
    tagLink.href = "#query/" + thisTag;
    tagLink.innerText = thisEmoji + " " + thisTag;
    tagLi.appendChild(tagLink);
    tagList.appendChild(tagLi);
  }
  container.appendChild(tagList);
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
  var rpn_url = "https://www.redpandanetwork.org";
  var rpn_logo_link = document.createElement('a');
  rpn_logo_link.href = rpn_url;
  var rpn_logo = document.createElement('img');
  rpn_logo.className = "footerRpnLogo";
  rpn_logo.src = "images/rpn-logo.png";
  rpn_logo_link.appendChild(rpn_logo);
  p.appendChild(rpn_logo_link);
  for (var i in L.messages.footer[language]) {
    var field = L.messages.footer[language][i];
    if (field == "<INSERTLINK_RPF>") {
      var rpf = document.createElement('a');
      rpf.href = "https://github.com/wwoast/redpanda-lineage";
      rpf.innerText = L.gui.footerLink_rpf[language];
      p.appendChild(rpf);
    } else if (field == "<INSERTLINK_RPN>") {
      var rpn = document.createElement('a');
      rpn.href = rpn_url;
      rpn.innerText = L.gui.footerLink_rpn[language];
      p.appendChild(rpn);
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
  // No need for paging on the home page
  Query.env.paging.display_button = false;
  // Output just the base search bar with no footer.
  var old_content = document.getElementById('contentFrame');
  Show["results"].menus.language();
  Show["results"].menus.top();
  // Special homepage headers
  if (P.db != undefined) {
    var new_content = document.createElement('div');
    new_content.className = "results birthdayPandas";
    new_content.id = "contentFrame";
    // Birthday logic
    if (Pandas.searchBirthday(true, photo_count=10).length > 0) {
      var birthday = Gallery.birthdayPhotoCredits(L.display);
      new_content.appendChild(birthday);
    }
    // Current memorials
    var departed = Gallery.memorialPhotoCredits(L.display, ["179", "112", "339"], 5, Message.memorial)
    new_content.appendChild(departed);
    // Please remember these pandas
    // var memorial = Gallery.memorialPhotoCredits(L.display, ["11"], 5, Message.missing_you);
    // new_content.appendChild(memorial);
    // Special galleries
    // var special = Gallery.special.taglist(L.display, 3, ["dig"], Message.shovel_pandas);
    // var special = Gallery.special.taglist(L.display, 3, ["bamboo", "bite", "portrait"], Message.lunch_time);
    // new_content.appendChild(special);
    var nearby = Message.findNearbyZoo(L.display);
    new_content.appendChild(nearby);
    var new_photos = Gallery.updatedNewPhotoCredits(L.display);
    new_content.appendChild(new_photos);
    // Group memorial for Kin and Gin
    // var ginkin = Gallery.memorialPhotoCreditsGroup(L.display, "media.7.gin-kin", ["22", "17"], 3);
    // new_content.appendChild(ginkin);    
    Page.swap(old_content, new_content);
    Layout.shrinkNames();
    Page.footer.redraw("landing");
  } else {
    var new_content = document.createElement('img');
    new_content.src = "images/jiuzhaigou.jpg";
    new_content.className = "fullFrame";
    new_content.id = "contentFrame";
    Page.swap(old_content, new_content);
    Page.footer.remove();
  }
  Show["results"].searchBar();   // Ensure the search bar comes back
  Page.color("results");
  window.scrollTo(0, 0);   // Scroll to the top of the page
}

Page.lastSearch = '#home';      // When un-clicking Links/About, go back to the last panda search

/*
    Logic related to the Links page.
*/
Page.links = {};
Page.links.content = undefined;    // Links page content
Page.links.hashchange = function() {
  // The links page hashchange results in needing to draw or fetch the
  // links page and initialize its menus, or at the very least, scroll
  // to the top of the page.
  Page.links.render();
  Page.current = Page.links.render;
  window.scrollTo(0, 0);   // Go to the top of the page
}
Page.links.render = function() {
  // No need for paging on the links page
  Query.env.paging.display_button = false;
  // Initialize submenus if necessary
  Page.links.sections.menuDefaults();
  var chosen = Page.stored.getItem("linksPageMenu");
  Page.links.content = Show.links.body(chosen);
  var old_content = document.getElementById('contentFrame');
  Page.swap(old_content, Page.links.content);
  // Add event listeners to the newly created Links page buttons
  Page.links.sections.buttonEventHandlers();
  Page.footer.redraw("results");
  Show["results"].menus.language();
  Show["links"].menus.top();
  Show["results"].searchBar();   // Ensure the search bar comes back
  Page.color("results");
}
Page.links.routing = function() {
  // Handle when someone clicks the links button
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
  }
}
Page.links.sections = {};
Page.links.sections.buttonEventHandlers = function() {
  // Find all button subelements of the menu
  var buttons = document.getElementsByClassName("sectionButton");
  // For each button, add an event handler to show the section
  // related to the button's id. Example:
  //    redPandaCommunity_button => shows redPandaCommunity page
  for (var button of buttons) {
    button.addEventListener('click', function() {
      var old_section = Page.stored.getItem("linksPageMenu");
      var show_section_id = this.id.split("_")[0];
      // Draw new links page content, and erase the old
      Page.links.content = Show.links.sections[show_section_id]();
      var old_content = document.getElementById(old_section);
      // Erase the old content and bring the new content into the page
      old_content.parentNode.replaceChild(Page.links.content, old_content);
      Page.stored.setItem("linksPageMenu", show_section_id);
      var old_button = document.getElementById(old_section + "_button");
      this.classList.add("selected");
      old_button.classList.remove("selected");
    });
  }
}
Page.links.sections.menuDefaults = function() {
  if (Page.stored.getItem("linksPageMenu") == null) {
    Page.stored.setItem("linksPageMenu", "redPandaCommunity");
  }
}

/*
    The media page displays group photos for an individual panda. It's part of the
    "profile" group of pages that show information about a specific animal.
*/
Page.media = {};
Page.media.render = function() {
  // window.location.hash doesn't decode UTF-8. This does, fixing Japanese search
  var input = decodeURIComponent(window.location.hash);
  // Start by just displaying info for one panda by id search
  var results = Page.routes.behavior(input);
  // TODO: count results and display a next page button if necessary
  Query.env.paging.display_button = true;
  // Generate new content frames
  var gallery_div = Show.media.gallery(results["hits"][0], L.display);
  var new_content = document.createElement('div');
  new_content.className = "profile";
  new_content.id = "contentFrame";
  new_content.appendChild(gallery_div);
  // Append the new content into the page and then swap it in
  var old_content = document.getElementById('contentFrame');
  Page.swap(old_content, new_content);
  Layout.shrinkNames();
  Show["media"].menus.language();
  var result_id = results["hits"][0]["_id"];
  Show["media"].menus.top(result_id);
  Page.footer.redraw("profile");
  Page.color("profile");
  // Add a search bar but hide it until the bottomMenu search button is clicked
  Show.media.search.render();
  // Move to the top of the page
  window.scrollTo(0, 0);
}

/*
    The profiles page display details for an individual panda
*/
Page.profile = {};
Page.profile.qr_update = new Event('qr_update');
Page.profile.render = function() {
  // window.location.hash doesn't decode UTF-8. This does, fixing Japanese search
  var input = decodeURIComponent(window.location.hash);
  // Profile pages never have additional content to load
  Query.env.paging.display_button = false;
  // Start by just displaying info for one panda by id search
  var results = Page.routes.behavior(input);
  var profile_div = Show.profile.panda(results["hits"][0], L.display);
  var where_divs = Show.profile.where(results["hits"][0], L.display);
  var family_divs = Show.profile.family(results["hits"][0], L.display);
  var children_divs = Show.profile.children(results["hits"][0], L.display);
  var siblings_divs = Show.profile.siblings(results["hits"][0], L.display);
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
  Show["profile"].menus.language();
  var result_id = results["hits"][0]["_id"];
  Show["profile"].menus.top(result_id);   // TOWRITE: need to take id of panda for buttons
  Page.footer.redraw("profile");
  Page.color("profile");
  // Add a search bar but hide it until the bottomMenu search button is clicked
  Show.profile.search.render();
  // Update the QR code based on the displayed photo
  window.dispatchEvent(Page.profile.qr_update);
  // Move to the top of the page
  window.scrollTo(0, 0);
}

/*
    Logic related to checking page routes, which are all implemented as #hashlinks
*/
Page.routes = {};
Page.routes.behavior = function(input) {
  // Each hashlink determines a different behavior for the page rendering.
  // Do a task based on what the route is.
  // TODO: add tag search URIs
  var query_string = undefined;
  if ((input.indexOf("#credit/") == 0) && 
  (input.split("/").length == 3)) {
    // link for a page of photo credits for a specific author,
    // including only a specific animal.
    var uri_items = input.slice(8);
    var [ author, filter ] = uri_items.split("/");
    // Don't adjust case for author searches, but eventually we
    // still need to do case-adjustment for the panda name itself
    Query.env.preserve_case = true;
    Query.env.output_mode = "photos";   // Set output mode for a photo list
    query_string = "credit" + " " + author + " " + filter;
  } else if ((input.indexOf("#credit/") == 0) && 
      (input.split("/").length == 2)) {
    // link for a page of photo credits for a specific author
    var photo_author = input.slice(8);
    Query.env.preserve_case = true;     // Don't adjust case for author searches
    Query.env.output_mode = "photos";   // Set output mode for a photo list
    query_string = "credit" + " " + photo_author;
  } else if ((input.indexOf("#panda/") == 0) &&
             (input.split("/").length == 4)) {
    // link for a panda result with a chosen photo.
    var uri_items = input.slice(7);
    var [ panda, _, photo_id ] = uri_items.split("/");
    Query.env.output_mode = "entities";
    Query.env.specific_photo = photo_id;
    query_string = "panda" + " " + panda;
  } else if ((input.indexOf("#panda/") == 0) &&
             (input.split("/").length == 2)) {
    // link for a single panda result.
    var panda = input.slice(7);
    Query.env.output_mode = "entities";
    query_string = "panda" + " " + panda;
  } else if ((input.indexOf("#group") == 0) &&
             (input.split("/").length >= 2) &&
             (input.split("/").length <= P.db["_photo"]["group_max"] + 1)) {
    // group display modes (just searching multiple ids for now)
    var id_list = input.slice(7).split("/");
    Query.env.output_mode = "group";
    query_string = id_list.join(" ");
  } else if ((input.indexOf("#profile/") == 0) &&
             (input.split("/").length == 4)) {
    // link for a panda profile result with a chosen photo.
    var uri_items = input.slice(9);
    var [ panda, _, photo_id ] = uri_items.split("/");
    Query.env.specific_photo = photo_id;
    query_string = "panda" + " " + panda;
  } else if ((input.indexOf("#profile/") == 0) &&
             (input.split("/").length == 2)) {
    // link for a single panda profile result.
    var panda = input.slice(9);
    query_string = "panda" + " " + panda;
  } else if ((input.indexOf("#media/") == 0) &&
             (input.split("/").length == 2)) {
    var panda = input.slice(7);
    query_string = "panda" + " " + panda;
  } else if (input.indexOf("#query/") == 0) {
    // process a query.
    query_string = input.slice(7);
    // Reset defaults to entity
    Query.env.output_mode = "entities";  
  } else if ((input.indexOf("#zoo/") == 0) &&
             (input.split("/").length == 4)) {
    // link for a panda result with a chosen photo.
    var uri_items = input.slice(5);
    var [ zoo, _, zoo_id ] = uri_items.split("/");
    Query.env.output_mode = "entities";
    Query.env.specific_photo = zoo_id;
    query_string = "zoo" + " " + zoo;
  } else if ((input.indexOf("#zoo/") == 0) &&
             (input.split("/").length == 2)) {
    // link for a single zoo result.
    var zoo = input.slice(5);
    Query.env.output_mode = "entities";
    query_string = "zoo" + " " + zoo;
  } else {
    // Don't know how to process the hashlink, so do nothing
    return false;
  }
  // Run the query through the parser and return results
  return Query.resolver.begin(query_string);
}
Page.routes.check = function() {
  // On initial page load, look for specific hashes that represent special buttons
  // and immediately load that page if necessary.
  var mode = window.location.hash.split('/')[0];
  if (Page.routes.profile.includes(mode)) {
    Page.current = Page.profile.render;
  } else if (Page.routes.media.includes(mode)) {
      Page.current = Page.media.render;  
  } else if (window.location.hash == "#about") {
    Page.current = Page.about.render;
  } else if (window.location.hash == "#links") {
    Page.current = Page.links.render;
  } else if (Page.routes.dynamic.includes(mode)) {
    Page.current = Page.results.render;
  } else {
    Page.current = Page.home.render;
  }
}
Page.routes.dynamic = [
  "#credit",
  "#group",
  "#links",
  "#media",
  "#panda",
  "#profile",
  "#query",
  "#timeline",
  "#zoo"
];
Page.routes.fixed = [
  "#about",    // The about page
  "#home"     // The empty query page
];
Page.routes.media = [
  "#media"
];
Page.routes.no_footer = [
  "#home"
];
Page.routes.profile = [
  "#profile",
  "#timeline"
];
Page.routes.results = [
  "#about",
  "#credit",
  "#group",
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
// Given a search for pandas or zoos, output entity divs
Page.results.entities = function(results) {
  var content_divs = [];
  if (results["hits"].length == 0) {
    // No results? On desktop, bring up a sad panda
    content_divs.push(Show.emptyResult(L.messages.no_result, L.display));
  }
  results["hits"].forEach(function(entity) {
    if (entity["_id"] < 0) {
      // Zoos get the Zoo div and pandas for this zoo
      content_divs.push(Show.results.zoo(entity, L.display));
      content_divs = content_divs.concat(Show.results.zooAnimals(entity, L.display));
      content_divs.push(Show.zooDivider("bear-bamboo"));
    } else {
      content_divs.push(Show.results.panda(entity, L.display));
    }
  });
  // Remove the last element if it's a divider
  var last_element = content_divs[content_divs.length - 1];
  if (last_element.className == 'zooDivider') {
    content_divs.pop();
  }
  return content_divs;
}
// Given a search for N panda ids, return first the list of media photos all of them 
// are in, or an error message saying they haven't been seen together. Then, display 
// the results for each one. This doesn't work yet for names due to space/tokenizing 
// and name resolution issues for duplicate names... that will be much more work!
Page.results.group = function(results) {
  var content_divs = [];
  if (results["hits"].length == 0) {
    // Push an error message
    content_divs.push(Show.emptyResult(L.messages.no_group_media_result, L.display));
    return content_divs;
  }
  // Then, start displaying a list of group photos paged out
  var animal_ids = results["query"].split(" ");
  if (results["hits"].length > 0) {
    // Show all photos with these animals, along with a message.
    // No container div here so just concat.
    content_divs = content_divs.concat(Show.results.groupGallery(animal_ids));
  }
  // Give a list of results for each individual animal
  var animal_results = [];
  for (let id of animal_ids) {
    var entity = Pandas.searchPandaId(id)[0];
    animal_results.push(Show.results.panda(entity, L.display));
  }
  // Let some photos appear first, unless we don't have very many photos
  var insert = 0;
  if (content_divs.length > 4) {
    insert = 2;
  }
  for (let result of animal_results) {
    content_divs.splice(insert, 0, result);
  }
  return content_divs;  
}
// Given a search for nearest zoos, add zoo divs and the pandas that live there,
// along with a header message of the zoos by proximity.
Page.results.nearby = function(results) {
  var content_divs = [];
  if (results.parsed == "geolookup_in_progress") {
    // Stuck at the interstitial after a language transition
    content_divs.push(Message.geolocationStart(L.display));
    return content_divs;
  }
  // Zoo results
  results["hits"].forEach(function(entity) {
    // Zoos get the Zoo div and pandas for this zoo
    content_divs.push(Show.results.zoo(entity, L.display));
    animals = Pandas.sortOldestToYoungest(Pandas.searchPandaZooCurrent(entity["_id"]));
    animals.forEach(function(animal) {
      content_divs.push(Show.results.panda(animal, L.display));
    });
    content_divs.push(Show.zooDivider("bear-bamboo"));
  });
  // Remove the last element if it's a divider
  var last_element = content_divs[content_divs.length - 1];
  if (last_element.className == 'zooDivider') {
    content_divs.pop();
  }
  // HACK: return to entity mode
  Query.env.output_mode = "entities";
  return content_divs;
}
Page.results.photos = function(results) {
  // Photo results have a slightly different structure from panda/zoo results
  var content_divs = [];
  var max_hits = Query.env.paging.results_count;
  if ((results["parsed"] == "set_tag") || 
      (results["parsed"] == "set_tag_subject") ||
      (results["parsed"] == "set_baby_subject")) {
    // Basic tag views with emoji in the name field
    content_divs = Gallery.tagPhotos(results, L.display, max_hits, true);
  } else if (results["parsed"].indexOf("set_tag_intersection") == 0) {
    // Combo tag views, no emoji in the name field
    content_divs = Gallery.tagPhotos(results, L.display, max_hits, false);
  } else if ((results["parsed"] == "set_credit_photos") || 
             (results["parsed"] == "set_credit_photos_filtered")) {
    content_divs = Gallery.creditPhotos(results, L.display, max_hits);
  }
  // HACK: revert to results mode
  Query.env.clear();
  return content_divs;
}
Page.results.render = function() {
  // window.location.hash doesn't decode UTF-8. This does, fixing Japanese search
  var input = decodeURIComponent(window.location.hash);
  // Don't assume a paging button is necessary until shown otherwise
  Query.env.paging.display_button = false;
  var results = Page.routes.behavior(input);
  var content_divs = [];
  var new_content = document.createElement('div');
  new_content.id = "hiddenContentFrame";
  switch(Query.env.output_mode) {
    case "entities":
      content_divs = Page.results.entities(results);
      break;
    case "photos":
      content_divs = Page.results.photos(results);
      new_content.style.textAlign = "center";   // Align photos centered in each row
      break;
    case "group":
      content_divs = Page.results.group(results);
      new_content.style.textAlign = "center";   // Align photos centered in each row
      break;
    case "nearby":
      content_divs = Page.results.nearby(F.results);
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
  Show["results"].menus.language();
  Show["results"].menus.top();
  Page.footer.redraw("results");
  Page.color("results");
  // Move to the top of the page
  window.scrollTo(0, 0);
}

/*
    Miscellaneous stuff that I don't know how to organize yet
*/
// Stores callback to the current page render function for redraws.
// Default mode is to show panda results.
Page.current = Page.results.render;

// The window.session variable that stores submenu state for about/links
Page.stored = window.sessionStorage;

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
  if ((window.location.hash.length > 0) && (P.db != undefined) && (callback == Page.media.render)) {
    callback();
  }
  // For non-panda-results page, don't worry if the database is there or not
  if ((window.location.hash.length > 0) && 
      (callback != Page.results.render) && 
      (callback != Page.profile.render) &&
      (callback != Page.media.render) &&
      (callback != Page.links.render)) {
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

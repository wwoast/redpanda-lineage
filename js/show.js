/*
    Presentation-level data, separated out from final website layout
*/
var Show = {};   /* Namespace */

// Given an animal and a language, obtain the immediate information that would
// be displayed in an information card about the panda, including its zoo and
// its relatives.
Show.acquirePandaInfo = function(animal, language) {
  var chosen_index = Query.env.specific_photo == undefined ? "random" : Query.env.specific_photo;
  var picture = Pandas.profilePhoto(animal, chosen_index, "animal");   // TODO: all photos for carousel
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
        "species": Pandas.species(animal["_id"]),
           "wild": Pandas.myWild(animal, "wild"),
            "zoo": Pandas.myZoo(animal, "zoo")
  }
  bundle = L.fallbackInfo(bundle, animal);  // Any defaults here?
  return bundle;
}

// Given an animal, return an array of location info translated correctly.
Show.acquireLocationList = function(animal, language) {
  var history = [];
  var raw_locations = Pandas.locationList(animal);
  for (let location of raw_locations) {
    var zoo = Pandas.searchZooId(location["zoo"])[0];
    zoo = L.fallbackEntity(zoo);   // Do language fallback strings
    var bundle = {
        "end_date": Pandas.formatDate(location["end_date"], language),
              "id": Pandas.zooField(zoo, "_id"),
  "language_order": Pandas.language_order(zoo),
        "location": Pandas.zooField(zoo, language + ".location"),
            "name": Pandas.zooField(zoo, language + ".name"),
      "start_date": Pandas.formatDate(location["start_date"], language),
    }
    history.push(bundle);
  }
  return history;
}

// Given a zoo, return an address, location, link to a website, and information
// about the number of pandas (living) that are at the zoo
Show.acquireZooInfo = function(zoo, language) {
  var animals = Pandas.searchPandaZooCurrent(zoo["_id"]);
  var chosen_index = Query.env.specific_photo == undefined ? "random" : Query.env.specific_photo;
  var picture = Pandas.profilePhoto(zoo, chosen_index, "zoo");   // TODO: all photos for carousel
  var recorded = Pandas.searchPandaZooBornLived(zoo["_id"]);
  var bundle = {
       "animals": animals,
       "address": Pandas.zooField(zoo, language + ".address"),
  "animal_count": animals.length,
      "get_name": language + ".name",
            "id": zoo["_id"],
      "language": language,
"language_order": Pandas.language_order(zoo),
      "location": Pandas.zooField(zoo, language + ".location"),
           "map": Pandas.zooField(zoo, "map"),
          "name": Pandas.zooField(zoo, language + ".name"),
         "photo": picture['photo'],
  "photo_credit": picture['credit'],
   "photo_index": picture['index'],
    "photo_link": picture['link'],
      "recorded": recorded,
"recorded_count": recorded.length,
       "website": Pandas.zooField(zoo, "website")
  }
  bundle = L.fallbackInfo(bundle, zoo);  // Any defaults here?
  return bundle;
}

// Construct an animal link as per parameters. Options include
// whether to do a mom/dad/boy/girl icon, or whether to do a 
// link within the page, versus a page wipe and redisplay.
// Default link text requires a language translation.
// Examples:
//    https://domain/index.html#panda/Lychee
//    https://domain/index.html#panda/4
// Animal links now use Unicode non-breaking spaces between
// the gender icon and the name.
Show.animalLink = function(animal, link_text, language, options) {
  // Don't print content if the input id is zero. If these are
  // fill-in links for moms or dads, use the Aladdin Sane icons :)
  if (animal['_id'] == Pandas.def.animal['_id']) {
    var alien = L.emoji.alien;
    if (options.indexOf("mom_icon") != -1) {
      alien = L.emoji.star_mom;
    }
    if (options.indexOf("dad_icon") != -1) {
      alien = L.emoji.star_dad;
    }
    return Show.emptyLink(alien + "\xa0" + link_text);
  }

  // Set up values for other functions working properly
  // Gender search requires doing a table search by language.
  var gender = Pandas.gender(animal, language);
  var a = document.createElement('a');
  a.className = 'geneaologyListName';
  // Put the name itself in a span, in case we want to squeeze it width-wise
  var name_span = document.createElement('span');
  var inner_text = link_text;
  var gender_text = "";
  var trailing_text = "";
  // Option to display gender face
  if (options.indexOf("child_icon") != -1) {
    gender_text = Show.childIcon(gender) + "\xa0";
  }
  // Moms and dads have older faces
  if (options.indexOf("mom_icon") != -1) {
    gender_text = L.emoji.mother + "\xa0";
  }
  if (options.indexOf("dad_icon") != -1) {
    gender_text = L.emoji.father + "\xa0";
  }
  // Half siblings indicator
  if (options.indexOf("half_icon") != -1) {
    trailing_text = trailing_text + "\u200A" + "½"
  }
  if ((options.indexOf("live_icon") != -1) && ("death" in animal)) {
    a.classList.add("passedAway");
    trailing_text = trailing_text + "\u200A" + L.emoji.died;
  }
  name_span.innerText = inner_text;
  a.append(gender_text);
  a.appendChild(name_span);
  a.append(trailing_text);
  if (options.indexOf("in_link") != -1) {
    // in_link: that finds a location on the displayed data
    a.href = "#panda" + "_" + animal['_id'];
  } else {
    // go_link: creates a new results frame based on desired data
    a.href = "#panda" + "/" + animal['_id'];
    // Force page to scroll to the top after a reload event
    a.addEventListener("click", Show.button.top.action);
  }
  return a;
}

// See how many other panda photos this user has posted. 
// Links to the credit page
Show.appleLink = function(info, container_element) {
  var other_photos = document.createElement(container_element);
  var credit_count_link = document.createElement('a');
  credit_count_link.id = info.id + "/counts/" + info.photo_index;   // Carousel
  credit_count_link.href = "#credit/" + info.photo_credit;
  credit_count_link.innerText = L.emoji.gift + " " + P.db._photo.credit[info.photo_credit];
  other_photos.appendChild(credit_count_link);
  return other_photos;
}

// Display the birthday and either age/date of death for an animal.
// Returns two text nodes that can be inserted into other elements
Show.birthday = function(info, language) {
  var birthday = L.emoji.born + " " + info.birthday;
  // If still alive, print their current age
  var parentheses = undefined;
  if (info.death == Pandas.def.unknown[language]) {
    parentheses = "(" + info.age + ")";
  } else {
    parentheses = L.emoji.died + " " + info.death;
  }
  return [birthday, parentheses];
}

// Male and female icons next to pandas used for panda links.
// This uses unlocalized m/f/unknown gender values
Show.childIcon = function(gender) {
  if (Object.values(Pandas.def.gender.Male).indexOf(gender) != -1) {
    return L.emoji.boy;
  } else if (Object.values(Pandas.def.gender.Female).indexOf(gender) != -1) {
    return L.emoji.girl;
  } else {
    return L.emoji.baby;
  }
}

// Display a link to a photo credit on Instagram or elsewhere
Show.creditLink = function(info, container_element) {
  var credit_link = document.createElement('a');
  credit_link.id = info.id + "/author/" + info.photo_index;   // Carousel
  credit_link.href = info.photo_link;
  credit_link.target = "_blank";   // Open in new tab
  if (info.photo_credit != undefined) {
    // Attribute photo to someone
    credit_link.innerText = L.emoji.camera + " " + info.photo_credit;
  } else {
    // Ask users to submit through a Google Form
    credit_link.innerText = L.emoji.camera + " " + L.gui.contribute[L.display] + "\xa0";
    credit_link.href = L.gui.contribute_link[L.display];
  }
  var container = document.createElement(container_element);
  container.appendChild(credit_link);
  return container;
}

// If link is to an undefined item or the zero ID, return a spacer
// TODO: final page layout
Show.emptyLink = function(output_text) {
  var a = document.createElement('a');
  var span = document.createElement('span');
  span.innerText = output_text;
  a.appendChild(span);
  a.href = '#not_sure_yet';
  return a;
}

// If the panda search result returned nothing, output a card
// with special "no results" formatting.
Show.emptyResult = function(chosen_message=L.messages.no_result, language) {
  var message = document.createElement('div');
  message.className = 'overlay';
  message.innerText = chosen_message[language];
  var image = document.createElement('img');
  image.src = "images/no-panda.jpg";
  var result = document.createElement('div');
  result.className = 'emptyResult';
  result.appendChild(image);
  result.appendChild(message);
  return result;
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

// Use localized alt-text, and display SVG gender information
// so that padding can work consistently on mobile.
Show.gender = function(info, frame_class) {
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
  if (frame_class != undefined) {
    gender.classList.add(frame_class);
  }
  gender.appendChild(img);
  return gender;
}

// Alternate gender function for if you only have an animal value and not 
// an info block value available.
Show.genderAnimal = function(animal, language, frame_class) {
  var gender = document.createElement('div');
  gender.className = frame_class;
  var img = document.createElement('img');
  if (animal["gender"] == "Male") {
    img.src = "images/male.svg";
    img.alt = Pandas.def.gender.Male[language];
  } else if (animal["gender"] == "Female") {
    img.src = "images/female.svg";
    img.alt = Pandas.def.gender.Male[language];
  } else {
    img.src = "images/unknown.svg";
    img.alt = Pandas.def.unknown[language];
  }
  gender.appendChild(img);
  return gender;
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
    output_text = L.emoji.map + " " + output_text;
  }
  if ("country_flag" in options) {
    // Replace any country names in location details with a flag
    var countries = Object.keys(L.flags).filter(function(key) {
      if (output_text.indexOf(key) != -1) {
        return key;
      }
    });
    countries.forEach(function(place) {
      output_text.replace(place, L.flags[place]);
    });
  }
  return output_text;
}

// Create a link to a location in Google Maps. This replaces the
// older content from Show.homeLocation, but I may want to make use
// of that function in the future.
Show.locationLink = function(zoo, language, mode="icons_only") {
  // Don't print content if the input id is zero
  if (zoo['_id'] == Pandas.def.zoo['_id']) {
    return Pandas.def.zoo[language + ".location"];
  }
  var link_text = L.emoji.map + " " + L.flags[zoo.flag];
  if (mode != "icons_only") {
    link_text = L.emoji.map + " " + zoo[language + ".location"] + " " + L.flags[zoo.flag];
  }
  var google_search = zoo['map'];
  var a = document.createElement('a');
  a.href = google_search;
  a.innerText = link_text;
  a.target = "_blank";   // Open in new tab
  return a;
}

// Give a list of nicknames in all languages, in priority of the
// current animal's language order
Show.nicknames = function(animal) {
  var container = document.createElement('ul');
  container.className = "nicknameList";
  for (let language of animal["language.order"].split(",").map(x => x.trim())) {
    var nicknames = animal[language + ".nicknames"];
    if (nicknames == undefined) {
      continue;
    }
    var nicknames_list = [];
    var nicknames_li = document.createElement('li');
    nicknames_li.innerText = L.gui.language[L.display][language] + ": ";
    // Nicknames for this animal
    for (let name of nicknames.split(",").map(x => x.trim())) {
      nicknames_list.push(name);
    }
    // Did we have any extra names? If so, add them
    if (nicknames_list.length > 0) {
      nicknames_li.innerText += nicknames_list.join(", ");
      container.appendChild(nicknames_li);
    }    
  }
  return container;
}

// Give a list of othernames in all languages, in priority of the
// current animal's language order. Include their regular names in
// other languages, but not the current language
Show.othernames = function(animal, current_language) {
  var container = document.createElement('ul');
  container.className = "nicknameList";  
  // Cycle through other languages to get their names and other
  // spellings for their names
  for (let language of animal["language.order"].split(",").map(x => x.trim())) {
    var othername_list = [];
    var othername_li = document.createElement('li');
    othername_li.innerText = L.gui.language[L.display][language] + ": ";
    // Animal's name in other languages
    if (language != current_language) {
      var name = animal[language + ".name"];
      if (name != undefined) {      
        othername_list.push(name);
      }
    }
    // Othernames / spellings for this animal
    var othernames = animal[language + ".othernames"];
    if (othernames != undefined) {
      for (let name of othernames.split(",").map(x => x.trim())) {
        othername_list.push(name);
      }
    }
    // Old names that were previously valid for this animal
    var oldnames = animal[language + ".oldnames"];
    if (oldnames != undefined) {
      for (let name of oldnames.split(",").map(x => x.trim())) {
        othername_list.push(name);
      }
    }
    // Did we have any extra names? If so, add them
    if (othername_list.length > 0) {
      othername_li.innerText += othername_list.join(", ");
      container.appendChild(othername_li);
    }
  }
  return container;
}

// Guarantee after calling this function that a menu, or a footer,
// exist in the page where they should be.
Show.update = function(new_contents, container=undefined, container_class, container_id) {
  if (container == undefined) {
    container = document.createElement('div');
    container.appendChild(new_contents);
  } else {
    var old_contents = container.childNodes[0];
    container.replaceChild(new_contents, old_contents);
  }
  container.className = container_class;   // Regardless, set the corret container class. TODO: list?
  container.id = container_id;
  return container;
}

// Construct a QR code out of the current page URL.
Show.qrcodeImage = function() {
  var img = showQRCode(window.location.toString());
  var qrcode = document.createElement('div');
  qrcode.className = "qrcodeFrame";
  var tld = document.createElement('span');
  tld.className = "qrcodeText";
  tld.innerText = "https://" + window.location.host + "/";
  qrcode.appendChild(tld);
  qrimg = document.createElement('img');
  qrimg.id = "qrcodeUri";
  qrimg.src = img.src;
  qrcode.appendChild(qrimg);
  var qrHashLink = document.createElement('span');
  qrHashLink.className = "qrcodeText";
  qrHashLink.innerText = window.location.hash;
  qrcode.appendChild(qrHashLink);
  return qrcode;
}

// Construct a zoo link as per design docs. Examples:
//    https://domain/index.html#zoo/1
// Show.zooLink = function(zoo, link_text, icon) {
Show.zooLink = function(zoo, link_text, language, icon=undefined) {
  // Don't print content if the input id is zero
  if (zoo['_id'] == Pandas.def.zoo['_id']) {
    return Show.emptyLink(Pandas.def.zoo[language + ".name"]);
  }
  var a = document.createElement('a');
  var inner_text = link_text;
  // Options processing
  if (icon != undefined) {
    inner_text = icon + " " + inner_text;
  }
  a.innerText = inner_text;
  a.href = "#zoo" + "/" + zoo['_id'];
  // Force page to scroll to the top after a reload event
  a.addEventListener("click", Show.button.top.action);
  return a;
}

// Display the name of a zoo in the "title bar"
Show.zooTitle = function(info) {
  var name_div = document.createElement('div');
  name_div.className = 'zooName';
  // No furigana for zoo names
  name_div.innerText = info.name;
  var title_div = document.createElement('div');
  title_div.className = "pandaTitle";
  title_div.appendChild(name_div);
  return title_div;
}

/*
    Show functions related to buttons and their event handlers
*/
Show.button = {};
Show.button.about = {};
Show.button.about.action = function() {
  Page.about.routing();
}
Show.button.about.render = function(class_name="results") {
  var about = Show.button.render("aboutButton", L.emoji.bamboo, L.gui.about[L.display], class_name);
  about.addEventListener("click", Show.button.about.action);
  return about;
}
Show.button.home = {};
Show.button.home.action = function() {
  // Return to the empty search page
  Page.lastSearch = "#home";
  Page.home.render();
  window.location = "#home";
  Page.current = Page.home.render;
};
Show.button.home.render = function(class_name="results") {
  var home = Show.button.render("homeButton", L.emoji.home, L.gui.home[L.display], class_name);
  home.addEventListener("click", Show.button.home.action);
  return home;
}
Show.button.language = {};
Show.button.language.action = function() {
  // When clicking the language button, cycle to the next possible display language
  var language = L.display;
  var options = Object.values(Pandas.def.languages);
  var choice = options.indexOf(language);
  choice = (choice + 1) % options.length;
  var new_language = options[choice];
  L.display = new_language;
  L.update();
  Page.redraw(Page.current);
}
Show.button.language.render = function(class_name="results") {
  var language = Show.button.render("languageButton", L.gui.flag[L.display], L.gui.language[L.display][L.display], class_name);
  language.addEventListener("click", Show.button.language.action);
  return language;
}
Show.button.links = {};
Show.button.links.action = function() {
  Page.links.routing();
}
Show.button.links.render = function(class_name="results") {
  var links = Show.button.render("linksButton", L.emoji.link, L.gui.links[L.display], class_name);
  links.addEventListener("click", Show.button.links.action);
  return links;
}
Show.button.logo = {};
// The logo button and home button do the same thing, but appear in different spots
Show.button.logo.action = Show.button.home.action;
Show.button.logo.render = function(class_name="results") {
  var logo = Show.button.render("logoButton", L.emoji.logo, undefined, class_name);
  logo.classList.add("logo");
  logo.classList.remove("menu");
  logo.addEventListener("click", Show.button.logo.action);
  return logo;
}
Show.button.media = {};
// Work in progress button, doesn't do anything yet
Show.button.media.render = function(class_name="profile") {class_name
  var media = Show.button.render("mediaButton", L.emoji.wip, L.gui.media[L.display], class_name);
  return media;
}
Show.button.message = {};
// Menu bar content that may have an arbitrary icon and arbitrary text after it.
Show.button.message.render = function(id, button_icon, button_text, class_name="results") {
  var button = document.createElement('button');
  button.className = "menu message";
  button.classList.add(class_name);
  button.id = id;
  var content = document.createElement('div');
  content.className = "buttonContent message";
  var icon_div = document.createElement('div');
  icon_div.className = 'buttonIcon';
  icon_div.innerText = button_icon;
  content.appendChild(icon_div);
  if (button_text != undefined) {
    var text_div = document.createElement('div');
    text_div.className = 'buttonText message';
    text_div.innerText = button_text;
    content.appendChild(text_div);
  }
  button.appendChild(content);
  return button;  
}
Show.button.profile = {};
// Work in progress button, doesn't do anything yet
Show.button.profile.render = function(class_name="profile") {
  var profile = Show.button.render("profileButton", L.emoji.profile, L.gui.profile[L.display], class_name);
  // Japanese text is too wide
  var text = profile.childNodes[0].childNodes[1];
  if (L.display == "jp") {
    text.classList.add("condensed");
  } else {
    text.classList.remove("condensed");
  }
  return profile;
}
Show.button.random = {};
Show.button.random.action = function() {
  // Show a random panda from the database when the dice is clicked
  Page.current = Page.results.render;
  var pandaIds = P.db.vertices.filter(entity => entity._id > 0)
                              .filter(entity => entity["photo.1"] != undefined)
                              .filter(entity => entity.death == undefined)
                              .map(entity => entity._id);
  window.location = "#query/" + pandaIds[Math.floor(Math.random() * pandaIds.length)];
  window.scrollTo(0, 0);   // Go to the top of the page
}
Show.button.random.render = function(class_name="results") {
  var random = Show.button.render("randomButton", L.emoji.random, L.gui.random[L.display], class_name);
  random.addEventListener("click", Show.button.random.action);
  return random;
}
Show.button.render = function(id, button_icon, button_text, class_name) {
  // Draw menu buttons for the bottom menu, or potentially elsewhere.
  var button = document.createElement('button');
  button.className = "menu";
  button.classList.add(class_name);
  button.id = id;
  var content = document.createElement('div');
  content.className = "buttonContent";
  var icon_div = document.createElement('div');
  icon_div.className = 'buttonIcon';
  icon_div.innerText = button_icon;
  content.appendChild(icon_div);
  if (button_text != undefined) {
    var text_div = document.createElement('div');
    text_div.className = 'buttonText';
    text_div.innerText = button_text;
    content.appendChild(text_div);
  }
  button.appendChild(content);
  return button;
}
Show.button.search = {};
Show.button.search.action = function() {
  // Used on pages where the search bar normally doesn't appear
  var active = Show.searchBar.toggle("bottomSearch");
  var searchBar = document.getElementById("searchInput");
  if (active == true) {
    window.scrollTo(0, document.getElementById("searchInput").offsetTop);
    document.getElementById("searchInput").focus();
  }
}
Show.button.search.render = function(class_name="profile") {
  var buttonText = L.gui.search[L.display].replace("...", "");   // No ellipses
  var search = Show.button.render("searchButton", L.emoji.search, buttonText, class_name);
  search.addEventListener("click", Show.button.search.action);
  return search;
}
Show.button.top = {};
Show.button.top.action = function() {
  // anchor tags get used for JS redraws, so don't use an anchor tag for
  // top-of-page scroll events. This fixes the language button after clicking pageTop.
  window.scrollTo(0, 0);
}
Show.button.top.render = function(class_name="results") {
  var top = Show.button.render("topButton", L.emoji.top, L.gui.top[L.display], class_name);
  top.addEventListener("click", Show.button.top.action);
  return top;
}
Show.button.tree = {};
// Work in progress button, doesn't do anything yet
Show.button.tree.render = function(class_name="profile") {
  var tree = Show.button.render("treeButton", L.emoji.wip, L.gui.family[L.display], class_name);
  // Japanese text is too wide
  var text = tree.childNodes[0].childNodes[1];
  if (L.display == "jp") {
    text.classList.add("condensed");
  } else {
    text.classList.remove("condensed");
  }
  return tree;
}

/*
    Show functions used to generate content for the landing page when you
    first visit redpandafinder.com. The landing (home) page is just a special 
    case of the results page, minus no search input, and the only time there
    is special display logic is when content is landing on the home page.
    This is very WIP.
*/
Show.landing = {};
Show.landing.menus = {};
Show.landing.menus.bottom = function() {
  // Return to a green menu bar: Top, and a Message Button 
  // for if the landing page is in a special mode.
  var new_contents = document.createElement('div');
  new_contents.className = "shrinker";
  // Take the list of bottom-menu buttons and render them.
  // Since the theme is green, leverage the "results" render type
  for (let btn_id of Show.landing.menus.bottomButtons) {
    var btn_type = btn_id.replace("Button", "");
    var button = undefined;
    button = Show.button[btn_type].render("results");
    new_contents.appendChild(button);
  }
  // Remove exisitng contents and replace with new.
  var menu = document.getElementsByClassName("bottomMenu")[0];
  menu = Show.update(new_contents, menu, "bottomMenu", "pageBottom");
  // Remove any previous menu class modifiers
  menu.classList.add("results");
  menu.classList.remove("profile");
  return menu;
}
Show.landing.menus.bottomButtons = ['topButton'];
/* 
    Show functions used to generate translated heading snippets in various page modes
*/
Show.message = {};
Show.message.birthday = function(name, animal_id, years, language) {
  var link = document.createElement('a');
  link.href = "#panda/" + animal_id;
  var p = document.createElement('p');
  for (var i in L.messages.happy_birthday[language]) {
    var field = L.messages.happy_birthday[language][i];
    if (field == "<INSERTNAME>") {
      field = name;
      var msg = document.createTextNode(field);
      p.appendChild(msg);
    } else if (field == "<INSERTNUMBER>") {
      field = years;
      var msg = document.createTextNode(field);
      p.appendChild(msg);
    } else {
      var msg = document.createTextNode(field);
      p.appendChild(msg);
    }
  }
  link.appendChild(p);
  var shrinker = document.createElement('div');
  shrinker.className = "shrinker";
  shrinker.appendChild(link);
  var message = document.createElement('div');
  message.className = "birthdaySummary";
  message.appendChild(shrinker);
  return message;
}
Show.message.credit = function(credit, count, language) {
  // Draw a header for crediting someone's photos contribution 
  // with the correct language
  var p = document.createElement('p');
  for (var i in L.messages.credit[language]) {
    var field = L.messages.credit[language][i];
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
  var message = document.createElement('div');
  message.className = "creditSummary";
  message.appendChild(shrinker);
  return message;
}
Show.message.profile_children = function(name, children_count, daughters, sons, language) {
  var p = document.createElement('p');
  var babies = 0;
  if (children_count != daughters + sons) {
    babies = children_count - daughters - sons;
  }
  // Choose the type of message
  var message = undefined;
  if (daughters > 0 && sons > 0 && babies > 0) {
    message = L.messages.profile_children_babies;
  } else if (daughters > 0 && sons > 0) {
    message = L.messages.profile_children;
  } else if (daughters > 0 && babies > 0) {
    message = L.messages.profile_daughters_babies;
  } else if (sons > 0 && babies > 0) {
    message = L.messages.profile_sons_babies;
  } else if (daughters > 0) {
    message = L.messages.profile_daughters;
  } else if (sons > 0) {
    message = L.messages.profile_sons;
  } else if (babies > 0) {
    message = L.messages.profile_babies;
  } else {
    message = L.messages.profile_children;
  }
  // Do string replacement
  for (var i in message[language]) {
    var field = message[language][i];
    if (field == "<INSERTNAME>") {
      var msg = document.createTextNode(name);
      p.appendChild(msg);
    } else if (field == "<INSERTTOTAL>") {
      var msg = document.createTextNode(children_count);
      p.appendChild(msg);
    } else if (field == "<INSERTDAUGHTERS>") {
      var msg = document.createTextNode(daughters);
      p.appendChild(msg);
    } else if (field == "<INSERTSONS>") {
      var msg = document.createTextNode(sons);
      p.appendChild(msg);
    } else if (field == "<INSERTBABIES>") {
      var msg = document.createTextNode(babies);
      p.appendChild(msg);
    } else {
      var msg = document.createTextNode(field);
      p.appendChild(msg);
    }
  }
  // TODO: Write a function to do all English tuneups.
  // 1 babys. Nuts's. ETC
  var shrinker = document.createElement('div');
  shrinker.className = "shrinker";
  shrinker.appendChild(p);
  var message = document.createElement('div');
  message.className = "profileSummary";
  message.appendChild(shrinker);
  return message;
}
Show.message.profile_family = function(name, language) {
  var p = document.createElement('p');
  for (var i in L.messages.profile_family[language]) {
    var field = L.messages.profile_family[language][i];
    if (field == "<INSERTNAME>") {
      var msg = document.createTextNode(name);
      p.appendChild(msg);
    } else {
      var msg = document.createTextNode(field);
      p.appendChild(msg);
    }
  }
  // Fix s's if it appears
  // TODO: Write a function to do all English tuneups.
  // 1 babys. Nuts's. ETC
  var innerText = p.innerText;
  p.innerText = innerText.replace("s's", "s'");
  var shrinker = document.createElement('div');
  shrinker.className = "shrinker";
  shrinker.appendChild(p);
  var message = document.createElement('div');
  message.className = "profileSummary";
  message.appendChild(shrinker);
  return message;
}
Show.message.profile_siblings = function(name, sibling_count, sisters, brothers, language) {
  var p = document.createElement('p');
  var babies = 0;
  if (sibling_count != sisters + brothers) {
    babies = sibling_count - daughters - sons;
  }
  // Choose the type of message
  var message = undefined;
  if (sisters > 0 && brothers > 0 && babies > 0) {
    message = L.messages.profile_siblings_babies;
  } else if (sisters > 0 && brothers > 0) {
    message = L.messages.profile_siblings;
  } else if (sisters > 0 && babies > 0) {
    message = L.messages.profile_sisters_babies;
  } else if (brothers > 0 && babies > 0) {
    message = L.messages.profile_brothers_babies;
  } else if (sisters > 0) {
    message = L.messages.profile_sisters;
  } else if (brothers > 0) {
    message = L.messages.profile_brothers;
  } else if (babies > 0) {
    message = L.messages.profile_babies;
  } else {
    message = L.messages.profile_siblings;
  }
  for (var i in message[language]) {
    var field = message[language][i];
    if (field == "<INSERTNAME>") {
      var msg = document.createTextNode(name);
      p.appendChild(msg);
    } else if (field == "<INSERTTOTAL>") {
      var msg = document.createTextNode(sibling_count);
      p.appendChild(msg);
    } else if (field == "<INSERTSISTERS>") {
      var msg = document.createTextNode(sisters);
      p.appendChild(msg);
    } else if (field == "<INSERTBROTHERS>") {
      var msg = document.createTextNode(brothers);
      p.appendChild(msg);
    } else if (field == "<INSERTBABIES>") {
      var msg = document.createTextNode(babies);
      p.appendChild(msg);
    } else {
      var msg = document.createTextNode(field);
      p.appendChild(msg);
    }
  }
  var shrinker = document.createElement('div');
  shrinker.className = "shrinker";
  shrinker.appendChild(p);
  var message = document.createElement('div');
  message.className = "profileSummary";
  message.appendChild(shrinker);
  return message;
}
Show.message.profile_where = function(name, language) {
  var p = document.createElement('p');
  for (var i in L.messages.profile_where[language]) {
    var field = L.messages.profile_where[language][i];
    if (field == "<INSERTNAME>") {
      var msg = document.createTextNode(name);
      p.appendChild(msg);
    } else {
      var msg = document.createTextNode(field);
      p.appendChild(msg);
    }
  }
  var shrinker = document.createElement('div');
  shrinker.className = "shrinker";
  shrinker.appendChild(p);
  var message = document.createElement('div');
  message.className = "profileSummary";
  message.appendChild(shrinker);
  return message;
}
Show.message.tag_subject = function(num, name, emoji, tag, language, overflow=0) {
  // If there was an id as part of a tagExpression, rewrite this message
  // using the panda's localized name instead.
  if (Pandas.checkId(name) == true) {
    name = Pandas.searchPandaId(name)[0][language + ".name"];
  }
  // For translating a tag between languages, we need the first value in
  // the array of tags considered equivalent.
  var near_tag = L.tags[tag][language][0];
  var p = document.createElement('p');
  for (var i in L.messages.tag_subject[language]) {
    var field = L.messages.tag_subject[language][i];
    if (field == "<INSERTNUM>") {
      var msg = document.createTextNode(num);
      p.appendChild(msg);
    } else if (field == "<INSERTNAME>") {
      var msg = document.createElement('i');
      var text = document.createTextNode(name);
      if (name != undefined) {
        msg.appendChild(text);
        p.appendChild(msg);
      }
    } else if (field == "<INSERTEMOJI>") {
      var msg = document.createTextNode(emoji);
      p.appendChild(msg);
    } else if (field == "<INSERTTAG>") {
      var msg = document.createElement('b');
      var text = document.createTextNode(near_tag);
      msg.appendChild(text);
      p.appendChild(msg);
    } else {
      var msg = document.createTextNode(field);
      if ((language == "jp") && (i == 1) && (name == undefined)) {
        msg = document.createTextNode("枚");
      }
      p.appendChild(msg);
    }
  }
  if (overflow > 0) {
    for (var i in L.messages.overflow[language]) {
      var field = L.messages.overflow[language][i];
      if (field == "<INSERTLIMIT>") {
        var msg = document.createTextNode(overflow);
        p.appendChild(msg);
      } else {
        var msg = document.createTextNode(field);
        p.appendChild(msg);
      }
    }
  }
  var shrinker = document.createElement('div');
  shrinker.className = "shrinker";
  shrinker.appendChild(p);
  var message = document.createElement('div');
  message.className = "tagSummary";
  message.appendChild(shrinker);
  return message;
}

/*
    Show functions used by the profile/media/timelines page for a single animal
*/
Show.profile = {};
Show.profile.children = function(animal, language) {
  // Display photos of the animal's children
  var info = Show.acquirePandaInfo(animal, language);
  var elements = [];
  var photo_divs = [];
  // Need to get daughters and sons counts
  var children_count = info.children.length;
  if (children_count == 0) {
    return [];   // Don't display anything
  }
  var sons_count = info.children.filter(x => x.gender == "Male").length;
  var daughters_count = info.children.filter(x => x.gender == "Female").length;
  var message = Show.message.profile_children(animal[language + ".name"], children_count, daughters_count, sons_count, language);
  elements.push(message);
  var photos = Pandas.searchPhotoProfileChildren(animal["_id"]);
  for (let photo of photos) {
    var child = info.children.filter(x => x["_id"] == photo["id"])[0];
    var birth_year = Pandas.formatYear(child["birthday"]);
    var div = Gallery.familyProfilePhoto(child, photo, language, birth_year);
    photo_divs.push(div);
  }
  var container = document.createElement('div');
  container.className = "profilePhotos";
  for (let photo_div of photo_divs) {
    container.appendChild(photo_div);
  }
  elements.push(container);
  return elements;
}
Show.profile.dossier = function(animal, info, language) {
  // This includes the species details, along with photo-credit text related
  // to the currently displayed gallery on the profile page, and a QR code
  // for the panda being displayed.
  // Start with species information
  var species = Show.profile.species(animal, language);
  // Next, display birthday info. TODO: do better than list items
  var [first_string, second_string] = Show.birthday(info, language);
  var birthday = document.createElement('ul');
  birthday.className = "pandaList";
  var first_item = document.createElement('li');
  first_item.style.display = "inline-block";
  first_item.style.paddingBottom = "0.25ex";
  first_item.style.paddingRight = "1em";
  first_item.innerText = first_string;
  second_item = document.createElement('li');
  second_item.style.display = "inline-block";
  second_item.style.marginTop = "0.25ex";
  second_item.innerText = second_string;
  birthday.appendChild(first_item);
  birthday.appendChild(second_item);
  // Display a QR code
  var qrcode = Show.qrcodeImage();
  // Lay it all out
  var dossier = document.createElement('div');
  dossier.className = "profileDossier";
  dossier.appendChild(species);
  dossier.appendChild(birthday);
  if (info.photo_credit != undefined) {
    // Display photo credit content if a photo exists
    // TODO: factor out into CSS, and do similar with birthday
    var credit = document.createElement('ul');
    credit.className = "pandaList";
    var credit_inner = Show.creditLink(info, 'li');
    credit_inner.style.display = "inline-block";
    credit_inner.style.paddingRight = "1em";
    credit.appendChild(credit_inner);
    // Display an apple link too
    var apple_inner = Show.appleLink(info, 'li');
    apple_inner.style.display = "inline-block";
    credit.appendChild(apple_inner);
    dossier.appendChild(credit);
  }
  dossier.appendChild(qrcode);
  // Nicknames, in all languages
  var nicknames_container = document.createElement('div');
  nicknames_container.className = "nicknameContainer";
  var nicknames_heading = document.createElement('h4');
  nicknames_heading.className = "nicknamesHeading";
  nicknames_heading.classList.add(L.display);
  nicknames_heading.innerText = L.gui.nicknames[L.display];
  var nicknames = Show.nicknames(animal);
  if (nicknames.childNodes.length > 0) {
    nicknames_container.appendChild(nicknames_heading);
    nicknames_container.appendChild(nicknames);
    dossier.appendChild(nicknames_container);
  }
  // Other names container, in all languages
  var othernames_container = document.createElement('div');
  othernames_container.className = "othernamesContainer";
  var othernames_heading = document.createElement('h4');
  othernames_heading.className = "othernamesHeading";
  othernames_heading.classList.add(L.display);
  othernames_heading.innerText = L.gui.othernames[L.display];
  var othernames = Show.othernames(animal, L.display);
  if (othernames.childNodes.length > 0) {
    othernames_container.appendChild(othernames_heading);
    othernames_container.appendChild(othernames);
    dossier.appendChild(othernames_container);
  }
  return dossier;
}
Show.profile.family = function(animal, language) {
  // Display photos of the animal's family
  var info = Show.acquirePandaInfo(animal, language);
  var elements = [];
  var photo_divs = [];
  var message = Show.message.profile_family(animal[language + ".name"], language);
  elements.push(message);
  var photos = Pandas.searchPhotoProfileImmediateFamily(animal["_id"]);
  // Start with mom and dad, and then a self photo, and then littermates.
  var mom_photo = undefined;
  if (info.mom != undefined) {
    var mom_photo = photos.filter(x => x["id"] == info["mom"]["_id"])[0];
    var mom = Gallery.familyProfilePhoto(info["mom"], mom_photo, language, L.gui.mother[language], "immediateFamily");
    photo_divs.push(mom);
  }
  var dad_photo = undefined;
  if (info.dad != undefined) {
    var dad_photo = photos.filter(x => x["id"] == info["dad"]["_id"])[0];
    var dad = Gallery.familyProfilePhoto(info["dad"], dad_photo, language, L.gui.father[language], "immediateFamily");
    photo_divs.push(dad);
  }
  var me_photo = photos.filter(x => x["id"] == info["id"])[0];
  var me = Gallery.familyProfilePhoto(animal, me_photo, language, L.gui.me[language], "immediateFamily");
  photo_divs.push(me);
  var litter_photos = photos.filter(x => (x != mom_photo && x != dad_photo && x != me_photo));
  for (let litter_photo of litter_photos) {
    var subHeading = L.gui.twin[language];
    if (litter_photos.length == 2) {
      subHeading = L.gui.triplet[language];
    }
    if (litter_photos.length >= 3) {
      subHeading = L.gui.quadruplet[language];
    }
    var litter_mate = info.litter.filter(x => x["_id"] == litter_photo["id"])[0];
    var div = Gallery.familyProfilePhoto(litter_mate, litter_photo, language, subHeading, "immediateFamily");
    photo_divs.push(div);
  }
  var container = document.createElement('div');
  container.className = "profilePhotos";
  for (let photo_div of photo_divs) {
    container.appendChild(photo_div);
  }
  elements.push(container);
  return elements;
}
Show.profile.gallery = function(info) {
  // Show a carousel of photos for this animal
  // TODO: start at the profile photo always
  var gallery = Gallery.init(info, 'animal');
  var photo = gallery.displayPhoto();
  var span = gallery.displayPhotoNavigation();
  photo.appendChild(span);
  photo.addEventListener('mouseover', function() {
    span.style.display = "block";
  });
  photo.addEventListener('mouseout', function() {
    span.style.display = "none";
  });
  return photo;
}
Show.profile.menus = {};
Show.profile.menus.bottom = function() {
  // Offer red menu bar with a search function: Top, Home, Search
  var new_contents = document.createElement('div');
  new_contents.className = "shrinker";
  // Take the list of bottom-menu buttons and render them
  for (let btn_id of Show.profile.menus.bottomButtons) {
    var btn_type = btn_id.replace("Button", "");
    var button = Show.button[btn_type].render("profile");
    new_contents.appendChild(button);
  }
  // Remove exisitng contents and replace with new.
  var menu = document.getElementsByClassName("bottomMenu")[0];
  menu = Show.update(new_contents, menu, "bottomMenu", "pageBottom");
  // Remove any previous menu class modifiers
  menu.classList.add("profile");
  menu.classList.remove("results");
  return menu;
}
Show.profile.menus.bottomButtons = ['topButton', 'homeButton', 'randomButton', 'searchButton'];
Show.profile.menus.top = function() {
  // A red menu bar: Logo/Home, Language, Profile, Media, Timeline
  var new_contents = document.createElement('div');
  new_contents.className = "shrinker";
  // Take the list of top-menu buttons and render them
  for (let btn_id of Show.profile.menus.topButtons) {
    var btn_type = btn_id.replace("Button", "");
    var button = Show.button[btn_type].render("profile");
    new_contents.appendChild(button);
  }
  // Remove exisitng contents and replace with new.
  var menu = document.getElementsByClassName("topMenu")[0];
  menu = Show.update(new_contents, menu, "topMenu", "pageTop");
  // Remove any previous menu class modifiers
  menu.classList.add("profile");
  menu.classList.remove("results");
  return menu;
}
Show.profile.menus.topButtons = ['logoButton', 'languageButton', 'profileButton', 'mediaButton', 'treeButton'];
Show.profile.nameBar = function(info) {
  // Replace the search bar with something that displays the animal's name and gender
  var gender = Show.gender(info, "profile");
  var name = document.createElement('div');
  name.className = "pandaName";
  name.classList.add("profile");
  name.innerText = info.name;
  var shrinker = document.createElement('div');
  shrinker.className = "shrinker";
  shrinker.appendChild(gender);
  shrinker.appendChild(name);
  var nameBar = document.createElement('div');
  nameBar.className = "nameBar";
  nameBar.classList.add("profile");
  nameBar.id = "focalBar";
  nameBar.appendChild(shrinker);
  var body = document.getElementsByTagName("body")[0];
  // Replace search or nameBar that might be there
  var existing = document.getElementById("focalBar");
  body.replaceChild(nameBar, existing);
}
Show.profile.panda = function(animal, language) {
  // Create a profile page for a single panda
  var info = Show.acquirePandaInfo(animal, language);
  // Replace the search bar with the name bar for this animal
  Show.profile.nameBar(info);
  // Start with panda content
  var gallery = Show.profile.gallery(info);
  var dossier = Show.profile.dossier(animal, info, language);
  var result = document.createElement('div');
  result.className = "profileFrame";
  result.appendChild(gallery);
  result.appendChild(dossier);
  return result; 
}
Show.profile.search = {};
Show.profile.search.render = function() {
  // Render the search bar at the bottom of the profile page
  var bottomMenu = document.getElementsByClassName("bottomMenu")[0];
  var searchBar = Show.searchBar.render("bottomSearch profile", "bottomSearch");
  bottomMenu.appendChild(searchBar);
}
Show.profile.siblings = function(animal, language) {
  // Display photos of the animal's siblings
  var info = Show.acquirePandaInfo(animal, language);
  var elements = [];
  var photo_divs = [];
  // Need to get daughters and sons counts
  var total_siblings = info.siblings.concat(info.litter);
  var siblings_count = total_siblings.length;
  if (siblings_count == 0) {
    return [];   // Don't display anything
  }
  var brothers_count = total_siblings.filter(x => x.gender == "Male").length;
  var sisters_count = total_siblings.filter(x => x.gender == "Female").length;
  var message = Show.message.profile_siblings(animal[language + ".name"], siblings_count, sisters_count, brothers_count, language);
  elements.push(message);
  var photos = Pandas.searchPhotoProfileSiblings(animal["_id"]);
  for (let photo of photos) {
    var sibling = total_siblings.filter(x => x["_id"] == photo["id"])[0];
    var subHeading = Pandas.formatYear(sibling["birthday"]);
    if (Pandas.halfSiblings(animal, sibling)) {
      subHeading = subHeading + "\u200A" + "(½)";
    }
    var div = Gallery.familyProfilePhoto(sibling, photo, language, subHeading);
    photo_divs.push(div);
  }
  var container = document.createElement('div');
  container.className = "profilePhotos";
  for (let photo_div of photo_divs) {
    container.appendChild(photo_div);
  }
  elements.push(container);
  return elements;
}
Show.profile.species = function(animal, language) {
  // Underneath a photo, display the subspecies info for the panda
  var species_text = document.createTextNode(Pandas.species(animal, language));
  var italics = document.createElement('i');
  italics.appendChild(species_text);
  var heading = document.createElement('h4');
  var emoji = document.createTextNode(L.emoji.animal + " ");
  heading.appendChild(emoji);
  heading.appendChild(italics);
  var species_div = document.createElement('div');
  species_div.className = "species";
  species_div.appendChild(heading);
  return species_div;
}
Show.profile.where = function(animal, language) {
  // Show the locations this panda has been at. Return an array of
  // HTMLElements to insert into the page
  var elements = [];
  var history = Show.acquireLocationList(animal, language);
  var message = Show.message.profile_where(animal[language + ".name"], language);
  elements.push(message);
  // Start at the current zoo, and work backwards
  var container = document.createElement('div');
  container.className = "zooHistory";
  for (let zoo of history.reverse()) {
    var zoo_icon = L.emoji.zoo;
    // Different date string logic for zoos versus wild animal sightings.
    if (zoo["id"].indexOf("wild.") == -1) {
      var date_string = zoo["start_date"] + "\u2014" + zoo["end_date"];
      if (zoo["end_date"] == Pandas.def.unknown[language]) {
        date_string = L.gui.since_date[language].replace("<INSERTDATE>", zoo["start_date"]);
        zoo_icon = L.emoji.home;
      }
    } else {
      zoo_icon = L.emoji.tree;
      date_string = L.gui.seen_date[language].replace("<INSERTDATE>", zoo["start_date"]);
    }
    if ((zoo["end_date"] != Pandas.def.unknown[language]) && 
    (zoo["end_date"] == Pandas.date(animal, "death", L.display))) {
      zoo_icon = L.emoji.died;
    }
    var zoo_info = Pandas.searchZooId(zoo["id"])[0];
    var zoo_entry = document.createElement('ul');
    zoo_entry.className = "zooList";
    var zoo_name = document.createElement('li');
    var zoo_link = Show.zooLink(zoo_info, zoo_info[language + ".name"], language, zoo_icon);
    var zoo_date = document.createElement('span');
    zoo_date.className = "detail";
    zoo_date.innerText = date_string;
    zoo_name.appendChild(zoo_link);
    if (zoo["start_date"] != Pandas.def.unknown[language]) {
      zoo_name.appendChild(zoo_date);
    }
    zoo_entry.appendChild(zoo_name);
    var zoo_location = document.createElement('li');
    // Location shows a map icon and a flag icon, and links to
    // a Google Maps search for the "<language>.address" field  
    var location_link = Show.locationLink(zoo_info, language, "text");
    zoo_location.appendChild(location_link);
    zoo_entry.appendChild(zoo_location);
    container.appendChild(zoo_entry);
  }
  elements.push(container);
  return elements;
}

/* 
    Show functions used by the search results pages
*/
Show.results = {};
Show.results.children = function(info) {
  // Display panda children in the family section
  var heading = document.createElement('h4');
  heading.className = "childrenHeading" + " " + info.language;
  heading.innerText = L.gui.children[info.language];
  var ul = document.createElement('ul');
  ul.className = "pandaList" + " " + info.language;
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
Show.results.family = function(info) {
  // Display lists of family information, starting with parents,
  // then adding immediate littermates, and finally including the
  // other siblings, ordered by birthday. This is the pink stripe
  // at the bottom of a family dossier.
  var family = document.createElement('div');
  family.className = "family";
  if ((info.dad == undefined && info.mom == undefined) &&
      (info.litter.length == 0) &&
      (info.siblings.length == 0) &&
      (info.children.length == 0))  {
    return family;   // No documented family
  }
  var parents = undefined;
  var litter = undefined;
  var siblings = undefined;
  var children = undefined;
  if (info.dad != undefined || info.mom != undefined) {
    parents = Show.results.parents(info);
  }
  if (info.litter.length > 0) {
    litter = Show.results.litter(info);
  }
  if (info.siblings.length > 0) {
    siblings = Show.results.siblings(info);
  }
  if (info.children.length > 0) {
    children = Show.results.children(info);
  }
  var layout = Layout.init(family, info, parents, litter, siblings, children);
  family = layout.layout();
  return family;
}
Show.results.litter = function(info) {
  // Do the littermates info in the family section
  var language = info.language;
  var heading = document.createElement('h4');
  heading.className = "litterHeading" + " " + info.language;
  heading.classList.add(language);
  heading.innerText = L.gui.litter[info.language];
  var ul = document.createElement('ul');
  ul.className = "pandaList" + " " + info.language;
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
Show.results.menus = {};
Show.results.menus.bottom = function() {
  // Return to a green menu bar: Top, Home
  var new_contents = document.createElement('div');
  new_contents.className = "shrinker";
  // Take the list of bottom-menu buttons and render them
  for (let btn_id of Show.results.menus.bottomButtons) {
    var btn_type = btn_id.replace("Button", "");
    var button = Show.button[btn_type].render("results");
    new_contents.appendChild(button);
  }
  // Remove exisitng contents and replace with new.
  var menu = document.getElementsByClassName("bottomMenu")[0];
  menu = Show.update(new_contents, menu, "bottomMenu", "pageBottom");
  // Remove any previous menu class modifiers
  menu.classList.add("results");
  menu.classList.remove("profile");
  return menu;
}
Show.results.menus.bottomButtons = ['topButton', 'homeButton'];
Show.results.menus.top = function() {
  // Return to a green menu bar: Logo/Home, Language, About, Random, Links
  var new_contents = document.createElement('div');
  new_contents.className = "shrinker";
  // Take the list of top-menu buttons and render them
  for (let btn_id of Show.results.menus.topButtons) {
    var btn_type = btn_id.replace("Button", "");
    var button = Show.button[btn_type].render("results");
    new_contents.appendChild(button);
  }
  // Remove exisitng contents and replace with new.
  var menu = document.getElementsByClassName("topMenu")[0];
  menu = Show.update(new_contents, menu, "topMenu", "pageTop");
  // Remove any previous menu class modifiers
  menu.classList.add("results");
  menu.classList.remove("profile");
  return menu;
}
Show.results.menus.topButtons = ['logoButton', 'languageButton', 'aboutButton', 'randomButton', 'linksButton'];
Show.results.panda = function(animal, language) {
  // Display a block of information for a single panda.
  // Most missing elements should not be displayed, but 
  // a few should be printed regardless (birthday / death)
  var info = Show.acquirePandaInfo(animal, language);
  var gallery = Gallery.init(info, 'animal');
  var photo = gallery.displayPhoto();
  var span = gallery.displayPhotoNavigation();
  photo.appendChild(span);
  photo.addEventListener('mouseover', function() {
    span.style.display = "block";
  });
  photo.addEventListener('mouseout', function() {
    span.style.display = "none";
  });
  var title = Show.results.pandaName(info);
  var details = Show.results.pandaDetails(info); 
  var family = Show.results.family(info);
  var dossier = document.createElement('div');
  dossier.className = "pandaDossier";
  dossier.appendChild(title);
  dossier.appendChild(details);
  dossier.appendChild(family);
  var result = document.createElement('div');
  result.className = "pandaResult";
  result.appendChild(photo);
  result.appendChild(dossier);
  // Ensure theres's a search bar
  Show.results.searchBar();
  return result; 
}
Show.results.pandaDetails = function(info) {
  // The purple results-page "dossier" information stripe for a panda.
  var language = info.language;
  // Start the new Div
  var details = document.createElement('div');
  details.className = "pandaDetails";
  // Start creating content
  var [first_string, second_string] = Show.birthday(info, language);
  var born = document.createElement('p');
  born.innerText = first_string;
  details.appendChild(born);
  // If still alive, print their current age
  var second = document.createElement ('p');
  second.innerText = second_string;
  if (info.age != undefined) {
    details.appendChild(second);
  }
  // Zoo link is the animal's home zoo, linking to a search 
  // for all living pandas at the given zoo.
  if (info.zoo != undefined) {
    var zoo = document.createElement('p');
    var zoo_link = Show.zooLink(info.zoo, info.zoo[language + ".name"], language, L.emoji.home);
    zoo.appendChild(zoo_link);  
    // Location shows a map icon and a flag icon, and links to
    // a Google Maps search for the "<language>.address" field
    var location = document.createElement('p');
    var location_link = Show.locationLink(info.zoo, language);
    location.appendChild(location_link);
    details.appendChild(zoo);
    details.appendChild(location);
  }
  if (info.wild != undefined) {
    var wild = document.createElement('p');
    wild.innerText = L.flags[info.wild["flag"]] + " " + info.wild[language + ".name"];
    details.appendChild(wild);
  }
  // Give credit for the person that took this photo
  var credit = Show.creditLink(info, 'p');
  details.appendChild(credit);
  if (info.photo_credit != undefined) {
    // See how many other panda photos this user has posted
    var other_photos = Show.appleLink(info, 'p');
    details.appendChild(other_photos);
  }
  return details;
}
Show.results.pandaName = function(info) {
  // Display the name and gender symbol for a single panda in the results "title bar"
  var language = info.language;
  var gender = Show.gender(info);
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
  var a = document.createElement('a');
  a.href = "#profile/" + info.id;
  var title_div = document.createElement('div');
  title_div.className = "pandaTitle";
  title_div.appendChild(gender);
  title_div.appendChild(name_div);
  a.appendChild(title_div);
  return a;
}
Show.results.parents = function(info) {
  // Do mom and dad's info in the family section
  var heading = document.createElement('h4');
  heading.className = "parentsHeading" + " " + info.language;
  heading.innerText = L.gui.parents[info.language];
  var ul = document.createElement('ul');
  ul.className = "pandaList" + " " + info.language;
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
Show.results.searchBar = function(language) {
  // Leaving a profile page? Turn this into a search bar again
  var body = document.getElementsByTagName("body")[0];
  var focalBar = document.getElementById("focalBar");
  if (focalBar.classList.contains("nameBar")) {
    // Replace the nameBar with a search bar
    var searchBar = Show.searchBar.render("topSearch", "focalBar");
    body.replaceChild(searchBar, focalBar);
    Show.searchBar.action();   // Add the event listeners
  }
}
Show.results.siblings = function(info) {
  // Do the non-litter siblings info in the family section
  var heading = document.createElement('h4');
  heading.className = "siblingsHeading" + " " + info.language;
  heading.innerText = L.gui.siblings[info.language];
  var ul = document.createElement('ul');
  ul.className = "pandaList" + " " + info.language;
  for (index in Pandas.sortOldestToYoungest(info.siblings)) {
    var myself = Pandas.searchPandaId(info.id)[0];
    var animal = info.siblings[index];
    var options = ["child_icon", "live_icon"];
    if (Pandas.halfSiblings(myself, animal)) {
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
Show.results.zoo = function(zoo, language) {
  // Display information for a zoo relevant to the red pandas
  var info = Show.acquireZooInfo(zoo, language);
  var gallery = Gallery.init(info, 'zoo', 'images/no-zoo.jpg');
  var photo = gallery.displayPhoto();
  var span = gallery.displayPhotoNavigation();
  photo.appendChild(span);
  photo.addEventListener('mouseover', function() {
    span.style.display = "block";
  });
  photo.addEventListener('mouseout', function() {
    span.style.display = "none";
  });
  title = Show.zooTitle(info);
  var details = Show.results.zooDetails(info);
  var dossier = document.createElement('div');
  dossier.className = "zooDossier";
  dossier.appendChild(title);
  dossier.appendChild(details);
  var result = document.createElement('div');
  result.className = "zooResult";
  result.appendChild(photo);
  result.appendChild(dossier);
  // Ensure theres's a search bar
  Show.results.searchBar();
  return result;
}
Show.results.zooDetails = function(info) {
  // This is the purple "dossier" information stripe for a zoo.
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
  counts.innerText = L.emoji.animal + " " + count_text[language];
  var address = document.createElement('p');
  var address_link = document.createElement('a');
  address_link.innerText = L.emoji.travel + " " + info.address;
  address_link.href = info.map;
  address_link.target = "_blank";   // Open in new tab
  address.appendChild(address_link);
  var zoo_page = document.createElement('p');
  var zoo_link = document.createElement('a');
  zoo_link.href = info.website;
  zoo_link.target = "_blank";   // Open in new tab
  zoo_link.innerText = L.emoji.website + " " + info.name;
  zoo_page.appendChild(zoo_link);
  var details = document.createElement('div');
  details.className = "zooDetails";
  details.appendChild(counts);
  details.appendChild(address);
  details.appendChild(zoo_page);
  // Photo details are optional for zoos, so don't show the
  // photo link if there's no photo included in the dataset
  if (info.photo != Pandas.def.zoo["photo.1"]) {
    // Give credit for the person that took this photo
    var credit = Show.creditLink(info, 'p');
    details.appendChild(credit);
    var other_photos = Show.appleLink(info, 'p');
    details.appendChild(other_photos);
  }
  return details;
}

/*
    Methods related to displaying a panda search bar
*/
Show.searchBar = {};
Show.searchBar.action = function() {
  // Set event listeners for the search bar
  if (document.forms['searchForm'] != undefined) {
    document.forms['searchForm'].addEventListener("submit", Show.searchBar.submit);
  }
  // Fix problems with Typesquare input box styling
  if (document.getElementById('searchInput') != undefined) {
    document.getElementById('searchInput').style.fontFamily = "sans-serif";
  }
}
Show.searchBar.display = function() {
  // Display the search bar if it is hidden
  if (document.forms['searchForm'] != undefined) {
    document.forms['searchForm'].display = "block";
  }
  // Then enable and set text cursor focus
  Show.searchBar.enable();
}
Show.searchBar.enable = function() {
  // Enable the search bar (i.e. if panda graph content has loaded), and display
  // the placeholder text in a localized way. If a page doesn't have the
  // search bar, do nothing.
  if (document.forms['searchForm'] != undefined) {
    document.forms['searchForm']['searchInput'].disabled = false;
    var placeholder = "➤ " + L.gui.search[L.display];
    document.forms['searchForm']['searchInput'].placeholder = placeholder;
    Show.searchBar.action();
  }
  document.getElementById('searchInput').focus();  // Set text cursor
}
Show.searchBar.remove = function(frame_id="bottomSearch") {
  // Remove the search bar when leaving profile mode. By default it will be
  // the bottom menu search bar that gets disappeared.
  var searchBar = document.getElementById(frame_id);
  if (searchBar != null) {
    searchBar.parentNode.remove(searchBar);
  }
}
Show.searchBar.render = function(frame_class, frame_id) {
  // Create a search bar. Should be the same kind of bar that would appear
  // either at the top of the search results page, or at the bottom of the
  // profiles page. There can only be one on a page (id logic).
  var hidden_button = document.createElement('input');
  hidden_button.id = "searchSubmit";
  hidden_button.className = "search";
  hidden_button.type = "submit";
  var text_input = document.createElement('input');
  text_input.id = "searchInput";
  text_input.className = "search";
  text_input.placeholder = "➤ " + L.gui.search[L.display];
  text_input.type = "search";
  var form = document.createElement('form');
  form.id = "searchForm";
  form.action = "javascript:";
  form.acceptCharset = "UTF-8";
  form.appendChild(hidden_button);
  form.appendChild(text_input);
  var shrinker = document.createElement('div');
  shrinker.className = "shrinker";
  shrinker.appendChild(form);
  var search_bar = document.createElement('div');
  search_bar.className = frame_class;   // top_search or bottom_search
  search_bar.id = frame_id;
  search_bar.appendChild(shrinker);
  // Add submit events for a search form
  Show.searchBar.action();
  return search_bar;
}
Show.searchBar.submit = function() {
  // JS actions for submiting a search
  Page.current = Page.results.render;
  document.getElementById('searchInput').blur();   // Make iOS keyboard disappear after submitting.
  var query = (document.getElementById('searchInput').value).replace(/\s+$/, '');
  window.location = "#query/" + query;
  // TODO: when submitting from the bottomMenu search bar, destroy it and move the
  // focus and query output to the top search bar.
  Show.searchBar.remove();
  // Refocus text cursor after a search is performed
  setTimeout(function() {
    document.getElementById('searchInput').focus();
  }, 0);
}
Show.searchBar.toggle = function(frame_id) {
  // Normally the search bar just appears at the top of the page.
  // In panda-profile mode, it's hidden unless the user opts to search
  // for new pandas using the Search Button at the bottom of the page.
  var searchBar = document.getElementById(frame_id);
  var display = searchBar.style.display;
  // Catch whether the search bar has no explicit display style (first click), or none
  if ((display == "none") || (display == "")) {
    searchBar.style.display = "table";
    Show.searchBar.action();   // Add the event listeners
    return true;
  } else {
    searchBar.style.display = "none";
    return false;
  }
}

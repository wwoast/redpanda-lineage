/*
    Presentation-level data, separated out from final website layout
*/
var Show = {};   /* Namespace */

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
  bundle = L.fallbackInfo(bundle, animal);  // Any defaults here?
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
  }
  return a;
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
Show.emptyResult = function(language) {
  var message = document.createElement('div');
  message.className = 'overlay';
  message.innerText = L.no_result[language];
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
Show.gender = function(info, frame_class="gender") {
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
  gender.className = frame_class;
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
Show.locationLink = function(zoo, language) {
  // Don't print content if the input id is zero
  if (zoo['_id'] == Pandas.def.zoo['_id']) {
    return Pandas.def.zoo[language + ".location"];
  }
  var link_text = L.emoji.map + " " + L.flags[zoo.flag];
  var google_search = zoo['map'];
  var a = document.createElement('a');
  a.href = google_search;
  a.innerText = link_text;
  a.target = "_blank";   // Open in new tab
  return a;
}

// Display the name and gender symbol for a single panda in the "title bar"
Show.pandaTitle = function(info) {
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
  var title_div = document.createElement('div');
  title_div.className = "pandaTitle";
  title_div.appendChild(gender);
  title_div.appendChild(name_div);
  return title_div;
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
    inner_text = L.emoji.home + " " + inner_text;
  }
  if (options.indexOf("map_icon") != -1) {
    inner_text = L.emoji.map + " " + inner_text;
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
  // Handle when someone clicks the about button
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
      Page.sections.buttonEventHandlers("aboutPageMenu");
      // Display correct subsection of the about page (class swaps)
      // Default: usage instructions appear non-hidden.
      Page.sections.show(Page.sections.menu.getItem("aboutPageMenu"));
      Page.current = Page.about.render;
    }
  }
}
Show.button.about.render = function() {
  var about = Show.button.render("aboutButton", L.emoji.bamboo, L.gui.about[L.display]);
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
Show.button.home.render = function() {
  var home = Show.button.render("homeButton", L.emoji.home, L.gui.home[L.display]);
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
Show.button.language.render = function() {
  var language = Show.button.render("languageButton", L.gui.flag[L.display], L.gui.language[L.display]);
  language.addEventListener("click", Show.button.language.action);
  return language;
}
Show.button.links = {};
Show.button.links.action = function() {
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
    if ((Page.links.language != L.display) && (Page.links.language != undefined)) {
      Page.links.fetch();
    } else {
      Page.links.render();
      // Add event listeners to the newly created About page buttons
      Page.sections.buttonEventHandlers("linksPageMenu");
      // Display correct subsection of the about page (class swaps)
      // Default: usage instructions appear non-hidden.
      Page.sections.show(Page.sections.menu.getItem("linksPageMenu"));
      Page.current = Page.links.render;
    }
  }
}
Show.button.links.render = function() {
  var links = Show.button.render("linksButton", L.emoji.link, L.gui.links[L.display]);
  links.addEventListener("click", Show.button.links.action);
  return links;
}
Show.button.logo = {};
// The logo button and home button do the same thing, but appear in different spots
Show.button.logo.action = Show.button.home.action;
Show.button.logo.render = function() {
  var logo = Show.button.render("logoButton", L.emoji.logo);
  logo.classList.add("logo");
  logo.classList.remove("menu");
  logo.addEventListener("click", Show.button.logo.action);
  return home;
}
Show.button.random = {};
Show.button.random.action = function() {
  // Show a random panda from the database when the dice is clicked
  Page.current = Page.results.render;
  var pandaIds = P.db.vertices.filter(entity => entity._id > 0).map(entity => entity._id);
  window.location = "#query/" + pandaIds[Math.floor(Math.random() * pandaIds.length)];
}
Show.button.random.render = function() {
  var random = Show.button.render("topButton", L.emoji.top, L.gui.top[L.display]);
  random.addEventListener("click", Show.button.random.action);
  return random;
}
Show.button.render = function(id, button_icon, button_text) {
  // Draw menu buttons for the bottom menu, or potentially elsewhere.
  var button = document.createElement('button');
  button.className = "menu";
  button.id = id;
  var content = document.createElement('div');
  content.className = "buttonContent";
  var icon_div = document.createElement('div');
  icon_div.className = 'icon';
  icon_div.innerText = button_icon;
  content.appendChild(icon_div);
  if (button_text != undefined) {
    var text_div = document.createElement('div');
    text_div.className = 'text';
    text_div.innerText = button_text;
    content.appendChild(text_div);
  }
  button.appendChild(content);
  return button;
}
Show.button.top = {};
Show.button.top.action = function() {
  // anchor tags get used for JS redraws, so don't use an anchor tag for
  // top-of-page scroll events. This fixes the language button after clicking pageTop.
  window.scrollTo(0, 0);
}
Show.button.top.render = function() {
  var top = Show.button.render("topButton", L.emoji.top, L.gui.top[L.display]);
  top.addEventListener("click", Show.button.top.action);
  return top;
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
    var button = Show.button[btn_type].render();
    new_contents.appendChild(button);
  }
  // Remove exisitng contents and replace with new.
  var menu = document.getElementsByClassName("topMenu")[0];
  var current_contents = menu.childNodes[0];
  menu.replaceChild(new_contents, current_contents);
  // Remove any previous menu class modifiers
  menu.classList.remove("profile");
}
Show.results.menus.bottomButtons = ['topButton', 'homeButton'];
Show.results.menus.top = function() {
  // Return to a green menu bar: Logo/Home, Language, About, Random, Links
  var new_contents = document.createElement('div');
  new_contents.className = "shrinker";
  // Take the list of top-menu buttons and render them
  for (let btn_id of Show.results.menus.topButtons) {
    var btn_type = btn_id.replace("Button", "");
    var button = Show.button[btn_type].render();
    new_contents.appendChild(button);
  }
  // Remove exisitng contents and replace with new.
  var menu = document.getElementsByClassName("topMenu")[0];
  var current_contents = menu.childNodes[0];
  menu.replaceChild(new_contents, current_contents);
  // Remove any previous menu class modifiers
  menu.classList.remove("profile");
}
Show.results.menus.topButtons = ['logoButton', 'languageButton', 'aboutButton', 'randomButton', 'linksButton'];
Show.results.panda = function(animal, language) {
  // Display a block of information for a single panda.
  // Most missing elements should not be displayed, but 
  // a few should be printed regardless (birthday / death)
  var info = Show.acquirePandaInfo(animal, language);
  var gallery = Gallery.init(info, 'pandaPhoto');
  var photo = gallery.displayPhoto();
  var span = gallery.displayPhotoNavigation();
  photo.appendChild(span);
  photo.addEventListener('mouseover', function() {
    span.style.display = "block";
  });
  photo.addEventListener('mouseout', function() {
    span.style.display = "none";
  });
  var title = Show.pandaTitle(info);
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
  return result; 
}
Show.results.pandaDetails = function(info) {
  // The purple results-page "dossier" information stripe for a panda.
  var language = info.language;
  var born = document.createElement('p');
  born.innerText = L.emoji.born + " " + info.birthday;
  // If still alive, print their current age
  var second = document.createElement ('p');
  if (info.death == Pandas.def.unknown[language]) {
    second.innerText = "(" + info.age + ")";
  } else {
    second.innerText = L.emoji.died + " " + info.death;
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
  credit_link.innerText = L.emoji.camera + " " + info.photo_credit;
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
    credit_count_link.innerText = L.emoji.gift + " " + P.db._photo.credit[info.photo_credit];
    other_photos.appendChild(credit_count_link);
    details.appendChild(other_photos);
  }
  return details;
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
Show.results.siblings = function(info) {
  // Do the non-litter siblings info in the family section
  var heading = document.createElement('h4');
  heading.className = "siblingsHeading" + " " + info.language;
  heading.innerText = L.gui.siblings[info.language];
  var ul = document.createElement('ul');
  ul.className = "pandaList" + " " + info.language;
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
Show.results.zoo = function(zoo, language) {
  // Display information for a zoo relevant to the red pandas
  var info = Show.acquireZooInfo(zoo, language);
  var gallery = Gallery.init(info, 'zooPhoto', 'images/no-zoo.jpg');
  var photo = gallery.displayPhoto();
  var title = Show.zooTitle(info);
  var details = Show.results.zooDetails(info);
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
  if (info.photo != Pandas.def.zoo["photo"]) {
    var photo_page = document.createElement('p');
    var photo_link = document.createElement('a');
    photo_link.href = info.photo_link;
    photo_link.innerText = L.emoji.camera + " " + info.photo_credit;
    photo_page.appendChild(photo_link);
    details.appendChild(photo_page);
    // See how many other panda photos this user has posted
    var other_photos = document.createElement('p');
    var credit_count_link = document.createElement('a');
    credit_count_link.href = "#credit/" + info.photo_credit;
    credit_count_link.innerText = L.emoji.gift + " " + P.db._photo.credit[info.photo_credit];
    other_photos.appendChild(credit_count_link);
    details.appendChild(other_photos);
  }
  return details;
}

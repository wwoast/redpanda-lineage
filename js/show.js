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
            "dad": Pandas.searchPandaDad(animal["_id"]),
         "gender": Pandas.gender(animal, language),
       "get_name": language + ".name",
             "id": animal["_id"],
       "language": language,
 "language_order": Pandas.language_order(animal),
         "litter": Pandas.searchLitter(animal["_id"]),
            "mom": Pandas.searchPandaMom(animal["_id"]),
           "name": Pandas.myName(animal, language),
     "othernames": Pandas.othernames(animal, language),
          "photo": picture['photo'],
   "photo_credit": picture['credit'],
    "photo_index": picture['index'],
     "photo_link": picture['link'],
 "photo_manifest": Pandas.photoManifest(animal),
 "search_context": animal["search_context"],
       "siblings": Pandas.searchNonLitterSiblings(animal["_id"]),
        "species": Pandas.species(animal["_id"]),
           "wild": Pandas.myWild(animal, "wild"),
            "zoo": Pandas.myZoo(animal, "zoo")
  }
  bundle = L.fallbackInfo(bundle, animal);  // Any defaults here?
  // HACK: revert search context
  animal["search_context"] = undefined;
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
        "closed": Pandas.zooField(zoo, "closed"),
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
  // Multiple possible moms or dads?
  if (options.indexOf("question_icon") != -1) {
    gender_text = gender_text.replace("\xa0", "") + Language.L.emoji.question + "\xa0";
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
  if (Object.keys(Pandas.def.authors).indexOf(info.photo_credit) != -1) {
    // Anonymous/uncredited photos get no apple link
    credit_count_link.removeAttribute("href");
    credit_count_link.innerText = "";
  } else {
    // Otherwise make an apple link with # of photos contributed
    var apple_count = P.db._photo.credit[info.photo_credit];
    credit_count_link.innerText = L.emoji.gift + " " + apple_count;
    if (parseInt(apple_count) >= 1000) {
      credit_count_link.innerText = L.emoji.megagift + " " + apple_count;
    }
  }
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
  credit_link.target = "_blank";   // Open in new tab
  credit_link.href = info.photo_link;
  if (Object.keys(Pandas.def.authors).indexOf(info.photo_credit) != -1) {
    // Uncredited / anonymous photos get no href, and are not links
    credit_link.innerText = L.emoji.camera + " " + Pandas.def.authors[info.photo_credit][L.display];
    credit_link.removeAttribute("href");
  } else if (info.photo_credit != undefined) {
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
  othernames = othernames.split(", ");   // Guarantee array
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
  for (let language of animal["language.order"].split(", ")) {
    var nicknames = animal[language + ".nicknames"];
    if (nicknames == undefined) {
      continue;
    }
    var nicknames_list = [];
    var nicknames_li = document.createElement('li');
    nicknames_li.innerText = L.gui.language[L.display][language] + ": ";
    // Nicknames for this animal
    for (let name of nicknames.split(", ")) {
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
  for (let language of animal["language.order"].split(", ")) {
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
      for (let name of othernames.split(", ")) {
        othername_list.push(name);
      }
    }
    // Old names that were previously valid for this animal
    var oldnames = animal[language + ".oldnames"];
    if (oldnames != undefined) {
      for (let name of oldnames.split(", ")) {
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

// Make a safe URL (no reflection issues)
Show.qrcodeHashSafe = function(short=false) {
  var in_hash = window.location.hash;
  var out_hash = undefined;
  var parts = in_hash.split("/");
  var profile = undefined;
  var panda_id = undefined;
  var sub_hash = undefined;
  var photo_id = undefined;
  if (parts.length >= 4) {
    profile = parts[0];
    panda_id = parts[1];
    sub_hash = parts[2];
    if (sub_hash != "photo") {
      sub_hash = "photo";
    }
    photo_id = parts[3];
    if ((parseInt(panda_id) <= 0) || 
        (parseInt(panda_id) > parseInt(P.db["_totals"].pandas))) {
      panda_id = '1';
    }
    if ((parseInt(photo_id) <= 0) ||
        (parseInt(photo_id) > parseInt(P.db["_photo"].entity_max))) {
      photo_id = '1'
    }
    if (short == false) {
      out_hash = profile + "/" + panda_id + "/" + sub_hash + "/" + photo_id;
    } else {
      out_hash = profile + "/" + panda_id;
    }
  }
  else if ((parts.length <= 3) && (parts.length >= 2)) {
    profile = parts[0];
    panda_id = parts[1];
    sub_hash = '';
    photo_id = '';
    if ((parseInt(panda_id) <= 0) || 
        (parseInt(panda_id) > parseInt(P.db["_totals"].pandas))) {
      panda_id = '1';
    }
    out_hash = profile + "/" + panda_id;
  } else {
    out_hash = '';
  }
  return out_hash;
}

// Construct a QR code out of the current page URL
Show.qrcodeImage = function(animal_index=null, photo_index=null) {
  // Shorten the hash if there's a photo index included
  var safe_hash = Show.qrcodeHashSafe(photo_index == null);
  var safe_url = "https://" + window.location.host + "/" + safe_hash;
  if ((photo_index != null) && (animal_index != null)) {
    safe_url = "https://" + window.location.host + "/#profile/" + animal_index + "/photo/" + photo_index;
  }
  var img = showQRCode(safe_url);
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
  // Click qrcode and copy its url
  qrimg.addEventListener("click", function(event) {
    event.preventDefault();
    const text_class = "qrcodeText";
    // Join the text blocks above and below the QR Code image
    const qrcode_url = Array.from(document.getElementsByClassName(text_class))
      .map(span => span.innerText)
      .join("");
    // Copy it into the clipboard
    navigator.clipboard.writeText(qrcode_url);
    // Make the Copied toast appear
    Show.fade(document.getElementById("copyToast"));
  });
  var qrHashLink = document.createElement('span');
  qrHashLink.className = "qrcodeText";
  if ((photo_index == null) && (animal_index == null)) {
    qrHashLink.innerText = safe_hash;
  } else {
    qrHashLink.innerText = "#profile/" + animal_index + "/photo/" + photo_index;
  }
  qrcode.appendChild(qrHashLink);
  var copy_notice = document.createElement('span');
  copy_notice.className = "notifier";
  copy_notice.id = "copyToast";
  copy_notice.innerText = L.gui.copied[L.display];
  qrcode.appendChild(copy_notice);
  return qrcode;
}

// When the gallery loads, swap the qrcode url so that it includes
// info about the photo that's currently being displayed. This means
// that the QRCode and the displayed page don't exactly match the
// #hash_code, but the contents will be guaranteed consistent.
// I didn't want back/forward browser buttons to ever modify the gallery
// photos themselves, because for the results pages with multiple galleries
// there is no sensible way to support this.
Show.qrcodeSwap = function() {
  var old_qrcode = document.getElementsByClassName('qrcodeFrame')[0];
  if (old_qrcode == undefined) {
    return;
  }
  var gallery = document.getElementsByClassName('pandaPhoto')[0];
  var gallery_id = gallery.childNodes[0].id;
  var animal_id = gallery_id.split("/photo/")[0].split("_")[1];
  var photo_index = gallery_id.split("/photo/").pop();
  var new_qrcode = Show.qrcodeImage(animal_id, photo_index);
  old_qrcode.parentNode.replaceChild(new_qrcode, old_qrcode);
}

// Construct a zoo divider, for when you search a place name and
// get multiple results worth of zoos
Show.zooDivider = function(mode="bear-bamboo") {
  var divider = document.createElement('div');
  var modes = ["bamboo", "bear", "bear-bamboo", "fruit"];
  if (mode == "random") {
    mode = Pandas.randomChoice(modes, 1);
  }
  divider.className = 'zooDivider';
  if (mode == "bamboo") {
    divider.innerText = '- 🎍 — 🎋 — 🎍 -';
  } else if (mode == "bear") {
    divider.innerText = '🌿 🐯 🐻 🌿';
  } else if (mode == "bear-bamboo") {
    divider.innerText = '🌿 🎍 🐯🐻 🎍 🌿';
  } else if (mode == "fruit") {
    divider.innerText = '🌿 🍎 🍇 🍎 🌿';
  } else {
    divider.innerText = '🌿 🍎 🍇 🍎 🌿';
  }
  return divider;
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
  Show.button.language.hide();   // If language menu open, hide it
}
Show.button.about.render = function(class_name="results") {
  var about = Show.button.render("aboutButton", L.emoji.bamboo, L.gui.about[L.display], class_name);
  about.addEventListener("click", Show.button.about.action);
  return about;
}
Show.button.flag = {};
Show.button.flag.action = function() {
  var language = this.id.replace("LanguageFlag", "");
  var options = Object.values(Pandas.def.languages);
  var choice = options.indexOf(language);
  // Don't redraw unless the language exists, or has
  // changed from the current display language.
  if ((choice > -1) && (language != L.display)) {
    L.display = language;
    L.update();
    // Redraw the nearby page if necessary
    if (Query.env.output_mode == "nearby") {
      F.getNaiveLocation();
    }
    Page.redraw(Page.current);
  }
  Show.button.language.hide();   // If language menu open, hide it
}
Show.button.flag.render = function(language, class_color) {
  var button = document.createElement('button');
  button.classList.add("menu");
  button.classList.add("flag");
  button.classList.add(class_color);
  button.id = language + "LanguageFlag";
  var content = document.createElement('div');
  content.className = "buttonContent";
  var icon = document.createElement('div');
  icon.className = "buttonIcon";
  icon.innerText = Language.L.gui.flag[language];
  content.appendChild(icon);
  button.appendChild(content);
  button.addEventListener("click", Show.button.flag.action);
  return button;
}
Show.button.home = {};
Show.button.home.action = function() {
  // Return to the empty search page
  Page.lastSearch = "#home";
  Page.home.render();
  window.location = "#home";
  Show.button.language.hide();   // If language menu open, hide it
  Page.current = Page.home.render;
  // If bottom search bar is showing, remove it
  Show.searchBar.remove("bottomSearch");
  window.scrollTo(0, 0);   // Go to the top of the page
};
Show.button.home.render = function(class_name="results") {
  var home = Show.button.render("homeButton", L.emoji.home, L.gui.home[L.display], class_name);
  home.addEventListener("click", Show.button.home.action);
  return home;
}
Show.button.language = {};
Show.button.language.action = function() {
  var language_menu = document.getElementsByClassName("languageMenu")[0];
  if ((language_menu.style.display == "none") ||
      (language_menu.style.display == "")) {
    language_menu.style.display = "table";
  } else {
    language_menu.style.display = "none";
  }
}
Show.button.language.altAction = function(e) {
  e.preventDefault();
  var language = L.display;
  var options = Object.values(Pandas.def.languages);
  var count = options.length;
  var choice = (options.indexOf(language) + 1) % count;
  L.display = options[choice];
  L.update();
  // Redraw the nearby page if necessary
  if (Query.env.output_mode == "nearby") {
    F.getNaiveLocation();
  }
  Page.redraw(Page.current);
  Show.button.language.hide();   // If language menu open, hide it
}
Show.button.language.hide = function() {
  var language_menu = document.getElementsByClassName("languageMenu")[0];
  language_menu.style.display = "none";
}
Show.button.language.render = function(class_name="results") {
  var language = Show.button.render("languageButton", L.gui.flag[L.display], L.gui.language[L.display][L.display], class_name);
  language.addEventListener("click", Show.button.language.action);
  language.addEventListener("contextmenu", Show.button.language.altAction);
  return language;
}
Show.button.links = {};
Show.button.links.action = function() {
  Page.links.routing();
  Show.button.language.hide();   // If language menu open, hide it
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
Show.button.media.action = function(panda_id) {
  Page.media.render();
  window.location = "#media/" + panda_id;
  Show.button.language.hide();   // If language menu open, hide it
  Page.current = Page.media.render;
}
Show.button.media.altAction = function(e) {
  e.preventDefault();       // Prevent normal right-click menu from firing
  Page.current = Page.media.render;
  var pandaIds = P.db.vertices.filter(entity => entity._id.indexOf("media") == 0)
                              .filter(entity => entity["photo.1"] != undefined)
                              .map(entity => entity["panda.tags"])
                              .map(tag_ids => tag_ids.split(", "));
  pandaIds = Pandas.distinct(Parse.tree.flatten(pandaIds));
  window.location = "#media/" + pandaIds[Math.floor(Math.random() * pandaIds.length)];
  Show.button.language.hide();   // If language menu open, hide it
  window.scrollTo(0, 0);   // Go to the top of the page
}
// Work in progress button, doesn't do anything yet
Show.button.media.render = function(class_name="profile", panda_id) {
  var media = Show.button.render("mediaButton", L.emoji.media, L.gui.media[L.display], class_name);
  media.addEventListener("click", function() {
    Show.button.media.action(panda_id);
  });
  media.addEventListener("contextmenu", Show.button.media.altAction);
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
Show.button.paging = {};
Show.button.paging.action = function(callback, parameters, frame_id, class_name) {
  Show.button.language.hide();   // If language menu open, hide it
  var paging_data = callback.apply(null, parameters);
  var new_photos = paging_data["output"];
  // Append content into the page. HACK: always the first child of the container frame
  var frame = document.getElementById(frame_id).childNodes[0];
  for (let new_photo of new_photos) {
    frame.appendChild(new_photo);
  }
  // Update the page count for the next button to use
  parameters[0] = parameters[0] + 1;
  // Redraw the footer with the next action, with the correct color (class_name)
  Page.footer.redraw(class_name)
  // Increment the shown page counter, in case we want to refresh
  // after changing the shown language 
  Query.env.paging.shown_pages = Query.env.paging.shown_pages + 1;
}
Show.button.paging.render = function(class_name) {
  var paging = Show.button.render("pagingButton", L.emoji.paging, L.gui.paging[L.display], class_name);
  // Get callback function and arguments from Query.env
  var callback = Query.env.paging.callback.function;
  var parameters = Query.env.paging.callback.arguments;
  var frame_id = Query.env.paging.callback.frame_id;
  paging.addEventListener("click", function() {
    Show.button.paging.action(callback, parameters, frame_id, class_name);
  });
  // English and Japanese text is too wide
  var text = paging.childNodes[0].childNodes[1];
  if (L.display == "jp") {
    text.classList.add("condensed");
  } else {
    text.classList.remove("condensed");
  }
  // If we're on a page that needs a "next page" button, display it
  if (Query.env.paging.display_button == false) {
    paging.classList.add("hidden");
  }   
  return paging;
}
Show.button.profile = {};
Show.button.profile.action = function(panda_id) {
  Page.profile.render();
  window.location = "#profile/" + panda_id;
  Show.button.language.hide();   // If language menu open, hide it
  Page.current = Page.profile.render;
}
Show.button.profile.altAction = function(e) {
  e.preventDefault();       // Prevent normal right-click menu from firing
  Page.current = Page.profile.render;
  var pandaIds = P.db.vertices.filter(entity => entity._id > 0)
                              .filter(entity => entity["photo.1"] != undefined)
                              .filter(entity => entity.death == undefined)
                              .map(entity => entity._id);
  window.location = "#profile/" + pandaIds[Math.floor(Math.random() * pandaIds.length)];
  Show.button.language.hide();   // If language menu open, hide it
  window.scrollTo(0, 0);   // Go to the top of the page
}
Show.button.profile.render = function(class_name="profile", panda_id) {  
  var profile = Show.button.render("profileButton", L.emoji.profile, L.gui.profile[L.display], class_name);
  profile.addEventListener("click", function() {
    Show.button.profile.action(panda_id);
  });
  profile.addEventListener("contextmenu", Show.button.profile.altAction);
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
  // Show a random panda or group set from the database when the dice is clicked
  Page.current = Page.results.render;
  var zooIds = P.db.vertices.filter(entity => isNaN(parseInt(entity._id)) == false)
                            .filter(entity => entity._id < 0)
                            .filter(entity => entity["photo.1"] != undefined)
                            .map(entity => entity._id)
                            .filter(id => Pandas.searchPandaZooCurrent(id).length > 0)
  var pandaIds = P.db.vertices.filter(entity => isNaN(parseInt(entity._id)) == false)
                              .filter(entity => entity._id > 0)
                              .filter(entity => entity["photo.1"] != undefined)
                              .filter(entity => entity.death == undefined)
                              .map(entity => entity._id);
  var groupIds = P.db.vertices.filter(entity => entity._id.indexOf("media") == 0)
                              .map(entity => entity["panda.tags"])
                              .map(tags => tags.split(", ").join(" "))
                              .filter(function(tags){
                                // If all animals in the group photo are dead, don't present
                                var alive = tags.split(" ").map(id => Pandas.searchPandaId(id).death != undefined);
                                if (alive.every(id => id === true)) {
                                  return false;
                                } else {
                                  return true;
                                }
                              });
  var randomChoices = pandaIds.concat(groupIds).concat(zooIds);
  window.location = "#query/" + randomChoices[Math.floor(Math.random() * randomChoices.length)];
  Show.button.language.hide();   // If language menu open, hide it
  Show.searchBar.remove("bottomSearch");   // When clicked, kill this search bar
  window.scrollTo(0, 0);   // Go to the top of the page
}
Show.button.random.render = function(class_name="results") {
  var random = Show.button.render("randomButton", L.emoji.random, L.gui.random[L.display], class_name);
  random.addEventListener("click", Show.button.random.action);
  return random;
}
Show.button.refresh = {};
Show.button.refresh.action = function() {
  location.reload(false);   // Reload from cache
}
Show.button.refresh.altAction = function(e) {
  e.preventDefault();       // Prevent normal right-click menu from firing
  location.reload(true);    // Reload from server
}
Show.button.refresh.render = function(class_name="results") {
  var refresh = Show.button.render("refreshButton", L.emoji.refresh, L.gui.refresh[L.display], class_name);
  refresh.addEventListener("click", Show.button.refresh.action);
  refresh.addEventListener("contextmenu", Show.button.refresh.altAction);
  return refresh;
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
Show.button.section = {};
Show.button.section.render = function(classes, id, body_text) {
  // Generate buttons for inside the links page, or for other sectional pages 
  // that need to be live-generated by Javascript
  var button = document.createElement('button');
  button.className = classes;   // Space-delimited classes == multiple classes
  button.id = id;
  var button_text = document.createElement('div');
  button_text.className = "sectionMenuItem";
  button_text.innerText = body_text;
  button.appendChild(button_text);
  return button;
}
Show.button.top = {};
Show.button.top.action = function() {
  // anchor tags get used for JS redraws, so don't use an anchor tag for
  // top-of-page scroll events. This fixes the language button after clicking pageTop.
  Show.button.language.hide();   // If language menu open, hide it
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
    Show functions used to generate content for the links page. Each links
    page has slightly different content and styles.
*/
Show.links = {};
Show.links.body = function(subpage) {
  // Draw a links page with menus and content based on the last
  // clicked version of a links menu button.
  var container = document.createElement('div');
  container.id = "contentFrame";
  container.className = "links";
  var shrinker = document.createElement('div');
  shrinker.className = "shrinker";
  // Draw the section menus
  var menu = Show.links.menus.section(subpage);
  // Draw the links-page content
  var content = Show.links.sections[subpage]();
  shrinker.appendChild(menu);
  shrinker.appendChild(content);
  container.appendChild(shrinker);
  return container;
}
Show.links.create = function(element, href, text, suffix, before=undefined, after=undefined) {
  // Draw a link for the links page. Many modes will want
  // to suffix specific data as part of the link text
  var container = document.createElement(element);
  var anchor = document.createElement('a');
  anchor.href = href;
  anchor.innerText = text + " " + suffix;
  if (before != undefined) {
    // Before text is for the special-thanks page.
    // Trailing spaces get eaten from config, so add it back.
    var text_before = document.createTextNode(before);
    container.appendChild(text_before);
  }
  if (href == "underline") {
    // Non-link links for the special-thanks page.
    // Do not process any suffix for this, and hack
    // in leading and trailing space.
    var leading = document.createTextNode(" ");
    var trailing = document.createTextNode(" ");
    anchor = document.createElement('u');
    anchor.innerText = text;
    container.appendChild(leading);
    container.appendChild(anchor);
    container.appendChild(trailing);    
  } else {
    container.appendChild(anchor);
  }
  if (after != undefined) {
    // After text is for the special-thanks page
    var text_after = document.createTextNode(after);
    container.appendChild(text_after);
  }
  return container;
}
Show.links.flags = function(order) {
  // Convert the language order string into a list of flag emojis
  var flags = "";
  if (order.length > 0) {
    flags = order.map(l => Language.L.gui.flag[l]).join(" ");
  }
  return flags;
}
Show.links.menus = {};
Show.links.menus.bottom = function() {
  // Return to a green menu bar.
  // TODO: only show the top button if the page height is larger
  // than the viewport by a certain amount
  var new_contents = document.createElement('div');
  new_contents.className = "shrinker";
  // Take the list of bottom-menu buttons and render them.
  // Since the theme is green, leverage the "results" render type
  for (let btn_id of Show.links.menus.bottomButtons) {
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
Show.links.menus.bottomButtons = ['topButton', 'homeButton'];
Show.links.menus.section = function(subpage) {
  // Draw the links page subsection menus
  // Highlight the button for the currently displayed subpage
  var menu = document.createElement('div');
  menu.id = "linksPageMenu";
  menu.className = "sectionMenu";
  // Draw each button based on its id and language.js lookups
  for (let btn_name of Show.links.menus.sectionButtons) {
    var btn_id = btn_name + "_button";
    var btn_class = "sectionButton four";
    if (btn_name == subpage) {
      btn_class = btn_class + " selected";
    }
    var text = Language.L.gui[btn_id][L.display];
    var button = Show.button.section.render(btn_class, btn_id, text);
    menu.appendChild(button);
  }
  return menu;
}
Show.links.menus.sectionButtons = ['redPandaCommunity', 'zooLinks', 'instagramLinks', 'specialThanksLinks'];
Show.links.menus.top = function() {
  // Return to a green menu bar: Logo/Home, Language, About, Random, Links
  var new_contents = document.createElement('div');
  new_contents.className = "shrinker";
  // Take the list of top-menu buttons and render them
  for (let btn_id of Show.links.menus.topButtons) {
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
Show.links.menus.topButtons = ['logoButton', 'languageButton', 'aboutButton', 'randomButton', 'linksButton'];
Show.links.order = {};
Show.links.order.given = function(links) {
  // Go through a set of links, and return an object with all details necessary
  // to construct links in the page, along with any counts that will assist in
  // sorting, should sorting be necessary elsewhere.
  var output = {};
  output.counts = {};
  // Count the hits for each language that we support in the display modes
  for (let language of Language.L.default.order) {
    output.counts[language] = 0;
  }
  // Grab the icon from the links values
  output.icon = links.icon;
  // The list of links themselves
  output.list = [];
  var link_fields = Pandas.linkGeneratorEntity;
  for (let field_name of link_fields(links)) {
    // Fallback language order
    var language_order = links[field_name + ".language.order"];
    if (links[field_name + ".language.order"] == undefined) {
      language_order = Language.L.default.order;
    } else {
      language_order = language_order.split(", ");
    }
    // Fallback name selection, if (like the instagram names) we don't
    // have language-specific names. Start with a generic name field if
    // the links are actually generic.
    var link_name = links[field_name + ".name"];
    if (link_name == undefined) {
      link_name = links[field_name + "." + L.display + ".name"]; 
    }
    if (link_name == undefined) {
      check_languages = language_order.filter(l => l != L.display);
      for (let l of check_languages) {
        link_name = links[field_name + "." + l + ".name"];
        if (link_name != undefined) {
          break;
        }
      }
    }
    var link = {
      "first": links[field_name + "." + L.display + ".first"],
      "href": links[field_name],
      "last": links[field_name + "." + L.display + ".last"],
      "order": language_order,
      "text": link_name
    }
    for (let language of link.order) {
      output.counts[language] = output.counts[language] + 1;
    }
    output.list.push(link);
  }
  return output;
}
Show.links.order.hits = function(links) {
  // Display links in language order, and then order by which language
  // has the most recorded hits in the links.
  var output = Show.links.order.given(links);
  output.list = output.list.sort(function(a, b) {
    // Do a pass of alphabetical sorting by name, without underscores
    // changing the sort order.
    var aText = a.text.replace("_", "");
    var bText = b.text.replace("_", "");    
    if (aText > bText) {
      return 1;
    } else if (aText < bText) {
      return -1;
    } else {
      return 0;
    }
  }).sort(function(a, b) {
    // Finally, do a pass of sorting by language hits count for the primary
    // language of each object
    var aLangCount = output.counts[a.order[0]];
    var bLangCount = output.counts[b.order[0]];
    if (aLangCount > bLangCount) {
      return -1;
    } else if (aLangCount < bLangCount) {
      return 1;
    } else {
      return 0;
    }
  });
  return output;
}
Show.links.order.language = function(links) {
  // Display links in language order, but otherwise preserving the list
  // order of the underlying links dataset. This means that other than
  // language sorting, the zoo lists will still prioritize the original
  // list order, which is generally done by how many animals that zoo is
  // known for.
  // Return the links page content as an array with the desired ordering.
  var output = Show.links.order.given(links);  
  output.list = output.list.sort(function(a, b) {
    // If the primary (zeroth) language for the link is the 
    // display language, prioritize that.
    var aHasLang = a.order.indexOf(L.display);
    var bHasLang = b.order.indexOf(L.display);
    if (aHasLang == bHasLang) {
      // Either the zeroth index, or neither entry has the language
      return 0;
    } else if (bHasLang == -1) {
      // One of the entries is missing the desired language 
      return -1;
    } else if (aHasLang == 0) {
      // Zeroth index is the primary language, so it comes first
      return -1;
    } else {
      return 1;
    }
  });
  return output;
}
Show.links.order.languageAndAlphabet = function(links) {
  // Display links in language order. Any link with the current language
  // as the 1st in the link's language.order will be treated as a primary
  // language link and appear first. All primary links will be arranged
  // in lexicographical order. Next, order the other links by whether the
  // desired language is a secondary value for the given link.
  // Return the links page content as an array with the desired ordering.
  var output = Show.links.order.given(links);  
  output.list = output.list.sort(function(a, b) {
    // Do a pass of alphabetical sorting by name, without underscores
    // changing the sort order.
    var aText = a.text.replace("_", "");
    var bText = b.text.replace("_", "");
    if (aText > bText) {
      return 1;
    } else if (aText < bText) {
      return -1;
    } else {
      return 0;
    }
  }).sort(function(a, b) {
    // If the primary (zeroth) language for the link is the 
    // display language, prioritize that.
    var aHasLang = a.order.indexOf(L.display);
    var bHasLang = b.order.indexOf(L.display);
    if (aHasLang == bHasLang) {
      // Either the zeroth index, or neither entry has the language
      return 0;
    } else if (bHasLang == -1) {
      // One of the entries is missing the desired language 
      return -1;
    } else if (aHasLang == 0) {
      // Zeroth index is the primary language, so it comes first
      return -1;
    } else {
      return 1;
    }
  });
  return output;
}
Show.links.sections = {};
Show.links.sections.instagramLinks = function() {
  var data = 'instagram';
  var links = Show.links.order.languageAndAlphabet(Pandas.searchLinks(data));
  var container = document.createElement('div');
  container.id = "instagramLinks";
  container.className = "section";
  var sub_container = document.createElement('div');
  sub_container.className = "pandaLinks";
  var h2 = document.createElement('h2');
  h2.className = "linksHeader";
  h2.innerText = Language.L.gui["instagramLinks_header"][L.display];
  var body = document.createElement('p');
  body.innerText = Language.L.gui["instagramLinks_body"][L.display];
  var ul = document.createElement("ul");
  ul.classList.add("linkList");
  ul.classList.add("multiColumn");
  ul.classList.add(links.icon);
  for (let link of links.list) {
    var suffix = Show.links.flags(link.order);
    var li = Show.links.create('li', link.href, link.text, suffix);
    ul.appendChild(li);
  }
  sub_container.appendChild(h2);
  sub_container.appendChild(body);
  sub_container.appendChild(ul);
  container.appendChild(sub_container);
  return container;
}
Show.links.sections.redPandaCommunity = function() {
  var data = 'community';
  var links = Show.links.order.language(Pandas.searchLinks(data));
  var container = document.createElement('div');
  container.id = "redPandaCommunity";
  container.className = "section";
  var sub_container = document.createElement('div');
  sub_container.className = "pandaLinks";
  var h2 = document.createElement('h2');
  h2.className = "linksHeader";
  h2.innerText = Language.L.gui["redPandaCommunity_header"][L.display];
  var body = document.createElement('p');
  body.innerText = Language.L.gui["redPandaCommunity_body"][L.display];
  var ul = document.createElement("ul");
  ul.classList.add("linkList");
  ul.classList.add(links.icon);
  for (let link of links.list) {
    var suffix = Show.links.flags(link.order);
    var li = Show.links.create('li', link.href, link.text, suffix);
    ul.appendChild(li);
  }
  sub_container.appendChild(h2);
  sub_container.appendChild(body);
  sub_container.appendChild(ul);
  container.appendChild(sub_container);
  return container;
}
Show.links.sections.specialThanksLinks = function() {
  var data = 'special-thanks';
  var links = Show.links.order.given(Pandas.searchLinks(data));
  var container = document.createElement('div');
  container.id = "specialThanksLinks";
  container.className = "section";
  var sub_container = document.createElement('div');
  sub_container.className = "pandaLinks";
  var h2 = document.createElement('h2');
  h2.className = "linksHeader";
  h2.innerText = Language.L.gui["specialThanksLinks_header"][L.display];
  var body = document.createElement('p');
  body.innerText = Language.L.gui["specialThanksLinks_body"][L.display];
  var ul = document.createElement("ul");
  ul.classList.add("linkList");
  ul.classList.add(links.icon);
  for (let link of links.list) {
    var li = Show.links.create('li', link.href, link.text, "", link.first, link.last);
    ul.appendChild(li);
  }
  sub_container.appendChild(h2);
  sub_container.appendChild(body);
  sub_container.appendChild(ul);
  container.appendChild(sub_container);
  return container;
}
Show.links.sections.zooLinks = function() {
  var data = 'zoos';
  var links = Show.links.order.language(Pandas.searchLinks(data));
  var container = document.createElement('div');
  container.id = "zooLinks";
  container.className = "section";
  var sub_container = document.createElement('div');
  sub_container.className = "pandaLinks";
  var h2 = document.createElement('h2');
  h2.className = "linksHeader";
  h2.innerText = Language.L.gui["zooLinks_header"][L.display];
  var body = document.createElement('p');
  body.innerText = Language.L.gui["zooLinks_body"][L.display];
  var ul = document.createElement("ul");
  ul.classList.add("linkList");
  ul.classList.add(links.icon);
  for (let link of links.list) {
    var suffix = Show.links.flags(link.order);
    var li = Show.links.create('li', link.href, link.text, suffix);
    ul.appendChild(li);
  }
  sub_container.appendChild(h2);
  sub_container.appendChild(body);
  sub_container.appendChild(ul);
  container.appendChild(sub_container);
  return container;
}

/*
    Show functions used to generate content for the landing page when you
    first visit redpandafinder.com. The landing (home) page is just a special 
    case of the results page, minus no search input, and the only time there
    is special display logic is when content is landing on the home page.
*/
Show.landing = {};
Show.landing.menus = {};
Show.landing.menus.language = function(class_color) {
  // Draw the language select menu, but it will be hidden initially
  var languages = Object.values(Pandas.def.languages);
  var shrinker = document.createElement('div');
  shrinker.className = "shrinker";
  for (let language of languages) {
    var button = Show.button.flag.render(language, class_color);
    shrinker.appendChild(button);
  }
  // Swap updated menu into the page when rendering
  var menu = document.getElementsByClassName("languageMenu")[0];
  menu = Show.update(shrinker, menu, "languageMenu", "languageTop");
  menu.classList.remove("results", "profile");
  menu.classList.add(class_color);
}
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
Show.landing.menus.bottomButtons = ['topButton', 'refreshButton'];

/*
    Show functions used by the profile page for a single animal
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
  var message = Message.profile_children(info["name"], children_count, daughters_count, sons_count, language);
  elements.push(message);
  var photos = Pandas.searchPhotoProfileChildren(animal["_id"]);
  for (let photo of photos) {
    var child = info.children.filter(x => x["_id"] == photo["id"])[0];
    var birth_year = Pandas.formatYear(child["birthday"]);
    var indeterminate = Pandas.indeterminateParent(animal["_id"], child["_id"])
    var div = Gallery.familyProfilePhoto(child, photo, language, birth_year, undefined, indeterminate);
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
  // Display a QR code, and manage updates
  var qrcode = Show.qrcodeImage();
  window.addEventListener('qr_update', function() {
    // Swap qr_code with one representing current profile page contents
    Show.qrcodeSwap();
  });
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
  var message = Message.profile_family(info["name"], language);
  elements.push(message);
  var photos = Pandas.searchPhotoProfileImmediateFamily(animal["_id"]);
  // Start with mom and dad, and then a self photo, and then littermates.
  var mom_photos = [];
  for (let mom of info.mom) {
    if (mom != undefined) {
      var mom_photo = photos.filter(x => x["id"] == mom["_id"])[0];
      mom_photos = mom_photos.concat(mom_photo);
      var mom_entry = Gallery.familyProfilePhoto(
        mom, mom_photo, language, L.gui.mother[language],
        "immediateFamily", info.mom.length > 1);
      photo_divs.push(mom_entry);
    }
  }
  var dad_photos = [];
  for (let dad of info.dad) {
    if (dad != undefined) {
      var dad_photo = photos.filter(x => x["id"] == dad["_id"])[0];
      dad_photos = dad_photos.concat(dad_photo);
      var dad_entry = Gallery.familyProfilePhoto(
        dad, dad_photo, language, L.gui.father[language],
        "immediateFamily", info.dad.length > 1);
      photo_divs.push(dad_entry);
    }
  }
  var me_photo = photos.filter(x => x["id"] == info["id"])[0];
  var me = Gallery.familyProfilePhoto(animal, me_photo, language, L.gui.me[language], "immediateFamily");
  photo_divs.push(me);
  var other_family_ids = mom_photos.concat(dad_photos).concat(me_photo).map(x => x.id);
  var litter_photos = photos.filter(function(photo) {
    if (other_family_ids.indexOf(photo["id"]) == -1) {
      return true;
    }
  });
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
  var gallery = Gallery.init(info, 'animal');
  gallery.displayPhoto();
  var frame = document.createElement('div');
  frame.className = "pandaPhoto";
  var image = gallery.image;
  var span = gallery.displayPhotoNavigation();
  frame.appendChild(image);
  frame.appendChild(span);
  frame.addEventListener('mouseover', function() {
    span.style.display = "block";
  });
  frame.addEventListener('mouseout', function() {
    span.style.display = "none";
  });
  return frame;
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
Show.profile.menus.bottomButtons = ['topButton', 'pagingButton', 'homeButton', 'randomButton', 'searchButton'];
Show.profile.menus.language = function() {
  return Show.landing.menus.language("profile");
}
Show.profile.menus.top = function(panda_id) {
  // A red menu bar: Logo/Home, Language, Profile, Media, Timeline
  var new_contents = document.createElement('div');
  new_contents.className = "shrinker";
  // Take the list of top-menu buttons and render them
  for (let btn_id of Show.profile.menus.topButtons) {
    var btn_type = btn_id.replace("Button", "");
    var button = Show.button[btn_type].render("profile", panda_id);
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
  var message = Message.profile_siblings(info["name"], siblings_count, sisters_count, brothers_count, language);
  elements.push(message);
  var photos = Pandas.searchPhotoProfileSiblings(animal["_id"]);
  for (let photo of photos) {
    var sibling = total_siblings.filter(x => x["_id"] == photo["id"])[0];
    var subHeading = Pandas.formatYear(sibling["birthday"]);
    if (Pandas.halfSiblings(animal, sibling)) {
      subHeading = subHeading + "\u200A" + "(½)";
    }
    var indeterminate = Pandas.indeterminateSiblings(animal["_id"], sibling["_id"])
    var div = Gallery.familyProfilePhoto(sibling, photo, language, subHeading, undefined, indeterminate);
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
  var info = Show.acquirePandaInfo(animal, language);
  var history = Show.acquireLocationList(animal, language);
  var message = Message.profile_where(info["name"], language);
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
    if ((zoo["start_date"] != Pandas.def.unknown[language]) &&
    (zoo["start_date"] == Pandas.formatDate(animal["birthday"], language)) &&
    (zoo_icon != L.emoji.home)) {
      zoo_icon = L.emoji.born_at;
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
    Show functions used by the media page for a single animal (group photos).
    Has to be defined after the profiles page since it refers to that logic
*/
Show.media = {};
Show.media.gallery = function(animal, language) {
  var gallery = Gallery.groupPhotosPage(0, [animal["_id"]], 10)["output"];
  var info = Show.acquirePandaInfo(animal, language);
  Show.profile.nameBar(info);
  var result = document.createElement('div');
  result.className = "mediaFrame";
  for (let photo of gallery) {
    result.appendChild(photo);
  }
  if (gallery.length < 1) {
    result.appendChild(Show.emptyResult(L.messages.no_group_media_result, L.display));
  }
  return result;
}
Show.media.menus = Show.profile.menus;
Show.media.nameBar = Show.profile.nameBar;
Show.media.search = Show.profile.search;

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
    // Check if animal has multiple possible moms/dads
    var icon_list = ["child_icon", "live_icon"]
    if (Pandas.indeterminateParent(info.id, animal["_id"]) == true) {
      icon_list.push("question_icon");
    }
    var children_link = Show.animalLink(animal, animal[info.get_name], 
                                        info.language, icon_list);
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
  if ((info.dad.length == 0 && info.mom.length == 0) &&
      (info.litter.length == 0) &&
      (info.siblings.length == 0) &&
      (info.children.length == 0))  {
    return family;   // No documented family
  }
  var parents = undefined;
  var litter = undefined;
  var siblings = undefined;
  var children = undefined;
  if (info.dad.length > 0 || info.mom.length > 0) {
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
Show.results.groupGallery = function(id_list) {
  var gallery = Gallery.groupPhotosIntersectPage(0, id_list, 10)["output"];
  var results = [];
  if (gallery.length < 1) {
    results.push(Show.emptyResult(L.messages.no_group_media_result, L.display));
  } else {
    results = gallery;
  }
  return results;
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
Show.results.menus.bottomButtons = ['topButton', 'pagingButton', 'homeButton'];
Show.results.menus.language = function() {
  return Show.landing.menus.language("results");
}
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
  gallery.displayPhoto();
  var frame = document.createElement('div');
  frame.className = "pandaPhoto";
  var image = gallery.image;
  var span = gallery.displayPhotoNavigation();
  frame.appendChild(image);
  frame.appendChild(span);
  frame.addEventListener('mouseover', function() {
    span.style.display = "block";
  });
  frame.addEventListener('mouseout', function() {
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
  result.appendChild(frame);
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
  // Modes for arrived/deparated animals based on query context
  var search_context = undefined;
  if (info.search_context != undefined) {
    search_context = info.search_context.query;
  }
  var squelch_home_zoo = false;
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
  // Arrivals have zoo information for where they came from
  if (info.zoo != undefined && search_context == "arrived") {
    var zoo = document.createElement('p');
    var target_zoo = Pandas.searchZooId(info.search_context.from)[0];
    var target_date = Pandas.formatDate(info.search_context.move_date, language);
    // Custom language templates for this
    var icon = Language.L.emoji.truck;
    var target_text = Message.arrived_from_zoo(target_zoo[language + ".name"], target_date, language);
    var zoo_link = Show.zooLink(target_zoo, target_text, language, icon);
    zoo.appendChild(zoo_link);
    // Location shows a map icon and a flag icon, and links to
    // a Google Maps search for the "<language>.address" field
    var location = document.createElement('p');
    var location_link = Show.locationLink(target_zoo, language);
    location.appendChild(location_link);
    details.appendChild(zoo);
    details.appendChild(location);
    squelch_home_zoo = true;
  }
  // Departures are for which zoo an animal just left for
  if (info.zoo != undefined && search_context == "departed") {
    var zoo = document.createElement('p');
    var target_zoo = Pandas.searchZooId(info.search_context.to)[0];
    var target_date = Pandas.formatDate(info.search_context.move_date, language);
    // Custom language templates for this
    var icon = Language.L.emoji.truck;
    var target_text = Message.departed_to_zoo(target_zoo[language + ".name"], target_date, language);
    var zoo_link = Show.zooLink(target_zoo, target_text, language, icon);
    zoo.appendChild(zoo_link);
    // Location shows a map icon and a flag icon, and links to
    // a Google Maps search for the "<language>.address" field
    var location = document.createElement('p');
    var location_link = Show.locationLink(target_zoo, language);
    location.appendChild(location_link);
    details.appendChild(zoo);
    details.appendChild(location);
    squelch_home_zoo = true;
  }
  if (info.zoo != undefined && search_context == "born_at") {
    var zoo = document.createElement('p');
    var target_zoo = Pandas.searchZooId(info.search_context.at)[0];
    var target_date = Pandas.formatDate(info.search_context.move_date, language);
    var icon = Language.L.emoji.born_at;
    var target_text = target_zoo[language + ".name"];
    var compare_text = info.zoo[language + ".name"];
    if (target_text == compare_text && info.death == Pandas.def.unknown[language]) {
      squelch_home_zoo = true;
      icon = icon + " " + Language.L.emoji.home;
    }
    if (info.death != Pandas.def.unknown[language]) {
      squelch_home_zoo = true;
    }
    var zoo_link = Show.zooLink(target_zoo, target_text, language, icon);
    zoo.appendChild(zoo_link);
    // Location shows a map icon and a flag icon, and links to
    // a Google Maps search for the "<language>.address" field
    var location = document.createElement('p');
    var location_link = Show.locationLink(target_zoo, language);
    location.appendChild(location_link);
    details.appendChild(zoo);
    details.appendChild(location);
  }
  // Ranges that an animal lived somewhere
  if (info.zoo != undefined && search_context == "born_or_lived" ) {
    var zoo = document.createElement('p');
    var target_zoo = Pandas.searchZooId(info.search_context.at)[0];
    var target_date = Pandas.formatDate(info.search_context.move_date, language);
    var icon = Language.L.emoji.zoo;
    var target_text = target_zoo[language + ".name"];
    var compare_text = info.zoo[language + ".name"];
    if (target_text == compare_text) {
      squelch_home_zoo = true;
      icon = Language.L.emoji.home;
    }
    var zoo_link = Show.zooLink(target_zoo, target_text, language, icon);
    zoo.appendChild(zoo_link);
    // Location shows a map icon and a flag icon, and links to
    // a Google Maps search for the "<language>.address" field
    var location = document.createElement('p');
    var location_link = Show.locationLink(target_zoo, language);
    location.appendChild(location_link);
    details.appendChild(zoo);
    details.appendChild(location);
    // Next, show the date ranges this is valid for
    for (let range of info.search_context.ranges) {
        var entry = document.createElement('p');
      var icon = Language.L.emoji.range_previous;
      if (range.length < 2 && info.death == Pandas.def.unknown[language]) {
        icon = Language.L.emoji.truck;   // When they arrived, haven't left
      }
      var start_range = Pandas.formatDate(range.shift(), language);
      var end_range = range.shift();
      if (end_range == undefined && info.death != Pandas.def.unknown[language]) {
        end_range = " \u2014 " + info.death;
      } else if (end_range == undefined) {
        end_range = "";
      } else {
        end_range = " \u2014 " + Pandas.formatDate(end_range, language);
      }
      entry.innerText = icon + " " + start_range + end_range;
      details.appendChild(entry);
    }
    // Don't show the home zoo if the animal is dead
    if (info.death != Pandas.def.unknown[language]) {
      squelch_home_zoo = true;
    }
  }
  // Which zoo is the animal at now. Ignore if just arrived/departed,
  // or if the born_at zoo is the same as the current zoo
  if (info.zoo != undefined && squelch_home_zoo == false) {
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
  // Wild animals, don't do context things for
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
  var mom_links = [];
  if (info.mom.length > 0) {
    for (let mom of info.mom) {
      var icon_list = ["mom_icon", "live_icon"];
      if (info.mom.length > 1) {
        icon_list.push("question_icon");
      }
      var mom_link = Show.animalLink(mom, mom[info.get_name],
                                     info.language, icon_list);
      mom_links.push(mom_link)
    }
  } else {
    var mom_link = Show.animalLink(Pandas.def.animal, Pandas.def.no_name[info.language],
                                   info.language, ["mom_icon"])
    mom_links.push(mom_link);
  }
  for (let mom_link of mom_links) {
    var mom_li = document.createElement('li');
    mom_li.appendChild(mom_link);
    ul.appendChild(mom_li);
  }
  var dad_links = [];
  if (info.dad.length > 0) {
    for (let dad of info.dad) {
      var icon_list = ["dad_icon", "live_icon"];
      if (info.dad.length > 1) {
        icon_list.push("question_icon");
      }
      var dad_link = Show.animalLink(dad, dad[info.get_name], 
                                     info.language, icon_list);
      dad_links.push(dad_link);
    }
  } else {
    var dad_link = Show.animalLink(Pandas.def.animal, Pandas.def.no_name[info.language],
                                   info.language, ["dad_icon"]);
    dad_links.push(dad_link);
  }
  for (let dad_link of dad_links) {
    var dad_li = document.createElement('li');
    dad_li.appendChild(dad_link);
    ul.appendChild(dad_li);
  }
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
    var icon_list = ["child_icon", "live_icon"];
    if (Pandas.halfSiblings(myself, animal)) {
      icon_list.push("half_icon");
    }
    if (Pandas.indeterminateSiblings(info.id, animal["_id"]) == true) {
      icon_list.push("question_icon");
    }
    var siblings_link = Show.animalLink(animal, animal[info.get_name], 
                                        info.language, icon_list);
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
  gallery.displayPhoto();
  var frame = document.createElement('div');
  frame.className = "zooPhoto";
  var image = gallery.image;
  var span = gallery.displayPhotoNavigation();
  frame.appendChild(image);
  frame.appendChild(span);
  frame.addEventListener('mouseover', function() {
    span.style.display = "block";
  });
  frame.addEventListener('mouseout', function() {
    span.style.display = "none";
  });
  title = Show.zooTitle(info);
  var details = Show.results.zooDetails(info);
  var counts = Show.results.zooCounts(info);
  var dossier = document.createElement('div');
  dossier.className = "zooDossier";
  dossier.appendChild(title);
  dossier.appendChild(details);
  dossier.appendChild(counts);
  var result = document.createElement('div');
  result.className = "zooResult";
  result.appendChild(frame);
  result.appendChild(dossier);
  // Ensure theres's a search bar
  Show.results.searchBar();
  return result;
}
// Display the animals at a zoo as follows:
// 1) Recently arrived or born animals at the zoo (if any exist)
//    -- order them together by their sort_time field
// 2) Recently departed or died animals at the zoo (if any exist)
//    -- order them together by their sort_time field
// 3) The other resident animals living at the zoo
//    -- order them oldest to youngest
Show.results.zooAnimals = function(zoo, language) {
  var animals_to_divs = function(animals) {
    var output_divs = [];
    animals.forEach(function(animal) {
      output_divs.push(Show.results.panda(animal, L.display));
    });
    return output_divs;
  }

  var id = zoo["_id"];
  // Death list takes precedence over all others. 
  // No panda in this list should appear in the other lists.
  var deaths = Pandas.searchPandaZooDied(id, 9);
  // Which pandas came to this zoo in the last nine months?
  var arrivals = Pandas.searchPandaZooArrived(id, 9);
  var born = Pandas.searchPandaZooBorn(id, 9);
  // Which pandas departed this zoo in the last nine months?
  var departures = Pandas.searchPandaZooDeparted(id, 9);
  // Which animals were resident at this zoo?
  var residents = Pandas.searchPandaZooCurrent(id);
  // Remove duplicate items based on panda "_id" fields
  residents = Pandas.removeElementsWithMatchingField(residents, arrivals, "_id");
  residents = Pandas.removeElementsWithMatchingField(residents, born, "_id");
  residents = Pandas.sortOldestToYoungest(residents);
  // Deaths and departures are together
  var leaving = Pandas.sortByDate(departures.concat(deaths), "sort_time", "descending");
  // Births and arrivals are together
  var coming = Pandas.sortByDate(arrivals.concat(born), "sort_time", "descending");
  // If a recently born panda moves zoos, take it off the arrivals list
  coming = Pandas.removeElementsWithMatchingField(coming, leaving, "_id");
  // Define the per-section messages. There are modifications depending on
  // which of the input lists are non-empty
  var headers = {
    "arrivals": Message.arrivals(zoo, born, language),
    "departures": Message.departures(zoo, deaths, leaving, language)
  }
  // Spool it all out
  var content_divs = [];
  if (coming.length > 0) {
    content_divs = content_divs.concat(headers["arrivals"]);
    content_divs = content_divs.concat(animals_to_divs(coming));
  }
  if (leaving.length > 0) {
    content_divs = content_divs.concat(headers["departures"]);
    content_divs = content_divs.concat(animals_to_divs(leaving));
  }
  // Residents get a message if there are other subsections 
  // in these lists of zoo animals
  if (residents.length > 0) {
    if ((leaving.length > 0 ) || (coming.length > 0)) {
      headers["residents"] = Message.residents(zoo, language);
      content_divs = content_divs.concat(headers["residents"]);
    }
    content_divs = content_divs.concat(animals_to_divs(residents));
  }
  return content_divs;
}
Show.results.zooCounts = function(info) {
  // The pink "animal counts" information stripe for a zoo
  var language = info.language;
  var ul = document.createElement('ul');
  ul.className = "zooCounts";
  var li_items = {
    "living": document.createElement('li'),
    "born": document.createElement('li'),
    "departed": document.createElement('li'),
    "recorded": document.createElement('li')
  }
  // Animals living at this zoo today
  var at_zoo = Pandas.searchPandaZooCurrent(info["id"]).length;
  if (at_zoo < 1) {
    var output_text = "";
    for (var i in L.messages.zoo_details_no_pandas_live_here[language]) {
      var field = L.messages.zoo_details_no_pandas_live_here[language][i];
      var output_text = output_text.concat(field);
    }
    var text_node = document.createTextNode(output_text);
    li_items["living"].appendChild(text_node);
  } else {
    var output_text = "";
    for (var i in L.messages.zoo_details_pandas_live_here[language]) {
      var field = L.messages.zoo_details_pandas_live_here[language][i];
      if (field == "<INSERTNUM>") {
        output_text = output_text.concat(at_zoo);        
      } else {
        output_text = output_text.concat(field);
      }
    }
    output_text = Language.unpluralize([output_text])[0];
    var text_node = document.createTextNode(output_text);
    li_items["living"].appendChild(text_node);
  }
  // Other messages may disappear if they aren't meaningful for the data
  // How many pandas were born at this zoo
  var born_link = document.createElement('a');
  born_link.href = "#query/born at " + info.id;
  var born_at_zoo = Pandas.searchPandaZooBornRecords(info["id"], false);
  var born_count = born_at_zoo.length;
  if (born_count > 0) {
    var earliest_born_year = born_at_zoo[born_count - 1]["birthday"].split("/")[0];
    var output_text = "";
    for (var i in L.messages.zoo_details_babies[language]) {
      var field = L.messages.zoo_details_babies[language][i];
      if (field == "<INSERTBABIES>") {
        output_text = output_text.concat(born_count);
      } else if (field == "<INSERTYEAR>") {
        output_text = output_text.concat(earliest_born_year);
      } else {
        output_text = output_text.concat(field);
      }
    }
    output_text = Language.unpluralize([output_text])[0];
    var text_node = document.createTextNode(output_text);
    born_link.appendChild(text_node);
    li_items["born"].appendChild(born_link);
  }
  // How many pandas have recently departed this zoo
  var departed_link = document.createElement('a');
  departed_link.href = "javascript:";
  var departed_link_id = "departures/zoo/" + info.id;
  departed_link.addEventListener("click", function() {
    document.getElementById(departed_link_id).scrollIntoView(true);
  });
  var departed_zoo = Pandas.searchPandaZooDeparted(info["id"], 9);
  var died_at_zoo = Pandas.searchPandaZooDied(info["id"], 9);
  var departed_count = departed_zoo.length;
  var died_count = died_at_zoo.length;
  var total_departed = departed_count + died_count;
  if (total_departed > 0) {
    var output_text = "";
    for (var i in L.messages.zoo_details_departures[language]) {
      var field = L.messages.zoo_details_departures[language][i];
      if (field == "<INSERTNUM>") {
        output_text = output_text.concat(total_departed);
      } else {
        output_text = output_text.concat(field);
      }
    }
    if (died_count > 0) {
      output_text = output_text.concat(" " + Language.L.emoji.died);
    }
    output_text = Language.unpluralize([output_text])[0];
    var text_node = document.createTextNode(output_text);
    departed_link.appendChild(text_node);
    li_items["departed"].appendChild(departed_link);
  }
  // How many pandas total have been recorded here
  var total_zoo = Pandas.searchPandaZooBornLived(info["id"]);
  var total_count = total_zoo.length;
  if (total_count > 0) {
    // Find the first location marker matching the zoo for this animal
    // Get the year from this value.
    var earliest_year = -1;
    var compare_id = info["id"] * -1;
    for (let animal of total_zoo) {
      var location_fields = Pandas.locationGeneratorEntity;
      for (let field_name of location_fields(animal)) {
        var location = Pandas.field(animal, field_name);
        [loc_id, loc_date] = location.split(", ");
        if ((loc_date != undefined) && (loc_id == compare_id)) {
          var year = parseInt(location.split(", ")[1].split("/")[0]);
          if ((earliest_year == -1) || (year < earliest_year)) {
            earliest_year = year;
          }
        }
      }
    }
    // Now for the message
    var total_link = document.createElement('a');
    total_link.href = "#query/lived at " + info.id;
    var output_text = "";
    for (var i in L.messages.zoo_details_records[language]) {
      var field = L.messages.zoo_details_records[language][i];
      if (field == "<INSERTNUM>") {
        output_text = output_text.concat(total_count);
      } else if (field == "<INSERTYEAR>") {
        output_text = output_text.concat(earliest_year);
      } else {
        output_text = output_text.concat(field);
      }
    }
    output_text = Language.unpluralize([output_text])[0];
    var text_node = document.createTextNode(output_text);
    total_link.appendChild(text_node);
    li_items["recorded"].appendChild(total_link);
  }
  // Finally, construct the set of info
  for (let message of ["living", "born", "departed", "recorded"]) {
    if (li_items[message].childNodes.length > 0) {
      ul.appendChild(li_items[message]);
    }
  }
  return ul;
}
Show.results.zooDetails = function(info) {
  // This is the purple "dossier" information stripe for a zoo.
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
  if (info.closed != Pandas.def.zoo.closed) {
    var date = Pandas.formatDate(info.closed, L.display);
    var closed = Message.closed(date, L.display);
    details.appendChild(closed);
  }
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
  // Refocus text cursor once page loads, but only on non-touch devices
  if (!("ontouchstart" in window)) {
    setTimeout(function() {
      document.getElementById('searchInput').focus({preventScroll: true});   // Set text cursor
    }, 0);
  }
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
  // Make iOS keyboard disappear after submitting.
  document.getElementById('searchInput').blur();
  var query = (document.getElementById('searchInput').value).replace(/\s+$/, '');
  window.location = "#query/" + query;
  // TODO: when submitting from the bottomMenu search bar, destroy it and move the
  // focus and query output to the top search bar.
  Show.searchBar.remove();
  // Refocus text cursor after a search is performed, but only on non-touch devices
  if (!("ontouchstart" in window)) {
    setTimeout(function() {
      document.getElementById('searchInput').focus({preventScroll: true});
    }, 0);
  }
  Show.button.language.hide();   // If language menu open, hide it
  window.scrollTo(0, 0);   // Go to the top of the page
}
Show.searchBar.toggle = function(frame_id) {
  // Normally the search bar just appears at the top of the page.
  // In panda-profile mode, it's hidden unless the user opts to search
  // for new pandas using the Search Button at the bottom of the page.
  var searchBar = document.getElementById(frame_id);
  if (searchBar == null) {
    return false;
  }
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

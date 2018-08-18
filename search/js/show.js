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
var L;   // Current language

/*
    Once page has loaded, add new event listeners for search processing
*/
$(function() {
  P = Pandas.init();
  Q = Query.init();
  G = Dagoba.graph();

  defaultLanguage();
  window.addEventListener('panda_data', function() {
    P.db.vertices.forEach(G.addVertex.bind(G));
    P.db.edges   .forEach(G.addEdge  .bind(G));
    // Enable search bar once the page has loaded
    var placeholder = "➤ Search...";
    document.forms['searchForm']['searchInput'].disabled = false;
    document.forms['searchForm']['searchInput'].placeholder = placeholder;

    // If a hashlink was bookmarked, bring up the results of it
    if (window.location.hash.length > 0) {
      outputResults();
    }
  });

  document.getElementById('languageButton').addEventListener("click", function() {
    var language = L;
    var options = Object.values(Pandas.def.languages);
    var choice = options.indexOf(language);
    choice = (choice + 1) % options.length;
    var new_language = options[choice];
    L = new_language;
    updateLanguage(L);
  });  

  $('#searchForm').submit(function() {
    $('#searchForm').blur();   // Make iOS keyboard disappear after submitting. TODO: not working
    var query = $('#searchInput').val().trim();
    var results = [];
    window.location = "#query/" + query;
  });
});

/*
    When the URL #hash changes, process it as a change in the search
    text and present new content.
*/
function outputResults() {
  // window.location.hash doesn't decode UTF-8. This does, fixing Japanese search
  var input = decodeURIComponent(window.location.hash);
  // Start by just displaying info for one panda by id search
  var results = Query.hashlink(input);
  results = results instanceof Array ? results : [results];   // Guarantee array
  var content_divs = [];
  results.forEach(function(animal) {
    content_divs.push(Show.pandaInformation(animal, undefined, L));
  });
  var new_content = document.createElement('div');
  new_content.id = "hiddenContentFrame";
  var shrinker = document.createElement('div');
  shrinker.className = "shrinker";
  content_divs.forEach(function(content_div) {
    shrinker.appendChild(content_div);
  });
  new_content.appendChild(shrinker);

  // Append the new content into the page and then swap it in
  var body = document.getElementsByTagName('body')[0];
  var old_content = document.getElementById('contentFrame');
  // Place the new content right after the old content
  old_content.parentNode.insertBefore(new_content, old_content.nextSibling);
  old_content.style.display = "none";
  new_content.style.display = "block";
  body.removeChild(old_content);
  new_content.id = 'contentFrame';

  if (body.lastElementChild.className != "footer") {
    var footer = Show.footer();
    body.appendChild(footer);
  }
}

window.addEventListener('hashchange', function() {
  outputResults();
});

/*
   Language selection functions
*/
// Page language settings come from the browser's Accept-Language header.
// Map a browser specified language to one of our supported options.
function defaultLanguage() {
  Object.keys(Pandas.def.languages).forEach(function(option) {
    if ((navigator.languages.indexOf(option) != -1) &&
        (L == undefined)) {
      L = Pandas.def.languages[option];
    }
  });
  // Fallback to English
  if (L == undefined) {
    L = "en";
  }
  // TODO: choose flag icon and language options based on this
  updateLanguage(L);
}

// Update all GUI elements based on the currently chosen language
// For now, just do the language button itself
function updateLanguage(language) {
  var languageButton = document.getElementById('languageButton');
  [ langIcon, langText ] = languageButton.childNodes[0].childNodes;
  langIcon.innerText = Show.gui.flag[language];
  langText.innerText = Show.gui.language[language];
  var aboutButton = document.getElementById('aboutButton');
  [ langIcon, langText ] = aboutButton.childNodes[0].childNodes;
  langText.innerText = Show.gui.about[language];
  var randomButton = document.getElementById('randomButton');
  [ langIcon, langText ] = randomButton.childNodes[0].childNodes;
  langText.innerText = Show.gui.random[language];
  var linksButton = document.getElementById('linksButton');
  [ langIcon, langText ] = linksButton.childNodes[0].childNodes;
  langText.innerText = Show.gui.links[language];
  // TODO: column class text headers
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
    "jp": "約"
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
  "language": {
    "cn": "漢語",
    "en": "English",
    "jp": "日本語"
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
    "jp": "ランダム"
  },
  "siblings": {
    "cn": Pandas.def.relations.siblings["cn"],
    "en": "Siblings",   // Capitalization
    "jp": Pandas.def.relations.siblings["jp"]
  }
}

Show.no_result = {
  "cn": "沒有發現熊貓",
  "en": "No Pandas Found",
  "jp": "パンダが見つかりません"
}

/*
    Presentation-level data, separated out from final website layout
*/
// Given an animal and a language, obtain the immediate information that would
// be displayed in an information card about the panda, including its zoo and
// its relatives.
Show.acquirePandaInfo = function(animal, language) {
  var picture = Pandas.profilePhoto(animal, "random");   // TODO: all photos for carousel
  return {
            "age": Pandas.age(animal, language),
       "birthday": Pandas.birthday(animal, language),
     "birthplace": Pandas.myZoo(animal, "birthplace", language),
       "children": Pandas.searchPandaChildren(animal["_id"]),
          "death": Pandas.date(animal, "death", language),
            "dad": Pandas.searchPandaDad(animal["_id"]),
         "gender": Pandas.gender(animal, language),
       "get_name": language + ".name",
       "language": language,
         "litter": Pandas.searchLitter(animal["_id"]),
            "mom": Pandas.searchPandaMom(animal["_id"]),
           "name": Pandas.myName(animal, language),
     "othernames": Pandas.othernames(animal, language),
          "photo": picture['photo'],
   "photo_credit": picture['credit'],
     "photo_link": picture['link'],
       "siblings": Pandas.searchNonLitterSiblings(animal["_id"]),
            "zoo": Pandas.myZoo(animal, "zoo")
  }
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

// Determine if altname is not worth displaying for furigana by calculating
// its Levenshtein distance. Courtesy of https://gist.github.com/rd4k1
Show.editDistance = function(a, b){
  if(!a || !b) return (a || b).length;
  var m = [];
  for(var i = 0; i <= b.length; i++){
    m[i] = [i];
    if(i === 0) continue;
    for(var j = 0; j <= a.length; j++){
      m[0][j] = j;
      if(j === 0) continue;
      m[i][j] = b.charAt(i - 1) == a.charAt(j - 1) ? m[i - 1][j - 1] : Math.min(
        m[i-1][j-1] + 1,
        m[i][j-1] + 1,
        m[i-1][j] + 1
      );
    }
  }
  return m[b.length][a.length];
};

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
    if (Show.editDistance(name, option) > 1) {
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

// Construct a query link as per the design docs. Input is the query
// string, and type is the initial hash code. Examples:
//    https://domain/search/index.html#query/(utf-8-query-string) (TODO)
// Text will be the name of the link, with additional options to determine
// whether icons for gender/mom/dad/liveness are needed

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
  heading.innerText = "Children";

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
  var siblings = document.createElement('div');
  siblings.className = 'children';
  siblings.appendChild(heading);
  siblings.appendChild(ul);
  return siblings;
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
      (window.matchMedia("(max-width: 630px)").matches == true)) {
    family.childNodes[2].parentNode.insertBefore(family.childNodes[2], family.childNodes[1]);
  }
  return family;
}

// Do the littermates info in the family section
Show.displayPandaLitter = function(info) {
  var heading = document.createElement('h4');
  heading.innerText = "Litter";
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
  heading.innerText = "Parents";
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
  heading.innerText = "Siblings";

  var ul = document.createElement('ul');
  ul.className = "pandaList";
  for (index in Pandas.sortOldestToYoungest(info.siblings)) {
    var animal = info.siblings[index];
    var siblings_link = Show.animalLink(animal, animal[info.get_name], 
                                        info.language, ["child_icon", "live_icon"])
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

// Will this break if the nodes are done on their own indent? :(
Show.displayPandaTitle = function(info) {
  var language = info.language;
  var gender = Show.displayGender(info);
  var name_div = document.createElement('div');
  name_div.className = 'pandaName';
  // In Japanese, display the first "othername" as furigana
  // TODO: separate text class and node for furigana text
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

// Display a text dossier of information for a panda. Most missing
// elements should not be displayed, but a few should be printed 
// regardless, such as birthday / time of death. 
// The "slip_in" value is a contextual reference to the initial search,
// something like "Melody's brother" or "Harumaki's mom".
Show.pandaInformation = function(animal, slip_in, language) {
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

Show.footer = function() {
  var p = document.createElement('p');
  var top_link = document.createElement('a');
  top_link.className = "emojiLink";
  top_link.href = "#pageTop";
  top_link.innerText = Show.emoji.top;
  p.appendChild(top_link);
  var msg1 = document.createTextNode(" All information courtesy of the ");
  p.appendChild(msg1);
  var rpl = document.createElement('a');
  rpl.href = "https://github.com/wwoast/redpanda-lineage"
  rpl.innerText = "Red Panda Lineage"
  p.appendChild(rpl);
  var msg2 = document.createTextNode(" dataset and red panda fans worldwide. Any media linked from this dataset remains property of its creator. Layout and design \u00A9 2018 Justin Fairchild.");
  p.appendChild(msg2);
  var shrinker = document.createElement('div');
  shrinker.className = "shrinker";
  shrinker.appendChild(p);
  var footer = document.createElement('div');
  footer.className = "footer";
  footer.appendChild(shrinker);
  return footer;
}

// Format the results for a single search as divs.
// The "slip_in" value is a contextual reference to the initial search,
// something like "Melody's brother" or "Harumaki's mom".
Show.pandaResults = function(animals, slip_in) {
  // No results? Display a specially-formatted empty card
  if (!('_id' in panda)) {
    return Show.nullPandaInformation();
  }

  // TODO: Get and display all info for this panda
}

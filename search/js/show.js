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

/*
    Once page has loaded, add new event listeners for search processing
*/
$(function() {
  P = Pandas.init();
  Q = Query.init();
  G = Dagoba.graph();
  // Hack to give time for P to load
  setTimeout(function() { 
    P.db.vertices.forEach(G.addVertex.bind(G));
    P.db.edges   .forEach(G.addEdge  .bind(G));
  }, 3000);

  $('#searchForm').submit(function() {
    $('#searchForm').blur();   // Make iOS keyboard disappear after submitting
    var query = $('#searchInput').val().trim();
    var results = [];
    // TODO: Remove or escape any search processing characters here like commas
    // Allow searches using special characters like #. The escape function doesn't
    // support unicode, so use encodeURI instead.
    query = encodeURI(query);
    window.location = "#" + query;
  });
});

/*
    When the URL #hash changes, process it as a change in the search
    text and present new content.
*/
window.addEventListener('hashchange', function() {
  var query = this.window.location.hash.slice(1);  // Everything after the #

  // Start by just displaying info for one panda by id search
  var results = Show.bootstrap(query);
  var new_content = document.createElement('div');
  new_content.id = "hiddenContentFrame";
  new_content.appendChild(results);

  // Append the new content into the page and then swap it in
  var body = document.getElementsByTagName('body')[0];
  var old_content = document.getElementById('contentFrame');
  body.appendChild(new_content);
  old_content.style.display = "none";
  new_content.style.display = "block";
  body.removeChild(old_content);
  new_content.id = 'contentFrame';
});


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
   "story": "🎍",
  "travel": "✈️",
 "website": "🌐"
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
// Examples:
//    https://domain/search/index.html#panda/Lychee
//    https://domain/search/index.html#panda/4
Show.animalLink = function(animal, link_text, options) {
  var language = animal.language;
  // Don't print content if the input id is zero
  if (animal['_id'] == Pandas.def.animal['_id']) {
    return Show.emptyLink(Pandas.def.animal[language + ".name"]);
  }
  var a = document.createElement('a');
  var inner_text = link_text;
  // Option to display gender face
  if (options.indexOf("child_icon") != -1) {
    inner_text = Show.displayChildIcon(animal.gender) + " " + inner_text;
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

// If link is to an undefined item or the zero ID, return a spacer
// TODO: final page layout
Show.emptyLink = function(output_text) {
  return null;  // TODO: link with the output text
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
  if (gender == "m") {
    return Show.emoji.male;
  } else if (gender == "f") {
    return Show.emoji.female;
  } else {
    return Show.emoji.alien;
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
  details.appendChild(second);
  details.appendChild(zoo);
  details.appendChild(location);
  details.appendChild(credit);
  return details;
}

// Display lists of family information, starting with parents,
// then adding immediate littermates, and finally including the
// other siblings, ordered by birthday. This is the pink stripe
// at the bottom of a family dossier.
Show.displayPandaFamily = function(info) {
  if ((info.dad == undefined && info.mom == undefined) &&
      (info.litter.length == 0) &&
      (info.siblings.length == 0))  {
    return;   // No documented family
  }
  var family = document.createElement('div');
  family.className = "family";
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
    var litter_link = Show.animalLink(animal, animal[info.get_name], ["child_icon", "live_icon"])
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
// TODO: if panda is missing, display as unknown instead
Show.displayPandaParents = function(info) {
  var heading = document.createElement('h4');
  heading.innerText = "Parents";
  var ul = document.createElement('ul');
  ul.className = "pandaList";
  var mom_li = document.createElement('li');
  var mom_link = Show.animalLink(info.mom, info.mom[info.get_name], ["mom_icon", "live_icon"]);
  mom_li.appendChild(mom_link);
  var dad_li = document.createElement('li');
  var dad_link = Show.animalLink(info.dad, info.dad[info.get_name], ["dad_icon", "live_icon"]);
  dad_li.appendChild(dad_link);  // TODO: check what kind of link a missing parent gets
  ul.appendChild(mom_li);
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
    var siblings_link = Show.animalLink(animal, animal[info.get_name], ["child_icon", "live_icon"])
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
    name_div.innerText = info.name + "(" + info.othernames[0] + ")"
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
  image.src = info.photo;
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

// Test function. Just search an ID, and show results
Show.bootstrap = function(id) {
  var animal = Pandas.searchPandaId(id);
  return Show.pandaInformation(animal, undefined, "en");
}
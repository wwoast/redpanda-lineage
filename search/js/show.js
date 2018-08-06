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
  var query = this.window.location.hash.slice(1);

  // Start by just displaying info for one panda by id search
  Show.bootstrap(query);
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
  var get_location = language + ".location";
  var get_name = language + ".name";

  var dad = Pandas.searchPandaDad(animal["_id"]);
  var mom = Pandas.searchPandaMom(animal["_id"]);
  var litter = Pandas.searchLitter(animal["_id"]);
  var siblings = Pandas.searchNonLitterSiblings(animal["_id"]);
  var zoo = Pandas.myZoo(animal, "zoo", language);
  var picture = Pandas.profilePhoto(animal, "random");   // TODO: all photos for carousel
  var zoo_link = Show.goLink(zoo['_id'], "zoo", zoo[get_name], undefined);
  var location = Show.goLink(zoo['_id'], "zoo", zoo[get_location], undefined);
  return {
            "age": Pandas.age(animal, language),
       "birthday": Pandas.birthday(animal, language),
     "birthplace": Pandas.myZoo(animal, "birthplace", language),
          "death": Pandas.date(animal, "death", language),
            "dad": dad,
         "gender": Pandas.gender(animal, language),
       "get_name": get_name,
         "litter": litter,
  "location_link": location,
            "mom": mom,
           "name": Pandas.myName(animal, language),
     "othernames": Pandas.othernames(animal, language),
          "photo": picture['photo'],
   "photo_credit": picture['author'],
     "photo_link": picture['link'],
       "siblings": siblings,
       "zoo_link": zoo_link
  }
}

// If link is to an undefined item or the zero ID, return a spacer
// TODO: final page layout
Show.emptyLink = function() {
  return null;
}

// Construct a link as per the design docs. Input is the query
// string, and type is the initial hash code. Examples:
//    https://domain/search/index.html#panda/Lychee  (TODO)
//    https://domain/search/index.html#panda/4
//    https://domain/search/index.html#zoo/1
//    https://domain/search/index.html#query/(utf-8-query-string) (TODO)
// Text will be the name of the link, with additional options to determine
// whether icons for gender/mom/dad/liveness are needed
Show.goLink = function(input, type, link_text, options) {
  // Don't print content if the input id is zero
  if (input['_id'] == Pandas.def.animal['_id']) {
    return Show.emptyLink();
  }
  // For pandas and zoos, determine whether the argument is a name or an ID
  if (type == "panda") {
    var a = document.createElement('a');
    var inner_text = link_text;
    // Option to display gender face
    if ("child_icon" in options) {
      inner_text = Show.displayChildIcon(input) + " " + inner_text;
    }
    // Moms and dads have older faces
    if ("mom_icon" in options) {
      inner_text = Show.emoji.mother + " " + inner_text;
    }
    if ("dad_icon" in options) {
      inner_text = Show.emoji.father + " " + inner_text;
    }
    if (("live_icon" in options) && (death in input)) {
      a.className = "passedAway";
      inner_text = inner_text + " " + Show.emoji.death;
    } 
    a.innerText = inner_text;  
    a.href = "#" + type + "/" + input['_id'];
    return a;
  } else {  // TODO: are strings valid inputs?
    return Show.emptyLink();
  }
}

// Have an alternate type of link that forwards to the card inside the page.
// These are also hash links, but they don't result in the search page being
// redrawn -- only relocating to another animal on the same page.
//    https://domain/search/index.html#panda_Lychee  (TODO)
//    https://domain/search/index.html#panda_4
//    https://domain/search/index.html#zoo_1
// Show.inLink = function(input, type, text) {

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
Show.displayChildIcon = function(animal) {
  var gender = animal.gender;
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
  var img = document.createElement('img');
  if (info.gender in Pandas.def.gender.Male) {
    img.src = "images/male.svg";
  } else if (info.gender in Pandas.def.gender.Female) {
    img.src = "images/female.svg";
  } else {
    img.src = "images/unknown.svg";
  }
  img.alt = info.gender;
  var gender = document.createElement('div');
  gender.className = "gender";
  return gender;
}

// The dossier of information for a single panda.
// This is the purple main information stripe for a panda.
Show.displayPandaDetails = function(info, language) {
  var born = document.createElement('p');
  born.innerText = Show.emoji.born + " " + info.born;
  // If still alive, print their current age
  var second = document.createElement ('p');
  if (info.death == Pandas.def.unknown[language]) {
    second.innerText = "(" + info.age + ")";
  } else {
    second.innerText = Show.emoji.died + " " + info.death;
  }
  var zoo = document.createElement('p');
  zoo.innerText = Show.emoji.home + " " + info.zoo;
  var location = document.createElement('p');
  // TODO: replace country words with flags
  location.innerText = Show.emoji.map + " " + info.location_link;
  var credit_link = document.createElement('a');
  credit_link.href = info.photo_link;
  credit_link.innerText = info.photo_credit;
  credit.innerText = Show.emoji.camera + " " + info.photo_credit;
  var credit  = document.createElement ('p');
  credit.appendChild(credit_link);
  var details = document.createElement('div');
  details.className = "pandaDetails";
  details.appendChild(born);
  details.appendChild(second);
  details.appendChild(zoo);
  details.appendChild(location);
  details.appendChild(credit_link);
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
    var parents = Show.displayPandaParents;
    family.appendChild(parents);
  }
  if (info.litter.length > 0) {
    var litter = Show.displayPandaLitter;
    family.appendChild(litter);
  }
  if (info.siblings.length > 0) {
    blocks.siblings = Show.displayPandaSiblings;
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
  for (animal in Pandas.sortOldestToYoungest(info.litter)) {
    var litter_link = Show.goLink(animal, "panda", animal[info.get_name], ["child_icon", "live_icon"])
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
  var mom_link = Show.goLink(info.mom, "panda", info.mom[get_name], ["mom_icon", "live_icon"]);
  mom_li.appendChild(mom_link);
  var dad_li = document.createElement('li');
  var dad_link = Show.goLink(info.dad, "panda", info.dad[get_name], ["dad_icon", "live_icon"]);
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
  heading.innerText = "Litter";

  var ul = document.createElement('ul');
  ul.className = "pandaList";
  for (animal in Pandas.sortOldestToYoungest(info.siblings)) {
    var litter_link = Show.goLink(animal, "panda", animal[info.get_name], ["child_icon", "live_icon"])
    var li = document.createElement('li');
    li.appendChild(litter_link);
    ul.appendChild(li);
  }
  var siblings = document.createElement('div');
  siblings.className = 'siblings';
  siblings.appendChild(heading);
  siblings.appendChild(ul);
  return siblings;
}

// Will this break if the nodes are done on their own indent? :(
Show.displayPandaTitle = function(info, language) {
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
Show.displayPhoto = function(info, frame_class) {
  var image = document.createElement('img');
  image.src = info.photo;
  var div = document.createElement('div');
  div.class = frame_class;
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
  var photo = Show.displayPhoto(info, 'pandaPhoto');
  var title = Show.displayPandaTitle(info, language);
  var details = Show.displayPandaDetails(info, language); 
  var family = Show.displayPandaFamily(info);
  var dossier = document.createElement('div');
  dossier.appendChild(title);
  dossier.appendChild(details);
  dossier.appendChild(family);
  var result = document.createElement('div');
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
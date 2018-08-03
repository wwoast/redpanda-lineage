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
  var name = language + ".name";
  var dad = Pandas.searchPandaDad(animal["_id"]);
  var mom = Pandas.searchPandaMom(animal["_id"]);
  var siblings = Pandas.searchSiblings(animal["_id"]);
  var zoo = Pandas.myLocation(animal, "zoo", language);
  // Create links to direct family and zoos
  var dad_link = Show.goLink(dad['_id'], "panda", dad[name]);
  var mom_link = Show.goLink(mom['_id'], "panda", mom[name]);
  var sib_links = siblings.map(x => Show.goLink(x['_id'], "panda", x[name]));
  var zoo_link = Show.goLink(zoo['_id'], "zoo", zoo[name]);
  return {
            "age": Pandas.age(animal),
       "birthday": Pandas.birthday(animal, language),
     "birthplace": Pandas.myLocation(animal, "birthplace", language),
          "death": Pandas.date(animal, "death", language),
            "dad": dad_link,
         "gender": Pandas.gender(animal, language),
            "mom": mom_link,
           "name": Pandas.myName(animal, language),
          "photo": Pandas.profilePhoto(animal, "random"),
       "siblings": sib_links,
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
// Text will be the name of the link.
Show.goLink = function(input, type, text) {
  // Don't print content if the input id is zero
  if (input == Pandas.def.animal['_id']) {
    return Show.emptyLink();
  }
  // For pandas and zoos, determine whether the argument is a name or an ID
  if (Query.isId(input)) {
    var a = document.createElement('a');
    a.innerText = text;  
    a.href = "#" + type + "/" + input;
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
Show.inLink = function(input, type, text) {
  // Don't print content if the input id is zero
  if (input == Pandas.def.animal['_id']) {
    return Show.emptyLink();
  }
  // For pandas and zoos, determine whether the argument is a name or an ID
  if (Query.isId(input)) {
    var a = document.createElement('a');
    a.innerText = text;  
    a.href = "#" + type + "_" + input;
    return a;
  } else {  // TODO: are strings valid inputs?
    return Show.emptyLink();
  }
}

// Render a born / died / age string out of emojis. Not all browsers
// support emoji rendering consistently, so we might need to render
// images instead.
Show.renderDates = function(animal, language) {
  var dates = [];
  var birthday = Pandas.date(animal, "birthday", language);
  if (birthday != Pandas.def.animal.birthday) {
    dates.push(Show.emoji.born);
    dates.push(birthday);
  }
  var death = Pandas.date(animal, "death", language);
  if (death != Pandas.def.animal.death) {
    dates.push(Show.emoji.arrow);
    dates.push(Show.emoji.death);
    dates.push(death);
  }
  var age = Pandas.age(animal, language);
  if ( age != Pandas.def.unknown[language]) {
    dates.push(age);
  }
  return dates.join(' ');
}

/*
    Displayed output in the webpage
*/
Show.displayGender = function(gender) {
  var img = document.createElement('img');
  if (gender in Pandas.def.gender.Male) {
    img.src = "images/male.svg";
  } else if (gender in Pandas.def.gender.Female) {
    img.src = "images/female.svg";
  } else {
    img.src = "images/unknown.svg";
  }
  img.alt = gender;
  var div = document.createElement('div');
  div.className = "gender";
}

// If the media exists for a panda, display it. If it's missing,
// display a placeholder empty frame that takes up the same amount
// of space on the page.
Show.displayPhoto = function(uri, frame_class) {
  var image = document.createElement('img');
  image.src = uri;
  var div = document.createElement('div');
  div.class = frame_class;
  div.appendChild(image);
  return div;
}

Show.displayTitle = function(name, gender) {
  <div class="pandaTitle">
  <div class="gender"><img src="images/female.svg" alt="female" /></div><div class="pandaName">Kinta</div>
</div>
}

// If the panda search result returned nothing, output a card
// with special "no results" formatting.
Show.nullInformation = function(language) {
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

// Display a text dossier of information for a panda. Most missing
// elements should not be displayed, but a few should be printed 
// regardless, such as birthday / time of death. 
// The "slip_in" value is a contextual reference to the initial search,
// something like "Melody's brother" or "Harumaki's mom".
Show.pandaInformation = function(animal, slip_in, language) {
/*
<div class="pandaResult">
  <div class="pandaDossier">
    <div class="pandaTitle">
      <div class="gender"><img src="images/female.svg" alt="female" /></div><div class="pandaName">Kinta</div>
    </div>
    <div class="pandaDetails">
      <p>👼 2000/6/8</p>
      <p>🌈 2018/6/11</p>
      <p>🏡 Nogeyama Zoo</p>
      <p>🗺️ Nogeyama, Yokohama 🇯🇵</p>
      <p>📷 redpanda_nippon_takashi</p>
    </div>
    <div class="family">
    </div><!-- family -->
  </div><!-- pandaDossier -->
</div> <!-- pandaResult -->
*/
  var info = Show.acquirePandaInfo(animal, language);
  var name = language + ".name";

  var photo = Show.displayPhoto(info.photo, 'pandaPhoto')

  
  var message = document.createElement('p');
  message.textContent = animal[name] + " (" + slip_in + ")";
  var dates = document.createElement('p');
  dates.textContent = Show.renderDates(animal, language);
  var parents = document.createElement('p');   // TODO: CSS and wireframing

  var result = document.createElement('div');
  result.appendChild(message);
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
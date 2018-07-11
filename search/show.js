/*
    Global objects usable by forms, and things that operate as the page loads
*/
var P;   // Pandas
var G;   // Lineage graph

/*
    Once page has loaded, add new event listeners for search processing
*/
$(function() {
  P = Pandas.init();
  G = Dagoba.graph();
  // Hack to give time for P to load
  setTimeout(function() { 
    P.db.vertices.forEach(G.addVertex.bind(G));
    P.db.edges   .forEach(G.addEdge  .bind(G));
  }, 3000);

  $('#searchForm').submit(function() {
    $('#searchEntry').blur();   // Make iOS keyboard disappear after submitting
    var query = $('#searchEntry').val().trim();
    var results = [];
    // TODO: Remove or escape any search processing characters here like commas
    // Allow searches using special characters like #. The escape function doesn't
    // support unicode, so use encodeURI instead.
    query = encodeURI(query);
    results = Pandas.searchPandaName(query);
  });
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
   "arrow": "➡",
    "born": "👼",
    "died": "⛼",
  "female": "♀️",
    "male": "♂️"
}


/*
    Presentation-level data, separated out from final website layout
*/
// Given an animal and a language, obtain the immediate information that would
// be displayed in an information card about the panda, including its zoo and
// its relatives.
Show.acquirePandaInfo = function(animal, language) {
  var zoo = Pandas.location(animal, "zoo", language);

  return {
            "age": Pandas.age(animal),
       "birthday": Pandas.birthday(animal, language),
     "birthplace": Pandas.location(animal, "birthplace", language),
          "death": Pandas.date(animal, "death", language),
            "dad": Pandas.searchPandaDad(animal["_id"]),
            "mom": Pandas.searchPandaMom(animal["_id"]),
           "name": Pandas.name(animal, language),
          "photo": Pandas.profile_photo(animal, "random"),
       "siblings": Pandas.searchSiblings(animal["_id"]),
       "zoo_name": Pandas.zoo_name(zoo, language),
    "zoo_website": Pandas.zoo_field(zoo, "website")
  }
}

/****** TODO: STYLESHEETS AND STYLE REFERENCES ******/
// Construct a link as per the design docs. Input is the query
// string, and type is the initial hash code. Examples:
//    https://domain/search/index.html#panda/Lychee
//    https://domain/search/index.html#panda/4
//    https://domain/search/index.html#zoo/1
//    https://domain/search/index.html#query/(utf-8-query-string)
// Text will be the name of the link.
Show.constructLink = function(input, type, text) {
  // For pandas and zoos, determine whether the argument is a name or an ID
  // TOWRITE
  // For query string, determine the query is properly formed
  // TOWRITE
  // Create the link to them based on ID
  // Name the link based on the relationship information
  
  return null;  // TODO
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
// If the media exists for a panda, display it. If it's missing,
// display a placeholder empty frame that takes up the same amount
// of space on the page.
Show.displayMedia = function(frame_type, media_type, index) {
  // Empty condition here ---
  // Display condition here ---
  return null;  // TODO
}

// If the index'th photo in the panda or zoo data is missing,
// create a placeholder frame with style "frame_type".
Show.emptyMedia = function(frame_type, media_type, index) {
  var missing_field = media_type + "." + index;
  var missing_uri = Pandas.def.animal[missing_field];
  var alt_text = missing_field + " not found";
  var contents = document.createElement('img');
  contents.src = missing_uri;
  contents.alt = alt_text;
  var result = document.createElement('div');
  result.className = frame_type;
  result.appendChild(contents);
  return result;
}

// If the panda search result returned nothing, output a card
// with special "no results" formatting.
Show.nullInformation = function(language) {
  var name_field = language + ".name";
  var message = document.createElement('p');
  message.textContent = Pandas.def.animal[name_field];
  var result = document.createElement('div');
  result.class = "nullInformation";
  result.appendChild(message);
  return result;
}

// Display a text dossier of information for a panda. Most missing
// elements should not be displayed, but a few should be printed 
// regardless, such as birthday / time of death. 
// The "slip_in" value is a contextual reference to the initial search,
// something like "Melody's brother" or "Harumaki's mom".
Show.pandaInformation = function(animal, slip_in, language) {
  var info = Show.acquirePandaInfo(animal, language);
  var name_field = language + ".name";

  // TODO: arrange the info in divs. Use emojis instead of words when possible
  // Display any avilable data about the panda
  // Its names in different languages, its gender and age
  // Links to its parents and children, which are listed by name
  // Hide a section where more media can be displayed, but pre-compute what it all looks like

  var message = document.createElement('p');
  message.textContent = animal[name_field] + " (" + slip_in + ")";
  var dates = document.createElement('p');
  dates.textContent = "Born: " + animal[birthday] + " ";

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
  return Show.pandaResults(animal);
}
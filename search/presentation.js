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
    results = Pandas.queryPandaName(query);
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

Show.default_panda = {
  "_id": "0",
  "birthday": "1970/1/1",
  "birthplace": "0",
  "children": "0",
  "en.name": "Panda Not Found",
  "en.nicknames": "No Nicknames Recorded",
  "en.othernames": "No Alternate Names Recorded",
  "gender": "Missing Gender Information",
  "jp.name": "パンダが見つかりませんでした",
  "jp.nicknames": "ニックネームは記録されていません",
  "jp.othernames": "代わりのスペルは記録されていません",
  "litter": "0",
  "photo.1": "No Photo Listed",
  "photo.2": "No Photo Listed",
  "photo.3": "No Photo Listed",
  "photo.4": "No Photo Listed",
  "photo.5": "No Photo Listed",
  "video.1": "No Video Listed",
  "video.2": "No Video Listed",
  "video.3": "No Video Listed",
  "video.4": "No Video Listed",
  "video.5": "No Video Listed",
  "zoo": "0"
}

Show.default_zoo = {
  "_id": "0",
  "en.address": "No Google Maps Address Recorded",
  "en.location": "No City, District, or State Info Listed",
  "en.name": "Zoo Not Found",
  "jp.address": "Googleマップのアドレスが記録されていません",
  "jp.location": "市区町村の情報が表示されていない",
  "jp.name": "動物園が見つかりません",
  "photo.1": "No Photo Listed",
  "photo.2": "No Photo Listed",
  "video.1": "No Video Listed",
  "video.2": "No Video Listed"
}

/****** TODO: STYLESHEETS AND STYLE REFERENCES ******/
// Construct a link for a panda given lookup information 
// on the relationship to the panda in the current results
Show.constructLink = function(my_id, their_id, their_relation) {
  // Look up the other panda
  // Create the link to them based on ID
  // Name the link based on the relationship information
  var them = Pandas.queryPandaId(their_id);
  // TODO: UI URL structure for query params for inset JSON
  return null;  // TODO
}

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
  var missing_uri = "/path/to/defaults/missing_media.png";
  var alt_text = media_type + "." + index + " not found";
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
Show.emptyPandaResult = function() {
  var message = document.createElement('p');
  message.textContent = Show.default_panda['en.name'];
  var result = document.createElement('div');
  result.appendChild(message);
  return result;
}

// Display a text dossier of information for a panda. Most missing
// elements should not be displayed, but a few should be printed 
// regardless, such as birthday / time of death.
Show.pandaInformation = function() {
  var me = Pandas.queryPandaId(their_id);

  return null;   // TODO
}

// Format the results for a single panda as a div.
Show.pandaResult = function(panda) {
  // No results? Display a specially-formatted empty card
  if (!('_id' in panda)) {
    return Show.emptyPandaResult();
  }

  // Get nodes for any parents, children, and siblings

  // Validate images. Choose a profile image at random from the ones available

  // Display any avilable data about the panda
  // Its names in different languages, its gender and age
  // Links to its parents and children, which are listed by name
  // Hide a section where more media can be displayed, but pre-compute what it all looks like

  var message = document.createElement('p');
  message.textContent = panda['en.name'];

  var result = document.createElement('div');
  result.appendChild(message);
  return result; 
}
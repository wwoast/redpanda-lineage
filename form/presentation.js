/*
    Global objects usable by forms, and things that operate as the page loads
*/
var P;
var G;

// Once page has loaded, add new event listeners
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
    // TODO: Remove or escape any search processing characters here like commas
    // Allow searches using special characters like #. The escape function doesn't
    // support unicode, so use encodeURI instead.
    query = encodeURI(query);
    Pandas.queryPandaName(query);
  });
});
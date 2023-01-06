/*
    Allows queries for nearby zoos, using the browser Geolocation API.
    
    Do not initialize the Geolocation details unless there has been a user
    action prompting for finding the closest zoo. So Geo.init() should be
    part of the callback for submitting a "nearby" search, or clicking on
    a "Find Zoos" button.
*/

var Geo = {};   // Namespace

Geo.G = {};   // Prototype

Geo.init = function() {
  var geo = Object.create(Geo.G);
  geo.resolved = false;    // Has a successful lookup completed?
  // List of zoos that match our search criteria
  geo.results = {
    "hits": [],
    "parsed": "geolookup_in_progress",
    "type": "nearby"
  };
  geo.accuracy = false;   // Coarse (IP-based) or Fine (GPS-based)
  geo.latitude = 0.0;
  geo.longitude = 0.0;
  geo.earth = 0;
  geo.units = "km";
  // Determine the locale (whether to use kilometers or miles)
  geo.setUnits();
  // Default nearby search radius (100 km/mi)
  geo.radius = 100;
  // Default max results
  geo.max_results = 5;
  // If radius has more than 2*max_results nearby, try to offer better results
  // by using GPS positioning instead of IP location
  geo.close_results = geo.max_results * 2;
  return geo;
}

/*
 * Find zoo results close to where the current location is.
 *
 * Given too many zoos nearby, the accuracy of IP-based geolocation may
 * be insufficient to tell you which zoo is the closest. If this is
 * the case and too many results were found in the current radius and
 * the ordering may be inaccurate, use GPS location instead (if available).
 */
Geo.G.findClosest = function(max_distance, max_results) {
  var zoos = {};     // k=distance, v=zoo. Sort by keys ascending
  var hit_list = [];   // Get max_results items
  // Iterating across zoos is silly
  for(var i = -1; Pandas.searchZooId(i)[0] != undefined; i--) {
    // Compare distance with where you are
    var z = Pandas.searchZooId(i)[0];
    var d = this.haversine(this.latitude, this.longitude, 
                           parseFloat(z.latitude), parseFloat(z.longitude));
    if (d < max_distance) {
      // For printing, use units and convert to a fixed-point number
      z["distance"] = d.toFixed(1).toString() + this.units;
      zoos[d] = z;
    }
  }
  // Iterate through distances in ascending order
  var closest = Object.keys(zoos).sort((a, b) => a < b ? -1 : 1);
  for (let distance of closest) {
    hit_list.push(zoos[distance]);
  }
  hit_list = hit_list.slice(0, max_results);   // Only keep the desired results
  // Return a dict similar to the results of the query parse responses
  this.results = {
    "hits": hit_list,
    "parsed": "set_zoo_id",
    "type": "nearby"
  }
  window.dispatchEvent(Geo.event.foundZoos);  
}

// Naive geolocation for getting the quickest possible answer. 
Geo.G.getNaiveLocation = function() {
  Geo.renderGeoLookupStart();
  navigator.geolocation.getCurrentPosition(position => {
    this.latitude = position.coords.latitude;
    this.longitude = position.coords.longitude;
    this.resolved = true;
    window.dispatchEvent(Geo.event.resolvedLocation);
  });
}

// Set API options to use more precision if desired or useful
Geo.G.getPreciseLocation = function() {
  var options = {
    enableHighAccuracy: true,
    timeout: 5000,
    maximumAge: 0
  }
  var error_noop = function() {};
  navigator.geolocation.getCurrentPosition(position => {
    this.latitude = position.coords.latitude;
    this.longitude = position.coords.longitude;
    this.resolved = true;
    window.dispatchEvent(Geo.event.resolvedLocation);
  }, error_noop, options);
}

/*
 * Figure out the distance between current location and a zoo.
 * Given the browser locale, use miles or kilometers.
 */
Geo.G.haversine = function(myLat, myLon, targetLat, targetLon) {
  var R = this.earth;
  var lat1 = Geo.toRadians(myLat);
  var lon1 = Geo.toRadians(myLon);
  var lat2 = Geo.toRadians(targetLat);
  var lon2 = Geo.toRadians(targetLon);
  var dlon = lon2 - lon1;
  var dlat = lat2 - lat1;
  var a = Math.pow(Math.sin(dlat/2), 2) + Math.cos(lat1) * Math.cos(lat2) * Math.pow(Math.sin(dlon/2), 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  var d = R * c;
  return d;
}

// Determine what units for displaying distance
// Radius of earth is 3961mi, and 6373km
Geo.G.setUnits = function() {
  if (navigator.language == "en-US") {
    this.earth = 3961;
    this.units = "mi";
  } else {
    this.earth = 6373;
    this.units = "km";
  }
}

// When changing the accuracy rating, un-toggle the flag tracking
// whether we completed a geo-lookup yet or not
Geo.G.toggleAccuracy = function() {
  this.accuracy = !(this.accuracy);
  if (this.accuracy == true) {
    // Fine-grained control with GPS
    this.resolved = false;
    this.getPreciseLocation();
  } else {
    // Do a follow-up naive lookup. Our location may have changed,
    // so this isn't a waste of time if a toggle is performed.
    this.resolved = false;
    this.getNaiveLocation();
  }
}

Geo.event = {};
Geo.event.foundZoos = new Event('found_zoos')
Geo.event.resolvedLocation = new Event('resolved_location');

// The interstitial message to draw if blocked on location permissions
Geo.renderGeoLookupStart = function() {
  var new_content = document.createElement('div');
  new_content.id = "hiddenContentFrame";
  var shrinker = document.createElement('div');
  shrinker.className = "shrinker";
  var message = Message.geolocationStart(L.display);
  shrinker.appendChild(message);
  new_content.appendChild(shrinker);
  // Redraw the search bar if necessary
  Show["results"].searchBar();
  // Append the new content into the page and then swap it in
  var old_content = document.getElementById('contentFrame');
  Page.swap(old_content, new_content);
  // Call layout adjustment functions to shrink any names that are too long
  Show["results"].menus.language();
  Show["results"].menus.top();
  Page.footer.redraw("results");
  Page.color("results");
}

Geo.toRadians = function(degrees) {
  return degrees * (Math.PI/180);
}

window.addEventListener('found_zoos', function() {
  // If we were loading a results screen, spool the results
  // If this is a normal results/query page
  Page.results.render();
  Page.current = Page.results.render;
  if (F.results.hits.length >= F.close_results) {
    // Search fine-tuned results with GPS if there's a lot of nearby zoos
    F.toggleAccuracy();
  }
});

window.addEventListener('resolved_location', function() {
  // Find 20 closest zoos within 100 (mi/km), and return the 5 closest
  F.findClosest(F.radius, F.max_results);
});

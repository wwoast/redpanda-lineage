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
  geo.results = [];       // List of zoos that match our search criteria
  geo.accuracy = false;   // Coarse (IP-based) or Fine (GPS-based)
  // Determine the locale (whether to use kilometers or miles)
  geo.latitude = 0.0;
  geo.longitude = 0.0;
  geo.radius = 0;
  geo.units = "km";
  geo.setUnits();
  // Start a quick dirty geolocation
  geo.getNaiveLocation();
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
Geo.G.findClosest = function(max_distance, max_results, accuracy_threshold) {
  var zoos = {};     // k=distance, v=zoo. Sort by keys ascending
  var output = [];   // Get max_results items
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
    output.push(zoos[distance]);
  }
  var count = output.length;
  output = output.slice(0, max_results);   // Only keep the desired results
  if (count > accuracy_threshold) {
    // TODO: get strict location
    this.toggleAccuracy();
  } else {
    this.results = output;
    window.dispatchEvent(Geo.event.foundZoos);
  }
}

// Naiive geolocation for getting the quickest possible answer
Geo.G.getNaiveLocation = function() {
  navigator.geolocation.getCurrentPosition(position => {
    this.latitude = position.coords.latitude;
    this.longitude = position.coords.longitude;
    window.dispatchEvent(Geo.event.resolvedLocation);
  });
}

/*
 * Figure out the distance between current location and a zoo.
 * Given the browser locale, use miles or kilometers.
 */
Geo.G.haversine = function(myLat, myLon, targetLat, targetLon) {
  var R = this.radius;
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
    this.radius = 3961;
    this.units = "mi";
  } else {
    this.radius = 6373;
    this.units = "km";
  }
}

// When changing the accuracy rating, un-toggle the flag tracking
// whether we completed a geo-lookup yet or not
Geo.G.toggleAccuracy = function() {
  this.accuracy = !(this.accuracy);
}

Geo.event = {};
Geo.event.foundZoos = new Event('found_zoos')
Geo.event.resolvedLocation = new Event('resolved_location');

Geo.toRadians = function(degrees) {
  return degrees * (Math.PI/180);
}

window.addEventListener('found_zoos', function() {
  // If we were loading a results screen, spool the results
  console.log("finished finding zoos");
  return;
});

window.addEventListener('resolved_location', function() {
  // Find 20 closest zoos, and return the 5 closest
  geo.results = geo.findClosest(100, 5, 20);
});

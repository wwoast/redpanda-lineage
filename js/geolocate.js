/**
 * Allows queries for nearby zoos, using the browser Geolocation API.
 *  
 * Do not initialize the Geolocation details unless there has been a user
 * action prompting for finding the closest zoo. So Geo.init() should be part
 * of the callback for submitting a "nearby" search, or clicking on a
 * "Find Zoos" button.
 */

/** Internal geolocation state */
export const state = {
  /** Coarse (IP-based) or Fine (GPS-based) */
  accuracy: false,
  /**
   * If radius has more than 2*maxResults nearby, try to offer better results
   * by using GPS positioning instead of IP location
   */
  closeResults: 10,
  /** Radius of the Earth, for calculations */
  earth: 0.0,
  latitude: 0.0,
  longitude: 0.0,
  /** Number of results to return by default */
  maxResults: 5,
  /** Has a successful lookup completed? */
  resolved: false,
  /** List of zoos that match our search criteria */
  results: {
    "hits": [],
    "parsed": "geolookup_in_progress",
    "type": "nearby"
  },
  /** Default search radius (100km or 100mi) */
  radius: 100,
  /** Units for the radius of the earth, either kilometers or miles */
  units: "km"
}

const geoEvents = {
  foundZoos: new Event('found_zoos'),
  resolvedLocation: new Event('resolved_location')
}

export function init() {
  setUnits()
}

/*
 * Find zoo results close to where the current location is.
 *
 * Given too many zoos nearby, the accuracy of IP-based geolocation may
 * be insufficient to tell you which zoo is the closest. If this is
 * the case and too many results were found in the current radius and
 * the ordering may be inaccurate, use GPS location instead (if available).
 */
function findClosest(maxDistance, maxResults) {
  const zoos = {};     // k=distance, v=zoo. Sort by keys ascending
  const hitList = [];   // Get max_results items
  // Iterating across zoos is silly
  // TODO ES6
  for(let i = -1; Pandas.searchZooId(i)[0] != undefined; i--) {
    // TODO ES6
    // Compare distance with where you are
    const z = Pandas.searchZooId(i)[0]
    const d = haversine(state.latitude, state.longitude, 
                        parseFloat(z.latitude), parseFloat(z.longitude))
    if (d < maxDistance) {
      // For printing, use units and convert to a fixed-point number
      z["distance"] = d.toFixed(1).toString() + this.units;
      zoos[d] = z
    }
  }
  // Iterate through distances in ascending order
  const closest = Object.keys(zoos).sort((a, b) => a < b ? -1 : 1)
  for (let distance of closest) {
    hitList.push(zoos[distance])
  }
  hitList = hitList.slice(0, maxResults);   // Only keep the desired results
  // Return a dict similar to the results of the query parse responses
  state.results = {
    "hits": hitList,
    "parsed": "set_zoo_id",
    "type": "nearby"
  }
  window.dispatchEvent(geoEvents.foundZoos);  
}

/** Naive geolocation for getting the quickest possible answer. */
export function getNaiveLocation() {
  renderGeoLookupStart()
  navigator.geolocation.getCurrentPosition(position => {
    state.latitude = position.coords.latitude;
    state.longitude = position.coords.longitude;
    state.resolved = true;
    window.dispatchEvent(geoEvents.resolvedLocation);
  });
}

// Set API options to use more precision if desired or useful
function getPreciseLocation() {
  const options = {
    enableHighAccuracy: true,
    timeout: 5000,
    maximumAge: 0
  }
  const error_noop = function() {};
  navigator.geolocation.getCurrentPosition(position => {
    state.latitude = position.coords.latitude;
    state.longitude = position.coords.longitude;
    state.resolved = true;
    window.dispatchEvent(geoEvents.resolvedLocation);
  }, error_noop, options);
}


/*
 * Figure out the distance between current location and a zoo. Given the
 * browser locale, use either miles or kilometers.
 */
function haversine(myLat, myLon, targetLat, targetLon) {
  const R = state.earth
  const lat1 = toRadians(myLat)
  const lon1 = toRadians(myLon)
  const lat2 = toRadians(targetLat)
  const lon2 = toRadians(targetLon)
  const dlon = lon2 - lon1
  const dlat = lat2 - lat1
  const a = 
    Math.pow(Math.sin(dlat/2), 2) + 
    Math.cos(lat1) * Math.cos(lat2) * Math.pow(Math.sin(dlon/2), 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  const d = R * c
  return d
}

/** The interstitial message to draw if blocked on location permissions */
function renderGeoLookupStart() {
  const newContent = document.createElement('div')
  newContent.id = "hiddenContentFrame"
  const shrinker = document.createElement('div')
  shrinker.className = "shrinker"
  // TODO ES6
  const message = Message.geolocationStart(L.display)
  shrinker.appendChild(message)
  newContent.appendChild(shrinker)
  // TODO ES6
  // Redraw the search bar if necessary
  Show["results"].searchBar()
  // Append the new content into the page and then swap it in
  const oldContent = document.getElementById('contentFrame')
  // TODO ES6
  Page.swap(oldContent, newContent)
  // TODO ES6
  // Call layout adjustment functions to shrink any names that are too long
  Show["results"].menus.language()
  Show["results"].menus.top()
  Page.footer.redraw("results")
  Page.color("results")
}

function setUnits() {
  if (navigator.language == "en-US") {
    state.earth = 3961;
    state.units = "mi";
  } else {
    state.earth = 6373;
    state.units = "km";
  }
}

function toRadians(degrees) {
  return degrees * (Math.PI/180)
}

/** 
 * When changing the accuracy rating, un-toggle the flag tracking whether w
 * completed a geo-lookup yet or not
 */
function toggleAccuracy() {
  state.accuracy = !(state.accuracy);
  if (state.accuracy == true) {
    // Fine-grained control with GPS
    state.resolved = false;
    getPreciseLocation();
  } else {
    // Do a follow-up naive lookup. Our location may have changed,
    // so this isn't a waste of time if a toggle is performed.
    state.resolved = false;
    getNaiveLocation();
  }
}

window.addEventListener('found_zoos', function() {
  // TODO ES6
  // If we were loading a results screen, spool the results
  // If this is a normal results/query page
  Page.results.render();
  Page.current = Page.results.render;
  if (state.results.hits.length >= state.close_results) {
    // Search fine-tuned results with GPS if there's a lot of nearby zoos
    toggleAccuracy()
  }
})

window.addEventListener('resolved_location', function() {
  // Find 20 closest zoos within 100 (mi/km), and return the 5 closest
  findClosest(state.radius, state.maxResults)
})

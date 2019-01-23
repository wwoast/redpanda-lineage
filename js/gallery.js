/*
   Operations and state related to photo galleries.

   This class, given a list of photos, will create many types of photo galleries --
   single frame ones with dogear navigation widgets and swipe controls, as well as 
   larger page-long galleries.
*/

Photos = {};     /* Namespace */

Photos.P = {};   /* Prototype */

Photos.init = function() {
  /*
// TODO: what values to add?
Survey of methods:
photo => photo URI
entity_id => animal's id name
photo_id => the id=value for the photo in the page
^^ either get this from animal data, or build it myself
^^ if we give the Photos object the info for a panda, it can make these things

frame_class => mode to determine whether we're preloading photos or not
fallback => fallback image. that can be an object value :)
photo => the photo element itself (probably should be an argument)

desired_index, language, credit ==> method arguments 

displayPhoto => derived from a single animal's details. provide single animal info at init
all the methods expect info derived from a single animal. 

in the future, we might need information from multiple animals. so should it take an array
of info values for animals? or just an array of animals?

  */

  var photos = Object.create(Photos.P);
  return photos;
}

// If the media exists for an entity, display it. If it's missing,
// display a placeholder empty frame that takes up the same amount
// of space on the page.
Photos.displayPhoto = function(photo, entity_id, photo_id, frame_class, fallback) {
  var image = document.createElement('img');
  if (photo == undefined) {
    image.src = fallback;
  } else {
    image.src = photo;
    image.id = entity_id + "/photo/" + photo_id;   // For carousel
    image.className = entity_id + "/photo";
  }
  image.onerror = "this.src='" + fallback + "'";
  var div = document.createElement('div');
  div.className = frame_class;
  div.appendChild(image);
  // Preload the next and previous images to avoid double-reflow problems
  if (frame_class == "pandaPhoto") {
    var preloads = Photos.displayPhotoPreload(entity_id, photo_id);
    for (var preload of preloads) {
      var pre_img = document.createElement('img');
      pre_img.className = "pandaPhoto preload";
      pre_img.src = preload;
      div.appendChild(pre_img);
    }
  }
  // Return the new div
  Photos.displayPhotoTouch(image);
  return div;
}

// The hover over or swipe menu for photo navigation
Photos.displayPhotoNavigation = function(animal_id, photo_id) {
  var span_link = document.createElement('a');
  span_link.className = "navigatorLink";
  span_link.id = animal_id + "/navigator";
  span_link.href = "javascript:;";
  var span = document.createElement('span');
  span.className = "navigator";
  // Clickable dogears when you have a carousel of more than one photo
  if (Photos.photoCount(animal_id) < 2) {
      span.innerText = L.emoji.no_more;
  } else {
    span.innerText = photo_id;
    span_link.addEventListener('click', function() {  // Left click event
      Photos.photoNext(animal_id);
    });
    span_link.addEventListener('contextmenu', function(e) {   // Right click event
      e.preventDefault();   // Prevent normal context menu from firing
      Photos.photoPrevious(animal_id);
    });
  }
  span_link.appendChild(span);
  return span_link;
}
  
// Preload one photo ahead, and one photo behind, into the page without displaying them. 
// This makes it so that only a single page reflow occurs when navigating images.
Photos.displayPhotoPreload = function(entity_id, photo_id) {
  var imgs = [];
  var default_photo = Pandas.def.animal["photo.1"];
  var prev_photo = "photo." + (parseInt(photo_id) - 1).toString();
  var next_photo = "photo." + (parseInt(photo_id) + 1).toString();
  var count = Photos.photoCount(entity_id);
  var last_photo = "photo." + count.toString();
  var animal = Pandas.searchPandaId(entity_id)[0];
  if (Pandas.field(animal, prev_photo) != default_photo) {
    imgs.push(animal[prev_photo]);
  } else {
    imgs.push(animal[last_photo]);  // Before first item is the last photo in the list
  }
  if (Pandas.field(animal, next_photo) != default_photo) {
    imgs.push(animal[next_photo]);
  } else {
    imgs.push(animal["photo.1"]);  // After last item is back to the first
  }
  // If any of the photos we tried to preload are undefined, remove them from the preload list
  return imgs.filter(function( element ) {
    return element !== undefined;
  });
}

// Touchable carousels for every loaded photo.
Photos.displayPhotoTouch = function(photo) {
  photo.addEventListener('touchstart', function(event) {
    T.start(event, photo.id);
  }, true);
  photo.addEventListener('touchend', function(event) {
    T.end(event);
  }, true);
  photo.addEventListener('touchmove', function(event) {
    T.move(event);
  }, true);
  photo.addEventListener('touchcancel', function(event) {
    T.cancel();
  }, true);
}

// Take an animal, and return a list of divs for all the photos of that animal
// that match the username that was searched. Used for making reports of all
// the photos in the website contributed by a single author.
Photos.pandaPhotoCredits = function(animal, credit, language) {
  var content_divs = [];
  var photos = [];
  var info = Show.acquirePandaInfo(animal, language);
  var photo_indexes = Pandas.photoGeneratorEntity;
  for (let field_name of photo_indexes(animal, 0)) {
    if (animal[field_name + ".author"] == credit) {
      photos.push({"image": animal[field_name], "index": field_name});
    }
  }
  for (let item of photos) {
    var photo = item.image;
    var index = item.index.split(".")[1];
    var img_link = document.createElement('a');
    // Link to the original instagram media
    img_link.href = photo.replace("/media/?size=m", "");
    img_link.target = "_blank";   // Open in new tab
    var img = document.createElement('img');
    img.src = photo.replace('/?size=m', '/?size=t');
    img_link.appendChild(img);
    var caption_link = document.createElement('a');
    caption_link.href = "#panda/" + animal._id + "/photo/" + index;
    var caption = document.createElement('h5');
    caption.className = "caption";
    caption.innerText = info.name;
    caption_link.appendChild(caption);
    var container = document.createElement('div');
    container.className = "photoSample";
    container.appendChild(img_link);
    container.appendChild(caption_link);
    content_divs.push(container);
  }
  return content_divs;
}

// Utility function to get the current number of photos.
Photos.photoCount = function(animal_id) {
  var animal = Pandas.searchPandaId(animal_id)[0];
  var photo_manifest = Pandas.photoManifest(animal);
  var max_index = Object.values(photo_manifest).length;
  return max_index;
}

// Navigation input event -- load the next photo in the carousel
Photos.photoNext = function(animal_id) {
  var current_photo = document.getElementsByClassName(animal_id + "/photo")[0];
  var current_photo_id = current_photo.id.split("/")[2];
  Photos.photoSwap(current_photo, parseInt(current_photo_id) + 1);
}

// Navigation input event -- load the previous photo in the carousel
Photos.photoPrevious = function(animal_id) {
  var current_photo = document.getElementsByClassName(animal_id + "/photo")[0];
  var current_photo_id = current_photo.id.split("/")[2];
  Photos.photoSwap(current_photo, parseInt(current_photo_id) - 1);
}

// Switch the currently displayed photo to the next one in the list
Photos.photoSwap = function(photo, desired_index) {
  var span_link = photo.parentNode.childNodes[photo.parentNode.childNodes.length - 1];
  var [animal_id, _, photo_id] = photo.id.split("/");
  var animal = Pandas.searchPandaId(animal_id)[0];
  var photo_manifest = Pandas.photoManifest(animal);
  var max_index = Object.values(photo_manifest).length;
  var new_index = 1;   // Fallback value
  if (desired_index < 1) {
    new_index = max_index;
  } else if (desired_index > max_index) {
    new_index = (desired_index % max_index);
  } else {
    var new_index = desired_index;
  }
  var chosen = "photo." + new_index.toString();
  var new_choice = photo_manifest[chosen];
  var new_container = Photos.displayPhoto(new_choice, animal_id, new_index.toString(), 
                                          "pandaPhoto", "images/no-panda-portrait.jpg");
  var new_photo = new_container.childNodes[0];
  // Replace the span navigation id if we have an actual carousel
  if (max_index > 1) {
    span_link.childNodes[0].innerText = new_index.toString();
  } else {
    return;  // No carousel, no need to actually swap photos
  }
  // Update existing photo element with info from the frame we switched to
  photo.src = new_photo.src;
  photo.id = new_photo.id;
  photo.className = new_photo.className;
  Photos.displayPhotoTouch(new_photo);
  var photo_info = Pandas.profilePhoto(animal, new_index);
  // Replace the animal credit info
  var credit_link = document.getElementById(animal_id + "/author/" + photo_id);
  credit_link.id = animal_id + "/author/" + new_index;
  credit_link.href = photo_info["link"];
  credit_link.target = "_blank";   // Open in new tab
  credit_link.innerText = L.emoji.camera + " " + photo_info["credit"];
  // And the photographer credit's apple points
  var apple_link = document.getElementById(animal_id + "/counts/" + photo_id);
  apple_link.id = animal_id + "/counts/" + new_index;
  apple_link.href = "#credit/" + photo_info["credit"];
  apple_link.innerText = L.emoji.gift + " " + P.db._photo.credit[photo_info["credit"]];
}

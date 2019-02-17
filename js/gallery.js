/*
   Operations and state related to photo galleries.

   This class, given a list of photos, will create many types of photo galleries --
   single frame ones with dogear navigation widgets and swipe controls, as well as 
   larger page-long galleries.
*/

Gallery = {};     /* Namespace */

Gallery.G = {};   /* Prototype */

Gallery.init = function(info, element_class, fallback_url='images/no-panda-portrait.jpg') {
  var gallery = Object.create(Gallery.G);
  gallery.info = info;   // Old photo value == info.photo
  // Define index value for which of an animal's photos we'll display by default.
  // Doesn't apply to zoo info objects, so we have a default standby value
  if ("photo_index" in gallery.info) {
    gallery.index = gallery.info.photo_index;
  } else {
    gallery.index = "1";
  }
  gallery.element_class = element_class;
  gallery.fallback_url = fallback_url;
  return gallery;
}

// If the media exists for an entity, display it. If it's missing,
// display a placeholder empty frame that takes up the same amount
// of space on the page. Support using class variables by default, but
// allow the photoSwap function to use unique parameters as it needs.
Gallery.G.displayPhoto = function(url=this.info.photo, id=this.info.id, index=this.index) {
  var image = document.createElement('img');
  if (url == undefined) {
    image.src = this.fallback_url;
  } else {
    image.src = url;
    image.id = id + "/photo/" + index;   // For carousel
    image.className = id + "/photo";
  }
  image.onerror = "this.src='" + this.fallback_url + "'";
  var div = document.createElement('div');
  div.className = this.element_class;
  div.appendChild(image);
  // Preload the next and previous images to avoid double-reflow problems
  if (this.element_class == "pandaPhoto") {
    var preloads = this.displayPhotoPreload(id, index);
    for (var preload of preloads) {
      var pre_img = document.createElement('img');
      pre_img.className = "pandaPhoto preload";
      pre_img.src = preload;
      div.appendChild(pre_img);
    }
  }
  // Return the new div
  Touch.addHandler(image);
  return div;
}

// The hover over or swipe menu for photo navigation
// Need ids defined outside of tihs.info due ot inner function scope
Gallery.G.displayPhotoNavigation = function() {
  var that = this;   // Function scoping
  var span_link = document.createElement('a');
  span_link.className = "navigatorLink";
  span_link.id = that.info.id + "/navigator";
  span_link.href = "javascript:;";
  var span = document.createElement('span');
  span.className = "navigator";
  // Clickable dogears when you have a carousel of more than one photo
  if (this.photoCount(that.info.id) < 2) {
      span.innerText = L.emoji.no_more;
  } else {
    span.innerText = that.index;
    span_link.addEventListener('click', function() {  // Left click event
      that.photoNext(that.info.id);
    });
    span_link.addEventListener('contextmenu', function(e) {   // Right click event
      e.preventDefault();   // Prevent normal context menu from firing
      that.photoPrevious(that.info.id);
    });
  }
  span_link.appendChild(span);
  return span_link;
}
  
// Preload one photo ahead, and one photo behind, into the page without displaying them. 
// This makes it so that only a single page reflow occurs when navigating images.
Gallery.G.displayPhotoPreload = function() {
  var imgs = [];
  var default_photo = Pandas.def.animal["photo.1"];
  var prev_photo = "photo." + (parseInt(this.index) - 1).toString();
  var next_photo = "photo." + (parseInt(this.index) + 1).toString();
  var count = this.photoCount(this.info.id);
  var last_photo = "photo." + count.toString();
  var animal = Pandas.searchPandaId(this.info.id)[0];
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
  return imgs.filter(function(element) {
    return element !== undefined;
  });
}

// Utility function to get the current number of photos.
Gallery.G.photoCount = function() {
  var animal = Pandas.searchPandaId(this.info.id)[0];
  var photo_manifest = Pandas.photoManifest(animal);
  var max_index = Object.values(photo_manifest).length;
  return max_index;
}

// Navigation input event -- load the next photo in the carousel
Gallery.G.photoNext = function(animal_id=this.info.id) {
  var current_photo_element = document.getElementsByClassName(animal_id + "/photo")[0];
  var current_photo_id = current_photo_element.id.split("/")[2];
  this.photoSwap(current_photo_element, parseInt(current_photo_id) + 1);
}

// Navigation input event -- load the previous photo in the carousel
Gallery.G.photoPrevious = function(animal_id=this.info.id) {
  var current_photo_element = document.getElementsByClassName(animal_id + "/photo")[0];
  var current_photo_id = current_photo_element.id.split("/")[2];
  this.photoSwap(current_photo_element, parseInt(current_photo_id) - 1);
}

// Switch the currently displayed photo to the next one in the list
Gallery.G.photoSwap = function(photo, desired_index) {
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
  // Replace the span navigation id if we have an actual carousel
  if (max_index > 1) {
    span_link.childNodes[0].innerText = new_index.toString();
  } else {
    return;  // No carousel, no need to actually swap photos
  }
  var chosen = "photo." + new_index.toString();
  var new_choice = photo_manifest[chosen];
  var new_container = this.displayPhoto(new_choice, animal_id, new_index.toString());
  var new_photo = new_container.childNodes[0];
  // Update existing photo element with info from the frame we switched to
  photo.src = new_photo.src;
  photo.id = new_photo.id;
  photo.className = new_photo.className;
  Touch.addHandler(new_photo);
  var photo_info = Pandas.profilePhoto(animal, new_index);
  // Replace the animal credit info
  this.singlePhotoCredit(photo_info, photo_id, new_index);
  // And the photographer credit's apple points
  this.userApplePoints(photo_info, photo_id, new_index);
}

// Replace the photographer's credit info for a panda's photo
Gallery.G.singlePhotoCredit = function(photo_info, current_index, new_index) {
  var animal_id = photo_info.id;
  var credit_link = document.getElementById(animal_id + "/author/" + current_index);
  credit_link.id = animal_id + "/author/" + new_index;
  credit_link.href = photo_info["link"];
  credit_link.target = "_blank";   // Open in new tab
  credit_link.innerText = L.emoji.camera + " " + photo_info["credit"];
}

// Replace the photographer's apple points (number of photos on the site)
Gallery.G.userApplePoints = function(photo_info, current_index, new_index) {
  var animal_id = photo_info.id;
  var apple_link = document.getElementById(animal_id + "/counts/" + current_index);
  apple_link.id = animal_id + "/counts/" + new_index;
  apple_link.href = "#credit/" + photo_info["credit"];
  apple_link.innerText = L.emoji.gift + " " + P.db._photo.credit[photo_info["credit"]];
}

/*
    Standalone gallery/photo construction methods
*/
// Create a profile page frame for a single animal, give it a nametag, and
// additionally, give it a relationship value.
Gallery.familyProfilePhoto = function(animal, chosen_photo, language, relationship, frame_class) {
  // The overall container
  var container = document.createElement('div');
  container.className = "photoSample";
  if (frame_class != undefined) {
    container.classList.add(frame_class);
  }
  // Photo container
  var clickable_photo = document.createElement('a');
  clickable_photo.target = "_blank";
  if (chosen_photo != Pandas.def.animal["photo.1"]) {   // No link if no photo defined
    clickable_photo.href = chosen_photo["photo"].replace("media/?size=m", "");   // Instagram hack
  } 
  var image = document.createElement('img');
  image.src = chosen_photo["photo"];
  clickable_photo.appendChild(image);
  container.appendChild(clickable_photo);
  // Family name caption
  var animal_name = document.createElement('a');
  animal_name.href = "#profile/" + animal["_id"];
  var animal_text = document.createElement('h5');
  animal_text.className = "caption familyName";
  animal_text.innerText = animal[language + ".name"];
  animal_name.appendChild(animal_text);
  animal_name.addEventListener("click", Show.button.top.action);
  container.appendChild(animal_name);
  // Family title caption.
  if (relationship != undefined) {
    var gender = Show.genderAnimal(animal, language, "caption gender");
    var animal_relation = document.createElement('a');
    animal_relation.href = "#profile/" + animal["_id"];
    var relation_text = document.createElement('h5');
    relation_text.className = "caption familyTitle";
    if (relationship == L.gui.me[language]) {
      relationship = relationship + "\u200A" + L.emoji.profile;
    }
    if (animal["death"] != undefined) {
      relationship = relationship + "\u200A" + L.emoji.died;
    }
    var text = document.createTextNode(relationship);
    relation_text.appendChild(gender);
    relation_text.appendChild(text);
    animal_relation.appendChild(relation_text);
    animal_relation.addEventListener("click", Show.button.top.action);
    container.appendChild(animal_relation);  
  }
  return container;
}


// Take an animal, and return a list of divs for all the photos of that animal
// that match the username that was searched. Used for making reports of all
// the photos in the website contributed by a single author.
// TODO: support paging!!
Gallery.pandaPhotoCredits = function(animal, credit, language) {
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

// Take a zoo, and return the photo. Assumes that you have a match
// that match the username that was searched. Used for making reports of all
// the photos in the website contributed by a single author.
Gallery.zooPhotoCredits = function(zoo, language) {
  var info = Show.acquireZooInfo(zoo, language);
  var img_link = document.createElement('a');
  // Link to the original instagram media
  img_link.href = zoo.photo.replace("/media/?size=m", "");
  img_link.target = "_blank";   // Open in new tab
  var img = document.createElement('img');
  img.src = zoo.photo;
  img_link.appendChild(img);
  var caption_link = document.createElement('a');
  caption_link.href = "#zoo/" + zoo._id;
  var caption = document.createElement('h5');
  caption.className = "caption";
  caption.innerText = info.name;
  caption_link.appendChild(caption);
  var container = document.createElement('div');
  container.className = "photoSample";
  container.appendChild(img_link);
  container.appendChild(caption_link);
  return container;
}

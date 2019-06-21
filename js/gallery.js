/*
   Operations and state related to photo galleries.

   This class, given a list of photos, will create many types of photo galleries --
   single frame ones with dogear navigation widgets and swipe controls, as well as 
   larger page-long galleries.

   The Gallery instance has two types of methods: photo methods (for dealing with
   single-photo panda info), and media methods (for dealing with photos with multiple
   pandas).
*/

Gallery = {};     /* Namespace */

Gallery.G = {};   /* Prototype */

Gallery.init = function(info, carousel_type, fallback_url='images/no-panda-portrait.jpg') {
  var gallery = Object.create(Gallery.G);
  gallery.info = info;   // Old photo value == info.photo
  // Hacky way to determine the proper element class from whether this
  // is an animal photo carousel or a zoo photo carousel
  gallery.carousel_type = carousel_type;
  if (carousel_type == "animal") {
    gallery.element_class = "pandaPhoto";
  } else if (carousel_type == "zoo") {
    gallery.element_class = "zooPhoto";
  } else {
    gallery.element_class = "pandaPhoto";
  }
  // Define index value for which of an animal's photos we'll display by default.
  // Doesn't apply to zoo info objects, so we have a default standby value
  if ("photo_index" in gallery.info) {
    gallery.index = gallery.info.photo_index;
  } else {
    gallery.index = "1";
  }
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
// Need ids defined outside of this.info due ot inner function scope
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
      Gallery.condenseDogEar(span);
    });
    span_link.addEventListener('contextmenu', function(e) {   // Right click event
      e.preventDefault();   // Prevent normal context menu from firing
      that.photoPrevious(that.info.id);
      Gallery.condenseDogEar(span);
    });
  }
  span_link.appendChild(span);
  Gallery.condenseDogEar(span);   // More than three digits?
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
  var entity = this.photoEntity();
  if (Pandas.field(entity, prev_photo, this.carousel_type) != default_photo) {
    imgs.push(entity[prev_photo]);
  } else {
    imgs.push(entity[last_photo]);  // Before first item is the last photo in the list
  }
  if (Pandas.field(entity, next_photo, this.carousel_type) != default_photo) {
    imgs.push(entity[next_photo]);
  } else {
    imgs.push(entity["photo.1"]);  // After last item is back to the first
  }
  // If any of the photos we tried to preload are undefined, remove them from the preload list
  return imgs.filter(function(element) {
    return element !== undefined;
  });
}

// Utility function to get the current number of photos.
Gallery.G.photoCount = function() {
  var entity = this.photoEntity();
  var photo_manifest = Pandas.photoManifest(entity, this.carousel_type);
  var max_index = Object.values(photo_manifest).length;
  return max_index;
}

// Utility function to get the proper entity for photo counts
Gallery.G.photoEntity = function(entity_id=this.info.id) {
  var entity = undefined;
  if (this.carousel_type == "zoo") {
    entity = Pandas.searchZooId(entity_id)[0];
  } else {
    entity = Pandas.searchPandaId(entity_id)[0];
  }
  return entity;
}

// Navigation input event -- load the next photo in the carousel
Gallery.G.photoNext = function(entity_id=this.info.id) {
  var current_photo_element = document.getElementsByClassName(entity_id + "/photo")[0];
  var current_photo_id = current_photo_element.id.split("/")[2];
  this.photoSwap(current_photo_element, parseInt(current_photo_id) + 1);
}

// Navigation input event -- load the previous photo in the carousel
Gallery.G.photoPrevious = function(entity_id=this.info.id) {
  var current_photo_element = document.getElementsByClassName(entity_id + "/photo")[0];
  var current_photo_id = current_photo_element.id.split("/")[2];
  this.photoSwap(current_photo_element, parseInt(current_photo_id) - 1);
}

// Switch the currently displayed photo to the next one in the list
Gallery.G.photoSwap = function(photo, desired_index) {
  var span_link = photo.parentNode.childNodes[photo.parentNode.childNodes.length - 1];
  var [entity_id, _, photo_id] = photo.id.split("/");
  var entity = this.photoEntity(entity_id);
  var photo_manifest = Pandas.photoManifest(entity, this.carousel_type);
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
  var new_container = this.displayPhoto(new_choice, entity_id, new_index.toString());
  var new_photo = new_container.childNodes[0];
  // Update existing photo element with info from the frame we switched to
  photo.src = new_photo.src;
  photo.id = new_photo.id;
  photo.className = new_photo.className;
  Touch.addHandler(new_photo);
  var photo_info = Pandas.profilePhoto(entity, new_index, this.carousel_type);
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
    var animal_relation = document.createElement('a');
    animal_relation.href = "#profile/" + animal["_id"];
    var relation_text = document.createElement('h5');
    relation_text.className = "caption familyTitle";
    var gender = Show.genderAnimal(animal, language, "caption gender");
    relation_text.appendChild(gender);
    // Span text can be cinched/tightened if too wide
    var span = document.createElement('span');
    var text = document.createTextNode(relationship);
    // TODO: cinch for any strings longer than X characters
    // TODO: cinch/make text smaller if also emojis exist
    if (relationship == L.gui.quadruplet["en"]) {
      span.classList.add("condensed");
    }
    span.appendChild(text);
    relation_text.appendChild(span);
    // Emoji separation not cinched
    var emojis = "";
    if (relationship == L.gui.me[language]) {
      emojis = "\u200A" + L.emoji.profile;
    }
    if (animal["death"] != undefined) {
      emojis = emojis + "\u200A" + L.emoji.died;
    }
    var emoji_text = document.createTextNode(emojis);
    relation_text.appendChild(emoji_text);
    animal_relation.appendChild(relation_text);
    animal_relation.addEventListener("click", Show.button.top.action);
    container.appendChild(animal_relation);  
  }
  return container;
}

// Take a dogear and change the style based on how large the inner number is
Gallery.condenseDogEar = function(nav) {
  // If more than three digits occur on click / mutate
  if (nav.innerText.length > 2) {
    nav.classList.add("threeDigits");
  } else {
    nav.classList.remove("threeDigits");
  }
}

// For a panda's birthday, grab a handful of photos (3). Display a birthday
// header above the photos and credit messages below each one.
Gallery.birthdayPhotoCredits = function(language) {
  var birthday_div = document.createElement('div');
  // Pandas must be alive, and have at least 20 photos
  var birthday_animals = Pandas.searchBirthday(true, 20);
  for (let animal of birthday_animals) {
    var info = Show.acquirePandaInfo(animal, language);
    var years_old = Pandas.ageYears(animal);
    // Post the birthday message (with age in years)
    var message = Show.message.birthday(info.name, info.id, years_old, language);
    birthday_div.appendChild(message);
    var photos = Pandas.searchPhotoTags([animal], ["portrait"], "photos", "first");
    var photo_count = 2;
    for (let photo of Pandas.shuffle(photos).splice(0, photo_count)) {
      var img_link = document.createElement('a');
      // Link to the original instagram media
      img_link.href = "#panda/" + animal._id + "/photo/" + photo["photo.index"];
      var img = document.createElement('img');
      img.src = photo["photo"];
      img.src = img.src.replace('/?size=l', '/?size=m');
      img_link.appendChild(img);
      // Link to the original instagram media
      var caption_link = document.createElement('a');
      caption_link.href = photo["photo.link"];
      caption_link.href = caption_link.href.replace("/media/?size=m", "/");
      caption_link.href = caption_link.href.replace("/media/?size=l", "/");
      caption_link.target = "_blank";   // Open in new tab
      var caption = document.createElement('h5');
      caption.className = "caption birthdayMessage";
      var caption_span = document.createElement('span');
      caption_span.innerText = Language.L.emoji.camera + " " + photo["photo.author"];
      // TODO: condenser
      caption.appendChild(caption_span);
      caption_link.appendChild(caption);
      var container = document.createElement('div');
      container.className = "photoSample quarterPage";
      container.appendChild(img_link);
      container.appendChild(caption_link);
      birthday_div.appendChild(container);
    }
  }
  return birthday_div;
}

// Take an animal, and return a list of divs for all the photos of that animal
// that match the username that was searched. Used for making reports of all
// the photos in the website contributed by a single author.
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
    img_link.href = photo;
    img_link.href = img_link.href.replace("/media/?size=m", "/");
    img_link.href = img_link.href.replace("/media/?size=l", "/");
    img_link.target = "_blank";   // Open in new tab
    var img = document.createElement('img');
    img.src = photo;
    img.src = img.src.replace('/?size=m', '/?size=t');
    img.src = img.src.replace('/?size=l', '/?size=t');
    img_link.appendChild(img);
    var caption_link = document.createElement('a');
    // TODO: better handling of group photos
    if (animal._id.indexOf("media.") != 0) {
      caption_link.href = "#panda/" + animal._id + "/photo/" + index;
    }
    var caption = document.createElement('h5');
    caption.className = "caption";
    // TODO: handling of names of group pandas
    if (animal._id.indexOf("media.") == 0) {
      caption.innerText = Pandas.groupMediaCaption(animal, item.index);
    } else {
      caption.innerText = info.name;
    }
    caption_link.appendChild(caption);
    var container = document.createElement('div');
    container.className = "photoSample";
    container.appendChild(img_link);
    container.appendChild(caption_link);
    content_divs.push(container);
  }
  return content_divs;
}

// Take a photo that matches a tag, and display it along with the tag emoji
Gallery.tagPhotoCredits = function(result, language) {
  var content_divs = [];
  var animal = Pandas.searchPandaId(result.id)[0];
  var info = Show.acquirePandaInfo(animal, language);
  var photo = result["photo"];
  var img_link = document.createElement('a');
  // Link to the original instagram media
  img_link.href = photo;
  img_link.href = img_link.href.replace("/media/?size=m", "/");
  img_link.href = img_link.href.replace("/media/?size=l", "/");
  img_link.target = "_blank";   // Open in new tab
  var img = document.createElement('img');
  img.src = photo;
  img.src = img.src.replace('/?size=m', '/?size=t');
  img.src = img.src.replace('/?size=l', '/?size=t');
  img_link.appendChild(img);
  var caption_link = document.createElement('a');
  // TODO: better handling of group photos
  if (animal._id.indexOf("media.") != 0) {
    caption_link.href = "#panda/" + animal._id + "/photo/" + result["photo.index"];
  }
  var caption = document.createElement('h5');
  caption.className = "caption";
  // TODO: handling of names of group pandas
  // TODO: support multiple tags
  if (animal._id.indexOf("media.") == 0) {
    caption.innerText = Pandas.groupMediaCaption(animal, "photo." + result["photo.index"]);
  } else {
    caption.innerText = info.name;
  }
  // Prefix caption with an emoji if we can get one
  var tag_lookup = Language.L.tags[result["photo.tags"][0]];
  if (tag_lookup != undefined) {
    var emoji = tag_lookup["emoji"];
    caption.innerText = emoji + "\xa0" + caption.innerText;
  }
  caption_link.appendChild(caption);
  var container = document.createElement('div');
  container.className = "photoSample";
  container.appendChild(img_link);
  container.appendChild(caption_link);
  content_divs.push(container);
  return content_divs;
}

// Take a zoo, and return the photo. Assumes that you have a match
// that match the username that was searched. Used for making reports of all
// the photos in the website contributed by a single author.
Gallery.zooPhotoCredits = function(zoo, credit, language) {
  var content_divs = [];
  var photos = [];
  var info = Show.acquireZooInfo(zoo, language);
  var photo_indexes = Pandas.photoGeneratorEntity;
  for (let field_name of photo_indexes(zoo, 0)) {
    if (zoo[field_name + ".author"] == credit) {
      photos.push({"image": zoo[field_name], "index": field_name});
    }
  }
  for (let item of photos) {
    var photo = item.image;
    var index = item.index.split(".")[1];
    var img_link = document.createElement('a');
    // Link to the original instagram media
    img_link.href = photo;
    img_link.href = img_link.href.replace("/media/?size=m", "/");
    img_link.href = img_link.href.replace("/media/?size=l", "/");
    img_link.target = "_blank";   // Open in new tab
    var img = document.createElement('img');
    img.src = photo;
    img.src = img.src.replace('/?size=m', '/?size=t');
    img.src = img.src.replace('/?size=l', '/?size=t');
    img_link.appendChild(img);
    var caption_link = document.createElement('a');
    caption_link.href = "#zoo/" + zoo._id + "/photo/" + index;
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

Gallery.special = {};
Gallery.special.mothersday = {};
Gallery.special.mothersday.photos = [
  {
    "photo.1": ["media.7.gin-marumi", "photo.1"],
    "photo.1.format": "medium",
    "photo.1.message": {
      "en": "Marumi & Gin " + Language.L.emoji.mother,
      "jp": "円実, ギン" + Language.L.emoji.mother
    }
  },
  {
    "photo.2": ["media.7.gin-marumi", "photo.2"],
    "photo.2.format": "medium",
    "photo.2.message": {
      "en": "Gin " + Language.L.emoji.mother + " & Marumi",
      "jp": "ギン" + Language.L.emoji.mother + ", 円実"
    }
  },
  {
    "photo.3": ["media.26.hinata-kanta-yuri", "photo.1"],
    "photo.3.format": "large",
    "photo.3.message": {
      "en": "Yuri " + Language.L.emoji.mother + ", Kanta & Hinata",
      "jp": "百合" + Language.L.emoji.mother + ", カンタ, ヒナタ"
    }
  },
  {
    "photo.4": ["media.29.akachan-laila", "photo.1"],
    "photo.4.format": "medium",
    "photo.4.message": {
      "en": "Aka-chan & Laila " + Language.L.emoji.mother,
      "jp": "赤ちゃん, ライラ" + Language.L.emoji.mother
    }
  },
  {
    "photo.5": ["media.29.akachan-laila", "photo.2"],
    "photo.5.format": "medium",
    "photo.5.message": {
      "en": "Aka-chan & Laila " + Language.L.emoji.mother,
      "jp": "赤ちゃん, ライラ" + Language.L.emoji.mother    
    }
  },
  {
    "photo.6": ["media.7.gin-marumi", "photo.3"],
    "photo.6.format": "medium",
    "photo.6.message": {
      "en": "Gin " + Language.L.emoji.mother + " & Marumi",
      "jp": "ギン" + Language.L.emoji.mother + ", 円実"
    }
  },
  {
    "photo.7": ["media.7.gin-marumi", "photo.4"],
    "photo.7.format": "medium",
    "photo.7.message": {
      "en": "Marumi & Gin " + Language.L.emoji.mother,
      "jp": "円実, ギン" + Language.L.emoji.mother
    }
  },
  {
    "photo.8": ["media.36.jazz-minfa", "photo.1"],
    "photo.8.format": "large",
    "photo.8.message": {
      "en": "Min-fa " + Language.L.emoji.mother + " & Jazz",
      "jp": "ミンファ" + Language.L.emoji.mother + ", ジャズ"
    }
  },
  {
    "photo.9": ["media.41.nohana-nokaze", "photo.1"],
    "photo.9.format": "medium",
    "photo.9.message": {
      "en": "Nokaze " + Language.L.emoji.mother + " & Nohana",
      "jp": "野風" + Language.L.emoji.mother + ", 野花"
    }
  },
  {
    "photo.10": ["media.50.karin-luca", "photo.1"],
    "photo.10.format": "medium",
    "photo.10.message": {
      "en": "Luca & Karin " + Language.L.emoji.mother,
      "jp": "ルカ, カリン" + Language.L.emoji.mother
    }
  },
  {
    "photo.11": ["media.17.rifa-taofa", "photo.1"],
    "photo.11.format": "large",
    "photo.11.message": {
      "en": "Rifa & Taofa " + Language.L.emoji.mother,
      "jp": "李花, タオファ" + Language.L.emoji.mother
    }
  },
  {
    "photo.12": ["media.7.gin-marumi", "photo.5"],
    "photo.12.format": "medium",
    "photo.12.message": {
      "en": "Gin " + Language.L.emoji.mother + " & Marumi",
      "jp": "ギン" + Language.L.emoji.mother + ", 円実"
    }
  },
  {
    "photo.13": ["media.7.gin-marumi", "photo.6"],
    "photo.13.format": "medium",
    "photo.13.message": {
      "en": "Marumi & Gin " + Language.L.emoji.mother,
      "jp": "円実, ギン" + Language.L.emoji.mother
    }
  },
  {
    "photo.14": ["media.1.cocoa-milk-yuufa", "photo.1"],
    "photo.14.format": "medium",
    "photo.14.message": {
      "en": "Yuufa " + Language.L.emoji.mother + " & Milk & Cocoa",
      "jp": "優花" + Language.L.emoji.mother + ", ミルク, ココア"
    },
  },
  {
    "photo.15": ["media.1.himawari-yuufa", "photo.1"],
    "photo.15.format": "medium",
    "photo.15.message": {
      "en": "Himawari & Yuufa " + Language.L.emoji.mother,
      "jp": "ひまわり, 優花" + Language.L.emoji.mother
    }
  },
  {
    "photo.16": ["media.7.gin-marumi", "photo.7"],
    "photo.16.format": "large",
    "photo.16.message": {
      "en": "Marumi & Gin " + Language.L.emoji.mother,
      "jp": "円実, ギン"+ Language.L.emoji.mother
    }
  }
]
Gallery.special.mothersday.render = function() {
  // Iterate over Gallery.special.mothersday.photos.
  // Make large format ones with a different URI and class
  var counter = 0;
  var mothers_div = document.createElement('div');
  for (let photo_info of Gallery.special.mothersday.photos) {
    counter = counter + 1;
    var counter_string = "photo." + counter;
    var [graph_id, desired_photo] = photo_info[counter_string];
    var graph_node = Pandas.searchPandaId(graph_id)[0];
    var source = graph_node[desired_photo];
    var author = Language.L.emoji.camera + "\xa0" + graph_node[desired_photo + ".author"]
    var format = photo_info[counter_string + ".format"]
    var link = graph_node[desired_photo + ".link"]
    var message = photo_info["photo." + counter + ".message"][L.display];
    // Create the image frame
    var img_link = document.createElement('a');
    img_link.href = source;
    img_link.href = img_link.href.replace("/media/?size=m", "/");
    img_link.href = img_link.href.replace("/media/?size=l", "/");
    var img = document.createElement('img');
    // Instagram size change logic
    img.src = source;
    if (format == "large") {
      img.src = img.src.replace("/media/?size=m", "/media/?size=l");
    }
    img_link.appendChild(img);
    // Create the message caption
    var caption_message = document.createElement('a');
    var caption_message_text = document.createElement('h5');
    caption_message_text.className = "caption shortMessage";
    caption_message_text.innerText = message;
    caption_message.appendChild(caption_message_text);
    // Create the secondary credit caption
    var caption_author = document.createElement('a');
    caption_author.href = link;
    var caption_author_text = document.createElement('h5');
    caption_author_text.className = "caption authorCredit";
    caption_author_text.innerText = author;
    caption_author.appendChild(caption_author_text);
    // Create the entire photo frame
    var photo_frame = document.createElement('div');
    photo_frame.className = "photoSample";
    photo_frame.appendChild(img_link);
    photo_frame.appendChild(caption_message);
    photo_frame.appendChild(caption_author);
    if (format == "large") {
      photo_frame.classList.add("fullPage");
    } else {
      photo_frame.classList.add("halfPage");
    }
    // Append this to the Mother's day frame
    mothers_div.appendChild(photo_frame);
  }
  return mothers_div;
}

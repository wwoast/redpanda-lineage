import Env from './environment.js'
import * as Language from './language.js'
import { Defaults, Emoji, Polyglots, Tags } from './lookup.js'
import * as Message from './message.js'
import * as Page from './page.js'
import P, * as Pandas from './pandas.js'
import * as Query from './query.js'
import * as Show from './show.js'
import * as Touch from './touch.js'

/** 
 * Operations and state related to photo galleries.
 *
 * This module, given a list of photos, will create many types of photo
 * galleries, including single frame _Carousel_ views with dogear navigation
 * widgets and swipe controls, as well as larger pageable galleries.
 *
 * The Gallery instance has two types of methods: photo methods (for dealing
 * with single-photo panda info), and media methods (for dealing with photos
 * with multiple pandas).
 */

/** 
 * On the panda results card, a single photo is shown. On mobile, this photo
 * can be swiped left and right, and on computers, a dog ear appears when the
 * mouse pointer hovers on the photo. In this way, many hundreds of photos
 * are viewable, from within a single `<img>` frame on a single results card.
 */
export class Carousel {
  /** `animal` or `zoo`, used to set the `element_class` */
  carousel_type =  "animal"
  /** `pandaPhoto` or `zooPhoto` */
  element_class = "pandaPhoto"
  /** Default image to load for a photo in this gallery */
  fallback_url = 'images/no-panda-portrait.jpg'
  /** `<img>` element we load photos into */
  image = document.createElement('img')
  /** photo index of the photo being shown */
  index = "1"
  /** information about the animal or zoo this gallery is for */
  info = undefined
  /** unique string to add to the gallery to make the widget unique */
  unique = undefined

  constructor(info, carousel_type, fallback_url) {
    this.info = info   // Old photo value == info.photo
    // Hacky way to determine the proper element class from whether this is an
    // animal photo carousel or a zoo photo carousel
    this.carousel_type = carousel_type
    this.element_class = (carousel_type == "zoo")
      ? "zooPhoto"
      : "pandaPhoto"
    // Define index value for which of an animal's photos we'll display by
    // default. Doesn't apply to zoo info, so we have a default standby value
    this.index = ("photo_index" in info)
      ? info.photo_index
      : "1"
    // Galleries need unique IDs, in case somehow the same animal appears twice
    // in output results for a page.
    this.unique = Math.random().toString(36).slice(2)
    if (fallback_url)
      this.fallback_url = fallback_url
    // Gallery instance has a single photo frame that we attach event handlers
    // to for loading images from random sources
    this.image.setAttribute("loading", "lazy")
    // Firefox has a bug when touch handlers register on browsers that don't
    // have them, so try to limit touch events to only browsers that have it.
    if ('ontouchstart' in document.documentElement) {
      Touch.addSwipeHandler(this, this.image, Touch.processPhoto)
    }
  }

  /**
   * If the media exists for an entity, display it. If it's missing, display a
   * placeholder empty frame that takes up the same amount of space on the page.
   * Support using class variables by default, but allow the `photoSwap` function
   * to use unique parameters as it needs.
   */
  displayPhoto() {
    // Using current information from the Gallery state...
    const photoUrl = this.info.photo
    const id = this.info.id
    const index = this.index
    // Fill in details of the image we are displaying
    if (photoUrl == undefined) {
      this.image.src = this.fallback_url
    } else if (id.indexOf("_") != -1) {
      // HACK: passing carousel id from touch handlers
      this.image.id = `${id}/photo/${index}`
      this.image.className = `${id}/photo`
      url.process(this.image, photoUrl)
    } else {
      this.image.id = `${this.unique}_${id}/photo/${index}`   // For carousel
      this.image.className = `${this.unique}_${id}/photo`
      url.process(image, photoUrl)
    }
    image.onerror = `this.src='${this.fallback_url}'`
  }

  /** The hover over or swipe menu for photo navigation */
  displayPhotoNavigation() {
    const span_link = document.createElement('a')
    span_link.className = "navigatorLink"
    span_link.id = `${this.unique}_${this.info.id}/navigator`
    span_link.href = "javascript:;";
    const span = document.createElement('span')
    span.className = "navigator"
    // Clickable dogears when you have a carousel of more than one photo
    if (this.photoCount() < 2) {
        span.innerText = Emoji.no_more;
        // Consistent widget behavior on mouse clicks for non-functional
        // navigators as well (disable normal right/middle click behavior)
        span_link.addEventListener('contextmenu', function(e) {   // Right click event
          e.preventDefault()   // Prevent normal context menu from firing
        });
        span_link.addEventListener('auxclick', function(e) {   // Middle click event
          if (e.which == 2) {
            e.preventDefault()   // Prevent middle click opening a new tab
          }
        });
    } else {
      span.innerText = this.index;
      span_link.addEventListener('click', function() {  // Left click event
        this.photoNext(this.info.id)
        condenseDogEar(span)
        window.dispatchEvent(Page.profile.qr_update)
      });
      span_link.addEventListener('contextmenu', function(e) {   // Right click event
        e.preventDefault()   // Prevent normal context menu from firing
        this.photoPrevious(this.info.id)
        condenseDogEar(span)
        window.dispatchEvent(Page.profile.qr_update)
      });
      span_link.addEventListener('auxclick', function(e) {   // Middle click event
        if (e.which == 2) {
          e.preventDefault();   // Prevent middle click opening a new tab
          this.photoRandom(this.info.id);
          condenseDogEar(span);
          window.dispatchEvent(Page.profile.qr_update);
        }
      });
    }
    span_link.appendChild(span);
    condenseDogEar(span);   // More than three digits?
    return span_link;
  }

  /** Utility function to get the current number of photos */
  photoCount() {
    const entity = this.photoEntity()
    const photo_manifest = Pandas.photoManifest(entity, this.carousel_type)
    const max_index = Object.values(photo_manifest).length
    return max_index
  }

  /** Utility function to get the proper entity for photo counts */
  photoEntity(entity_id=this.info.id) {
    return (this.carousel_type == "zoo")
      ? Pandas.searchZooId(entity_id)[0]
      : Pandas.searchPandaId(entity_id)[0]
  }

  /** Navigation input event -- load the next photo in the carousel */
  photoNext = function(entity_id=this.info.id) {
    // HACK: from touch handlers, it has a carousel id
    const carousel_id = (!entity_id.includes("_"))
      ? `${this.unique}_${entity_id}`
      : entity_id
    const current_photo_element =
      document.getElementsByClassName(`${carousel_id}/photo`)[0]
    const current_photo_id = current_photo_element.id.split("/")[2]
    this.photoSwap(current_photo_element, parseInt(current_photo_id) + 1)
  }

  /** Navigation input event -- load the previous photo in the carousel */
  photoPrevious(entity_id=this.info.id) {
    // HACK: from touch handlers, it has a carousel id
    const carousel_id = (!entity_id.includes("_"))
      ? `${this.unique}_${entity_id}`
      : entity_id
    const current_photo_element =
      document.getElementsByClassName(`${carousel_id}/photo`)[0]
    const current_photo_id = current_photo_element.id.split("/")[2]
    this.photoSwap(current_photo_element, parseInt(current_photo_id) - 1)
  }

  /** Navigation input event -- load a random-index photo of this animal */
  photoRandom(entity_id=this.info.id) {
    // HACK: from touch handlers, it has a carousel id
    const carousel_id = (!entity_id.includes("_"))
      ? `${this.unique}_${entity_id}`
      : entity_id
    if (entity_id.includes("_"))
      entity_id = carousel_id.split("_").pop()
    const current_photo_element =
      document.getElementsByClassName(`${carousel_id}/photo`)[0]
    const current_photo_id = current_photo_element.id.split("/")[2]
    // Randomly choose the next id
    const photo_indexes = Object.keys(
      Pandas.photoManifest(Pandas.searchPandaId(entity_id)[0], "animal"))
        .map(x => x.split(".")[1])
    let next_id = current_photo_id
    if (photo_indexes.length > 1)
      while (next_id == current_photo_id)
        next_id = Pandas.randomChoice(photo_indexes, 1)
    this.photoSwap(current_photo_element, parseInt(next_id))
  }

  /** Switch the currently displayed photo to the next one in the list */
  photoSwap(photo, desired_index) {
    const span_link =
      photo.parentNode.childNodes[photo.parentNode.childNodes.length - 1]
    const [carousel_id, _, photo_id] = photo.id.split("/")
    const entity_id = carousel_id.split("_").pop()
    const entity = this.photoEntity(entity_id)
    const photo_manifest = Pandas.photoManifest(entity, this.carousel_type)
    const max_index = Object.values(photo_manifest).length
    let new_index = 1   // Fallback value
    if (desired_index < 1) {
      new_index = max_index
    } else if (desired_index > max_index) {
      new_index = (desired_index % max_index)
    } else {
      new_index = desired_index
    }
    // Replace the span navigation id if we have an actual carousel
    if (max_index > 1) {
      span_link.childNodes[0].innerText = new_index.toString()
    } else {
      return  // No carousel, no need to actually swap photos
    }
    var chosen = `photo.${newIndex}`
    var new_choice = photo_manifest[chosen];
    // Update displayed photo
    this.displayPhoto(photo, new_choice, carousel_id, new_index.toString())
    var photo_info = Pandas.profilePhoto(entity, new_index, this.carousel_type)
    // Replace the animal credit info
    this.singlePhotoCredit(photo_info, photo_id, new_index)
    // And the photographer credit's apple points
    this.userApplePoints(photo_info, photo_id, new_index)
  }

  /** Replace the photographer's credit info for a panda's photo */
  singlePhotoCredit(photo_info, current_index, new_index) {
    const animal_id = photo_info.id;
    const credit_link =
      document.getElementById(`${animal_id}/author/${current_index}`)
    credit_link.id = `${animal_id}/author/${new_index}`
    if (!Object.keys(Defaults.authors).includes(photo_info.credit)) {
      credit_link.href = photo_info["link"]
    } else {
      credit_link.removeAttribute("href")   // No more link
    }
    credit_link.target = "_blank"   // Open in new tab
    credit_link.innerText = `${Emoji.camera} ${photo_info["credit"]}`
  }

  /** Replace the photographer's apple points (number of photos on the site) */
  userApplePoints(photo_info, current_index, new_index) {
    const animal_id = photo_info.id;
    const apple_link = document.getElementById(`${animal_id}/counts/${current_index}`)
    apple_link.id = `${animal_id}/counts/${new_index}`
    if (!Object.keys(Defaults.authors).includes(photo_info.credit)) {
      const apple_count = P.db._photo.credit[photo_info["credit"]]
      apple_link.href = `#credit/${photo_info["credit"]}`
      apple_link.innerText = `${Emoji.gift} ${apple_count}`
      if (parseInt(apple_count) >= 1000) {
        apple_link.innerText = `${Emoji.megagift} ${apple_count}`
      }
    } else {
      apple_link.innerText = "";
    }
  }
}

/** Standalone gallery/photo construction methods */

/** 
 * Take a gallery photo. If it's a special URL format, process it into a final
 * photo URI.
 */
const url = {
  /** Get the thumbnail uri from self-hosting */
  codaworry: (image, input_uri) => {
    const uri_split = input_uri.split("/")
    const cwdc_locator = uri_split.pop()
    const cwdc_url = `https://www.codaworry.com/images/submitted/${cwdc_locator}`
    image.src = cwdc_url
  },
  /** Unroll various custom link formats into things that work as href */
  href: (uri) => {
    if (uri.indexOf("http") == 0)
      return uri
    else if (uri.indexOf("ig") == 0) {
      const ig_locator = uri.split("/")[2]
      return `https://www.instagram.com/p/${ig_locator}`
    } else if (uri.indexOf("cwdc") == 0) {
      const cwdc_locator = uri.split("/")[2]
      return `https://www.codaworry.com/images/submitted/${cwdc_locator}`
    } else { 
      return Defaults.animal["photo.1"]
    }
  },
  /** 
   * Support a colorful cast of formats for getting underlying image hrefs.
   * The `<img>` element is processed and eventually its `src` is updated
   */
  process: (image, uri) => {
    if (uri.indexOf("http") == 0) {
      image.src = uri
    } else if (uri.indexOf("cwdc") == 0) {
      url.codaworry(image, uri)
    } else {
      image.src = Defaults.animal["photo.1"];   // Default image
    }
  }
}

/** 
 * For a panda's birthday, grab a handful of photos (3 by default). Display a
 * birthday header above the photos and credit messages below each one.
 */
export function birthdayPhotoCredits(language, photo_count=3, max_animals=5) {
  const birthday_div = document.createElement('div')
  // Pandas must be alive, and have at least photo_count photos
  const birthday_animals = Pandas.searchBirthdayToday(true, photo_count)
  const birthday_count = birthday_animals.length
  if (birthday_count > max_animals) {
    birthday_animals = Pandas.searchBirthdayLitterBias(true, photo_count, max_animals)
    const overflow = Message.birthday_overflow(birthday_count, language)
    birthday_div.appendChild(overflow)
  }
  for (const animal of birthday_animals) {
    const info = Show.acquirePandaInfo(animal, language)
    const years_old = Pandas.ageYears(animal);
    // Post the birthday message (with age in years)
    const message = Message.birthday(info.name, info.id, years_old, language)
    birthday_div.appendChild(message)
    const photos = Pandas.searchPhotoTags([animal], ["portrait"], "photos", "first");
    for (const photo of Pandas.randomChoice(photos, photo_count)) {
      const img_link = document.createElement('a')
      // Link to the original instagram media
      img_link.href = `#panda/${animal._id}/photo/${photo["photo.index"]}`
      const img = document.createElement('img')
      img.setAttribute("loading", "lazy")
      // Set the photo, even if it takes an extra XHR
      url.process(img, photo["photo"])
      img_link.appendChild(img)
      // Link to the original instagram media
      const caption_link = document.createElement('a')
      caption_link.href = url.href(photo["photo.link"])
      caption_link.target = "_blank";   // Open in new tab
      const caption = document.createElement('h5')
      caption.className = "caption birthdayMessage"
      const caption_span = document.createElement('span')
      caption_span.innerText = `${Emoji.camera} ${photo["photo.author"]}`
      // TODO: condenser
      caption.appendChild(caption_span)
      caption_link.appendChild(caption)
      const container = document.createElement('div')
      container.className = "photoSample quarterPage"
      container.appendChild(img_link)
      container.appendChild(caption_link)
      birthday_div.appendChild(container)
    }
  }
  return birthday_div
}

/** Change a dogear text style based on how many digits in the index number */
export function condenseDogEar(nav) {
  switch (nav.innerText.length) {
    case 3:
      nav.classList.remove("fourDigits");
      nav.classList.add("threeDigits");
      break;
    case 4:
      nav.classList.remove("threeDigits");
      nav.classList.add("fourDigits");
      break;
    default:
      nav.classList.remove("threeDigits");
      nav.classList.remove("fourDigits");
  }
}

/** `pandaPhotoCredits` and `zooPhotoCredits`, interleaved as results */
export function creditPhotos(results, language, max_hits) {
  const photo_results = creditPhotosPage(0, results, language, max_hits)
  const content_divs = photo_results["output"]
  const photo_count = photo_results["hit_count"];
  // Write some HTML with summary information for the user and the photo count
  const header = (results["filter"] != undefined)
    ? Message.creditSingleFilter(
        results["subject"], results["filter"], photo_count, language)
    : Message.credit(results["subject"], photo_count, language)
  content_divs.unshift(header)
  return content_divs
}

/**
 * Use a page counter to determine where in the results count to start showing
 * photos. If photos on this page < `max_hits`, hide the next page button
 * 
 * TODO: `zooPhotoCredits` and `pandaPhotoCredits` shouldn't return divs yet,
 * to prevent loading the entire image set each time you only want `set/N`
 */
function creditPhotosPage(page, results, language, max_hits) {
  let grab_photos = []
  let content_divs = []
  const initial_max_hits = max_hits
  // We must unspool the results because each entity we query here can have multiple
  // results returned, and the paging must only return the first max_hits content.
  for (const entity of results["hits"]) {
    grab_photos = (entity["_id"] < 0)
      ? grab_photos.concat(
          zooPhotoCredits(entity, results["subject"], language))
      : grab_photos.concat(
          pandaPhotoCredits(entity, results["subject"], language))
  }
  const starting_point = page * Env.paging.results_count
  // Working copy of photo set, starting at the nth page of photos
  let content_photos = grab_photos.slice(starting_point)
  const hit_count = content_photos.length
  // Refresh, but show more than just the normal photo_count
  // TODO: this may not work across history changes
  if (page == 0 && Env.paging.shown_pages > 1)
    max_hits = Env.paging.shown_pages * max_hits
  if (hit_count <= max_hits) {
    // Last page of content. Hide Next button
    Env.paging.display_button = false
  } else {
    // Limit to just photo_count of the output
    content_photos = content_photos.slice(0, max_hits)
    // Set callbacks for next button, and redraw footer
    Env.paging.callback.function = creditPhotosPage
    const pages_shown = initial_max_hits / Env.paging.results_count
    Env.paging.callback.arguments = [
      page + pages_shown,
      results,
      language,
      Env.paging.results_count
    ]
    Env.paging.callback.frame_id = "contentFrame"
  }
  // Take the desired content_photos and convert them to divs
  content_photos.forEach(function(photo) {
    if (photo["type"] == "panda")
      content_divs = content_divs.concat(pandaPhotoCreditSingle(photo))
    if (photo["type"] == "zoo")
      content_divs = content_divs.concat(zooPhotoCreditSingle(photo))
  })
  // Redraw footer to update the paging button
  Page.footer.redraw("results")
  return {
    "output": content_divs,
    "hit_count": grab_photos.length
  }
}

/**
 * Create a profile page frame for a single animal, give it a nametag, and
 * additionally, give it a relationship value.
 */
export function familyProfilePhoto(
  animal, chosen_photo, language, relationship, frame_class, multiple=false
) {
  const info = Show.acquirePandaInfo(animal, language)
  // The overall container
  const container = document.createElement('div')
  container.className = "photoSample"
  if (frame_class != undefined)
    container.classList.add(frame_class)
  // Photo container
  const clickable_photo = document.createElement('a')
  clickable_photo.target = "_blank"
  if (chosen_photo != Defaults.animal["photo.1"])   // No link if no photo defined
    clickable_photo.href = url.href(chosen_photo["photo"])
  const image = document.createElement('img')
  image.setAttribute("loading", "lazy")
  // Set the photo, even if it takes an extra XHR
  url.process(image, chosen_photo["photo"])
  clickable_photo.appendChild(image)
  container.appendChild(clickable_photo)
  // Family name caption
  const animal_name = document.createElement('a')
  animal_name.href = `#profile/${animal["_id"]}`
  const animal_text = document.createElement('h5')
  animal_text.className = "caption familyName"
  animal_text.innerText = info["name"]
  animal_name.appendChild(animal_text)
  animal_name.addEventListener("click", Show.topButton.action)
  container.appendChild(animal_name)
  // Family title caption.
  if (relationship != undefined) {
    const animal_relation = document.createElement('a')
    animal_relation.href = `#profile/${animal["_id"]}`
    const relation_text = document.createElement('h5')
    relation_text.className = "caption familyTitle"
    const gender = Show.genderAnimal(animal, language, "caption gender")
    relation_text.appendChild(gender)
    // Span text can be cinched/tightened if too wide
    const span = document.createElement('span')
    const text = document.createTextNode(relationship)
    // TODO: cinch for any strings longer than X characters
    // TODO: cinch/make text smaller if also emojis exist
    if (relationship == Gui.quadruplet["en"])
      span.classList.add("condensed")
    span.appendChild(text)
    relation_text.appendChild(span)
    // Emoji separation not cinched
    let emojis = ""
    if (relationship == Gui.me[language])
      emojis = "\u200A" + Emoji.profile
    if (multiple == true)
      emojis = Emoji.question
    if (animal["death"] != undefined)
      emojis = emojis + "\u200A" + Emoji.died
    const emoji_text = document.createTextNode(emojis)
    relation_text.appendChild(emoji_text)
    animal_name.appendChild(relation_text)
  }
  return container
}

/**
 * Get media photos (of two or more animals), which include a particular
 * animal. Return a set of divs that includes both images and the titles
 * for each image.
 */
function groupPhotos(id_list) {
  const seen = {}
  const photo_list = [];
  for (const id of id_list) {
    const entities = Pandas.searchPandaMedia(id, only_media=true)
    for (const entity of entities) {
      const photos = Pandas.photoManifest(entity)
      for (const photo_key in photos) {
        const url = photos[photo_key]
        if (seen[url] == true)
          continue   // Skip photos we've already trakced
        else {
          seen[url] = true
          photo_list.push({
            "entity": entity,
            "photo_key": photo_key,
            "url": url
          })
        }
      }
    }
  }
  return Pandas.shuffleWithSeed(photo_list, Env.paging.seed)
}

/**
 * Get the Nth page of group photos. Since we don't have a ton of group photos
 * in general, I figure this is OK to write in terms of the older groupPhotos
 * which parses all photos and writes name tags and such.
 */
export function groupPhotosPage(page, id_list, photo_count) {
  const initial_photo_count = photo_count
  if (page == 0 && Env.paging.shown_pages > 1) { 
    // Refresh, but show more than just the normal photo_count
    photo_count = Env.paging.shown_pages * photo_count
  }
  const photos = groupPhotos(id_list)   // All photos
  const chosen = photos.slice(page * photo_count)   // Choose just this page
  // Last page of content. Hide Next button
  if (chosen.length <= photo_count)
    Env.paging.display_button = false
  else {
    // Limit to just photo_count of the output
    chosen = chosen.slice(0, photo_count)
    Env.paging.callback.function = groupPhotosPage
    Env.paging.callback.arguments = [
      page + 1,
      id_list,
      initial_photo_count
    ]
    Env.paging.callback.frame_id = "contentFrame"
  }
  // Now that photos are whittled down, make divs
  const output = []
  for (const shot of chosen) {
    const container =
      groupPhotoSingle(shot["entity"], shot["photo_key"], shot["url"])
    output.push(container);        
  }
  // Redraw the footer menu to update the paging button
  Page.footer.redraw("profile")
  return {
    "output": output
  }
}

/** 
 * Similar to `groupPhotos`, but each photo must have all animals represented
 * in the input id list.
 */
function groupPhotosIntersect(id_list) {
  const output = []
  const entities = Pandas.searchPandaMediaIntersect(id_list)
  for (const entity of entities) {
    const photos = Pandas.photoManifest(entity);
    for (const photo_key in photos) {
      output.push({
        "entity": entity,
        "photo_key": photo_key,
        "url": photos[photo_key]
      });
    }
  }
  return output;
}

/**
 * Clone of `groupPhotosPage`, with the constraint that all photos must be of
 * the entire list of animals in the id_list. Since this is a callback I had to
 * conform to the existing arity of the other functions, rather than pass
 * `groupPhotosIntersect` itself as a callback.
 */
export function groupPhotosIntersectPage(page, id_list, photo_count) {
  const initial_photo_count = photo_count
  // Refresh, but show more than just the normal photo_count
  if (page == 0 && Env.paging.shown_pages > 1)
    photo_count = Env.paging.shown_pages * photo_count
  const photos = groupPhotosIntersect(id_list)   // All photos
  const chosen = photos.slice(page * photo_count)   // Choose just this page
  // Last page of content. Hide Next button
  if (chosen.length <= photo_count)
    Env.paging.display_button = false;
  else {
    // Limit to just photo_count of the output
    chosen = chosen.slice(0, photo_count)
    Env.paging.callback.function = groupPhotosIntersectPage
    Env.paging.callback.arguments = [
      page + 1,
      id_list,
      initial_photo_count
    ]
    Env.paging.callback.frame_id = "contentFrame"
  }
  // Now that photos are whittled down, make divs
  const output = []
  for (const shot of chosen) {
    const container =
      groupPhotoSingle(shot["entity"], shot["photo_key"], shot["url"])
    output.push(container)
  }
  // Redraw the footer menu to update the paging button
  Page.footer.redraw("profile")
  return {
    "output": output
  }
}

function groupPhotoSingle(entity, photo_key, imgUrl) {
  // TOWRITE: image styles based on url being medium or large
  const img_link = document.createElement('a')
  img_link.href = url.href(imgUrl)
  const img = document.createElement('img')
  img.setAttribute("loading", "lazy")
  // Set the photo, even if it takes an extra XHR
  url.process(img, imgUrl)
  img_link.appendChild(img);
  // Names of the group photos
  const caption_names = document.createElement('h5')
  caption_names.className = "caption groupMediaName"
  const caption_names_span = document.createElement('span')
  caption_names_span.innerText = Pandas.groupMediaCaption(entity, photo_key)
  caption_names.appendChild(caption_names_span)
  const caption_names_link = document.createElement('a')
  const panda_route = entity["panda.tags"].split(", ").join("/")
  caption_names_link.href = `#group/${panda_route}`
  caption_names_link.appendChild(caption_names)
  // Credit for the group photos
  const author = entity[`${photo_key}.author`]
  const caption_credit_link = document.createElement('a');
  caption_credit_link.href = `#credit/${author}`   // build from author info
  const caption_credit = document.createElement('h5')
  caption_credit.className = "caption groupMediaAuthor"
  const caption_credit_span = document.createElement('span')
  caption_credit_span.innerText = `${Emoji.apple} ${author}`
  caption_credit.appendChild(caption_credit_span)
  caption_credit_link.appendChild(caption_credit)
  // Put it all in a frame
  const container = document.createElement('div')
  container.className = "photoSample"
  if ((imgUrl.indexOf("/l") == imgUrl.length - 2) && 
      (imgUrl.indexOf("ig://") == 0)) {
    container.classList.add("halfPage")
  } else if ((imgUrl.indexOf("/m") == imgUrl.length - 2) &&
             (imgUrl.indexOf("ig://") == 0)) {
    container.classList.add("quarterPage")
  } else if (imgUrl.indexOf("ig://") == -1) {
    container.classList.add("fullPage")   // self-hosted images
  } else {
    container.classList.add("quarterPage")
  }
  container.appendChild(img_link)
  container.appendChild(caption_names_link)
  container.appendChild(caption_credit_link)
  return container
}

/** 
 * Solo photos that can be found in the group gallery. These are chosen on
 * the basis of having the most tags, and are ideally interesting "action
 * shots" of an individual animal.
 */
function actionPhotos(language, id_list, photo_count=10) {
  return   // TOWRITE
}

/** Generic version of the birthday / memorial logic */
export function genericPhotoCredits(
  language, id_list, photo_count, tag_list, message_function, message_params
) {
  const generic_div = document.createElement('div');
  for (const id of id_list) {
    const animal = Pandas.searchPandaId(id)[0]
    const message = message_function.apply(null, message_params)
    generic_div.appendChild(message)
    const photos = Pandas.searchPhotoTags([animal], tag_list, "photos", "first")
    for (const photo of Pandas.randomChoice(photos, photo_count)) {
      const img_link = document.createElement('a')
      // Link to the original instagram media
      img_link.href = `#panda/${animal._id}/photo/${photo["photo.index"]}`
      const img = document.createElement('img')
      img.setAttribute("loading", "lazy")
      // Set the photo, even if it takes an extra XHR
      url.process(img, photo["photo"])
      img_link.appendChild(img)
      // Link to the original instagram media
      const caption_link = document.createElement('a')
      caption_link.href = url.href(photo["photo.link"])
      caption_link.target = "_blank"   // Open in new tab
      const caption = document.createElement('h5')
      caption.className = "caption memorialMessage"
      const caption_span = document.createElement('span')
      caption_span.innerText = `${Emoji.camera} ${photo["photo.author"]}`
      // TODO: condenser
      caption.appendChild(caption_span)
      caption_link.appendChild(caption)
      const container = document.createElement('div')
      container.className = "photoSample quarterPage"
      container.appendChild(img_link);
      container.appendChild(caption_link)
      generic_div.appendChild(container)
    }
  }
  return generic_div
}

/** 
 * Give it manual-compiled lists of animals who died recently. Return a div
 * with the exact desired output.
 */
export function memorialPhotoCredits(
  language, id_list, photo_count=5, message_function
) {
  const memorial_div = document.createElement('div')
  for (const id of id_list) {
    const animal = Pandas.searchPandaId(id)[0]
    const info = Show.acquirePandaInfo(animal, language)
    const message =
      message_function(info.name, info.id, info.birthday, info.death, language)
    memorial_div.appendChild(message)
    const photos = Pandas.searchPhotoTags([animal], ["portrait"], "photos", "first")
    for (const photo of Pandas.randomChoice(photos, photo_count)) {
      const img_link = document.createElement('a')
      // Link to the original instagram media
      img_link.href = `#panda/${animal._id}/photo/${photo["photo.index"]}`
      const img = document.createElement('img')
      img.setAttribute("loading", "lazy")
      // Set the photo, even if it takes an extra XHR
      url.process(img, photo["photo"])
      img_link.appendChild(img)
      // Link to the original instagram media
      const caption_link = document.createElement('a')
      caption_link.href = url.href(photo["photo.link"])
      caption_link.target = "_blank"   // Open in new tab
      const caption = document.createElement('h5');
      caption.className = "caption memorialMessage"
      const caption_span = document.createElement('span')
      caption_span.innerText = `${Emoji.camera} ${photo["photo.author"]}`
      // TODO: condenser
      caption.appendChild(caption_span)
      caption_link.appendChild(caption)
      const container = document.createElement('div')
      container.className = "photoSample quarterPage"
      container.appendChild(img_link)
      container.appendChild(caption_link)
      memorial_div.appendChild(container)
    }
  }
  return memorial_div
}

/**
 * Give it manual-compiled lists of group animals who died recently. Return a
 * div with the exact desired output. Use manually defined `id_list` to decide
 * the proper aesthetic ordering of names.
 */
export function memorialPhotoCreditsGroup(
  language, group_id, id_list, photo_count=5
) {
  const memorial_div = document.createElement('div')
  const group = Pandas.searchPandaId(group_id)[0]
  const id_link_string = id_list.join("/")
  const name_list = id_list.map(x => Pandas.searchPandaId(x)[0])
                           .map(x => Language.fallback_name(x))
  const name_string = Language.commaPhraseBare(name_list)
  const message = Message.memorialGroup(name_string, id_link_string, language)
  memorial_div.appendChild(message)
  // Group photos
  let photos = Pandas.searchPhotoTags([group], ["portrait"], "photos", "first")
  // Individual photos
  for (const id of id_list) {
    const animal = Pandas.searchPandaId(id)[0]
    const individual_all =
      Pandas.searchPhotoTags([animal], ["portrait"], "photos", "first");
    const individual_sample = Pandas.randomChoice(individual_all, 2)
    photos = photos.concat(individual_sample)
  }
  photos = Pandas.shuffle(photos)
  for (const photo of Pandas.randomChoice(photos, photo_count)) {
    const img_link = document.createElement('a')
    img_link.href = `#group/${id_link_string}`
    const img = document.createElement('img')
    img.setAttribute("loading", "lazy")
    // Set the photo, even if it takes an extra XHR
    url.process(img, photo["photo"])
    img_link.appendChild(img)
    // Link to the original instagram media
    const caption_link = document.createElement('a')
    caption_link.href = url.href(photo["photo.link"])
    caption_link.target = "_blank"   // Open in new tab
    const caption = document.createElement('h5')
    caption.className = "caption memorialMessage"
    const caption_span = document.createElement('span')
    caption_span.innerText = `${Emoji.camera} ${photo["photo.author"]}`
    // TODO: condenser
    caption.appendChild(caption_span);
    caption_link.appendChild(caption);
    const container = document.createElement('div')
    container.className = "photoSample quarterPage"
    container.appendChild(img_link)
    container.appendChild(caption_link)
    memorial_div.appendChild(container)
  }
  return memorial_div
}

/**
 * Take an animal, and return a list of divs for all the photos of that animal
 * that match the username that was searched. Used for making reports of all
 * the photos in the website contributed by a single author.
 */
function pandaPhotoCredits(animal, credit, language) {
  const photos = []
  const photo_indexes = Pandas.photoGeneratorEntity
  for (const field_name of photo_indexes(animal, 0)) {
    if (animal[field_name + ".author"] == credit) {
      photos.push({
        "id": animal["_id"],
        "image": animal[field_name], 
        "index": field_name,
        "type": "panda"}
      )
    }
  }
  return photos
}

/** Format a panda credit photo into displayable content */
function pandaPhotoCreditSingle(item) {
  const photo = item.image
  const index = item.index.split(".")[1]
  const img_link = document.createElement('a')
  const id = item.id
  // Link to the original instagram media
  img_link.href = url.href(photo);
  img_link.target = "_blank";   // Open in new tab
  const img = document.createElement('img')
  img.setAttribute("loading", "lazy")
  // Set the photo, even if it takes an extra XHR
  url.process(img, photo)
  img_link.appendChild(img)
  const caption_link = document.createElement('a')
  // TODO: better handling of group photos
  if (id.indexOf("media.") != 0)
    caption_link.href = `#panda/${id}/photo/${index}`
  const caption = document.createElement('h5')
  caption.className = "caption pandaName"
  // TODO: handling of names of group pandas
  if (id.indexOf("media.") == 0) {
    const entity = Pandas.searchPandaId(id)[0]
    caption.innerText = Pandas.groupMediaCaption(entity, item.index)
    const panda_route = entity["panda.tags"].split(", ").join("/")
    caption_link.href = `#group/${panda_route}`
  } else {
    const animal = Pandas.searchPandaId(id)[0]
    const info = Show.acquirePandaInfo(animal, Env.language)
    caption.innerText = info.name
  }
  caption_link.appendChild(caption)
  const container = document.createElement('div')
  container.className = "photoSample"
  container.appendChild(img_link)
  container.appendChild(caption_link)
  return container
}

/** Display a gallery of photos with a given tag. */
export function tagPhotos(results, language, max_hits, add_emoji) {
  const hit_count = results["hits"].length
  // Get the first page of content
  const paging_data = tagPhotosPage(0, results, language, max_hits, add_emoji)
  const content_divs = paging_data["output"]
  // Build a summary message based on which tag_photo parser mode we have,
  // and whether we have hits or not.
  const header = tagPhotoMessage(results, hit_count)
  content_divs.unshift(header)
  return content_divs
}

/** 
 * Use a page counter to determine where in the results count to start showing
 * photos. If photos on this page < `max_hits`, hide the next page button
 */
function tagPhotosPage(page, results, language, max_hits, add_emoji) {
  let content_divs = []
  const initial_max_hits = max_hits
  const starting_point = page * Env.paging.results_count
  // Working copy of photo set, shuffled
  let page_results = results["hits"].slice()
  page_results = Pandas.shuffleWithSeed(page_results, Env.paging.seed)
  page_results = page_results.slice(starting_point)
  const hit_count = page_results.length
  if (page == 0 && Env.paging.shown_pages > 1) {
    // Refresh, but show more than just the normal photo_count
    max_hits = Env.paging.shown_pages * max_hits
  }
  // Last page of content. Hide Next button
  if (hit_count <= max_hits)
    Env.paging.display_button = false
  else {
    // Limit to just photo_count of the output
    page_results = page_results.slice(0, max_hits)
    // Set callbacks for next button, and redraw footer
    Env.paging.callback.function = tagPhotosPage
    const pages_shown = initial_max_hits / Env.paging.results_count
    Env.paging.callback.arguments = [
      page + pages_shown,
      results,
      language,
      Env.paging.results_count,
      add_emoji
    ]
    Env.paging.callback.frame_id = "contentFrame"
  }
  // Redraw footer to update the paging button
  Page.footer.redraw("results")
  for (const photo of page_results) {
    if (photo["photo.index"] != "0")   // Not a null photo result
      content_divs = content_divs.concat(tagPhotoSingle(photo, language, add_emoji))
    else
      page_results.pop(page_results.indexOf(photo))
  }
  return {
    "output": content_divs
  }
}

/** 
 * Logic to determine which message to display inside the photo gallery of
 * tagged photos
 */
function tagPhotoMessage(results, hit_count) {
  let header = undefined
  if (hit_count == 0) {
    header =
      Show.emptyResult(Message.Text.no_subject_tag_result, Env.language)
  } else if ((results["parsed"] == "set_tag") ||
             (results["parsed"] == "set_tag_subject")) {
    const tag = results["tag"] != undefined ? results["tag"] : results["query"]
    const ctag = Language.tagPrimary(tag);
    header = Message.tag_subject(hit_count, results["subject"],
                                 Tags[ctag]["emoji"], 
                                 ctag, Env.language)
  } else if (results["parsed"] == "set_baby_subject") {
    const tag = results["tag"] != undefined ? results["tag"] : results["query"]
    const ctag = Language.tagPrimary(tag);
    header = Message.tag_subject(hit_count, results["subject"],
                                 Polyglots[ctag]["emoji"], 
                                 ctag, Env.language)
  } else if (results["parsed"] == "set_tag_intersection") {
    const tag = results["tag"] != undefined ? results["tag"] : results["query"];
    const emojis = tag.split(", ").map(tag => Tags[tag]["emoji"])
    header = Message.tag_combo(hit_count, emojis, Env.language)
  } else if (results["parsed"] == "set_tag_intersection_subject") {
    const tag = results["tag"] != undefined ? results["tag"] : results["query"]
    const emojis = tag.split(", ").map(tag => Tags[tag]["emoji"])
    header = Message.tag_combo(hit_count, emojis, Env.language)
  } else {
    header =
      Show.emptyResult(Message.Text.no_subject_tag_result, Env.language)
  }
  return header
}

/** Take a photo that matches a tag, and display it along with the tag emoji */
function tagPhotoSingle(result, language, add_emoji) {
  const content_divs = []
  const animal = Pandas.searchPandaId(result.id)[0]
  const info = Show.acquirePandaInfo(animal, language)
  const photo = result["photo"]
  const img_link = document.createElement('a')
  // Link to the original instagram media
  img_link.href = url.href(photo)
  img_link.target = "_blank"   // Open in new tab
  const img = document.createElement('img')
  img.setAttribute("loading", "lazy")
  // Set the photo, even if it takes an extra XHR
  url.process(img, photo)
  img_link.appendChild(img)
  const caption_link = document.createElement('a')
  // TODO: better handling of group photos
  if (animal._id.indexOf("media.") != 0)
    caption_link.href = `#panda/${animal._id}/photo/${result["photo.index"]}`
  const caption = document.createElement('h5')
  caption.className = "caption updateTagName"
  // TODO: handling of names of group pandas
  // TODO: support multiple tags
  if (animal._id.indexOf("media.") == 0) {
    caption.innerText =
      Pandas.groupMediaCaption(animal, `photo.${result["photo.index"]}`)
    var panda_route = animal["panda.tags"].split(", ").join("/")
    caption_link.href = `#group/${panda_route}`
  } else {
    caption.innerText = info.name
  }
  // Prefix caption with an emoji if we can get one
  const tag_lookup = Tags[result["photo.tags"][0]]
  if ((tag_lookup != undefined) && (add_emoji == true)) {
    const emoji = tag_lookup["emoji"]
    caption.innerText = emoji + "\xa0" + caption.innerText
  }
  caption_link.appendChild(caption)
  const container = document.createElement('div')
  container.className = "photoSample"
  container.appendChild(img_link)
  container.appendChild(caption_link)
  content_divs.push(container)
  return content_divs
}

/**
 * Make a gallery out of newly added photos, for the front page. Choose some
 * Choose some pandas from the list of updated photos at random.
 */
export function updatedNewPhotoCredits(language, photo_count=7) {
  const new_photos_div = document.createElement('div')
  const message = Message.new_photos(language)
  new_photos_div.appendChild(message)
  // Build a set of photos in the desired sort order: zoos, zoo(pandas),
  // new contributors, and finally new photos.
  const display_photos = updatedPhotoOrdering(language, photo_count)
  for (const item of display_photos) {
    const photo = item.photo
    const img_link = document.createElement('a')
    // Link to the original instagram media
    img_link.href = url.href(photo)
    img_link.target = "_blank"   // Open in new tab
    const img = document.createElement('img')
    img.setAttribute("loading", "lazy")
    // Set the photo, even if it takes an extra XHR
    url.process(img, photo)
    img_link.appendChild(img)
    const caption_link = document.createElement('a')
    // TODO: better handling of group photos
    if (item.id.indexOf("media.") != 0)
      caption_link.href = `#panda/${item.id}/photo/${item.index}`
    const caption = document.createElement('h5')
    caption.className = "caption updateName"
    // Color any zoo-related animals in the summary info
    if ("classes" in item)
      for (let caption_class of item.classes)
        caption.classList.add(caption_class)
    const animal = Pandas.searchPandaId(item.id)[0]
    let updateName = undefined;
    if (item.id.indexOf("media.") == 0) {
      updateName = Pandas.groupMediaCaption(animal, `photo.${item.index}`)
      const panda_route = animal["panda.tags"].split(", ").join("/");
      caption_link.href = `#group/${panda_route}`
  
    } else {
      const info = Show.acquirePandaInfo(animal, Env.language)
      updateName = info.name
    }
    if ("name_icon" in item)
      updateName = `${item.name_icon} ${updateName}`
    caption.innerText = updateName
    const author = document.createElement('h5')
    // Not separate links like the front page header credits
    author.className = "caption updateAuthorCredit"
    const author_span = document.createElement('span')
    if ("credit_icon" in item) {
      author_span.innerText = item.credit_icon + "\xa0" + item.credit
      caption.classList.add("newContributor")
    }
    else
      author_span.innerText = Emoji.camera + "\xa0" + item.credit
    author.appendChild(author_span)
    caption_link.appendChild(caption)
    caption_link.appendChild(author)
    const container = document.createElement('div')
    container.className = "photoSample"
    container.appendChild(img_link)
    container.appendChild(caption_link)
    new_photos_div.appendChild(container)
  }
  return new_photos_div
}

/** 
 * Enforce the photo ordering for photos in the updates list, and select not
 * the complete set of updates/pandas/zoos, but just a single photo for each.
 */
function updatedPhotoOrdering(language, photo_count) {
  // New zoo photos. Include only if there are current pandas at this zoo
  // that have at least one photo. Take no more zoo photos than we have
  // budgeted to show in this section
  const zoo_locators = P.db["_updates"].entities
    .filter(locator => locator.indexOf("zoo.") == 0);
  const zoo_photos = Pandas.unique(Pandas.locatorsToPhotos(zoo_locators), "id")
    .filter(function(photo) {
      const pandas = Pandas.searchPandaZoo(photo.id)
        .filter(panda => "photo.1" in panda);
      return pandas.length > 0
    }).filter(function(photo) {
      return (!Object.keys(Defaults.authors).includes(photo.credit))
    })
  let zoo_chosen = Pandas.randomChoice(zoo_photos, photo_count)
  zoo_chosen = Pandas.sortPhotosByName(zoo_chosen, `${language}.name`)
  // Photos from new contributors just for pandas, not for zoos
  const author_locators = P.db["_updates"].authors
  const author_photos_all = Pandas.locatorsToPhotos(author_locators)
    .filter(function(photo) {
      return (!Object.keys(Defaults.authors).includes(photo.credit))
    })
  const author_photos = Pandas.unique(author_photos_all, "id")
  let author_chosen = author_photos.slice()
  author_chosen = author_chosen.filter(photo => photo.type != "zoo")
  author_chosen = Pandas.randomChoice(author_chosen, photo_count)
  if (author_chosen.length > 3) {
    // If too many new people contributing photos, reduce down to one per contributor
    author_chosen = Pandas.unique(author_chosen, "credit")
  }
  author_chosen = Pandas.sortPhotosByName(author_chosen, `${language}.name`)
  // Photos of newly introduced pandas
  const new_panda_locators = P.db["_updates"].entities
    .filter(locator => locator.indexOf("panda.") == 0)
    .filter(locator => (!author_locators.includes(locator)))
  const new_panda_photos = 
    Pandas.unique(Pandas.locatorsToPhotos(new_panda_locators), "id")
      .filter(function(photo) {
        return (!Object.keys(Defaults.authors).includes(photo.credit))
      })
  let new_panda_chosen = Pandas.randomChoice(new_panda_photos, photo_count)
  new_panda_chosen = Pandas.sortPhotosByName(new_panda_chosen, `${language}.name`)
  // New pandas, or new panda group photos
  const panda_locators = P.db["_updates"].entities
    .filter(locator => (!zoo_locators.includes(locator)))
  const panda_photos = Pandas.unique(Pandas.locatorsToPhotos(panda_locators), "id")
  // Remaining new photos for exisitng pandas. If any photo locators also describe 
  // a new author/new entity, only display those in their own section. Filter them out here.
  const update_locators = P.db["_updates"].photos
    .filter(locator => (!P.db["_updates"].entities.includes(locator)))
    .filter(locator => (!P.db["_updates"].authors.includes(locator)))
    .filter(locator => (!locator.includes("zoo.")))
  let update_photos =
    Pandas.unique(Pandas.locatorsToPhotos(update_locators), "id")
      .filter(function(photo) {
        return (!Object.keys(Defaults.authors).includes(photo.credit))
      })
  // Now construct the list of photos. For each zoo in alphabetical order, find any
  // pandas in the panda list for that zoo, with priority to photos from new contributors.
  // Then display those pandas in alphabetical order. Once we're out of zoos and pandas,
  // display remaining new pandas from the update_photos list in alphabetical order.
  const output_photos = [];
  const all_zoo_pandas = [];
  const zoo_classes = ["one", "two", "three", "four"]
  let zoo_class_index = 0;
  for (const zoo_photo of zoo_chosen) {
    if (photo_count == 0) {
      return output_photos
    }
    // New author added, so make sure it gets the giftwrap
    if (author_photos_all.map(photo => photo.credit).includes(zoo_photo.credit)) {
      zoo_photo.credit_icon = Emoji.giftwrap   // new panda and author!
    }
    // Give it giftwrap if only one photo attributed to this author
    if (P.db._photo.credit[zoo_photo.credit] == 1) {
      zoo_photo.credit_icon = Emoji.giftwrap
    }
    const class_list = ["zoo", zoo_classes[zoo_class_index % zoo_classes.length]]
    zoo_photo.classes = class_list
    output_photos.push(zoo_photo)
    // Display updated photos for animals at this zoo first
    const zoo_panda_ids = Pandas.searchPandaZoo(zoo_photo.id).map(panda => panda["_id"])
    const zoo_pandas = author_photos.concat(panda_photos).concat(update_photos)
      .filter(panda => zoo_panda_ids.includes(panda.id))
      .filter(function(panda) {
        // If the commitdate of the animal isn't recent, it's not new and
        // shouldn't be listed in the new zoo info, or with a heart panel
        const currenttime = new Date()
        const commitdate = Pandas.searchPandaId(panda.id)[0].commitdate
        const ms_per_week = 1000 * 60 * 60 * 24 * 7;
        return (currenttime - commitdate > ms_per_week)
      });
    zoo_pandas = Pandas.unique(zoo_pandas, "id")
    zoo_pandas = Pandas.sortPhotosByName(zoo_pandas, `${language}.name`)
    for (const zoo_panda of zoo_pandas) {
      zoo_panda.name_icon = Emoji.profile   // heart_panel
      if (author_photos_all.map(photo => photo.credit).includes(zoo_panda.credit)) {
        zoo_panda.credit_icon = Emoji.giftwrap   // new panda and author!
      }
      // Give it giftwrap if only one photo attributed to this author
      if (P.db._photo.credit[zoo_panda.credit] == 1) {
        zoo_panda.credit_icon = Emoji.giftwrap
      }
      zoo_panda.classes = class_list
      output_photos.push(zoo_panda)
      all_zoo_pandas.push(zoo_panda)
      photo_count = photo_count - 1
    }
    photo_count = photo_count - 1
    zoo_class_index = zoo_class_index + 1
  }
  for (const author_photo of author_chosen) {
    if (photo_count == 0) {
      return output_photos
    }
    const all_zoo_panda_ids = all_zoo_pandas.map(x => x.id)
    const author_photo_id = author_photo.id
    if (all_zoo_panda_ids.includes(author_photo_id)) {
      // Zoo pandas don't show in the new authors section
      continue
    }
    // New panda added, so make sure it gets the heart icon
    if ((panda_photos.map(panda => panda.id).includes(author_photo.id)) &&
        (!author_photo.id.includes("media"))) {
      author_photo.name_icon = Emoji.profile
    }
    author_photo.credit_icon = Emoji.giftwrap
    output_photos.push(author_photo)
    photo_count = photo_count - 1
  }
  for (const new_panda_photo of new_panda_chosen) {
    if (photo_count == 0) {
      return output_photos
    }
    const all_zoo_panda_ids = all_zoo_pandas.map(x => x.id)
    const new_panda_photo_id = new_panda_photo.id
    if (all_zoo_panda_ids.includes(new_panda_photo_id)) {
      // Zoo pandas don't show in the new authors section
      continue
    }
    // New panda added, so make sure it gets the heart icon
    new_panda_photo.name_icon = Emoji.profile
    output_photos.push(new_panda_photo)
    photo_count = photo_count - 1
  }
  // If the author or entity photos have animals represented in the other
  // update photos, remove them from the update photos to get a broader set of
  // animals shown.
  update_photos = update_photos.filter(photo => 
    (!author_photos.concat(panda_photos)
      .map(others => others["id"])
      .includes(photo["id"])))
  let update_chosen = Pandas.randomChoice(update_photos, photo_count)
  update_chosen = Pandas.sortPhotosByName(update_chosen, `${language}.name`)
  for (const update_photo of update_chosen) {
    if (photo_count == 0) {
      return output_photos
    }
    output_photos.push(update_photo)
    photo_count = photo_count - 1
  }
  // If somehow we didn't exhaust the entire possible set of photos already
  return output_photos
}

/** 
 * Take a zoo, and return the photo. Assumes that you have a match that matches
 * the username that was searched. Used for making reports of all the photos in
 * the website contributed by a single author.
 */
function zooPhotoCredits(zoo, credit, language) {
  const photos = []
  const photo_indexes = Pandas.photoGeneratorEntity
  for (const field_name of photo_indexes(zoo, 0)) {
    if (zoo[field_name + ".author"] == credit) {
      photos.push({
        "id": zoo["_id"],
        "image": zoo[field_name],
        "index": field_name,
        "type": "zoo"})
    }
  }
  return photos
}

function zooPhotoCreditSingle(item) {
  const photo = item.image
  const index = item.index.split(".")[1]
  const img_link = document.createElement('a')
  const id = item.id
  const entity = Pandas.searchZooId(id)[0]
  const info = Show.acquireZooInfo(entity, Env.language)
  // Link to the original instagram media
  img_link.href = url.href(photo)
  img_link.target = "_blank"   // Open in new tab
  const img = document.createElement('img')
  img.setAttribute("loading", "lazy")
  // Set the photo, even if it takes an extra XHR
  url.process(img, photo)
  img_link.appendChild(img)
  const caption_link = document.createElement('a')
  caption_link.href = `#zoo/${id}/photo/${index}`
  const caption = document.createElement('h5')
  caption.className = "caption zooName"
  caption.innerText = info.name
  caption_link.appendChild(caption)
  const container = document.createElement('div')
  container.className = "photoSample"
  container.appendChild(img_link)
  container.appendChild(caption_link)
  return container
}

export function pumpkin(language, photo_count=5) {
  const pumpkin_div  = document.createElement('div')
  const message = Message.trick_or_treat(language)
  pumpkin_div.appendChild(message)
  const animals_photos = Pandas.searchPandaAnyPhotoMedia()
  const photos =
    Pandas.searchPhotoTags(animals_photos, ["pumpkin", "portrait"], "intersect", "none")
  for (const photo of Pandas.randomChoice(photos, photo_count)) {
    const img_link = document.createElement('a')
    // Link to the original instagram media
    img_link.href = `#panda/${photo.id}/photo/${photo["photo.index"]}`
    const img = document.createElement('img')
    img.setAttribute("loading", "lazy")
    // Set the photo, even if it takes an extra XHR
    url.process(img, photo["photo"])
    img_link.appendChild(img)
    // Animal name
    const name_caption_link = document.createElement('a')
    name_caption_link.href = `#panda/${photo.id}/photo/${photo["photo.index"]}`
    const name_caption = document.createElement('h5')
    name_caption.className = "caption updateName halloweenMessage"
    const name_caption_span = document.createElement('span')
    const animal = Pandas.searchPandaId(photo.id)[0]
    let updateName = undefined
    if (photo.id.indexOf("media.") == 0) {
      updateName = Pandas.groupMediaCaption(animal, `photo.${photo["photo.index"]}`)
      const panda_route = animal["panda.tags"].split(", ").join("/")
      name_caption_link.href = `#group/${panda_route}`
    } else {
      const info = Show.acquirePandaInfo(animal, Env.language)
      updateName = info.name
    }
    name_caption_span.innerText = updateName
    name_caption.appendChild(name_caption_span)
    name_caption_link.appendChild(name_caption)
    // Link to the original instagram media
    const credit_caption_link = document.createElement('a')
    credit_caption_link.href = url.href(photo["photo"])
    credit_caption_link.target = "_blank"   // Open in new tab
    const credit_caption = document.createElement('h5')
    credit_caption.className = "caption updateAuthor halloweenMessage"
    const credit_caption_span = document.createElement('span')
    credit_caption_span.innerText = `${Emoji.camera} ${photo["photo.author"]}`
    // TODO: condenser
    credit_caption.appendChild(credit_caption_span)
    credit_caption_link.appendChild(credit_caption)
    const container = document.createElement('div')
    container.className = "photoSample quarterPage"
    container.appendChild(img_link)
    container.appendChild(name_caption_link)
    container.appendChild(credit_caption_link)
    pumpkin_div.appendChild(container)
  }
  return pumpkin_div
}

/**
 * Slightly more general than the pumpkin function, but doesn't take the
 * special message styles yet. Iterate on this until it can be a _front page
 * gallery_ generator for anything I might want.
 */
export function taglist(language, photo_count=5, taglist, message_function) {
  const div = document.createElement('div')
  const message = message_function(language)
  div.appendChild(message)
  const animals_photos = Pandas.searchPandaAnyPhotoMedia()
  const photos =
    Pandas.searchPhotoTags(animals_photos, taglist, "intersect", "none")
  for (const photo of Pandas.randomChoice(photos, photo_count)) {
    const img_link = document.createElement('a')
    // Link to the original instagram media
    img_link.href = `#panda/${photo.id}/photo/${photo["photo.index"]}`
    const img = document.createElement('img')
    img.setAttribute("loading", "lazy")
    // Set the photo, even if it takes an extra XHR
    url.process(img, photo["photo"])
    img_link.appendChild(img);
    // Animal name
    const name_caption_link = document.createElement('a')
    name_caption_link.href = `#panda/${photo.id}/photo/${photo["photo.index"]}`
    const name_caption = document.createElement('h5')
    name_caption.className = "caption updateName"
    const name_caption_span = document.createElement('span')
    const animal = Pandas.searchPandaId(photo.id)[0]
    let updateName = undefined;
    if (photo.id.indexOf("media.") == 0) {
      updateName = Pandas.groupMediaCaption(animal, `photo.${photo["photo.index"]}`)
      const panda_route = animal["panda.tags"].split(", ").join("/")
      name_caption_link.href = `#group/${panda_route}`
    } else {
      const info = Show.acquirePandaInfo(animal, Env.language)
      updateName = info.name
    }
    name_caption_span.innerText = updateName
    name_caption.appendChild(name_caption_span)
    name_caption_link.appendChild(name_caption)
    // Link to the original instagram media
    const credit_caption_link = document.createElement('a')
    credit_caption_link.href = url.href(photo["photo"])
    credit_caption_link.target = "_blank"   // Open in new tab
    const credit_caption = document.createElement('h5')    
    credit_caption.className = "caption updateAuthor"
    const credit_caption_span = document.createElement('span')
    credit_caption_span.innerText = `${Emoji.camera} ${photo["photo.author"]}`
    // TODO: condenser
    credit_caption.appendChild(credit_caption_span)
    credit_caption_link.appendChild(credit_caption)
    const container = document.createElement('div')
    container.className = "photoSample quarterPage"
    container.appendChild(img_link)
    container.appendChild(name_caption_link)
    container.appendChild(credit_caption_link)
    div.appendChild(container)
  }
  return div
}

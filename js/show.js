import Env from './environment.js'
import * as Gallery from './gallery.js'
import * as Geo from './geolocate.js'
import { showQRCode } from './html5-qrcode.js'
import * as Language from './language.js'
import Layout from './layout.js'
import { Defaults, Emoji, Fallback, Flags, Gui } from './lookup.js'
import * as Message from './message.js'
import * as Options from './options.js'
import * as Page from './page.js'
import P, * as Pandas from './pandas.js'
import * as Query from './query.js'

/** 
 * In the old world this was all code for rendering page components in
 * redpandafinder. We need to move this code to JSX components so that it
 * composes in a much cleaner way.
 */

/**
 * Given an animal and a language, obtain the immediate information that would
 * be displayed in an information card about the panda, including its zoo and
 * its relatives.
 */
export function acquirePandaInfo(animal, language) {
  const chosen_index = (Env.specific_photo == undefined)
    ? "random"
    : Env.specific_photo
  const picture = Pandas.profilePhoto(animal, chosen_index, "animal")
  let bundle = {
            "age": Pandas.age(animal, language),
       "birthday": Pandas.birthday(animal, language),
     "birthplace": Pandas.myZoo(animal, "birthplace"),
       "children": Pandas.searchPandaChildren(animal["_id"]),
          "death": Pandas.date(animal, "death", language),
            "dad": Pandas.searchPandaDad(animal["_id"]),
         "gender": Pandas.gender(animal, language),
       "get_name": language + ".name",
             "id": animal["_id"],
       "language": language,
 "language_order": Pandas.language_order(animal),
         "litter": Pandas.searchLitter(animal["_id"]),
            "mom": Pandas.searchPandaMom(animal["_id"]),
           "name": Pandas.myName(animal, language),
     "othernames": Pandas.othernames(animal, language),
          "photo": picture['photo'],
   "photo_credit": picture['photo.author'],
    "photo_index": picture['photo.index'],
     "photo_link": picture['photo.link'],
 "photo_manifest": Pandas.photoManifest(animal),
 "search_context": animal["search_context"],
       "siblings": Pandas.searchNonLitterSiblings(animal["_id"]),
        "species": Pandas.species(animal["_id"]),
           "wild": Pandas.myWild(animal, "wild"),
            "zoo": Pandas.myZoo(animal, "zoo")
  }
  bundle = Language.fallbackInfo(bundle, animal)   // Any defaults here?
  // HACK: revert search context
  animal["search_context"] = undefined
  return bundle
}

/** Given an animal, return an array of location info translated correctly. */
function acquireLocationList(animal, language) {
  const history = []
  const raw_locations = Pandas.locationList(animal)
  for (const location of raw_locations) {
    const bundle = getZooBundle(location, language)
    history.push(bundle)
  }
  return history
}

function getZooBundle(location, language) {
  const zoos = Pandas.searchZooId(location["zoo"])
  if (zoos.length === 0) {
    return getUnknownZooBundle(location, language)
  }
  if (zoos.length > 0) {
    const zoo = Language.fallbackEntity(zoos[0])   // Do language fallback strings
    return {
        "end_date": Pandas.formatDate(location["end_date"], language),
              "id": Pandas.zooField(zoo, "_id"),
  "language_order": Pandas.language_order(zoo),
        "location": Pandas.zooField(zoo, language + ".location"),
            "name": Pandas.zooField(zoo, language + ".name"),
      "start_date": Pandas.formatDate(location["start_date"], language)
    }
  }
}

function getUnknownZooBundle(location, language) {
  return {
    "end_date": Pandas.formatDate(location["end_date"], language),
    "id": "0",
    "language_order": [],
    "start_date": Pandas.formatDate(location["start_date"], language)
  }
}

/**
 * Given a zoo, return an address, location, link to a website, and information
 * about the number of pandas (living) that are at the zoo
 */
export function acquireZooInfo(zoo, language) {
  const animals = Pandas.searchPandaZooCurrent(zoo["_id"])
  const chosen_index = (Env.specific_photo == undefined)
    ? "random"
    : Env.specific_photo
  const picture = Pandas.profilePhoto(zoo, chosen_index, "zoo")
  const recorded = Pandas.searchPandaZooBornLived(zoo["_id"])
  let bundle = {
       "animals": animals,
       "address": Pandas.zooField(zoo, language + ".address"),
  "animal_count": animals.length,
        "closed": Pandas.zooField(zoo, "closed"),
      "get_name": language + ".name",
            "id": zoo["_id"],
      "language": language,
"language_order": Pandas.language_order(zoo),
      "location": Pandas.zooField(zoo, language + ".location"),
           "map": Pandas.zooField(zoo, "map"),
          "name": Pandas.zooField(zoo, language + ".name"),
         "photo": picture['photo'],
  "photo_credit": picture['photo.author'],
   "photo_index": picture['photo.index'],
    "photo_link": picture['photo.link'],
      "recorded": recorded,
"recorded_count": recorded.length,
       "website": Pandas.zooField(zoo, "website")
  }
  bundle = Language.fallbackInfo(bundle, zoo)   // Any defaults here?
  return bundle
}

/**
 * Construct an animal link as per parameters. Options include whether to do a
 * mom/dad/boy/girl icon, or whether to do a link within the page, versus a
 * page wipe and redisplay. Default link text requires a language translation.
 * Examples:
 * 
 *    `https://domain/index.html#panda/Lychee`
 *    `https://domain/index.html#panda/4`
 * 
 * Animal links now use Unicode non-breaking spaces between the gender icon and
 * the name.
 */
function animalLink(animal, link_text, language, options) {
  // Don't print content if the input id is zero. If these are
  // fill-in links for moms or dads, use the Aladdin Sane icons :)
  if (animal['_id'] == Defaults.animal['_id']) {
    let alien = Emoji.alien
    if (options.indexOf("mom_icon") != -1)
      alien = Emoji.star_mom
    if (options.indexOf("dad_icon") != -1)
      alien = Emoji.star_dad
    return emptyLink(alien + "\xa0" + link_text)
  }
  // Set up values for other functions working properly
  // Gender search requires doing a table search by language.
  const gender = Pandas.gender(animal, language)
  const a = document.createElement('a')
  a.className = 'geneaologyListName'
  // Put the name itself in a span, in case we want to squeeze it width-wise
  const name_span = document.createElement('span')
  const inner_text = link_text
  let gender_text = ""
  let trailing_text = ""
  // Option to display gender face
  if (options.includes("child_icon"))
    gender_text = childIcon(gender) + "\xa0"
  // Moms and dads have older faces
  if (options.includes("mom_icon"))
    gender_text = Emoji.mother + "\xa0"
  if (options.includes("dad_icon"))
    gender_text = Emoji.father + "\xa0"
  // Multiple possible moms or dads?
  if (options.includes("question_icon"))
    gender_text = gender_text.replace("\xa0", "") + Emoji.question + "\xa0"
  // Half siblings indicator
  if (options.indexOf("half_icon") != -1)
    trailing_text = trailing_text + "\u200A" + '½'
  if ((options.indexOf("live_icon") != -1) && ("death" in animal)) {
    a.classList.add("passedAway")
    trailing_text = trailing_text + "\u200A" + Emoji.died
  }
  name_span.innerText = inner_text
  a.append(gender_text)
  a.appendChild(name_span)
  a.append(trailing_text)
  if (options.indexOf("in_link") != -1) {
    // in_link: that finds a location on the displayed data
    a.href = `#panda_${animal['_id']}`
  } else {
    // go_link: creates a new results frame based on desired data
    a.href = `#panda/${animal['_id']}`
    // Force page to scroll to the top after a reload event
    a.addEventListener("click", topButton.action)
  }
  return a
}

/**
 * See how many other panda photos this user has posted.  Links to the credit
 * page for a particular author, with all of their contributed photos
 */
function appleLink(info, container_element) {
  const other_photos = document.createElement(container_element)
  const credit_count_link = document.createElement('a')
  credit_count_link.id = `${info.id}/counts/${info.photo_index}`   // Carousel
  credit_count_link.href = `#credit/${info.photo_credit}`
  if (Object.keys(Defaults.authors).includes(info.photo_credit)) {
    // Anonymous/uncredited photos get no apple link
    credit_count_link.removeAttribute("href")
    credit_count_link.innerText = ""
  } else {
    // Otherwise make an apple link with # of photos contributed
    const apple_count = parseInt(P.db._photo.credit[info.photo_credit])
    credit_count_link.innerText = `${Emoji.gift} ${apple_count}`
    if (apple_count >= 1000)
      credit_count_link.innerText = `${Emoji.megagift}  ${apple_count}`
  }
  other_photos.appendChild(credit_count_link)
  return other_photos
}

/**
 * Display the birthday and either age/date of death for an animal. Returns two
 * text nodes that can be inserted into other elements
 */
function birthday(info, language) {
  const birthday = `${Emoji.born} ${info.birthday}`
  // If still alive, print their current age
  let parentheses = undefined
  if (info.death == Defaults.unknown[language])
    parentheses = `(${info.age})`
  else
    parentheses = `${Emoji.died} ${info.death}`
  return [birthday, parentheses]
}

/**
 * Male and female icons next to pandas used for panda links. This uses
 * unlocalized m/f/unknown gender values
 */
function childIcon(gender) {
  if (Object.values(Defaults.gender.Male).includes(gender))
    return Emoji.boy
  else if (Object.values(Defaults.gender.Female).includes(gender))
    return Emoji.girl
  else
    return Emoji.baby
}

/** Display a link to a photo credit on Instagram or elsewhere */
function creditLink(info, container_element) {
  const credit_link = document.createElement('a')
  credit_link.id = `${info.id}/author/${info.photo_index}`   // Carousel
  credit_link.target = "_blank"   // Open in new tab
  credit_link.href = Pandas.authorLink(info.photo_credit, info.photo_link)
  if (Object.keys(Defaults.authors).includes(info.photo_credit)) {
    // Uncredited / anonymous photos get no href, and are not links
    credit_link.innerText =
      `${Emoji.camera} ${Defaults.authors[info.photo_credit][Env.language]}`
    credit_link.removeAttribute("href")
  } else if (info.photo_credit != undefined) {
    // Attribute photo to someone
    credit_link.innerText = `${Emoji.camera} ${info.photo_credit}`
  } else {
    // Ask users to submit through a Google Form
    credit_link.innerText =
      `${Emoji.camera} ${Gui.contribute[Env.language]}` + "\xa0"
    credit_link.href = Gui.contribute_link[Env.language]
  }
  const container = document.createElement(container_element)
  container.appendChild(credit_link)
  return container
}

/** If link is to an undefined item or the zero ID, return a spacer */
function emptyLink(output_text) {
  const a = document.createElement('a')
  const span = document.createElement('span')
  span.innerText = output_text
  a.appendChild(span)
  a.href = '#not_sure_yet'   // TODO: or just remove the href?
  return a
}

/**
 * If the panda search result returned nothing, output a card with special
 * _no results_ formatting.
 */
export function emptyResult(chosen_message=Message.Text.no_result, language) {
  const message = document.createElement('div')
  message.className = 'overlay'
  message.innerText = chosen_message[language]
  const image = document.createElement('img')
  image.src = "images/no-panda.jpg"
  const result = document.createElement('div')
  result.className = 'emptyResult'
  result.appendChild(image)
  result.appendChild(message)
  return result
}

/** Used to fade the dogear menu for selecting photos */
export function fade(el) {
  const op = 1  // initial opacity
  if (el.style.display == "none" || el.style.display == "")
    el.style.display = "block"
  else {
    el.style.opacity = op  // Reset the opacity and let exisitng fade just run
    return
  }
  const timer = setInterval(function () {
    if (op <= 0.05) {
      clearInterval(timer)
      el.style.display = 'none'
    }
    el.style.opacity = op
    el.style.filter = `alpha(opacity=${op * 100})`
    op -= 0.10
  }, 40)
}

/** 
 * Read from `info.othernames`, and if it's not a language default, add an
 * alternate add an alternate spelling to the name information.
 */
function furigana(name, othernames) {
  if (othernames == Defaults.animal["ja.othernames"])
    return false
  othernames = othernames.split(", ")   // Guarantee array
  othernames = othernames.filter(function(option) {
    if (Language.editDistance(name, option) > 1) {
      return option
    }
  })
  if (othernames.length == 0)
    return false
  const chosen = othernames[0]
  const p = document.createElement('p')
  p.className = "furigana"
  p.innerText = `(${chosen})`
  return p
}

/** 
 * Use localized alt-text, and display SVG gender information so that padding
 * can work consistently on mobile.
 */
export function gender(info, frame_class) {
  const language = info.language
  const img = document.createElement('img')
  if (info.gender == Defaults.gender.Male[language])
    img.src = "images/male.svg"
  else if (info.gender == Defaults.gender.Female[language])
    img.src = "images/female.svg"
  else
    img.src = "images/unknown.svg"
  img.alt = info.gender
  const gender = document.createElement('div')
  gender.className = "gender"
  if (frame_class != undefined)
    gender.classList.add(frame_class)
  gender.appendChild(img)
  return gender
}

/** 
 * Alternate gender function for if you only have an animal value and not an
 * info block value available.
 */
export function genderAnimal(animal, language, frame_class) {
  const gender = document.createElement('div')
  gender.className = frame_class
  const img = document.createElement('img')
  if (animal["gender"] == "Male") {
    img.src = "images/male.svg"
    img.alt = Defaults.gender.Male[language]
  } else if (animal["gender"] == "Female") {
    img.src = "images/female.svg"
    img.alt = Defaults.gender.Male[language]
  } else {
    img.src = "images/unknown.svg"
    img.alt = Defaults.unknown[language]
  }
  gender.appendChild(img)
  return gender
}

/** Create a link to a location in Google Maps */
function locationLink(zoo, language, mode="icons_only") {
  const languageLocation = `${language}.location`
  // Don't print content if the input id is zero
  if (zoo['_id'] == Defaults.zoo['_id'])
    return Defaults.zoo[languageLocation]
  let link_text = Emoji.map
  if (mode != "icons_only")
    link_text += ` ${zoo[languageLocation]}`
  if (zoo.flag) {
    link_text += ` ${Flags[zoo.flag]}`
  }
  const a = document.createElement('a')
  if (zoo['map']) {
    a.href = zoo['map']
  }
  a.innerText = link_text
  a.target = "_blank"   // Open in new tab
  // rel="noopener noreferrer" is recommended for security reasons
  a.rel = "noopener noreferrer"
  return a
}

/**
 * Give a list of nicknames in all languages, in priority of the current
 * animal's language order
 */
function nicknames(animal) {
  const container = document.createElement('ul')
  container.className = "nicknameList"
  for (let language of animal["language.order"].split(", ")) {
    const nicknames = animal[language + ".nicknames"]
    if (nicknames == undefined)
      continue
    const nicknames_list = []
    const nicknames_li = document.createElement('li')
    nicknames_li.innerText =
      `${Gui.language[Env.language][language]}: `
    // Nicknames for this animal
    for (let name of nicknames.split(", "))
      nicknames_list.push(name)
    // Did we have any extra names? If so, add them
    if (nicknames_list.length > 0) {
      nicknames_li.innerText += nicknames_list.join(", ")
      container.appendChild(nicknames_li)
    }    
  }
  return container
}

/**
 * Give a list of othernames in all languages, in priority of the current
 * animal's language order. Include their regular names in other languages,
 * but not the current language
 */
function othernames(animal, current_language) {
  const container = document.createElement('ul')
  container.className = "nicknameList"
  // Cycle through other languages to get their names and other
  // spellings for their names
  for (let language of animal["language.order"].split(", ")) {
    const othername_list = []
    const othername_li = document.createElement('li')
    othername_li.innerText =
      `${Gui.language[Env.language][language]}: `
    // Animal's name in other languages
    if (language != current_language) {
      const name = animal[`${language}.name`]
      if (name != undefined)
        othername_list.push(name)
    }
    // Othernames / spellings for this animal
    const othernames = animal[`${language}.othernames`]
    if (othernames != undefined) {
      for (let name of othernames.split(", "))
        othername_list.push(name)
    }
    // Old names that were previously valid for this animal
    const oldnames = animal[`${language}.oldnames`]
    if (oldnames != undefined) {
      for (let name of oldnames.split(", "))
        othername_list.push(name)
    }
    // Did we have any extra names? If so, add them
    if (othername_list.length > 0) {
      othername_li.innerText += othername_list.join(", ")
      container.appendChild(othername_li)
    }
  }
  return container
}

/** Make a safe URL (no reflection issues) */
function qrcodeHashSafe(short=false) {
  const in_hash = window.location.hash
  let out_hash = undefined
  const parts = in_hash.split("/")
  let profile = undefined
  let panda_id = undefined
  let sub_hash = undefined
  let photo_id = undefined
  if (parts.length >= 4) {
    profile = parts[0]
    panda_id = parts[1]
    sub_hash = "photo"
    photo_id = parts[3]
    if ((parseInt(panda_id) <= 0) || 
        (parseInt(panda_id) > parseInt(P.db["_totals"].pandas))) {
      panda_id = '1'
    }
    if ((parseInt(photo_id) <= 0) ||
        (parseInt(photo_id) > parseInt(P.db["_photo"].entity_max))) {
      photo_id = '1'
    }
    if (short == false)
      out_hash = `${profile}/${panda_id}/${sub_hash}/${photo_id}`
    else
      out_hash = `${profile}/${panda_id}`
  }
  else if ((parts.length <= 3) && (parts.length >= 2)) {
    profile = parts[0]
    panda_id = parts[1]
    sub_hash = ''
    photo_id = ''
    if ((parseInt(panda_id) <= 0) || 
        (parseInt(panda_id) > parseInt(P.db["_totals"].pandas))) {
      panda_id = '1'
    }
    out_hash = `${profile}/${panda_id}`
  } else {
    out_hash = ''
  }
  return out_hash
}

/** 
 * Construct a QR code out of the current page URL. When clicked, it copies a
 * link to the URL the QRCode is representing.
 */
function qrcodeImage(animal_index=null, photo_index=null) {
  // Shorten the hash if there's a photo index included
  const safe_hash = qrcodeHashSafe(photo_index == null)
  let safe_url = `https://${window.location.host}/${safe_hash}`
  if ((photo_index != null) && (animal_index != null)) {
    safe_url =
      `https://${window.location.host}/#profile/${animal_index}/photo/${photo_index}`
  }
  const img = showQRCode(safe_url)
  const qrcode = document.createElement('div')
  qrcode.className = "qrcodeFrame"
  const button = document.createElement('button')
  const tld = document.createElement('span')
  tld.className = "qrcodeText"
  tld.innerText = `https://${window.location.host}/`
  button.appendChild(tld)
  const qrimg = document.createElement('img')
  qrimg.id = "qrcodeUri"
  qrimg.src = img.src
  button.appendChild(qrimg)
  qrcode.appendChild(button)
  // Click qrcode and copy its url
  button.addEventListener("click", function(event) {
    event.preventDefault()
    const text_class = "qrcodeText"
    // Join the text blocks above and below the QR Code image
    const qrcode_url = Array.from(document.getElementsByClassName(text_class))
      .map(span => span.innerText)
      .join("")
    // Copy it into the clipboard
    navigator.clipboard.writeText(qrcode_url)
    // Make the Copied toast appear
    fade(document.getElementById("copyToast"))
  })
  const qrHashLink = document.createElement('span')
  qrHashLink.className = "qrcodeText"
  if ((photo_index == null) && (animal_index == null))
    qrHashLink.innerText = safe_hash
  else
    qrHashLink.innerText = `#profile/${animal_index}/photo/${photo_index}`
  button.appendChild(qrHashLink)
  const copy_notice = document.createElement('span')
  copy_notice.className = "notifier condensed"
  copy_notice.id = "copyToast"
  copy_notice.innerText = Gui.copied[Env.language]
  qrcode.appendChild(copy_notice)
  return qrcode
}

/** 
 * When the carousel image loads, swap the qrcode url so that it includes info
 * about the photo that's currently being displayed. This means that the QRCode
 * and the displayed page don't exactly match the `#hash_code`, but the
 * contents will be guaranteed consistent. I didn't want back/forward browser
 * buttons to ever modify the gallery photos themselves, because for the result
 * pages with multiple galleries there is no sensible way to support this.
 */
function qrcodeSwap() {
  const old_qrcode = document.getElementsByClassName('qrcodeFrame')[0]
  if (old_qrcode == undefined)
    return
  const gallery = document.getElementsByClassName('pandaPhoto')[0]
  const gallery_id = gallery.childNodes[0].id
  const animal_id = gallery_id.split("/photo/")[0].split("_")[1]
  const photo_index = gallery_id.split("/photo/").pop()
  const new_qrcode = qrcodeImage(animal_id, photo_index)
  old_qrcode.replaceWith(new_qrcode)
}

/**
 * Guarantee after calling this function that a menu, or a footer, exist in the
 * page where they should be.
 */
function update(new_contents, container=undefined, container_class, container_id) {
  if (container == undefined) {
    container = document.createElement('div')
    container.appendChild(new_contents)
  } else {
    const old_contents = container.childNodes[0]
    container.replaceChild(new_contents, old_contents)
  }
  // Regardless, set the corret container class
  container.className = container_class
  container.id = container_id
  return container
}

/** 
 * Construct a zoo divider, for when you search a place name and get multiple
 * results worth of zoos
 */
export function zooDivider(mode="bear-bamboo") {
  const divider = document.createElement('div')
  const modes = ["bamboo", "bear", "bear-bamboo", "fruit"]
  if (mode == "random")
    mode = Pandas.randomChoice(modes, 1)
  divider.className = 'zooDivider'
  if (mode == "bamboo")
    divider.innerText = '- 🎍 — 🎋 — 🎍 -'
  else if (mode == "bear")
    divider.innerText = '🌿 🐯 🐻 🌿'
  else if (mode == "bear-bamboo")
    divider.innerText = '🌿 🎍 🐯🐻 🎍 🌿'
  else if (mode == "fruit")
    divider.innerText = '🌿 🍎 🍇 🍎 🌿'
  else
    divider.innerText = '🌿 🍎 🍇 🍎 🌿'
  return divider
}


/** 
 * Construct a zoo link as per design docs. Example:
 *    `https://domain/index.html#zoo/1`
 */
function zooLink(zoo, link_text, language, icon=undefined) {
  // Don't print content if the input id is zero
  if (zoo['_id'] == Defaults.zoo['_id'])
    return emptyLink(Defaults.zoo[`${language}.name`])
  const a = document.createElement('a')
  let inner_text = link_text
  // Options processing
  if (icon != undefined)
    inner_text = `${icon} ${inner_text}`
  a.innerText = inner_text
  a.href = `#zoo/${zoo['_id']}`
  // Force page to scroll to the top after a reload event
  a.addEventListener("click", topButton.action)
  return a
}

/** Display the name of a zoo in the "title bar" */
function zooTitle(info) {
  const name_div = document.createElement('div')
  name_div.className = 'zooName'
  // No furigana for zoo names
  name_div.innerText = info.name
  const title_div = document.createElement('div')
  title_div.className = "zooTitle"
  title_div.appendChild(name_div)
  return title_div
}

/** Show functions related to buttons and their event handlers */
// Was show.button.render

/** Render a menu button for redpandafinder, with desired classes and ids */
function renderButton(id, button_icon, button_text, class_name, icon_class="") {
  const button = document.createElement('button')
  button.className = "menu"
  button.classList.add(class_name)
  button.id = id
  const content = document.createElement('div')
  content.className = "buttonContent"
  const icon_div = document.createElement('div')
  icon_div.className = 'buttonIcon'
  if (icon_class)
    icon_div.classList.add(icon_class)
  icon_div.innerText = button_icon
  content.appendChild(icon_div)
  if (button_text != undefined) {
    const text_div = document.createElement('div')
    text_div.className = 'buttonText'
    text_div.innerText = button_text
    content.appendChild(text_div)
  }
  button.appendChild(content)
  return button
}

/** 
 * When the _about_ button is clicked, we either show the `#about` page, or
 * return to the last shown results or the `#home` page. If the language menu
 * is open, we hide it.
 */
const aboutButton = {
  /** Toggle the visibility of the `#about` page */
  action: function() {
    Page.about.routing()
    languageButton.hide()
  },
  /** Draw the _about_ button */
  render: function(class_name="results") {
    const button = renderButton(
      "aboutButton",
      Emoji.bamboo,
      Gui.about[Env.language],
      class_name)
    button.addEventListener("click", this.action)
    return button
  }
}

/** The language menu's flag buttons change the current `Env.language` */
const flagButton = {
  action: function(button) {
    const language = button.id.replace("LanguageFlag", "")
    const options = Defaults.languages
    const choice = options.indexOf(language)
    // Don't redraw unless the language exists, or has changed from the current
    // display language.
    if ((choice > -1) && (language != Env.language)) {
      Env.language = language
      Language.update()
      // Redraw the nearby page if necessary
      if (Env.output_mode == "nearby")
        Geo.getNaiveLocation()
      Page.redraw(Env.current)
    }
    // If language menu is open, hide it
    languageButton.hide()
  },
  /** Draw one of the language-select flag buttons */
  render: function(language, class_color) {
    const button = document.createElement('button')
    button.classList.add("menu")
    button.classList.add("flag")
    button.classList.add(class_color)
    button.id = language + "LanguageFlag"
    const content = document.createElement('div')
    content.className = "buttonContent"
    const icon = document.createElement('div')
    icon.className = "buttonIcon"
    icon.innerText = Gui.flag[language]
    content.appendChild(icon)
    button.appendChild(content)
    button.addEventListener("click", (e) => this.action(e.target))
    return button
  }
}

/** 
 * Return to the `#home` landing page when clicked, and re-render all the
 * randomized content displayed
 */
const homeButton = {
  action: function() {
    Env.lastSearch = "#home"
    Page.home.render()
    window.location = "#home"
    // If language menu is open, hide it
    languageButton.hide()
    Env.current = Page.home.render
    // If bottom search bar is showing, remove it
    searchBar.remove("bottomSearch")
    window.scrollTo(0, 0)   // Go to the top of the page
  },
  /** Draw the _home_ button that takes you to the landing page */
  render: function(class_name="results") {
    const button = renderButton(
      "homeButton",
      Emoji.home,
      Gui.home[Env.language],
      class_name)
    button.addEventListener("click", this.action)
    return button
  }
}

/** 
 * The language button has two modes. When you left-click, it makes the flag
 * buttons show up above the top menu, and clicking a flag changes which
 * `Env.language` redpandafinder is drawn in.
 * 
 * When you right-click the language button, it immediately changes the
 * `Env.language` to the next language in `Defaults.languages`.
 */
const languageButton = {
  /** Make the flag menu buttons appear above the top menu */
  action: function() {
    const language_menu = document.getElementsByClassName("languageMenu")[0]
    if ((language_menu.style.display == "none") ||
        (language_menu.style.display == "")) {
      language_menu.style.display = "table"
    } else {
      language_menu.style.display = "none"
    }
  },
  /** Immediately change the displayed language to the next one in the list */
  altAction: function(e) {
    e.preventDefault()
    const language = Env.language
    const options = Defaults.languages
    const count = options.length
    const choice = (options.indexOf(language) + 1) % count
    Env.language = options[choice]
    Language.update()
    // Redraw the nearby page if necessary
    if (Env.output_mode == "nearby")
      Geo.getNaiveLocation()
    Page.redraw(Env.current)
    // If language menu is open, hide it
    languageButton.hide()
  },
  hide: function() {
    const language_menu = document.querySelector(".languageMenu")
    language_menu.style.display = "none"
  },
  render: function(class_name="results") {
    const button = renderButton(
      "languageButton",
      Gui.flag[Env.language],
      Gui.language[Env.language][Env.language],
      class_name)
    button.addEventListener("click", this.action)
    button.addEventListener("contextmenu", this.altAction)
    return button
  }
}

/** Navigate to the _links_ section of redpandafinder */
const linksButton = {
  action: function() {
    Page.links.routing()
    // If language menu is open, hide it
    languageButton.hide()
  },
  render: function(class_name="results") {
    const button = renderButton(
      "linksButton",
      Emoji.link,
      Gui.links[Env.language],
      class_name)
    button.addEventListener("click", this.action)
    return button
  }
}

/**
 * The media button shows group photos with the given animal. If right-clicked,
 * it shows group photos of a random animal, like a hidden _random_ button.
 */
const mediaButton = {
  action: function(panda_id) {
    Page.media.render()
    window.location = `#media/${panda_id}`
    // If language menu is open, hide it
    languageButton.hide()
    Env.current = Page.media.render
  },
  altAction: function(e) {
    e.preventDefault()   // Prevent normal right-click menu from firing
    Env.current = Page.media.render
    const pandaIds = 
      P.db.vertices.filter(entity => entity._id.indexOf("media") == 0)
                   .filter(entity => entity["photo.1"] != undefined)
                   .map(entity => entity["panda.tags"])
                   .map(tag_ids => tag_ids.split(", "))
    pandaIds = Pandas.distinct(Parse.tree.flatten(pandaIds))
    window.location =
      `#media/${pandaIds[Math.floor(Math.random() * pandaIds.length)]}`
    // If language menu is open, hide it
    languageButton.hide()
    window.scrollTo(0, 0)   // Go to the top of the page
  },
  render: function(class_name="profile", panda_id) {
    const button = renderButton(
      "mediaButton",
      Emoji.media,
      Gui.media[Env.language],
      class_name)
    button.addEventListener("click", () => this.action(panda.id))
    button.addEventListener("contextmenu", this.altAction)
    return button
  }
}

/** 
 * The _Options_ button opens a menu where you can toggle on filters
 * related to the panda search results you see.
 */
const optionsButton = {
  action: function() {
    window.location = '#options'
  },
  render: function(class_name="results") {
    const button = renderButton(
      "optionsButton",
      Emoji.options,
      Gui.options[Env.language],
      class_name, 
      "brightness-150")
    button.addEventListener("click", this.action)
    return button
  }
}

/** 
 * On photo gallery and other media pages, this is the button that pages in 
 * more content to look at. 
 */
const pagingButton = {
  action: function(callback, parameters, frame_id, class_name) {
    // If language menu is open, hide it
    languageButton.hide()
    const paging_data = callback.apply(null, parameters)
    const new_photos = paging_data["output"]
    // Append content into the page. 
    // HACK: always the first child of the container frame
    const frame = document.getElementById(frame_id).childNodes[0]
    for (const new_photo of new_photos)
      frame.appendChild(new_photo)
    // Update the page count for the next button to use
    parameters[0] = parameters[0] + 1
    // Redraw the footer with the next action, with the correct color (class_name)
    Page.footer.redraw(class_name)
    // Increment the shown page counter, in case we want to refresh
    // after changing the shown language 
    Env.paging.shown_pages = Env.paging.shown_pages + 1
  },
  render: function(class_name) {
    const button = renderButton(
      "pagingButton",
      Emoji.paging,
      Gui.paging[Env.language],
      class_name)
    // Get callback function and arguments from Query.env
    const callback = Env.paging.callback.function
    const parameters = Env.paging.callback.arguments
    const frame_id = Env.paging.callback.frame_id
    button.addEventListener("click",
      () => this.action(callback, parameters, frame_id, class_name))
    // English and Japanese text is too wide
    const text = button.childNodes[0].childNodes[1]
    if (Env.language == "ja")
      text.classList.add("condensed")
    else
      text.classList.remove("condensed")
    // If we're not on a page that needs a "next page" button, hide it
    if (Env.paging.display_button == false)
      button.classList.add("hidden")
    return button
  }
}

/** 
 * When clicked, view the profile of a specific animal. When right-clicked,
 * view the profile of a random animal, similar to a hidden _random_ button.
 */
const profileButton = {
  action: function(panda_id) {
    Page.profile.render()
    window.location = `#profile/${panda_id}`
    languageButton.hide()   // If language menu is open, hide it
    Env.current = Page.profile.render
  },
  altAction: function(e) {
    e.preventDefault()   // Prevent normal right-click menu from firing
    Env.current = Page.profile.render
    var pandaIds =
      P.db.vertices.filter(entity => entity._id > 0)
                   .filter(entity => entity["photo.1"] != undefined)
                   .filter(entity => entity.death == undefined)
                   .map(entity => entity._id)
    window.location =
      `#profile/${pandaIds[Math.floor(Math.random() * pandaIds.length)]}`
    languageButton.hide()   // If language menu open, hide it
    window.scrollTo(0, 0)   // Go to the top of the page
  },
  render: function(class_name="profile", panda_id) {  
    const button = renderButton(
      "profileButton",
      Emoji.profile,
      Gui.profile[Env.language],
      class_name)
    button.addEventListener("click", () => this.action(panda_id))
    button.addEventListener("contextmenu", this.altAction)
    // Japanese text is too wide
    const text = button.childNodes[0].childNodes[1]
    if (Env.language == "ja")
      text.classList.add("condensed")
    else
      text.classList.remove("condensed")
    return button
  }
}

/** The _random_ dice button, for viewing random panda search results! */
const randomButton = {
  action: function() {
    Env.current = Page.results.render
    const zooIds =
      P.db.vertices.filter(entity => isNaN(parseInt(entity._id)) == false)
                   .filter(entity => entity._id < 0)
                   .filter(entity => entity["photo.1"] != undefined)
                   .map(entity => entity._id)
                   .filter(id => Pandas.searchPandaZooCurrent(id).length > 0)
    const pandaIds =
      P.db.vertices.filter(entity => isNaN(parseInt(entity._id)) == false)
                   .filter(entity => entity._id > 0)
                   .filter(entity => entity["photo.1"] != undefined)
                   .filter(entity => entity.death == undefined)
                   .map(entity => entity._id)
    const groupIds =
      P.db.vertices.filter(entity => entity._id.indexOf("media") == 0)
                   .map(entity => entity["panda.tags"])
                   .map(tags => tags.split(", ").join(" "))
                   .filter(function(tags) {
                      // If all animals in the group photo are dead, don't present
                      var alive = tags.split(" ")
                        .map(id => Pandas.searchPandaId(id).death != undefined)
                      if (alive.every(id => id === true))
                        return false
                      else
                        return true
                    })
    const randomChoices = pandaIds.concat(groupIds).concat(zooIds)
    window.location = 
      `#query/${randomChoices[Math.floor(Math.random() * randomChoices.length)]}`
    languageButton.hide()   // If language menu open, hide it
    searchBar.remove("bottomSearch")   // When clicked, kill this search bar
    window.scrollTo(0, 0)   // Go to the top of the page
  },
  render: function(class_name="results") {
    const button = renderButton(
      "randomButton",
      Emoji.random,
      Gui.random[Env.language],
      class_name)
    button.addEventListener("click", this.action)
    return button
  }
}

/** 
 * The refresh button has a hidden dual-feature. Clicking it normally just
 * reloads content from the browser cache. Right-clicking it reloads content
 * from the server, similar to a CTRL+SHIFT+R hard-refresh browser event
 */
const refreshButton = {
  action: function() {
    location.reload(false)   // Reload from cache
  },
  altAction: function(e) {
    e.preventDefault()       // Prevent normal right-click menu from firing
    location.reload(true)    // Reload from server
  },
  render: function(class_name="results") {
    const button = renderButton(
      "refreshButton",
      Emoji.refresh,
      Gui.refresh[Env.language],
      class_name)
    button.addEventListener("click", this.action)
    button.addEventListener("contextmenu", this.altAction)
    return button
  }
}

/** Button for drawing a search bar, on `#profile` pages' bottom menu bar */
const searchButton = {
  action: function() {
    // Used on pages where the search bar normally doesn't appear
    const active = searchBar.toggle("bottomSearch")
    if (active == true) {
      window.scrollTo(0, document.getElementById("searchInput").offsetTop)
      document.getElementById("searchInput").focus()
    }
  },
  render: function(class_name="profile") {
    const searchButtonText = 
      Gui.search[Env.language].replace("...", "");   // No ellipses
    const button = renderButton(
      "searchButton",
      Emoji.search,
      searchButtonText,
      class_name)
    button.addEventListener("click", this.action)
    return button
  }
}

/** 
 * Generate buttons for inside the links page, or for other sectional pages 
 * that need to be live-generated by Javascript
 */
const sectionButton = {
  render: function(classes, id, body_text) {   
    const button = document.createElement('button')
    button.className = classes   // Space-delimited classes == multiple classes
    button.id = id
    const button_text = document.createElement('div')
    button_text.className = "sectionMenuItem"
    button_text.innerText = body_text
    button.appendChild(button_text)
    return button
  }
}

/** The top-button for scrolling back to the top of a page */
export const topButton = {
  /**
   * anchor tags get used for JS redraws, so don't use an anchor tag for
   * top-of-page scroll events. This fixes the language button after clicking
   * _pageTop_.
   */
  action: function() {
    languageButton.hide()   // If language menu open, hide it
    window.scrollTo(0, 0)
  },
  render: function(class_name="results") {
    const button = renderButton(
      "topButton",
      Emoji.top,
      Gui.top[Env.language],
      class_name)
    button.addEventListener("click", this.action)
    return button
  }
}

/** The family tree button in the `#profile` page doesn't do anything yet */
const treeButton = {
  render: function(class_name="profile") {
    const button = renderButton(
      "treeButton",
      Emoji.wip,
      Gui.family[Env.language],
      class_name)
    // Japanese text is too wide
    const text = button.childNodes[0].childNodes[1]
    if (Env.language == "ja")
      text.classList.add("condensed")
    else
      text.classList.remove("condensed")
    return button
  }
}

/** 
 * Currently it is poorly defined what ends up in `show.js` and in `page.js`,
 * but the hope is that moving to JSX components is an opportunity to put
 * code in sensible places, and not in these poorly split-up dictionaries.
 */

/** The `About` page only has a top menu */
export const aboutMenu = {
  buttons: [homeButton, languageButton, randomButton, linksButton],
  render: function() {
    const new_contents = document.createElement('div')
    new_contents.className = "shrinker"
    // Take the list of top-menu buttons and render them
    for (const buttonType of this.buttons) {
      const button = buttonType.render("results")
      new_contents.appendChild(button)
    }
    // Remove exisitng contents and replace with new
    let menu = document.querySelector(".topMenu")
    menu = update(new_contents, menu, "topMenu", "pageTop")
    // Remove any previous menu class modifiers
    menu.classList.add("results")
    menu.classList.remove("profile")
    return menu
  }
}

/** Generate the options page and its input-controls for changing settings */
const optionsPage = {
  body: function() {
    const container = document.createElement('div')
    container.id = "contentFrame"
    container.className = "options"
    container.appendChild(this.content.render())
    const shrinker = document.createElement('div')
    shrinker.className = "shrinker"
    container.appendChild(shrinker)
    return container
  },
  content: {
    deadPandas: {
      action: function(e) {
        Options.update(data => data.hideDeadPandas = e.currentTarget.checked)
      },
      render: function() {
        const container = document.createElement('div')
        const input = document.createElement('input')
        input.type = 'checkbox'
        input.id = 'dead-pandas'
        input.name = 'dead-pandas'
        input.value = 'dead-pandas'
        input.checked = Options.Data.hideDeadPandas
        input.addEventListener('change', this.action)
        container.appendChild(input)
        const label = document.createElement('label')
        label.htmlFor = 'dead-pandas'
        label.innerText = Gui['opt_hide_dead_pandas'][Env.language]
        container.appendChild(label)
        return container
      }
    }
  },
  header: function() {
    const header = document.createElement('h3')
    header.innerText = Gui['options'][Env.language]
    return header
  },
  render: function() {
    const container = document.createElement('div')
    container.className = 'shrinker'
    container.appendChild(this.header())
    container.appendChild(this.deadPandas.render())
    return container
  }
}

/**
 * Show functions used to generate content for the landing page when you first
 * visit redpandafinder.com. The landing (home) page is just a special case of
 * the results page, minus no search input, and the only time there is special
 * display logic is when content is landing on the home page.
*/
export const landingMenus = {
  bottom: {
    buttons: [optionsButton],
    render: function() {
      const new_contents = document.createElement('div')
      new_contents.className = "shrinker"
      // Take the list of bottom-menu buttons and render them.
      // Since the theme is green, leverage the "results" render type
      for (const buttonType of this.buttons) {
        const button = buttonType.render("results")
        new_contents.appendChild(button)
      }
      // Remove exisitng contents and replace with new
      var menu = document.querySelector(".bottomMenu")
      menu = update(new_contents, menu, "bottomMenu", "pageBottom")
      // Remove any previous menu class modifiers
      menu.classList.add("results")
      menu.classList.remove("profile")
      return menu
    }
  },
  /** Draw the language (flags) select menu, but it will be hidden initially */
  language: function(class_color) {
    const languages = Defaults.languages
    const shrinker = document.createElement('div')
    shrinker.className = "shrinker"
    for (const language of languages) {
      const button = flagButton.render(language, class_color)
      shrinker.appendChild(button)
    }
    // Swap updated menu into the page when rendering
    let menu = document.querySelector(".languageMenu")
    menu = update(shrinker, menu, "languageMenu", "languageTop")
    menu.classList.remove("results", "profile")
    menu.classList.add(class_color)
  },
  top: {
    buttons: [refreshButton, languageButton, aboutButton, randomButton, linksButton],
    render: function() {
      const new_contents = document.createElement('div')
      new_contents.className = "shrinker"
      for (const buttonType of this.buttons) {
        const button = buttonType.render("results")
        new_contents.appendChild(button)
      }
      // Remove exisitng contents and replace with new
      let menu = document.querySelector(".topMenu")
      menu = update(new_contents, menu, "topMenu", "pageTop")
      // Remove any previous menu class modifiers
      menu.classList.add("results")
      menu.classList.remove("profile")
      return menu
    }
  }
}

/** The button menus for each subsection in the links page */
export const linksMenus = {
  bottom: {
    buttons: [],
    /** Share the green color of the results page content for the links page */
    render: function() {
      const new_contents = document.createElement('div')
      new_contents.className = "shrinker"
      for (const buttonType of this.buttons) {
        const button = buttonType.render("results")
        new_contents.appendChild(button)
      }
      // Remove exisitng contents and replace with new
      let menu = document.querySelector(".bottomMenu")
      menu = update(new_contents, menu, "bottomMenu", "pageBottom")
      // Remove any previous menu class modifiers
      menu.classList.add("results")
      menu.classList.remove("profile")
      return menu
    }
  },
  sections: {
    buttons: ['redPandaCommunity', 'zooLinks', 'instagramLinks', 'specialThanksLinks'],
    /** 
     * Draw the links page subsection menus, highlighting the button for the 
     * currently-displayed subpage
     */
    render: function(subpage) {
      const menu = document.createElement('div')
      menu.id = "linksPageMenu"
      menu.className = "sectionMenu"
      // Draw each button based on its id and `language.js` lookups
      for (const btn_name of this.buttons) {
        const btn_id = `${btn_name}__button`
        const btn_class = "sectionButton four"
        if (btn_name == subpage) {
          btn_class = `${btn_class} selected`
        }
        const text = Gui[btn_id][Env.language]
        const button = sectionButton.render(btn_class, btn_id, text)
        menu.appendChild(button)
      }
      return menu
    }
  },
  top: {
    buttons: [homeButton, languageButton, aboutButton, randomButton],
    render: function () {
      // Return to a green menu bar: Logo/Home, Language, About, Random, Links
      const new_contents = document.createElement('div')
      new_contents.className = "shrinker"
      // Take the list of top-menu buttons and render them
      for (const buttonType of this.buttons) {
        const button = buttonType.render("results")
        new_contents.appendChild(button)
      }
      // Remove exisitng contents and replace with new
      var menu = document.querySelector(".topMenu")
      menu = update(new_contents, menu, "topMenu", "pageTop")
      // Remove any previous menu class modifiers
      menu.classList.add("results")
      menu.classList.remove("profile")
      return menu
    }
  }
}

/** Methods for sorting links displayed in the Links pages */
const linksOrder = {
  /** 
   * Go through a set of links, and return an object with all details necessary
   * to construct links in the page, along with any counts that will assist in
   * sorting, should sorting be necessary elsewhere.
   */
  given: function(links) {
    const output = {}
    output.counts = {}
    // Count the hits for each language that we support in the display modes
    for (let language of Fallback.order)
      output.counts[language] = 0
    // Grab the icon from the links values
    output.icon = links.icon
    // The list of links themselves
    output.list = []
    const link_fields = Pandas.linkGeneratorEntity
    for (const field_name of link_fields(links)) {
      // Fallback language order
      let language_order = links[`${field_name}.language.order`]
      if (language_order == undefined) {
        language_order = Fallback.order
      } else {
        language_order = language_order.split(", ")
      }
      // Fallback name selection, if (like the instagram names) we don't
      // have language-specific names. Start with a generic name field if
      // the links are actually generic.
      let link_name = links[`${field_name}.name`]
      if (link_name == undefined)
        link_name = links[`${field_name}.${Env.language}.name`] 
      if (link_name == undefined) {
        const check_languages = language_order.filter(l => l != Env.language)
        for (let l of check_languages) {
          link_name = links[`${field_name}.${l}.name`]
          if (link_name != undefined)
            break
        }
      }
      const link = {
        "first": links[`${field_name}.${Env.language}.first`],
        "href": links[field_name],
        "last": links[`${field_name}.${Env.language}.last`],
        "order": language_order,
        "text": link_name
      }
      for (const language of link.order)
        output.counts[language] = output.counts[language] + 1
      output.list.push(link)
    }
    return output
  },
  /**
   * Display links in language order, and then order by which language has the
   * most recorded hits in the links.
   */
  hits: function(links) {
    const output = this.given(links)
    output.list = output.list
      .sort(this.sortLinkTextWithoutUnderscores)
      .sort(this.sortLinkByLanguagePrevalence)
    return output
  },
  /** 
   * Display links in language order, but otherwise preserving the list order
   * of the underlying links dataset. This means that other than language
   * sorting, the zoo lists will still prioritize the original list order,
   * which is generally done by how many animals that zoo is known for. Return
   * the links page content as an array with the desired ordering.
   */
  language: function(links) {
    const output = this.given(links)
    output.list = output.list
      .sort(this.sortLinkByCurrentLanguageAndOrder)
    return output
  },
  /** 
   * Display links in language order. Any link with the current language as the
   * 1st in the link's language.order will be treated as a primary language
   * link and appear first. All primary links will be arranged in
   * lexicographical order. Next, order the other links by whether the desired
   * language is a secondary value for the given link. Return the links page
   * content as an array with the desired ordering.
   */
  languageAndAlphabet: function(links) {
    const output = this.given(links)
    output.list = output.list
      .sort(this.sortLinkTextWithoutUnderscores)
      .sort(this.sortLinkByCurrentLanguageAndOrder)
    return output
  },
  /**
   * If the primary (zeroth) language for the link is the display language,
   * prioritize that.
   */
  sortLinkByCurrentLanguageAndOrder: function(a, b) {
    const aHasLang = a.order.indexOf(Env.language)
    const bHasLang = b.order.indexOf(Env.language)
    if (aHasLang == bHasLang) {
      // Either the zeroth index, or neither entry has the language
      return 0
    } else if (bHasLang == -1) {
      // One of the entries is missing the desired language 
      return -1
    } else if (aHasLang == 0) {
      // Zeroth index is the primary language, so it comes first
      return -1
    } else {
      return 1
    }
  },
  /** 
   * Do a pass of sorting by how prevalent any given language is in the
   * list of links being reviewed.
   */
  sortLinkByLanguagePrevalence: function(a, b) {
    const aLangCount = output.counts[a.order[0]]
    const bLangCount = output.counts[b.order[0]]
    if (aLangCount > bLangCount) return -1
    else if (aLangCount < bLangCount) return 1
    else return 0
  },
  /** 
   * Do a pass of alphabetical sorting by name, without underscores changing
   * the sort order.
   */
  sortLinkTextWithoutUnderscores: function(a, b) {
    const aText = a.text.replace("_", "")
    const bText = b.text.replace("_", "")
    if (aText > bText) return 1
    else if (aText < bText) return -1
    else return 0
  }
}

/** Generate the links page, and subsections with different content + styles */
export const linksPage = {
  body: function(subpage) {
    // Draw a links page with menus and content based on the last
    // clicked version of a links menu button.
    const container = document.createElement('div')
    container.id = "contentFrame"
    container.className = "links"
    const shrinker = document.createElement('div')
    shrinker.className = "shrinker"
    // Draw the section menus
    const menu = linksMenus.sections.render(subpage)
    // Draw the links-page content
    const content = linksSections[subpage]()
    shrinker.appendChild(menu)
    shrinker.appendChild(content)
    container.appendChild(shrinker)
    return container
  },
  /** Draw a link, with optional suffix data for the link text */
  create: function(element, href, text, suffix, before=undefined, after=undefined) {
    const container = document.createElement(element)
    const anchor = document.createElement('a')
    anchor.href = href
    anchor.innerText = `${text} ${suffix}`
    anchor.target = "_blank"
    anchor.rel = "noopener noreferrer"
    // Before text is for the special-thanks page. Trailing spaces get eaten
    // from config, so add it back.
    if (before != undefined) {
      const text_before = document.createTextNode(before)
      container.appendChild(text_before)
    }
    if (href == "underline") {
      // Non-link links for the special-thanks page. Do not process any suffix
      // for these, and hack in leading and trailing space.
      const leading = document.createTextNode(" ")
      const trailing = document.createTextNode(" ")
      anchor = document.createElement('u')
      anchor.innerText = text
      container.appendChild(leading)
      container.appendChild(anchor)
      container.appendChild(trailing)    
    } else {
      container.appendChild(anchor)
    }
    // After text is for the special-thanks page
    if (after != undefined) {
      var text_after = document.createTextNode(after)
      container.appendChild(text_after)
    }
    return container
  },
  /** Convert the language order string into a list of flag emojis */
  flags: function(order) {
    return (order.length > 0)
      ? order.map(l => Gui.flag[l]).join(" ")
      : ""
  }
}

/** Rendering and sorting links on different sections of the _Links_ page */
export const linksSections = {
  instagramLinks: function() {
    const data = 'instagram'
    const links = linksOrder.languageAndAlphabet(Pandas.searchLinks(data))
    const container = document.createElement('div')
    container.id = "instagramLinks"
    container.className = "section"
    const sub_container = document.createElement('div')
    sub_container.className = "pandaLinks"
    const h2 = document.createElement('h2')
    h2.className = "linksHeader"
    h2.innerText = Gui["instagramLinks_header"][Env.language]
    const body = document.createElement('p')
    body.innerText = Gui["instagramLinks_body"][Env.language]
    const ul = document.createElement("ul")
    ul.classList.add("linkList")
    ul.classList.add("multiColumn")
    ul.classList.add(links.icon)
    for (const link of links.list) {
      const suffix = linksMenu.flags(link.order)
      const li = linksPage.create('li', link.href, link.text, suffix)
      ul.appendChild(li)
    }
    sub_container.appendChild(h2)
    sub_container.appendChild(body)
    sub_container.appendChild(ul)
    container.appendChild(sub_container)
    return container
  },
  redPandaCommunity: function() {
    const data = 'community'
    const links = linksOrder.language(Pandas.searchLinks(data))
    const container = document.createElement('div')
    container.id = "redPandaCommunity"
    container.className = "section"
    const sub_container = document.createElement('div')
    sub_container.className = "pandaLinks"
    var h2 = document.createElement('h2')
    h2.className = "linksHeader"
    h2.innerText = Gui["redPandaCommunity_header"][Env.language]
    var body = document.createElement('p')
    body.innerText = Gui["redPandaCommunity_body"][Env.language]
    var ul = document.createElement("ul")
    ul.classList.add("linkList")
    ul.classList.add(links.icon)
    for (const link of links.list) {
      const suffix = linksPage.flags(link.order)
      const li = linksPage.create('li', link.href, link.text, suffix)
      ul.appendChild(li)
    }
    sub_container.appendChild(h2)
    sub_container.appendChild(body)
    sub_container.appendChild(ul)
    container.appendChild(sub_container)
    return container
  },
  specialThanksLinks: function() {
    const data = 'special-thanks'
    const links = linksOrder.given(Pandas.searchLinks(data))
    const container = document.createElement('div')
    container.id = "specialThanksLinks"
    container.className = "section"
    const sub_container = document.createElement('div')
    sub_container.className = "pandaLinks"
    const h2 = document.createElement('h2')
    h2.className = "linksHeader"
    h2.innerText = Gui["specialThanksLinks_header"][Env.language]
    const body = document.createElement('p')
    body.innerText = Gui["specialThanksLinks_body"][Env.language]
    const ul = document.createElement("ul")
    ul.classList.add("linkList")
    ul.classList.add(links.icon)
    for (const link of links.list) {
      const li =
        linksPage.create('li', link.href, link.text, "", link.first, link.last)
      ul.appendChild(li)
    }
    sub_container.appendChild(h2)
    sub_container.appendChild(body)
    sub_container.appendChild(ul)
    container.appendChild(sub_container)
    return container
  },
  zooLinks: function() {
    const data = 'zoos'
    const links = linksOrder.language(Pandas.searchLinks(data))
    const container = document.createElement('div')
    container.id = "zooLinks"
    container.className = "section"
    const sub_container = document.createElement('div')
    sub_container.className = "pandaLinks"
    const h2 = document.createElement('h2')
    h2.className = "linksHeader"
    h2.innerText = Gui["zooLinks_header"][Env.language]
    const body = document.createElement('p')
    body.innerText = Gui["zooLinks_body"][Env.language]
    const ul = document.createElement("ul")
    ul.classList.add("linkList")
    ul.classList.add(links.icon)
    for (const link of links.list) {
      const suffix = linksPage.flags(link.order)
      const li = linksPage.create('li', link.href, link.text, suffix)
      ul.appendChild(li)
    }
    sub_container.appendChild(h2)
    sub_container.appendChild(body)
    sub_container.appendChild(ul)
    container.appendChild(sub_container)
    return container
  }
}

/** 
 * The menus used by the profile page for a single animal. Our language menu
 * behaves consistently with the landing page language menu, so just adopt it
 */
export const profileMenus = {
  bottom: {
    buttons: [pagingButton, randomButton, searchButton],
    /** Offer red menu bar with a search function: Top, Home, Search */
    render: function() {
      const new_contents = document.createElement('div')
      new_contents.className = "shrinker"
      // Take the list of bottom-menu buttons and render them
      for (const buttonType of this.buttons) {
        const button = buttonType.render("profile")
        new_contents.appendChild(button)
      }
      // Remove exisitng contents and replace with new
      let menu = document.querySelector(".bottomMenu")
      menu = update(new_contents, menu, "bottomMenu", "pageBottom")
      // Remove any previous menu class modifiers
      menu.classList.add("profile")
      menu.classList.remove("results")
      return menu
    }
  },
  language: () => landingMenus.language("profile"),
  top: {
    buttons: [homeButton, languageButton, profileButton, mediaButton, treeButton],
    /** A red menu bar: Home, Language, Profile, Media, Timeline */
    render: function(panda_id) {
      const new_contents = document.createElement('div')
      new_contents.className = "shrinker"
      // Take the list of top-menu buttons and render them
      for (const buttonType of this.buttons) {
        const button = buttonType.render("profile", panda_id)
        new_contents.appendChild(button)
      }
      // Remove exisitng contents and replace with new
      let menu = document.querySelector(".topMenu")
      menu = update(new_contents, menu, "topMenu", "pageTop")
      // Remove any previous menu class modifiers
      menu.classList.add("profile")
      menu.classList.remove("results")
      return menu
    }
  }
}

/** Show functions used by the profile page for a single animal */
export const profilePage = {
  /** Show a carousel of photos for this animal */
  carousel: function(info) {
    const carousel = new Gallery.Carousel(info, 'animal')
    carousel.displayPhoto()
    const frame = document.createElement('div')
    frame.className = "pandaPhoto"
    const image = carousel.image
    const dogEar = carousel.displayPhotoNavigation()
    frame.appendChild(image)
    frame.appendChild(dogEar)
    frame.addEventListener('mouseover', () => dogEar.style.display = "block")
    frame.addEventListener('mouseout', () => dogEar.style.display = "none")
    return frame
  },
  /** Display photos of the animal's children */
  children: function(animal, language) {
    const info = acquirePandaInfo(animal, language)
    const elements = []
    const photo_divs = []
    // Need to get daughters and sons counts
    const children_count = info.children.length
    if (children_count == 0)
      return []   // Don't display anything
    const sons_count = info.children.filter(x => x.gender == "Male").length
    const daughters_count = info.children.filter(x => x.gender == "Female").length
    const message =
      Message.profile_children(
        info["name"], children_count, daughters_count, sons_count, language)
    elements.push(message)
    const photos = Pandas.searchPhotoProfileChildren(animal["_id"])
    for (const photo of photos) {
      const child = info.children.filter(x => x["_id"] == photo["id"])[0]
      const birth_year = Pandas.formatYear(child["birthday"])
      const indeterminate =
        Pandas.indeterminateParent(animal["_id"], child["_id"])
      const gallery = Gallery.familyProfilePhoto(
        child, photo, language, birth_year, undefined, indeterminate)
      photo_divs.push(gallery)
    }
    const container = document.createElement('div')
    container.className = "profilePhotos"
    for (const photo_div of photo_divs)
      container.appendChild(photo_div)
    elements.push(container)
    return elements
  },
  /**
   * The profile dossier includes the species details, along with photo-credit
   * text related to the currently-displayed gallery on the profile page, and a
   * QR code for the panda being displayed.
   */
  dossier: function(animal, info, language) {
    // Start with species information
    const species = this.species(animal, language)
    // Next, display birthday info. TODO: do better than list items
    const [first_string, second_string] = birthday(info, language)
    const dossierBirthday = document.createElement('ul')
    dossierBirthday.className = "pandaList"
    const first_item = document.createElement('li')
    first_item.style.display = "inline-block"
    first_item.style.paddingBottom = "0.25ex"
    first_item.style.paddingRight = "1em"
    first_item.innerText = first_string
    const second_item = document.createElement('li')
    second_item.style.display = "inline-block"
    second_item.style.marginTop = "0.25ex"
    second_item.innerText = second_string
    dossierBirthday.appendChild(first_item)
    dossierBirthday.appendChild(second_item)
    // Display a QR code, and manage updates
    const qrcode = qrcodeImage()
    // Swap qr_code with one representing current profile page contents
    window.addEventListener('qr_update', qrcodeSwap)
    // Lay it all out
    const dossier = document.createElement('div')
    dossier.className = "profileDossier"
    dossier.appendChild(species)
    dossier.appendChild(dossierBirthday)
    if (info.photo_credit != undefined) {
      // Display photo credit content if a photo exists
      // TODO: factor out into CSS, and do similar with birthday
      const credit = document.createElement('ul')
      credit.className = "pandaList"
      const credit_inner = creditLink(info, 'li')
      credit_inner.style.display = "inline-block"
      credit_inner.style.paddingRight = "1em"
      credit.appendChild(credit_inner)
      // Display an apple link too
      const apple_inner = appleLink(info, 'li')
      apple_inner.style.display = "inline-block"
      credit.appendChild(apple_inner)
      dossier.appendChild(credit)
    }
    dossier.appendChild(qrcode)
    // Nicknames, in all languages
    const nicknames_container = document.createElement('div')
    nicknames_container.className = "nicknameContainer"
    const nicknames_heading = document.createElement('h4')
    nicknames_heading.className = "nicknamesHeading"
    nicknames_heading.classList.add(Env.language)
    nicknames_heading.innerText = Gui.nicknames[Env.language]
    const dossierNicknames = nicknames(animal)
    if (dossierNicknames.childNodes.length > 0) {
      nicknames_container.appendChild(nicknames_heading)
      nicknames_container.appendChild(dossierNicknames)
      dossier.appendChild(nicknames_container)
    }
    // Other names container, in all languages
    const othernames_container = document.createElement('div')
    othernames_container.className = "othernamesContainer"
    const othernames_heading = document.createElement('h4')
    othernames_heading.className = "othernamesHeading"
    othernames_heading.classList.add(Env.language)
    othernames_heading.innerText = Gui.othernames[Env.language]
    const dossierOthernames = othernames(animal, Env.language)
    if (dossierOthernames.childNodes.length > 0) {
      othernames_container.appendChild(othernames_heading)
      othernames_container.appendChild(dossierOthernames)
      dossier.appendChild(othernames_container)
    }
    return dossier
  },
  /** Display photos of the animal's family */
  family: function(animal, language) {
    const info = acquirePandaInfo(animal, language)
    const elements = []
    const photo_divs = []
    const message = Message.profile_family(info["name"], language)
    elements.push(message)
    const photos = Pandas.searchPhotoProfileImmediateFamily(animal["_id"])
    // Start with mom and dad, and then a self photo, and then littermates.
    const mom_photos = []
    for (const mom of info.mom) {
      if (mom != undefined) {
        const mom_photo = photos.filter(x => x["id"] == mom["_id"])[0]
        mom_photos.push(mom_photo)
        const mom_entry = Gallery.familyProfilePhoto(
          mom, mom_photo, language, Gui.mother[language],
          "immediateFamily", info.mom.length > 1)
        photo_divs.push(mom_entry)
      }
    }
    const dad_photos = []
    for (const dad of info.dad) {
      if (dad != undefined) {
        const dad_photo = photos.filter(x => x["id"] == dad["_id"])[0]
        dad_photos.push(dad_photo)
        var dad_entry = Gallery.familyProfilePhoto(
          dad, dad_photo, language, Gui.father[language],
          "immediateFamily", info.dad.length > 1)
        photo_divs.push(dad_entry)
      }
    }
    const me_photo = photos.filter(x => x["id"] == info["id"])[0]
    const me = Gallery.familyProfilePhoto(
      animal, me_photo, language, Gui.me[language], "immediateFamily")
    photo_divs.push(me)
    const other_family_ids =
      mom_photos.concat(dad_photos).concat(me_photo).map(x => x.id)
    const litter_photos =
      photos.filter(photo => !other_family_ids.includes(photo["id"]))
    for (const litter_photo of litter_photos) {
      let subHeading = Gui.twin[language]
      if (litter_photos.length == 2)
        subHeading = Gui.triplet[language]
      if (litter_photos.length >= 3)
        subHeading = Gui.quadruplet[language]
      const litter_mate = info.litter.filter(x => x["_id"] == litter_photo["id"])[0]
      const gallery = Gallery.familyProfilePhoto(
        litter_mate, litter_photo, language, subHeading, "immediateFamily")
      photo_divs.push(gallery)
    }
    const container = document.createElement('div')
    container.className = "profilePhotos"
    for (let photo_div of photo_divs)
      container.appendChild(photo_div)
    elements.push(container)
    return elements
  },
  /** 
   * Replace the _top_search_ bar with something that displays the animal's
   * name and gender
   */
  nameBar: function(info) {
    const animalGender = gender(info, "profile")
    const name = document.createElement('div')
    name.className = "pandaName"
    name.classList.add("profile")
    name.innerText = info.name
    const shrinker = document.createElement('div')
    shrinker.className = "shrinker"
    shrinker.appendChild(animalGender)
    shrinker.appendChild(name)
    const nameBar = document.createElement('div')
    nameBar.className = "nameBar"
    nameBar.classList.add("profile")
    nameBar.id = "focalBar"
    nameBar.appendChild(shrinker)
    const body = document.getElementsByTagName("body")[0]
    // Replace search or nameBar that might be there
    const existing = document.getElementById("focalBar")
    body.replaceChild(nameBar, existing)
  },
  /** Create a profile page for a single panda */
  panda: function(animal, language) {
    const info = acquirePandaInfo(animal, language)
    // Replace the search bar with the name bar for this animal
    this.nameBar(info)
    // Start with panda content
    const carousel = this.carousel(info)
    const dossier = this.dossier(animal, info, language)
    const result = document.createElement('div')
    result.className = "profileFrame"
    result.appendChild(carousel)
    result.appendChild(dossier)
    return result
  },
  /** Render the search bar at the bottom of the profile page */
  searchBar: function() {
    const bottomMenu = document.querySelector(".bottomMenu")
    const bottomSearchBar = searchBar.render("bottomSearch profile", "bottomSearch")
    bottomMenu.appendChild(bottomSearchBar)
  },
  /** Display photos of the animal's siblings */
  siblings: function(animal, language) {
    const info = acquirePandaInfo(animal, language)
    const elements = []
    const photo_divs = []
    // Need to get daughters and sons counts
    const total_siblings = info.siblings.concat(info.litter)
    const siblings_count = total_siblings.length
    if (siblings_count == 0)
      return []   // Don't display anything
    const brothers_count = total_siblings.filter(x => x.gender == "Male").length
    const sisters_count = total_siblings.filter(x => x.gender == "Female").length
    const message =
      Message.profile_siblings(
        info["name"], siblings_count, sisters_count, brothers_count, language)
    elements.push(message)
    const photos = Pandas.searchPhotoProfileSiblings(animal["_id"])
    for (const photo of photos) {
      const sibling = total_siblings.filter(x => x["_id"] == photo["id"])[0]
      let subHeading = Pandas.formatYear(sibling["birthday"])
      if (Pandas.halfSiblings(animal, sibling))
        subHeading = subHeading + "\u200A" + "(½)"
      const indeterminate =
        Pandas.indeterminateSiblings(animal["_id"], sibling["_id"])
      const gallery = Gallery.familyProfilePhoto(
        sibling, photo, language, subHeading, undefined, indeterminate)
      photo_divs.push(gallery)
    }
    const container = document.createElement('div')
    container.className = "profilePhotos"
    for (const photo_div of photo_divs)
      container.appendChild(photo_div)
    elements.push(container)
    return elements
  },
  /** Underneath a photo, display the subspecies info for the panda */
  species: function(animal, language) {
    const species_text = document.createTextNode(Pandas.species(animal, language))
    const italics = document.createElement('i')
    italics.appendChild(species_text)
    const heading = document.createElement('h4')
    const emoji = document.createTextNode(Emoji.animal + " ")
    heading.appendChild(emoji)
    heading.appendChild(italics)
    const species_div = document.createElement('div')
    species_div.className = "species"
    species_div.appendChild(heading)
    return species_div
  },
  /**
   * Show the locations this panda has been at. Return an array of HTMLElements
   * to insert into the page
   */
  where: function(animal, language) {
    const elements = []
    const info = acquirePandaInfo(animal, language)
    const history = acquireLocationList(animal, language)
    const message = Message.profile_where(info["name"], language)
    elements.push(message)
    // Start at the current zoo, and work backwards
    const container = document.createElement('div')
    container.className = "zooHistory"
    for (const zoo of history.reverse()) {
      let zoo_icon = Emoji.zoo
      // Different date string logic for zoos versus wild animal sightings.
      let date_string = zoo["start_date"] + "\u2014" + zoo["end_date"]
      if (!zoo["id"].includes("wild.")) {
        if (zoo["end_date"] == Defaults.unknown[language]) {
          date_string = 
            Gui.since_date[language].replace("<INSERTDATE>", zoo["start_date"])
          zoo_icon = Emoji.home
        }
      } else {
        zoo_icon = Emoji.tree
        date_string =
          Gui.seen_date[language].replace("<INSERTDATE>", zoo["start_date"])
      }
      if ((zoo["end_date"] != Defaults.unknown[language]) && 
          (zoo["end_date"] == Pandas.date(animal, "death", Env.language))) {
        zoo_icon = Emoji.died
      }
      if ((zoo["start_date"] != Defaults.unknown[language]) &&
          (zoo["start_date"] == Pandas.formatDate(animal["birthday"], language)) &&
          (zoo_icon != Emoji.home)) {
        zoo_icon = Emoji.born_at
      }
      const zoo_info = Pandas.searchZooId(zoo["id"])[0]
      const zoo_entry = document.createElement('ul')
      zoo_entry.className = "zooList"
      const zoo_name = document.createElement('li')
      const zoo_link = zooLink(zoo_info, zoo_info[`${language}.name`], language, zoo_icon)
      const zoo_date = document.createElement('span')
      zoo_date.className = "detail"
      zoo_date.innerText = date_string
      zoo_name.appendChild(zoo_link)
      if (zoo["start_date"] != Defaults.unknown[language])
        zoo_name.appendChild(zoo_date)
      zoo_entry.appendChild(zoo_name)
      const zoo_location = document.createElement('li')
      // Location shows a map icon and a flag icon, and links to
      // a Google Maps search for the "<language>.address" field  
      const location_link = locationLink(zoo_info, language, "text")
      zoo_location.appendChild(location_link)
      zoo_entry.appendChild(zoo_location)
      container.appendChild(zoo_entry)
    }
    elements.push(container)
    return elements
  }
}

/** Results page menu rendering */
export const resultsMenus = {
  bottom: {
    buttons: [pagingButton],
    /** Return to a green menu bar: Paging, Home */
    render: function() {
      const new_contents = document.createElement('div')
      new_contents.className = "shrinker"
      // Take the list of bottom-menu buttons and render them
      for (const buttonType of this.buttons) {
        const button = buttonType.render("results")
        new_contents.appendChild(button)
      }
      // Remove exisitng contents and replace with new
      let menu = document.querySelector(".bottomMenu")
      menu = update(new_contents, menu, "bottomMenu", "pageBottom")
      // Remove any previous menu class modifiers
      menu.classList.add("results")
      menu.classList.remove("profile")
      return menu
    }
  },
  language: () => landingMenus.language("results"),
  top: {
    buttons: [homeButton, languageButton, aboutButton, randomButton, linksButton],
    /** Return to a green menu bar: Logo/Home, Language, About, Random, Links */
    render: function() {
      const new_contents = document.createElement('div')
      new_contents.className = "shrinker"
      // Take the list of top-menu buttons and render them
      for (const buttonType of this.buttons) {
        const button = buttonType.render("results")
        new_contents.appendChild(button)
      }
      // Remove exisitng contents and replace with new
      let menu = document.querySelector(".topMenu")
      menu = update(new_contents, menu, "topMenu", "pageTop")
      // Remove any previous menu class modifiers
      menu.classList.add("results")
      menu.classList.remove("profile")
      return menu
    }
  }
}

/** 
 * The media page's menus are equivalent to the profile page. This means we
 * need to define the mediaPage stuff after the profilePage stuff, so we don't
 * end up in a temporal dead-zone (TDZ)
 */
export const mediaMenus = profileMenus

/**
 * Show functions used by the media page for a single animal (group photos).
 * Has to be defined after the profiles page since it refers to that logic
 */
export const mediaPage = {
  gallery: function(animal, language) {
    const gallery = Gallery.groupPhotosPage(0, [animal["_id"]], 10)["output"]
    const info = acquirePandaInfo(animal, language)
    this.nameBar(info)
    const result = document.createElement('div')
    result.className = "mediaFrame"
    for (const photo of gallery)
      result.appendChild(photo)
    if (gallery.length < 1)
      result.appendChild(
        emptyResult(Message.Text.no_group_media_result, Env.language))
    return result
  },
  nameBar: profilePage.nameBar,
  searchBar: profilePage.searchBar
}

/** Show functions used by the search results cards / pages */
export const resultsPage = {
  /** Display panda children in the family section */
  children: function(info) {
    const heading = document.createElement('h4')
    heading.className = `childrenHeading  ${info.language}`
    heading.innerText = Gui.children[info.language]
    const ul = document.createElement('ul')
    ul.className = `pandaList ${info.language}`
    for (const index in Pandas.sortOldestToYoungest(info.children)) {
      const animal = info.children[index]
      // Check if animal has multiple possible moms/dads
      const icon_list = ["child_icon", "live_icon"]
      if (Pandas.indeterminateParent(info.id, animal["_id"]) == true)
        icon_list.push("question_icon")
      const children_link = animalLink(
        animal, animal[info.get_name], info.language, icon_list)
      const li = document.createElement('li')
      li.appendChild(children_link)
      ul.appendChild(li)
    }
    const children = document.createElement('div')
    children.className = 'children'
    children.appendChild(heading)
    children.appendChild(ul)
    return children
  },
  /** 
   * Display lists of family information, starting with parents, then adding
   * immediate littermates, and finally including the other siblings, ordered
   * by birthday. This is the tan stripe at the bottom of a family dossier in
   * a search-result card.
   */
  family: function(info) {
    let family = document.createElement('div')
    family.className = "family"
    if ((info.dad.length == 0 && info.mom.length == 0) &&
        (info.litter.length == 0) &&
        (info.siblings.length == 0) &&
        (info.children.length == 0))  {
      return family   // No documented family
    }
    let parents = undefined
    let litter = undefined
    let siblings = undefined
    let children = undefined
    if (info.dad.length > 0 || info.mom.length > 0)
      parents = this.parents(info)
    if (info.litter.length > 0)
      litter = this.litter(info)
    if (info.siblings.length > 0)
      siblings = this.siblings(info)
    if (info.children.length > 0)
      children = this.children(info)
    family = new Layout(family, info, parents, litter, siblings, children)
    return family
  },
  groupGallery: function(id_list) {
    const gallery = Gallery.groupPhotosIntersectPage(0, id_list, 10)["output"]
    const results = []
    if (gallery.length < 1) {
      results.push(
        emptyResult(Message.Text.no_group_media_result, Env.language))
    } else {
      results = gallery
    }
    return results
  },
  /** Do the littermates info in the family section */
  litter: function(info) {
    const language = info.language
    const heading = document.createElement('h4')
    heading.className = `litterHeading ${info.language}`
    heading.classList.add(language)
    heading.innerText = Gui.litter[info.language]
    const ul = document.createElement('ul')
    ul.className = `pandaList ${info.language}`
    for (const index in Pandas.sortOldestToYoungest(info.litter)) {
      const animal = info.litter[index]
      const litter_link = animalLink(
        animal, animal[info.get_name], info.language, ["child_icon", "live_icon"])
      const li = document.createElement('li')
      li.appendChild(litter_link)
      ul.appendChild(li)
    }
    const litter = document.createElement('div')
    litter.className = 'litter'
    litter.appendChild(heading)
    litter.appendChild(ul)
    return litter
  },
  /**
   * Display a card of information for a single panda. Most missing elements
   * should not be displayed, but a few should be printed regardless 
   * (birthday / death)
   */
  panda: function(animal, language) {
    const info = acquirePandaInfo(animal, language)
    const carousel = new Gallery.Carousel(info, 'animal')
    carousel.displayPhoto()
    const frame = document.createElement('div')
    frame.className = "pandaPhoto"
    const image = carousel.image
    const dogEar = carousel.displayPhotoNavigation()
    frame.appendChild(image)
    frame.appendChild(dogEar)
    frame.addEventListener('mouseover', () => dogEar.style.display = "block")
    frame.addEventListener('mouseout', () => dogEar.style.display = "none")
    const title = this.pandaName(info)
    const details = this.pandaDetails(info)
    const family = this.family(info)
    const dossier = document.createElement('div')
    dossier.className = "pandaDossier"
    dossier.appendChild(title)
    dossier.appendChild(details)
    dossier.appendChild(family)
    const result = document.createElement('div')
    result.className = "pandaResult"
    result.appendChild(frame)
    result.appendChild(dossier)
    // Ensure theres's a search bar
    this.searchBar()
    return result
  },
  /** The purple results-page "dossier" information stripe for a panda. */
  pandaDetails: function(info) {
    const language = info.language
    // Start the new Div
    const details = document.createElement('div')
    details.className = "pandaDetails"
    // Modes for arrived/deparated animals based on query context
    let search_context = undefined
    if (info.search_context != undefined)
      search_context = info.search_context.query
    let squelch_home_zoo = false
    // Start creating content
    const [first_string, second_string] = birthday(info, language)
    const born = document.createElement('p')
    born.innerText = first_string
    details.appendChild(born)
    // If still alive, print their current age
    const second = document.createElement ('p')
    second.innerText = second_string
    if (info.age != undefined)
      details.appendChild(second)
    // Arrivals have zoo information for where they came from
    if (info.zoo != undefined && search_context == "arrived") {
      const zoo = document.createElement('p')
      const target_zoo = Pandas.searchZooId(info.search_context.from)[0]
      const target_date = Pandas.formatDate(info.search_context.move_date, language)
      // Custom language templates for this
      const icon = Emoji.truck
      const target_text =
        Message.arrived_from_zoo(target_zoo[`${language}.name`], target_date, language)
      const zoo_link = zooLink(target_zoo, target_text, language, icon)
      zoo.appendChild(zoo_link)
      // Location shows a map icon and a flag icon, and links to
      // a Google Maps search for the "<language>.address" field
      const location = document.createElement('p')
      const location_link = locationLink(target_zoo, language)
      location.appendChild(location_link)
      details.appendChild(zoo)
      details.appendChild(location)
      squelch_home_zoo = true
    }
    // Departures are for which zoo an animal just left for
    if (info.zoo != undefined && search_context == "departed") {
      const zoo = document.createElement('p')
      const target_zoo = Pandas.searchZooId(info.search_context.to)[0]
      const target_date = Pandas.formatDate(info.search_context.move_date, language)
      // Custom language templates for this
      const icon = Emoji.truck
      const target_text =
        Message.departed_to_zoo(target_zoo[`${language}.name`], target_date, language)
      const zoo_link = zooLink(target_zoo, target_text, language, icon)
      zoo.appendChild(zoo_link)
      // Location shows a map icon and a flag icon, and links to
      // a Google Maps search for the "<language>.address" field
      const location = document.createElement('p')
      const location_link = locationLink(target_zoo, language)
      location.appendChild(location_link)
      details.appendChild(zoo)
      details.appendChild(location)
      squelch_home_zoo = true
    }
    if (info.zoo != undefined && search_context == "born_at") {
      const zoo = document.createElement('p')
      const target_zoo = Pandas.searchZooId(info.search_context.at)[0]
      const target_date = Pandas.formatDate(info.search_context.move_date, language)
      let icon = Emoji.born_at
      const target_text = target_zoo[`${language}.name`]
      const compare_text = info.zoo[`${language}.name`]
      if (target_text == compare_text && info.death == Defaults.unknown[language]) {
        squelch_home_zoo = true
        icon = `${icon} ${Emoji.home}`
      }
      if (info.death != Defaults.unknown[language])
        squelch_home_zoo = true
      const zoo_link = zooLink(target_zoo, target_text, language, icon)
      zoo.appendChild(zoo_link)
      // Location shows a map icon and a flag icon, and links to
      // a Google Maps search for the "<language>.address" field
      const location = document.createElement('p')
      const location_link = locationLink(target_zoo, language)
      location.appendChild(location_link)
      details.appendChild(zoo)
      details.appendChild(location)
    }
    // Ranges that an animal lived somewhere
    if (info.zoo != undefined && search_context == "born_or_lived" ) {
      const zoo = document.createElement('p')
      const target_zoo = Pandas.searchZooId(info.search_context.at)[0]
      const target_date = Pandas.formatDate(info.search_context.move_date, language)
      const icon = Emoji.zoo
      const target_text = target_zoo[`${language}.name`]
      const compare_text = info.zoo[`${language}.name`]
      if (target_text == compare_text) {
        squelch_home_zoo = true
        icon = Emoji.home
      }
      const zoo_link = zooLink(target_zoo, target_text, language, icon)
      zoo.appendChild(zoo_link)
      // Location shows a map icon and a flag icon, and links to
      // a Google Maps search for the "<language>.address" field
      const location = document.createElement('p')
      const location_link = locationLink(target_zoo, language)
      location.appendChild(location_link)
      details.appendChild(zoo)
      details.appendChild(location)
      // Next, show the date ranges this is valid for
      for (const range of info.search_context.ranges) {
        const entry = document.createElement('p')
        let icon = Emoji.range_previous
        if (range.length < 2 && info.death == Defaults.unknown[language])
          icon = Emoji.truck   // When they arrived, haven't left
        const start_range = Pandas.formatDate(range.shift(), language)
        let end_range = range.shift()
        if (end_range == undefined && info.death != Defaults.unknown[language])
          end_range = " \u2014 " + info.death
        else if (end_range == undefined)
          end_range = ""
        else
          end_range = " \u2014 " + Pandas.formatDate(end_range, language)
        entry.innerText = `${icon} ${start_range}${end_range}`
        details.appendChild(entry)
      }
      // Don't show the home zoo if the animal is dead
      if (info.death != Defaults.unknown[language])
        squelch_home_zoo = true
    }
    // Which zoo is the animal at now. Ignore if just arrived/departed,
    // or if the born_at zoo is the same as the current zoo
    if (info.zoo != undefined && squelch_home_zoo == false) {
      const zoo = document.createElement('p')
      const zoo_link =
        zooLink(info.zoo, info.zoo[`${language}.name`], language, Emoji.home)
      zoo.appendChild(zoo_link)
      // Location shows a map icon and a flag icon, and links to
      // a Google Maps search for the "<language>.address" field
      const location = document.createElement('p')
      const location_link = locationLink(info.zoo, language)
      location.appendChild(location_link)
      details.appendChild(zoo)
      details.appendChild(location)
    }
    // Wild animals, don't do context things for
    if (info.wild != undefined) {
      const wild = document.createElement('p')
      wild.innerText =
        Flags[info.wild["flag"]] + " " + info.wild[`${language}.name`]
      details.appendChild(wild)
    }
    // Give credit for the person that took this photo
    const credit = creditLink(info, 'p')
    details.appendChild(credit)
    if (info.photo_credit != undefined) {
      // See how many other panda photos this user has posted
      const other_photos = appleLink(info, 'p')
      details.appendChild(other_photos)
    }
    return details
  },
  /** 
   * Display the name and gender symbol for a single panda in the
   * results _title bar_
   * */
  pandaName: function(info) {
    const language = info.language
    const pandaGender = gender(info)
    const name_div = document.createElement('div')
    name_div.className = 'pandaName'
    // In Japanese, display one of the "othernames" as furigana
    if (language == "ja") {
      name_div.innerText = info.name
      const pandaFurigana = furigana(info.name, info.othernames)
      if (pandaFurigana != false)
        name_div.appendChild(pandaFurigana)
    } else {
      name_div.innerText = info.name
    }
    const a = document.createElement('a')
    a.href = `#profile/${info.id}`
    const title_div = document.createElement('div')
    title_div.className = "pandaTitle"
    title_div.appendChild(pandaGender)
    title_div.appendChild(name_div)
    a.appendChild(title_div)
    return a
  },
  /** Do mom and dad's info in the family section */
  parents: function(info) {
    const heading = document.createElement('h4')
    heading.className = `parentsHeading ${info.language}`
    heading.innerText = Gui.parents[info.language]
    const ul = document.createElement('ul')
    ul.className = `pandaList ${info.language}`
    const mom_links = []
    if (info.mom.length > 0) {
      for (const mom of info.mom) {
        const icon_list = ["mom_icon", "live_icon"]
        if (info.mom.length > 1)
          icon_list.push("question_icon")
        const mom_link = animalLink(
          mom, mom[info.get_name], info.language, icon_list)
        mom_links.push(mom_link)
      }
    } else {
      const mom_link = animalLink(
        Defaults.animal, Defaults.no_name[info.language], info.language, ["mom_icon"])
      mom_links.push(mom_link)
    }
    for (const mom_link of mom_links) {
      const mom_li = document.createElement('li')
      mom_li.appendChild(mom_link)
      ul.appendChild(mom_li)
    }
    const dad_links = []
    if (info.dad.length > 0) {
      for (const dad of info.dad) {
        const icon_list = ["dad_icon", "live_icon"]
        if (info.dad.length > 1)
          icon_list.push("question_icon")
        var dad_link = animalLink(
          dad, dad[info.get_name], info.language, icon_list)
        dad_links.push(dad_link)
      }
    } else {
      const dad_link = animalLink(
        Defaults.animal, Defaults.no_name[info.language], info.language, ["dad_icon"])
      dad_links.push(dad_link)
    }
    for (const dad_link of dad_links) {
      const dad_li = document.createElement('li')
      dad_li.appendChild(dad_link)
      ul.appendChild(dad_li)
    }
    const parents = document.createElement('div')
    parents.className = 'parents'
    parents.appendChild(heading)
    parents.appendChild(ul)
    return parents
  },
  /** Leaving a profile page? Turn this into a search bar again */
  searchBar: function(language) {
    const body = document.getElementsByTagName("body")[0]
    const focalBar = document.getElementById("focalBar")
    if (focalBar.classList.contains("nameBar")) {
      // Replace the nameBar with a search bar
      const topSearchBar = searchBar.render("topSearch", "focalBar")
      body.replaceChild(topSearchBar, focalBar)
      searchBar.action()   // Add the event listeners
    }
  },
  /** Do the non-litter siblings info in the family section */ 
  siblings: function(info) {
    const heading = document.createElement('h4')
    heading.className = `siblingsHeading ${info.language}`
    heading.innerText = Gui.siblings[info.language]
    const ul = document.createElement('ul')
    ul.className = `pandaList ${info.language}`
    for (const index in Pandas.sortOldestToYoungest(info.siblings)) {
      const myself = Pandas.searchPandaId(info.id)[0]
      const animal = info.siblings[index]
      const icon_list = ["child_icon", "live_icon"]
      if (Pandas.halfSiblings(myself, animal))
        icon_list.push("half_icon")
      if (Pandas.indeterminateSiblings(info.id, animal["_id"]) == true)
        icon_list.push("question_icon")
      const siblings_link = animalLink(
        animal, animal[info.get_name], info.language, icon_list)
      const li = document.createElement('li')
      li.appendChild(siblings_link)
      ul.appendChild(li)
    }
    const siblings = document.createElement('div')
    siblings.className = 'siblings'
    siblings.appendChild(heading)
    siblings.appendChild(ul)
    return siblings
  },
  /** Display information for a zoo relevant to the red pandas */
  zoo: function(zoo, language) {
    const info = acquireZooInfo(zoo, language)
    const carousel = new Gallery.Carousel(info, 'zoo', 'images/no-zoo.jpg')
    carousel.displayPhoto()
    const frame = document.createElement('div')
    frame.className = "zooPhoto"
    const image = carousel.image
    const dogEar = carousel.displayPhotoNavigation()
    frame.appendChild(image)
    frame.appendChild(dogEar)
    frame.addEventListener('mouseover', () => dogEar.style.display = "block")
    frame.addEventListener('mouseout', () => dogEar.style.display = "none")
    const title = zooTitle(info)
    const details = this.zooDetails(info)
    const counts = this.zooCounts(info)
    const dossier = document.createElement('div')
    dossier.className = "zooDossier"
    dossier.appendChild(title)
    dossier.appendChild(details)
    dossier.appendChild(counts)
    const result = document.createElement('div')
    result.className = "zooResult"
    result.appendChild(frame)
    result.appendChild(dossier)
    // Ensure theres's a search bar
    this.searchBar()
    return result
  },
  /**
   * Display the animals at a zoo as follows:
   * 1) Recently arrived or born animals at the zoo (if any exist)
   *   -- order them together by their sort_time field
   * 2) Recently departed or died animals at the zoo (if any exist)
   *   -- order them together by their sort_time field
   * 3) The other resident animals living at the zoo
   *   -- order them oldest to youngest
   */
  zooAnimals: function(zoo, language) {
    const animals_to_divs = (animals) => {
      const output_divs = []
      // TODO ES6: this scope here
      animals.forEach(animal =>
        output_divs.push(this.panda(animal, Env.language)))
      return output_divs
    }
    const id = zoo["_id"]
    // Death list takes precedence over all others. 
    // No panda in this list should appear in the other lists.
    const deaths = Pandas.searchPandaZooDied(id, 9)
    // Which pandas came to this zoo in the last nine months?
    const arrivals = Pandas.searchPandaZooArrived(id, 9)
    const born = Pandas.searchPandaZooBorn(id, 9)
    // Which pandas departed this zoo in the last nine months?
    const departures = Pandas.searchPandaZooDeparted(id, 9)
    // Which animals were resident at this zoo?
    let residents = Pandas.searchPandaZooCurrent(id)
    // Remove duplicate items based on panda "_id" fields
    residents = Pandas.removeElementsWithMatchingField(residents, arrivals, "_id")
    residents = Pandas.removeElementsWithMatchingField(residents, born, "_id")
    residents = Pandas.sortOldestToYoungest(residents)
    // Deaths and departures are together
    const leaving = Pandas.sortByDate(
      departures.concat(deaths), "sort_time", "descending")
    // Births and arrivals are together
    let coming = Pandas.sortByDate(
      arrivals.concat(born), "sort_time", "descending")
    // If a recently born panda moves zoos, take it off the arrivals list
    coming = Pandas.removeElementsWithMatchingField(coming, leaving, "_id")
    // Define the per-section messages. There are modifications depending on
    // which of the input lists are non-empty
    var headers = {
      "arrivals": Message.arrivals(zoo, born, language),
      "departures": Message.departures(zoo, deaths, leaving, language)
    }
    // Spool it all out
    let content_divs = []
    if (coming.length > 0) {
      content_divs = content_divs.concat(headers["arrivals"])
      content_divs = content_divs.concat(animals_to_divs(coming))
    }
    if (leaving.length > 0) {
      content_divs = content_divs.concat(headers["departures"])
      content_divs = content_divs.concat(animals_to_divs(leaving))
    }
    // Residents get a message if there are other subsections 
    // in these lists of zoo animals
    if (residents.length > 0) {
      if ((leaving.length > 0 ) || (coming.length > 0)) {
        headers["residents"] = Message.residents(zoo, language)
        content_divs = content_divs.concat(headers["residents"])
      }
      content_divs = content_divs.concat(animals_to_divs(residents))
    }
    return content_divs
  },
  /** The pink "animal counts" information stripe for a zoo */
  zooCounts: function(info) {
    const language = info.language
    const ul = document.createElement('ul')
    ul.className = "zooCounts"
    const li_items = {
      "living": document.createElement('li'),
      "born": document.createElement('li'),
      "departed": document.createElement('li'),
      "recorded": document.createElement('li')
    }
    // Animals living at this zoo today
    const at_zoo = Pandas.searchPandaZooCurrent(info["id"]).length
    if (at_zoo < 1) {
      let output_text = ""
      for (const i in Message.Text.zoo_details_no_pandas_live_here[language]) {
        const field = Message.Text.zoo_details_no_pandas_live_here[language][i]
        output_text = output_text.concat(field)
      }
      const text_node = document.createTextNode(output_text)
      li_items["living"].appendChild(text_node)
    } else {
      let output_text = ""
      for (const i in Message.Text.zoo_details_pandas_live_here[language]) {
        const field = Message.Text.zoo_details_pandas_live_here[language][i]
        if (field == "<INSERTNUM>")
          output_text = output_text.concat(at_zoo)
        else
          output_text = output_text.concat(field)
      }
      output_text = Language.unpluralize([output_text])[0]
      const text_node = document.createTextNode(output_text)
      li_items["living"].appendChild(text_node)
    }
    // Other messages may disappear if they aren't meaningful for the data
    // How many pandas were born at this zoo
    const born_link = document.createElement('a')
    born_link.href = `#query/born at ${info.id}`
    const born_at_zoo = Pandas.searchPandaZooBornRecords(info["id"], false)
    const born_count = born_at_zoo.length
    if (born_count > 0) {
      const earliest_born_year = born_at_zoo[born_count - 1]["birthday"].split("/")[0]
      let output_text = ""
      for (const i in Message.Text.zoo_details_babies[language]) {
        const field = Message.Text.zoo_details_babies[language][i]
        if (field == "<INSERTBABIES>")
          output_text = output_text.concat(born_count)
        else if (field == "<INSERTYEAR>")
          output_text = output_text.concat(earliest_born_year)
        else
          output_text = output_text.concat(field)
      }
      output_text = Language.unpluralize([output_text])[0]
      const text_node = document.createTextNode(output_text)
      born_link.appendChild(text_node)
      li_items["born"].appendChild(born_link)
    }
    // How many pandas have recently departed this zoo
    const departed_link = document.createElement('a')
    departed_link.href = "javascript:"
    const departed_link_id = `departures/zoo/${info.id}`
    departed_link.addEventListener("click", function() {
      document.getElementById(departed_link_id).scrollIntoView(true)
    })
    const departed_zoo = Pandas.searchPandaZooDeparted(info["id"], 9)
    const died_at_zoo = Pandas.searchPandaZooDied(info["id"], 9)
    const departed_count = departed_zoo.length
    const died_count = died_at_zoo.length
    const total_departed = departed_count + died_count
    if (total_departed > 0) {
      let output_text = ""
      for (const i in Message.Text.zoo_details_departures[language]) {
        const field = Message.Text.zoo_details_departures[language][i]
        if (field == "<INSERTNUM>")
          output_text = output_text.concat(total_departed)
        else
          output_text = output_text.concat(field)
      }
      if (died_count > 0)
        output_text = output_text.concat(" " + Emoji.died)
      output_text = Language.unpluralize([output_text])[0]
      const text_node = document.createTextNode(output_text)
      departed_link.appendChild(text_node)
      li_items["departed"].appendChild(departed_link)
    }
    // How many pandas total have been recorded here
    const total_zoo = Pandas.searchPandaZooBornLived(info["id"])
    const total_count = total_zoo.length
    if (total_count > 0) {
      // Find the first location marker matching the zoo for this animal
      // Get the year from this value.
      let earliest_year = -1
      const compare_id = info["id"] * -1
      for (const animal of total_zoo) {
        const location_fields = Pandas.locationGeneratorEntity
        for (const field_name of location_fields(animal)) {
          const location = Pandas.field(animal, field_name)
          const [loc_id, loc_date] = location.split(", ")
          if ((loc_date != undefined) && (loc_id == compare_id)) {
            const year = parseInt(location.split(", ")[1].split("/")[0])
            if ((earliest_year == -1) || (year < earliest_year)) {
              earliest_year = year
            }
          }
        }
      }
      // Now for the message
      const total_link = document.createElement('a')
      total_link.href = `#query/lived at ${info.id}`
      let output_text = ""
      for (const i in Message.Text.zoo_details_records[language]) {
        const field = Message.Text.zoo_details_records[language][i]
        if (field == "<INSERTNUM>")
          output_text = output_text.concat(total_count)
        else if (field == "<INSERTYEAR>")
          output_text = output_text.concat(earliest_year)
        else
          output_text = output_text.concat(field)
      }
      output_text = Language.unpluralize([output_text])[0]
      const text_node = document.createTextNode(output_text)
      total_link.appendChild(text_node)
      li_items["recorded"].appendChild(total_link)
    }
    // Finally, construct the set of info
    for (const message of ["living", "born", "departed", "recorded"]) {
      if (li_items[message].childNodes.length > 0) {
        ul.appendChild(li_items[message])
      }
    }
    return ul
  },
  /** This is the purple "dossier" information stripe for a zoo. */
  zooDetails: function(info) {
    const address = document.createElement('p')
    const address_link = document.createElement('a')
    address_link.innerText = `${Emoji.travel} ${info.address}`
    address_link.href = info.map
    address_link.target = "_blank"   // Open in new tab
    address.appendChild(address_link)
    const zoo_page = document.createElement('p')
    const zoo_link = document.createElement('a')
    zoo_link.href = info.website
    zoo_link.target = "_blank"   // Open in new tab
    zoo_link.innerText = `${Emoji.website} ${info.name}`
    zoo_page.appendChild(zoo_link)
    const details = document.createElement('div')
    details.className = "zooDetails"
    if (info.closed != Defaults.zoo.closed) {
      const date = Pandas.formatDate(info.closed, Env.language)
      const closed = Message.closed(date, Env.language)
      details.appendChild(closed)
    }
    details.appendChild(address)
    details.appendChild(zoo_page)
    // Photo details are optional for zoos, so don't show the
    // photo link if there's no photo included in the dataset
    if (info.photo != Defaults.zoo["photo.1"]) {
      // Give credit for the person that took this photo
      const credit = creditLink(info, 'p')
      details.appendChild(credit)
      const other_photos = appleLink(info, 'p')
      details.appendChild(other_photos)
    }
    return details
  }
}

/** Methods and actions pertaining to the redpandafinder search bar */
export const searchBar = {
  /** Set event listeners for the search bar */
  action: function() {
    if (document.forms['searchForm'] != undefined)
      document.forms['searchForm'].addEventListener("submit", this.submit)
    // Fix problems with Typesquare input box styling
    if (document.getElementById('searchInput') != undefined)
      document.getElementById('searchInput').style.fontFamily = "sans-serif"
  },
  /** Unhide, enable, and set text cursor focus on the search bar if hidden */
  display: function() {
    if (document.forms['searchForm'] != undefined) {
      document.forms['searchForm'].display = "block"
      this.enable()
    }
  },
  /**
   * Enable the search bar (i.e. if panda graph content has loaded), and
   * display the placeholder text in a localized way. If a page doesn't have
   * the searchbar, do nothing.
   */
  enable: function() {
    if (document.forms['searchForm'] != undefined) {
      document.forms['searchForm']['searchInput'].disabled = false
      const placeholder = "➤ " + Gui.search[Env.language]
      document.forms['searchForm']['searchInput'].placeholder = placeholder
      this.action()
    }
    // Refocus text cursor once page loads, but only on non-touch devices
    if (!("ontouchstart" in window))
      setTimeout(() =>
        document.getElementById('searchInput').focus({preventScroll: true}))
  },
  /**
   * Remove the search bar when leaving profile mode. By default it will be the
   * bottom menu search bar that gets hidden.
   */
  remove: function(frame_id) {
    if (document.getElementById(frame_id) != null)
      document.getElementById(frame_id).parentNode.remove(searchBar)
  },
  /**
   * Generate a search bar. Should be the same kind of bar that would appear
   * either at the top of the search results page, or at the bottom of the
   * profiles page. There can only be one on a page (id logic).
   * 
   * @param frame_class `top_search` or `bottom_search`
   */
  render: function(frame_class, frame_id) {
    const hidden_button = document.createElement('input')
    hidden_button.id = "searchSubmit"
    hidden_button.className = "search"
    hidden_button.type = "submit"
    const text_input = document.createElement('input')
    text_input.id = "searchInput"
    text_input.className = "search"
    text_input.placeholder = "➤ " + Gui.search[Env.language]
    text_input.type = "search"
    const form = document.createElement('form')
    form.id = "searchForm"
    form.action = "javascript:"
    form.acceptCharset = "UTF-8"
    form.appendChild(hidden_button)
    form.appendChild(text_input)
    const shrinker = document.createElement('div')
    shrinker.className = "shrinker"
    shrinker.appendChild(form)
    const search_bar = document.createElement('div')
    search_bar.className = frame_class
    search_bar.id = frame_id
    search_bar.appendChild(shrinker)
    // Add submit events for a search form
    this.action()
    return search_bar
  },
  /** JS actions for submiting a search */
  submit: function() {
    Env.current = Page.results.render
    // Make iOS keyboard disappear after submitting.
    document.getElementById('searchInput').blur()
    const query = (document.getElementById('searchInput').value).replace(/\s+$/, '')
    window.location = `#query/${query}`
    // When submitting from the bottomMenu search bar, destroy it and move the
    // focus and query output to the top search bar.
    this.remove("bottomSearch")
    // Refocus text cursor after a search is performed, but only on non-touch devices
    if (!("ontouchstart" in window))
      setTimeout(() =>
        document.getElementById('searchInput').focus({preventScroll: true}))
    languageButton.hide()   // If language menu open, hide it
    window.scrollTo(0, 0)   // Go to the top of the page
  },
  /**
   * Normally the search bar just appears at the top of the page. In `#profile`
   * mode, it's hidden unless the user opts to search for new pandas using the
   * Search Button at the bottom of the page.
   */
  toggle: function(frame_id) {
    const searchBar = document.getElementById(frame_id)
    if (searchBar == null)
      return false
    const display = searchBar.style.display
    // Catch whether the search bar has no explicit display style (first click), or none
    if ((display == "none") || (display == "")) {
      searchBar.style.display = "table"
      this.action()   // Add the event listeners
      return true
    } else {
      searchBar.style.display = "none"
      return false
    }
  }
}

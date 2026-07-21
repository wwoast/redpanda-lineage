import * as Gallery from './gallery.js'
import * as Geo from './geolocate.js'
import * as Language from './language.js'
import { mediaQuery, shrinkNames } from './layout.js'
import * as Message from './message.js'
import * as Options from './options.js'
import P, * as Pandas from './pandas.js'
import * as Query from './query.js'
import * as Show from './show.js'

/** 
 * Module for rendering all sectional pages of redpandafinder, some of which
 * are smaller modes with their own encapsulated state.
 */

/**
 * Manage the background color of the page. Profiles/Results page have different 
 * colors. This mostly impacts how things look when you try and scroll on mobile
 * and you reach the end of touch-scrolling content.
 */
export function color(class_name) {
  const body = document.getElementsByTagName('body')[0]
  body.classList.remove("results")
  body.classList.remove("profile")
  body.classList.add(class_name)
}

/** 
 * Redraw page after an updateLanguage event or similar. Redisplay results in
 * the correct language, but only if the Pandas content has already loaded.
 * 
 * TODO: rewrite this logic to be less tied to results/profile callback checks
 */
export function redraw(callback) {
  if ((window.location.hash.length > 0) &&
      (P.db != undefined) &&
      (callback == results.render)) {
    callback()
  }
  // Redisplay profile info in the correct language, but only if the Pandas
  // content has already been loaded.
  if ((window.location.hash.length > 0) &&
      (P.db != undefined) &&
      (callback == profile.render)) {
    callback()
  }
  if ((window.location.hash.length > 0) &&
      (P.db != undefined) &&
      (callback == media.render)) {
    callback()
  }
  // For non-panda-results page, don't worry if the database is there or not
  if ((window.location.hash.length > 0) && 
      (callback != results.render) && 
      (callback != profile.render) &&
      (callback != media.render) &&
      (callback != links.render)) {
    callback()
  }
  if ((window.location.hash.length == 0) && (callback == home.render)) {
    callback()
  }
}

/** 
 * Logic related to the "About" page. This loads language-specific static
 * content using an XHR. Like all objects representing page state, this is a
 * singleton object for the current browser tab.
 */
class AboutPage {
  /** The page body to render or restore for the About page */
  content = undefined

  /** Language the current page is displayed in */
  language = undefined

  /** Event representing the About page was successfully fetched */
  loaded = new Event('about_loaded')

  /** 
   * Fetch the about page contents, and add the event listeners for how section
   * buttons load different parts of the about page.
   */
  fetch() {
    const fetch_url = `/fragments/${Language.Displayed}/about.html`
    const request = new XMLHttpRequest()
    request.open('GET', fetch_url)
    request.responseType = 'document'
    request.send()
    request.onload = () => {
      this.content = request.response.getElementById('hiddenContentFrame')
      this.language = Language.Displayed   // Language the content was loaded in
      window.dispatchEvent(this.loaded)   // Report the data has loaded
    }
  }

  /** Find all image links on instagram, and replace their URIs with fetches */
  fetchImages() {
    // TODO ES6: get rid of this code and replace with direct image links
    const replace_images = document.getElementsByClassName("replace")
    for (const img of replace_images) {
      if (img.src.indexOf("https://www.instagram.com/p/") == 0) {
        const shortcode = img.src.split("/")[4];
        const size = img.src.split("/")[6].split("=")[1]
        const ig_url = `ig://${shortcode}/${size}`
        Gallery.url.process(img, ig_url)
      }
    }
  }

  /** 
   * The about page hashchange results in needing to draw or fetch the page
   * initialize its menus, or at the very least, scroll to the top of the page
   */
  hashchange() {
    if ((this.language != Language.Displayed) && (this.language != undefined))
      this.fetch()
    else {
      this.render()
      // Add event listeners to the newly created About page buttons
      // TODO ES6
      this.sections.buttonEventHandlers()
      // Display correct subsection of the about page (class swaps)
      // Default: usage instructions appear non-hidden.
      this.sections.show(window.sessionStorage.getItem("aboutPageMenu"))
      // Determine desktop or mobile, and display relevant instructions
      this.instructions()
      mediaQuery.addListener(this.instructions)
      // Add a tag list
      this.tags();
      env.current = this.render
    }
    window.scrollTo(0, 0)  // Go to the top of the page
  }

  /** 
   * Use media queries to determine whether to display instructions for mobile
   * visitors or for PC visitors
   */
  instructions() {  
    if (mediaQuery.matches) {
      document.querySelector(".pandaAbout.onlyDesktop").style.display = "none"
      document.querySelector(".pandaAbout.onlyMobile").style.display = "block"
    } else {
      document.querySelector(".pandaAbout.onlyMobile").style.display = "none"
      document.querySelector(".pandaAbout.onlyDesktop").style.display = "block"
    }
  }

  /** 
   * Displays the about page when the button is clicked. Load content from a
   * static file based on the given language, and display it in a frame with
   * `#contentFrame.about`
   */
  render() {
    // No need for media paging on the about page
    Query.env.paging.display_button = false
    // Direct link / server refresh, or language change event
    if (!this.language || this.language != Language.Displayed)
      this.fetch()
    else {
      this.sections.menuDefaults()   // Initialize submenus if necessary
      document.getElementById('contentFrame').replaceWith(this.content)
      footer.redraw("results")
    }
    Show.resultsMenus.language()
    Show.aboutMenu.render()
    Show.resultsPage.searchBar()   // Ensure the search bar comes back
    color("results")
    // Re-enable scroll restoration for just the about page
    if (history.scrollRestoration) {
      history.scrollRestoration = 'auto'
    }
  }

  /**
   * When someone clicks the about button, either show the about page, or
   * return to the last page shown before the about page
   */
  routing() {
    if (env.current == this.render) {
      // Check the last query done and return to it, if it was a query
      if (routes.fixed.includes(env.lastSearch) == false) {
        window.location = env.lastSearch
      } else {
        window.location = "#home"
      }
    } else {
      // Only save the last page if it wasn't one of the other fixed buttons
      if (routes.fixed.includes(window.location.hash) == false) {
        env.lastSearch = window.location.hash;
      }
      window.location = "#about"
    }
  }

  /** 
   * Hydrate the section buttons on the About page, to change between a
   * handful of section views with different information
   */
  sectionButtonEventHandlers() {
    const buttons = document.getElementsByClassName("sectionButton")
    buttons.forEach(button => button.addEventListener('click', function() {
      const show_section_id = this.id.split("_")[0]
      this.sectionShow(show_section_id)
      // TODO: set new uri representing sub-page
      // Set subMenu state, to to validate what page to show and how the menu
      // will be colored.
      window.sessionStorage.setItem("aboutPageMenu", show_section_id)
    }))
  }

  /**
   * Use session storage (lost when browser closes) for menu state.
   * Potential values are for the menus on the about and links page, so the
   * chosen sub-page will reappear when theses pages are regenerated.
   *  "aboutPageMenu" can be set to (usage|pandas|contributions)
   *   "linksPageMenu" can be set to (community|zoos|friends)
   */
  sectionMenuDefaults() {
    if (window.sessionStorage.getItem("aboutPageMenu") == null) {
      window.sessionStorage.setItem("aboutPageMenu", "usageGuide")
    }
  }

  /** 
   * For pages with hidden sections, get a list of the section containers, and
   * hide all of them but the one provided. This requires an id convention
   * where sections are id'ed `name` and the buttons that activate those
   * sections are id'ed `name_button`
   */
  sectionShow(section_id) {
    const desired = document.getElementById(section_id)
    const desired_button = document.getElementById(`${section_id}_button`)
    // Find currently shown section and hide it
    const sections = document.getElementsByClassName("section")
    const shown = [].filter.call(sections, function(el) {
      return el.classList.contains("hidden") == false
    })[0]
    // Turn off the existing shown section, and "unselect" its button
    if (shown != undefined) {
      const shown_button = document.getElementById(`${shown.id}_button`)
      shown.classList.add("hidden")
      shown_button.classList.remove("selected")
    }
    // Remove the hidden class on the desired section, and "select" its button
    desired.classList.remove("hidden")
    desired_button.classList.add("selected")
    // Fetch images from IG if necessary
    this.fetchImages()
  }

  /** 
   * Take all available tags for this language, and draw a sorted list of tags
   * by the current `this.language`
   */
  tags() {
    const container = document.querySelector(".pandaAbout.aboutTags")
    // The tag menu already exists, so we're good to go
    if (container.hasChildNodes() == true)
      return
    const tagList = document.createElement('ul')
    tagList.classList.add("tagList")
    tagList.classList.add("multiColumn")
    const tagKeys = Object.keys(Language.tags)
    const primaryTags = {}
    for (const key of tagKeys) {
      const primaryTag = Language.tags[key][this.language][0];
      // Index by primaryTag, while the value is the key to the tagList
      primaryTags[primaryTag] = key
    }
    const sortedTags = Object.keys(primaryTags).sort()
    for (const thisTag of sortedTags) {
      const lookup = primaryTags[thisTag]
      const thisEmoji = Language.tags[lookup]["emoji"]
      const tagLi = document.createElement('li')
      const tagLink = document.createElement('a')
      tagLink.href = `#query/${thisTag}`
      tagLink.innerText = `${thisEmoji} ${thisTag}`
      tagLi.appendChild(tagLink)
      tagList.appendChild(tagLi)
    }
    container.appendChild(tagList)
  }
}

/**
 * Singleton class representing the About page with settings for which
 * submenu of the About page was last viewed.
 */
export const about = new AboutPage()

class FooterComponent {
  /** Add or refresh the footer at the bottom of the page */
  redraw(page_mode="results") {
    const body = document.getElementsByTagName('body')[0]
    const footer_test = document.getElementById("footer")
    if (footer_test == null) {
      // No footer exists, and no bottom menu either. Add both
      const footer = this.render(Language.Displayed, page_mode)
      const bottomMenu = (page_mode == "profile")
        ? Show.profileMenus.bottom.render()
        : Show.resultsMenus.bottom.render()
      body.appendChild(bottomMenu)
      body.appendChild(footer)
    } else {
      // Redraw the footer for language event changes
      const footer = this.render(Language.Displayed, page_mode)
      const bottomMenu = (page_mode == "profile")
        ? Show.profileMenus.bottom.render()
        : Show.resultsMenus.bottom.render()
      // If bottom menu isn't there, add it
      if (footer_test.previousElementSibling.id != "pageBottom")
        body.insertBefore(bottomMenu, footer_test)
      // Replace footer menu itself
      body.replaceChild(footer, footer_test)
    }
  }

  /** Remove the footer and bottom menu if returning to the home page */
  remove() {
    const body = document.getElementsByTagName('body')[0]
    const footer_test = body.lastElementChild
    if (footer_test.id == "footer") {
      // TODO: top and bottom menu operations should be by id
      const bottomMenu_test = document.getElementsByClassName("bottomMenu")[0]
      body.removeChild(bottomMenu_test)
      body.removeChild(footer_test)
    }
  }

  /** Draw a footer with the correct language and color (class) */
  render(language, class_name) {
    const p = document.createElement('p')
    const rpn_url = "https://www.redpandanetwork.org"
    const rpn_logo_link = document.createElement('a')
    rpn_logo_link.href = rpn_url
    rpn_logo_link.target = "_blank"
    rpn_logo_link.rel = "noopener noreferrer"
    const rpn_logo = document.createElement('img')
    rpn_logo.className = "footerRpnLogo"
    rpn_logo.src = "images/rpn-logo.png"
    rpn_logo_link.appendChild(rpn_logo)
    p.appendChild(rpn_logo_link)
    for (const i in Language.messages.footer[language]) {
      const field = Language.messages.footer[language][i];
      if (field == "<INSERTLINK_RPF>") {
        const rpf = document.createElement('a')
        rpf.href = "https://github.com/wwoast/redpanda-lineage"
        rpf.target = "_blank"   // Open link in a new tab
        // Security best practice: prevent access to window.opener
        rpf.rel = "noopener noreferrer"
        rpf.innerText = Language.gui.footerLink_rpf[language]
        p.appendChild(rpf)
      } else if (field == "<INSERTLINK_RPN>") {
        const rpn = document.createElement('a')
        rpn.href = rpn_url
        rpn.target = "_blank"   // Open link in a new tab
        // Security best practice: prevent access to window.opener
        rpn.rel = "noopener noreferrer"
        rpn.innerText = Language.gui.footerLink_rpn[language]
        p.appendChild(rpn)
      } else if (field === "") {
        // If the field is an empty string, insert a line break in the footer
        p.appendChild(document.createElement('br'))
      } else {
        // For normal text, add it as a text node
        const msg = document.createTextNode(field)
        p.appendChild(msg);
      }
    }
    const shrinker = document.createElement('div')
    shrinker.className = "shrinker";
    shrinker.appendChild(p)
    const footer = document.createElement('div')
    footer.className = "footer"
    footer.classList.add(class_name)
    footer.id = "footer"
    footer.appendChild(shrinker)
    return footer
  }
}

/**
 * Singleton class representing the Footer that gets drawn at the bottom of
 * most (but not all) modes for redpandafinder.
 */
export const footer = new FooterComponent()

/** Logic for drawing the redpandafinder landing page. */
class HomePage {
  /** 
   * Render an instance of the redpandafinder landing/home page with
   * randomized content from the `redpanda.json` database
   */
  render() {
    // No need for paging on the home page
    Query.env.paging.display_button = false
    // Output just the base search bar with no footer.
    const old_content = document.getElementById('contentFrame')
    Show.resultsMenus.language()
    Show.landingMenus.top.render()
    // Special homepage headers
    if (P.db != undefined) {
      const new_content = document.createElement('div')
      new_content.className = "results birthdayPandas"
      new_content.id = "contentFrame"
      // Halloween
      // const halloween = Gallery.pumpkin(Language.Displayed, 3)
      // new_content.appendChild(halloween);
      // Kin Gin special
      // const kingin = Gallery.memorialPhotoCreditsGroup(
      //   Language.Displayed, "media.7.gin-kin", ["22", "17"], 3)
      // new_content.appendChild(kingin)
      // Current memorials
      const memorial_ids = []
      if (!Options.Data.hideDeadPandas) {
        var departed =
          Gallery.memorialPhotoCredits(
            Language.Displayed, memorial_ids, 3, Message.memorial)
        new_content.appendChild(departed)
      }
      // Please remember these pandas
      // const memorial = 
      //   Gallery.memorialPhotoCredits(
      //     Language.Displayed, ["59"], 3, Message.missing_you)
      // new_content.appendChild(memorial)
      // Birthday logic
      const min_photo_count = 3
      const max_birthday_animals = 5
      const birthday_count =
        Pandas.searchBirthdayToday(true, min_photo_count).length
      if (birthday_count > 0) {
        const birthday = Gallery.birthdayPhotoCredits(
          Language.Displayed, min_photo_count, max_birthday_animals)
        new_content.appendChild(birthday)
      }
      // Special galleries
      if (birthday_count + memorial_ids.length < 2) {
        const special_galleries = this.special_galleries()
        new_content.appendChild(special_galleries)
      }
      const nearby = Message.findNearbyZoo(Language.Displayed)
      new_content.appendChild(nearby)
      const new_photos = Gallery.updatedNewPhotoCredits(Language.Displayed)
      new_content.appendChild(new_photos)
      old_content.replaceWith(new_content)
      shrinkNames()
      footer.redraw("landing")
    } else {
      const new_content = document.createElement('img')
      new_content.src = "images/jiuzhaigou.jpg"
      new_content.className = "fullFrame"
      new_content.id = "contentFrame"
      old_content.replaceWith(new_content)
      footer.remove()
    }
    Show.resultsPage.searchBar()   // Ensure the search bar comes back
    color("results")
    window.scrollTo(0, 0)   // Scroll to the top of the page
  }

  /**
   * Front page galleries to use whenever there are not lots of other
   * content to display.
   * TODO: for memorials, use Option.Data to hide this
   */
  special_galleries() {
    const date = new Date()
    const choice = Query.env.paging.seed
    if (date.getDay() == choice % 7) {
      // Sunday has a special memorial
      return this.special_memorial()
    } else {
      return this.special_tag_galleries()
    }
  }

  /** Special memorials that are important to redpandafinder */
  special_memorial() {
    const choice = Query.env.paging.seed
    if (choice % 7 == 0) {
      const laila = Gallery.memorialPhotoCredits(
        Language.Displayed, ["60"], 3, Message.missing_you)
      return laila
    } else if (choice % 5 == 0) {
      const kokin = Gallery.memorialPhotoCredits(
        Language.Displayed, ["23"], 3, Message.missing_you)
      return kokin
    } else if (choice % 3 == 0) {
      const hokuto = Gallery.memorialPhotoCredits(
        Language.Displayed, ["58"], 3, Message.missing_you);
      return hokuto
    } else {
      // Group memorial for Kin and Gin, temporarily Hokuto
      const kingin = Gallery.memorialPhotoCreditsGroup(
        Language.Displayed, "media.7.gin-kin", ["22", "17"], 3)
      return kingin
    }
  }

  /** Tag-based special galleries */
  special_tag_galleries() {
    const special_galleries = [
      {
        "message": Message.lunch_time,
        "photo_count": 3,
        "taglist": ["bamboo", "bite", "portrait"],
      },
      {
        "message": Message.lunch_time,
        "photo_count": 3,
        "taglist": ["apple time", "dish", "portrait"]
      },
      {
        "message": Message.lunch_time,
        "photo_count": 3,
        "taglist": ["apple time", "portrait", "snow"]
      },
      {
        "message": Message.autumn,
        "photo_count": 3,
        "taglist": ["autumn", "portrait"]
      },
      {
        "message": Message.baby_photos,
        "photo_count": 3,
        "taglist": ["baby", "portrait"]
      }
    ]
    const choice = Query.env.paging.seed % special_galleries.length
    const special = Gallery.taglist(
      Language.Displayed, 
      special_galleries[choice].photo_count,
      special_galleries[choice].taglist,
      special_galleries[choice].message)
    return special
  }
}

/** Singleton class representing the Home / landing page for redpandafinder */
export const home = new HomePage()

/** Logic related to the Links page. */
class LinksPage {
  /** The page body to render or restore for the Links page */
  content = undefined

  /**
   * The links page hashchange results in needing to draw or fetch the
   * links page and initialize its menus, or at the very least, scroll
   * to the top of the page.
   */
  hashchange() {
    this.render()
    env.current = this.render
    window.scrollTo(0, 0)   // Go to the top of the page
  }

  render() {
    // No need for paging on the links page
    Query.env.paging.display_button = false
    // Initialize submenus if necessary
    this.sectionMenuDefaults()
    var chosen = window.sessionStorage.getItem("linksPageMenu")
    this.content = Show.linksPage.body(chosen)
    document.getElementById('contentFrame').replaceWith(this.content)
    // Add event listeners to the newly created Links page buttons
    this.sectionButtonEventHandlers()
    footer.redraw("results")
    Show.resultsMenus.language()
    Show.linksMenus.top.render()
    Show.resultsPage.searchBar()   // Ensure the search bar comes back
    color("results")
  }

  /** Handle when someone clicks the links button */
  routing() {
    if (env.current == this.render) {
      // Check the last query done and return to it, if it was a query
      if (routes.fixed.includes(env.lastSearch) == false)
        window.location = env.lastSearch
      else
        window.location = "#home"
    } else {
      // Only save the last page if it wasn't one of the other fixed buttons
      if (!routes.fixed.includes(window.location.hash)) {
        env.lastSearch = window.location.hash
      }
      window.location = "#links"
    }
  }

  sectionButtonEventHandlers() {
    // Find all button subelements of the menu
    const buttons = document.getElementsByClassName("sectionButton")
    // For each button, add an event handler to show the section
    // related to the button's id. Example:
    //    redPandaCommunity_button => shows redPandaCommunity page
    buttons.forEach(button => button.addEventListener('click', function() {
      const old_section = window.sessionStorage.getItem("linksPageMenu")
      const show_section_id = this.id.split("_")[0]
      // Draw new links page content, and erase the old
      this.content = Show.linksSections[show_section_id]()
      const old_content = document.getElementById(old_section)
      // Erase the old content and bring the new content into the page
      old_content.replaceWith(this.content)
      window.sessionStorage.setItem("linksPageMenu", show_section_id)
      const old_button = document.getElementById(`${old_section}_button`)
      button.classList.add("selected")
      old_button.classList.remove("selected")
    }))
  }

  sectionMenuDefaults() {
    if (window.sessionStorage.getItem("linksPageMenu") == null) {
      window.sessionStorage.setItem("linksPageMenu", "redPandaCommunity")
    }
  }
}

/** Singleton class representing the Links pagefor redpandafinder */
export const links = new LinksPage()

/**
 * The media page displays group photos for an individual panda. It's part of
 * the "profile" group of pages that show information about a specific animal.
 */
class MediaPage {
  render() {
    // window.location.hash doesn't decode UTF-8. This does, fixing Japanese search
    const input = decodeURIComponent(window.location.hash)
    // Start by just displaying info for one panda by id search
    const results = routes.behavior(input)
    // TODO: count results and display a next page button if necessary
    Query.env.paging.display_button = true
    // Generate new content frames
    const gallery_div = Show.mediaPage.gallery(results["hits"][0], Language.Displayed)
    const new_content = document.createElement('div')
    new_content.className = "profile"
    new_content.id = "contentFrame"
    new_content.appendChild(gallery_div)
    // Swap the new content into the page
    document.getElementById('contentFrame').replaceWith(new_content)
    shrinkNames()
    Show.mediaMenus.language()
    const result_id = results["hits"][0]["_id"]
    Show.mediaMenus.top.render(result_id)
    footer.redraw("profile")
    color("profile")
    // Add a search bar but hide it until the bottomMenu search button is clicked
    Show.mediaPage.searchBar()
    // Move to the top of the page
    window.scrollTo(0, 0)
  }
}

/**
 * Singleton class representing the Media page, mostly for consistency with the
 * other class-based page objects.
 */
export const media = new MediaPage()

/** 
 * Logic related to the "Options" page. Like all objects representing page
 * state, they are singleton objects for the current browser tab.
 */
class OptionsPage {
  /** The page body to render or restore for the Options page */
  content = undefined

  /** Call this in a `hashchange` handler to make the Options page appear */
  hashchange() {
    this.render()
    env.current = this.render
    window.scrollTo(0, 0)   // Go to the top of the page
  }

  /** Render the options page, and replace the exisitng page content */
  render() {
    // Disable paging from another page rendering mode
    Query.env.paging.display_button = false
    this.content = Show.options.body()
    // Replace existing content frame with the Options page
    document.querySelector('#contentFrame').replaceWith(this.content)
    // Add event listeners to the newly created Links page buttons
    footer.redraw("results")
    Show.resultsMenus.language()
    Show.linksMenus.top.render()
    Show.resultsPage.searchBar()   // Ensure the search bar comes back
    color("results")
  }
}

/**
 * Singleton class representing the Options page with settings for changing
 * what content a user sees by default in redpandafinder.
 */
export const options = new OptionsPage()

/** The profiles page display details for an individual panda */
class ProfilePage {
  qr_update = new Event('qr_update')

  render() {
    // window.location.hash doesn't decode UTF-8. This does, fixing Japanese search
    const input = decodeURIComponent(window.location.hash)
    // Profile pages never have additional content to load
    Query.env.paging.display_button = false
    // Start by just displaying info for one panda by id search
    const results = routes.behavior(input)
    const profile_div = Show.profilePage.panda(results["hits"][0], Language.Displayed)
    const where_divs = Show.profilePage.where(results["hits"][0], Language.Displayed)
    const family_divs = Show.profilePage.family(results["hits"][0], Language.Displayed)
    const children_divs = Show.profilePage.children(results["hits"][0], Language.Displayed)
    const siblings_divs = Show.profilePage.siblings(results["hits"][0], Language.Displayed)
    // Generate new content frames
    const shrinker = document.createElement('div')
    shrinker.className = "shrinker"
    shrinker.appendChild(profile_div)
    for (const content_div of where_divs.concat(family_divs)
                                      .concat(children_divs)
                                      .concat(siblings_divs)) {
      shrinker.appendChild(content_div)
    }
    const new_content = document.createElement('div')
    new_content.className = "profile"
    new_content.id = "contentFrame"
    new_content.appendChild(shrinker)
    // Swap the new content into the page
    document.getElementById('contentFrame').replaceWith(new_content)
    Show.profileMenus.language()
    const result_id = results["hits"][0]["_id"]
    // TODO TOWRITE: need to take id of panda for buttons
    Show.profileMenus.top.render(result_id)
    footer.redraw("profile")
    color("profile")
    // Add a search bar but hide it until the bottomMenu search button is clicked
    Show.profilePage.searchBar()
    // Update the QR code based on the displayed photo
    window.dispatchEvent(this.qr_update)
    // Move to the top of the page
    window.scrollTo(0, 0)
  }
}

/**
 * Singleton class representing the Profile page, mostly for consistency with
 * the other class-based page objects.
 */
export const profile = new ProfilePage()

/** 
 * Logic related to the results page output. The main render function chooses
 * between other results rendering modes, and we'll likely add many more as
 * time goes on.
 */
class ResultsPage {
  /** Given a search for pandas or zoos, output entity divs */
  entities(results) {
    let content_divs = []
    if (results["hits"].length == 0) {
      // No results? On desktop, bring up a sad panda
      content_divs.push(
        Show.emptyResult(Language.messages.no_result, Language.Displayed))
    }
    results["hits"].forEach(function(entity) {
      // Zoos get the Zoo div and pandas for this zoo
      if (entity["_id"] < 0) {
        content_divs.push(Show.resultsPage.zoo(entity, Language.Displayed))
        content_divs = content_divs.concat(
          Show.resultsPage.zooAnimals(entity, Language.Displayed))
        content_divs.push(Show.zooDivider("bear-bamboo"))
      } else
        content_divs.push(Show.resultsPage.panda(entity, Language.Displayed))
    })
    // Remove the last element if it's a divider
    const last_element = content_divs[content_divs.length - 1]
    if (last_element.className == 'zooDivider') {
      content_divs.pop()
    }
    return content_divs
  }
  /** 
   * Given a search for N panda ids, return first the list of media photos all
   * of them  are in, or an error message saying they haven't been seen
   * together. Then, display the results for each one. This doesn't work yet
   * for names due to space/tokenizing and name resolution issues for duplicate
   * names... that will be much more work!
   */
  group(results) {
    let content_divs = []
    if (results["hits"].length == 0) {
      // Push an error message
      content_divs.push(
        Show.emptyResult(Language.messages.no_group_media_result, Language.Displayed))
      return content_divs
    }
    // Then, start displaying a list of group photos paged out
    const animal_ids = results["query"].split(" ")
    // Show all photos with these animals, along with a message.
    // No container div here so just concat.
    if (results["hits"].length > 0)
      content_divs = content_divs.concat(Show.resultsPage.groupGallery(animal_ids))
    // Give a list of results for each individual animal
    const animal_results = []
    for (const id of animal_ids) {
      const entity = Pandas.searchPandaId(id)[0]
      animal_results.push(Show.resultsPage.panda(entity, Language.Displayed))
    }
    // Let some photos appear first, unless we don't have very many photos
    let insert = 0
    if (content_divs.length > 4)
      insert = 2
    for (const result of animal_results) {
      content_divs.splice(insert, 0, result)
    }
    return content_divs
  }
  /**
   * Given a search for nearest zoos, add zoo divs and the pandas that live there,
   * along with a header message of the zoos by proximity.
   */
  nearby(results) {
    let content_divs = []
    if (results.parsed == "geolookup_in_progress") {
      // Stuck at the interstitial after a language transition
      content_divs.push(Message.geolocationStart(Language.Displayed))
      return content_divs
    }
    // Zoo results
    results["hits"].forEach(function(entity) {
      // Zoos get the Zoo div and pandas for this zoo
      content_divs.push(Show.resultsPage.zoo(entity, Language.Displayed))
      animals = Pandas.sortOldestToYoungest(
        Pandas.searchPandaZooCurrent(entity["_id"]))
      animals.forEach(animal =>
        content_divs.push(Show.resultsPage.panda(animal, Language.Displayed)))
      content_divs.push(Show.zooDivider("bear-bamboo"))
    })
    // Remove the last element if it's a divider
    const last_element = content_divs[content_divs.length - 1]
    if (last_element.className == 'zooDivider')
      content_divs.pop()
    // HACK: return to entity mode
    Query.env.output_mode = "entities"
    return content_divs
  }
  /** Photo results have a different structure from panda/zoo results */
  photos(results) {
    let content_divs = []
    const max_hits = Query.env.paging.results_count
    if ((results["parsed"] == "set_tag") || 
        (results["parsed"] == "set_tag_subject") ||
        (results["parsed"] == "set_baby_subject")) {
      // Basic tag views with emoji in the name field
      content_divs = Gallery.tagPhotos(results, Language.Displayed, max_hits, true)
    } else if (results["parsed"].indexOf("set_tag_intersection") == 0) {
      // Combo tag views, no emoji in the name field
      content_divs = Gallery.tagPhotos(results, Language.Displayed, max_hits, false)
    } else if ((results["parsed"] == "set_credit_photos") || 
               (results["parsed"] == "set_credit_photos_filtered")) {
      content_divs = Gallery.creditPhotos(results, Language.Displayed, max_hits)
    }
    // HACK: revert to results mode
    Query.clear()
    return content_divs
  }
  render() {
    // window.location.hash doesn't decode UTF-8. This does, fixing Japanese search
    const input = decodeURIComponent(window.location.hash)
    // Don't assume a paging button is necessary until shown otherwise
    Query.env.paging.display_button = false
    const results = routes.behavior(input)
    let content_divs = []
    const new_content = document.createElement('div')
    new_content.id = "contentFrame"
    switch(Query.env.output_mode) {
      case "entities":
        content_divs = this.entities(results)
        break
      case "photos":
        content_divs = this.photos(results)
        new_content.style.textAlign = "center"   // Align photos centered in each row
        break
      case "group":
        content_divs = this.group(results)
        new_content.style.textAlign = "center"   // Align photos centered in each row
        break
      case "nearby":
        content_divs = this.nearby(Geo.state.results)
        break
    }
    const shrinker = document.createElement('div')
    shrinker.className = "shrinker"
    content_divs.forEach(content_div => shrinker.appendChild(content_div))
    new_content.appendChild(shrinker)
    // Redraw the search bar if necessary
    Show.resultsPage.searchBar()
    // Append the new content into the page and then swap it in
    document.getElementById('contentFrame').replaceWith(new_content)
    // Call layout adjustment functions to shrink any names that are too long
    shrinkNames()
    Show.resultsMenus.language()
    Show.resultsMenus.top.render()
    footer.redraw("results")
    color("results")
    window.scrollTo(0, 0)   // Move to the top of the page
  }
}

/**
 * Singleton class representing the Results page, mostly for consistency with
 * the other class-based page objects.
 */
export const results = new ResultsPage()

/**
 * Logic related to redpandafidner page routing, implemented as behavior around
 * `#fragment` client-side-routed URLs.
 */
class Routes {
  /** Flexible layout pages */
  dynamic = [
    "#credit",
    "#group",
    "#links",
    "#media",
    "#panda",
    "#profile",
    "#query",
    "#timeline",
    "#zoo"
  ]
  /** Fixed layout pages: about page, empty query page, and options page */
  fixed = ["#about", "#home", "#options"]
  media = ["#media"]
  no_footer = ["#home"]
  profile = ["#profile", "#timeline"]
  results = [
    "#about",
    "#credit",
    "#group",
    "#home",
    "#links",
    "#panda",
    "#query",
    "#zoo"
  ]

  /**
   * Each hashlink determines a different behavior for the page rendering. Do a
   * task based on what the route is. TODO: add tag search URIs
   */
  behavior(input) {
    let query_string = undefined
    if ((input.indexOf("#credit/") == 0) && (input.split("/").length == 3)) {
      // link for a page of photo credits for a specific author,
      // including only a specific animal.
      const uri_items = input.slice(8)
      const [ author, filter ] = uri_items.split("/")
      // Don't adjust case for author searches, but eventually we
      // still need to do case-adjustment for the panda name itself
      Query.env.preserve_case = true;
      Query.env.output_mode = "photos";   // Set output mode for a photo list
      query_string = `credit ${author} ${filter}`
    } else if ((input.indexOf("#credit/") == 0) && (input.split("/").length == 2)) {
      // link for a page of photo credits for a specific author
      const photo_author = input.slice(8);
      Query.env.preserve_case = true     // Don't adjust case for author searches
      Query.env.output_mode = "photos"   // Set output mode for a photo list
      query_string = `credit ${photo_author}`
    } else if ((input.indexOf("#panda/") == 0) && (input.split("/").length == 4)) {
      // link for a panda result with a chosen photo.
      const uri_items = input.slice(7)
      const [ panda, _, photo_id ] = uri_items.split("/")
      Query.env.output_mode = "entities"
      Query.env.specific_photo = photo_id
      query_string = `panda ${panda}`
    } else if ((input.indexOf("#panda/") == 0) && (input.split("/").length == 2)) {
      // link for a single panda result.
      const panda = input.slice(7)
      Query.env.output_mode = "entities"
      query_string = `panda ${panda}`
    } else if ((input.indexOf("#group") == 0) &&
               (input.split("/").length >= 2) &&
               (input.split("/").length <= P.db["_photo"]["group_max"] + 1)) {
      // group display modes (just searching multiple ids for now)
      const id_list = input.slice(7).split("/")
      Query.env.output_mode = "group"
      query_string = id_list.join(" ")
    } else if ((input.indexOf("#profile/") == 0) && (input.split("/").length == 4)) {
      // link for a panda profile result with a chosen photo.
      const uri_items = input.slice(9)
      const [ panda, _, photo_id ] = uri_items.split("/")
      Query.env.specific_photo = photo_id
      query_string = `panda ${panda}`
    } else if ((input.indexOf("#profile/") == 0) && (input.split("/").length == 2)) {
      // link for a single panda profile result.
      const panda = input.slice(9)
      query_string = `panda ${panda}`
    } else if ((input.indexOf("#media/") == 0) && (input.split("/").length == 2)) {
      const panda = input.slice(7)
      query_string = `panda ${panda}`
    } else if (input.indexOf("#query/") == 0) {
      // process a query.
      query_string = input.slice(7)
      // Reset defaults to entity
      Query.env.output_mode = "entities"
    } else if ((input.indexOf("#zoo/") == 0) && (input.split("/").length == 4)) {
      // link for a panda result with a chosen photo.
      const uri_items = input.slice(5)
      const [ zoo, _, zoo_id ] = uri_items.split("/")
      Query.env.output_mode = "entities"
      Query.env.specific_photo = zoo_id
      query_string = `zoo ${zoo}`
    } else if ((input.indexOf("#zoo/") == 0) && (input.split("/").length == 2)) {
      // link for a single zoo result.
      const zoo = input.slice(5)
      Query.env.output_mode = "entities"
      query_string = `zoo ${zoo}`
    } else {
      // Don't know how to process the hashlink, so do nothing
      return false
    }
    // Run the query through the parser and return results
    return Query.result(query_string)
  }

  /**
   * On initial page load, look for specific hashes that represent special
   * buttons and queue up that page for loading if necessary.
   */
  check() {
    // TODO ES6: refer to methods on singleton classes
    const mode = window.location.hash.split('/')[0]
    if (this.profile.includes(mode))
      env.current = profile.render
    else if (this.media.includes(mode))
      env.current = media.render
    else if (window.location.hash == "#about")
      env.current = about.render
    else if (window.location.hash == "#links")
      env.current = links.render
    else if (window.location.hash == "#options")
      env.current = options.render
    else if (this.dynamic.includes(mode))
      env.current = results.render
    else
      env.current = home.render
  }

  /**
   * Determine if the current page route includes one of the routes
   * specified in the different routes lists above.
   */
  memberOf(routeList, current_route) {
    for (let route of routeList) {
      if (current_route.includes(route)) {
        return true;
      }
    }
    return false
  }
}

/** Singleton class representing the redpandafinder routing behavior */
export const routes = new Routes()

/** 
 * Since primitive values are read-only across import boundaries, these
 * mutable items are considered "page environment" for all the page objects.
 * Defined at the bottom so we can use any of the singleton classes above us.
 */
export var env = {
  /** 
   * When un-clicking Links/About, go back to the last page viewed, or possibly
   * the last panda you searched for.
   */  
  lastSearch: "#home",
  /** 
   * Stores callback to the current page render function for redraws.
   * Default mode is to show panda results.
   */
  current: results.render
}

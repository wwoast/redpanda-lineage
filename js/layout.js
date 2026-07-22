import { Defaults } from './lookup.js'

/**
 * Layout calculation for optimizing the visual space taken by panda families
 * in the search result cards. A layout object should exist for each panda we
 * work with, so instead of tracking state internal to this module, this is
 * implemented as a class. Just call the constructor, and your family data will
 * be arranged and styled in a space-optimal way. 
 * 
 * Other than space, this tries to preserve clarity in unordered-list logical
 * ordering (by birthday), and unambiguous vertical lists (no 2x2 lists)
 */

/** Tells JS to do operations on either a mobile or desktop size window */
export const mediaQuery = () => window.matchMedia("(max-width: 670px)")

/** 
 * Media-query height adjustment listeners, plus making sure the height
 * adjustment works on the initial page load.
 */
mediaQuery().addListener(shrinkNames)
mediaQuery().addListener(recomputeHeight)

/** 
 * Create a divider. This is a horizontal rule element with 100% width. Works
 * great for breaking the flow of either a flex box or a multiColumn box
 */
function divider(className) {
  const breaker = document.createElement('hr')
  breaker.className = "divider"
  breaker.classList.add(className)
  return breaker
}

/**
 * Take a div list, and apply flatten classes to it. When adding a flattened
 * class, we need to add a line-break entity afterwards, and bump the flex box
 * display order of subsequent inserted divs.
 */
function flatten(div, mode) {
  div.childNodes[1].classList.add("double")
  if (mode == "onlyMobile") {
    div.childNodes[1].classList.add("onlyMobile")
  }
  return div
}

/** Take a div list, and apply a column-mode class to it. */
function multiColumn(div, columnCount=2, extraStyle=undefined) {
  if (columnCount == 2) {
    div.childNodes[1].classList.add("double")
    div.classList.add("double")
  }
  if (columnCount == 3) {
    div.childNodes[1].classList.add("triple")
    div.classList.add("triple")
  }
  if (extraStyle != undefined) {
    div.childNodes[1].classList.add(extraStyle)
  }
  return div
}

/**
 * Create all permutations of an input array. This is used to determine the
 * arrangements of parents and children in the layout function
 */
function permutations(input) {
  const results = []
  if (input.length == 1) {
    return input
  }
  for (let i = 0; i < input.length; i++) {
    const firstVal = input[i]
    const valsLeft = input.slice(0, i).concat(input.slice(i + 1))
    const innerPermutations = permutations(valsLeft)
    for (let j = 0; j < innerPermutations.length; j++) {
      results.push([firstVal].concat(innerPermutations[j]))
    }
  }
  return results
}

/**
 * For vertical flow elements, the height is used to display content properly.
 * For now, these vertical flow details only exist in mobile mode, so we can
 * turn them off when setting height values outside mobile.
 */
export function recomputeHeight(e) {
  const families = document.getElementsByClassName("family")
  if ((e.matches == false) || (e.type == "DOMContentLoaded")) {
    // Not in a mobile mode
    for (const family_div of families) {
      if (family_div.classList.contains("onlyMobile")) {
        // Disable height when in desktop mode for onlyMobile divs
        family_div.style.height = "";
      } else {
        // Recalculate height after media query change
        family_div.style.height = family_div.dataset.height_desktop;
      }
    }
  } else {
    for (const family_div of families) {
      // We are in mobile mode
      if (family_div.classList.contains("onlyDesktop")) {
        // Disable height when in mobile mode for onlyDesktop divs
        family_div.style.height = "";
      } else {
        // Recalculate height after media query change
        family_div.style.height = family_div.dataset.height_mobile;
      }
    }
  }
}

/** 
 * Look for span elements that are children of links, in the family bars. Any
 * of these displayed in the page larger than 100px will get shrunk.
 */
export function shrinkNames() {
  const width_check = function(span, element, width_select) {
    let width = element.offsetWidth   // Default to outer width
    if (width_select == "inner") {
      width = span.offsetWidth;
    }
    return width; 
  }
  const shrinker = function(element, nth, width_select, condensed_width) {
    const span = element.childNodes[nth]
    let width = width_check(span, element, width_select)
    if (width > condensed_width) {
      span.classList.add("condensed")
      span.classList.remove("ultraCondensed")
      // Recalculate the width and see if we need to ultra-condense
      width = width_check(span, element, width_select)
      if (width > condensed_width) {
        span.classList.add("ultraCondensed")
        span.classList.remove("condensed")
      }
    }
    // TODO: ES6
    // Fix the spacing for strings that have mixed character sets.
    // Fixes long mixed-range strings like "Erin Curry博士"
    const latin = Defaults.ranges['en'].some(function(range) {
      return range.test(span.innerText);
    });
    const cjk = Defaults.ranges['ja'].some(function(range) {
      return range.test(span.innerText);
    });
    if (latin && cjk) {
      span.classList.add("adjusted");
    }
  }
  const expander = function(element, nth, _, __) {
    const span = element.childNodes[nth]
    span.classList.remove("condensed")
    span.classList.remove("ultraCondensed")
    span.classList.remove("adjusted")
    // Still apply the condenser style to author nodes, so the updates page
    // doesn't have super long names in the author boxes
    var author_nodes = document.getElementsByClassName("caption updateAuthor")
    var more_author_nodes =
      document.getElementsByClassName("caption updateAuthorCredit")
    for (let caption of author_nodes) {
      // shrinker(caption, 0, "inner", caption.clientWidth - 10, caption.clientWidth)
      shrinker(caption, 0, "inner", 160, 170)
    }
    for (let caption of more_author_nodes) {
      // shrinker(caption, 0, "inner", caption.clientWidth - 10, caption.clientWidth)
      shrinker(caption, 0, "inner", 160, 170)
    }
  }
  let action = shrinker
  if (mediaQuery().matches == false)
    action = expander
  const link_nodes = document.getElementsByClassName("geneaologyListName")
  const birthday_nodes = document.getElementsByClassName("caption birthdayMessage")
  const memorial_nodes = document.getElementsByClassName("caption memorialMessage")
  const author_nodes = document.getElementsByClassName("caption updateAuthor")
  const more_author_nodes = document.getElementsByClassName("caption updateAuthorCredit")
  const media_author_nodes = document.getElementsByClassName("caption groupMediaAuthor")
  for (const link of link_nodes)
    shrinker(link, 1, "outer", 125)
  for (const caption of birthday_nodes)
    action(caption, 0, "inner", 130)
  for (const caption of memorial_nodes)
    action(caption, 0, "inner", 130)
  for (const caption of author_nodes)
    action(caption, 0, "inner", 130)
  for (const caption of more_author_nodes)
    action(caption, 0, "inner", 130)
  for (const caption of media_author_nodes)
    action(caption, 0, "inner", 130)
}

/**
 * Instance a Layout object for arranging the names of panda relatives in a
 * results card, to minimize the amount of vertical space the relative names
 * take up on the page.
 */
export default class Layout {
  /**
   * All details of creating new content and arranging that content happens in
   * the `layout` namespace. This includes layout rules, list ordering, and the
   * actual HTMLNode containers of div contents.
   */
  layout = {
    /** 
     * Flex box order. Determines display groupings. In the arrange methods,
     * increment whenever we plan on making a new row.
     */
    boxOrder: 0,
    /**
     * Cutoffs for the number of columns in a multi-column list. `m[2] = 4`
     * here means a two-column list must have greater than 4 items in it.
     */ 
    cutoffs: [0, 0, 4, 8, 16],
    /**
     * Distance in list-count since the last divider. When this gets to two,
     * or after a flat element, a divider should be added
     */
    distance: 0,
    /**
     * Modal check to add a divider to the layout flow. May be `true`/`false`,
     * or a `mobileOnly` setting
     */
    dividerMode: false,
    /**
     * Height values to apply to the family box/DOM node when in vertical-flow
     * mode on desktop. This is required for the flex box to properly flow the
     * child elements. The default values here are arbitrary!
     */
    height_desktop: "500px",
    /**
     * Height values to apply to the family box/DOM node when in vertical-flow
     * mode on mobile. This is required for the flex box to properly flow the
     * child elements. The default values here are arbitrary!
     */
    height_mobile: "500px",
    /** 
     * The default order of parents/litter/siblings/children in the flow of
     * the family box/DOM node
     */
    list_default: ["parents", "litter", "siblings", "children"],
    /** 
     * The modified or selected order of parents/litter/siblings/children in
     * the flow of the family box/DOM node, with items removed if no siblings
     * or litter or children are known/present.
     */
    list_order: ["parents", "litter", "siblings", "children"],
  }
  /** 
   * Number of animals for laying out in each of the parent, litter, siblings,
   * and children columns. If one parent is unknown, we insert a "star-parent"
   * 👩‍🎤👨‍🎤 entry and count that towards the layout totals here.
   */
  num = {
    children: 0,
    litter: 0,
    parents: 0,
    siblings: 0
  }
  /** 
   * The DOM nodes themselves for the parents, litter, siblings, and children
   * lists. They are all contained in the family DOM node once the layout code
   * has finished its job.
   */
  section = {
    children: undefined,
    family: undefined,
    litter: undefined,
    parents: undefined,
    siblings: undefined
  }

  /** Set the initial layout state, and perform a layout computation */
  constructor(family, info, parents, litter, siblings, children) {
    // The first case accounts for uncertainty (i.e. a panda has 2+ possible
    // moms or dads). The second case accounts for if a mom or dad is not
    // recorded, we fill in an unknown "star-mom 👩‍🎤" or "star-dad 👨‍🎤".
    const parentCount =
      ((info.dad.length > 1) || (info.mom.length > 1))
        ? info.dad.length + info.mom.length
        : ((info.dad.length > 0) || (info.mom.length > 0))
          ? 2 
          : 0
    this.num = {
      parents: parentCount,
      litter: info.litter.length,
      siblings: info.siblings.length,
      children: info.children.length
    }
    this.section = {
      children: children,
      family: family,
      litter: litter,
      parents: parents,
      siblings: siblings
    }
    // Now start performing the layout computations
    const sum = this.sum()
    const orders = permutations(this.layout.list_order)
    // Find the name of an arrangement function based on the list counts.
    // divn_parentcnt_littercnt_siblingcnt_childcnt => example: div6_2_1_3_0
    let arrangeId = undefined;
    for (const order of orders) {
      this.layout.list_order = order
      const test = `div${sum}_${order.map(list => this.num[list]).join("_")}`
      if (test in this.switchboard) {
        arrangeId = test
        break
      }
    }
    // Call an arrangement function if it exists. If not, use a default layout heuristic.
    // This will result in an updated this.arrangement.family div getting written.
    if (arrangeId != undefined) {
      this.switchboard[arrangeId]()
    } else {
      this.arrange.default()
    }
    return this.section.family
  }

  /** Get the number of non-empty columns */
  existingColumns() {
    return Object.values(this.num).filter(a => a != 0).length
  }

  /** Find the list with the most pandas in it */
  longestList() {
    return Object.values(this.num).reduce((a, b) => a > b ? a : b)
  }

  /**
   * In the cutoff array that describes how many columns to use, find the first
   * value greater than the number of elements in the list you're measuring.
   * Then, step back one entry in that array, and that index to the cutoff
   * array becomes the CSS column-count for the list.
   * 
   * In other words, the cutoff column reads the number of list items underneath
   * which it should remain in n columns.
   */
  multiColumnCount(list_len) {
    const cutoffs = this.layout.cutoffs
    return cutoffs.indexOf(cutoffs.filter(x => x >= list_len)[0]) - 1
  }

  /**
   * Clear state after doing a layout operation. Partial clears are useful
   * after adding a divider, so support that as the default.
   */
  resetCounters(mode="partial") {
    if (mode=="all") {
      this.layout.boxOrder = 0
      this.layout.list_order = this.layout.list_default
    }
    this.layout.distance = 0
    this.layout.dividerMode = false
  }

  /** 
   * A layout sum of parents, litter, siblings, and children. This includes
   * "star-parents 👩‍🎤👨‍🎤" which are unknown.
   */
  sum() {
    return this.num.parents + 
           this.num.litter + 
           this.num.siblings + 
           this.num.children
  }

  /** 
   * Lots of different layout arrangements, which are grouped inside this
   * namespace, all so we can operate on a specific instance of layout state
   * for any given search result card.
   */
  arrange = {
    /** 
     * This may be the basis of a basic layout which takes arguments:
     * _flattenTop_, _multiColumn_, _others_.
     * Take all inputs and display as straight columns.
     */
    columns: (nobreak=false) => {
      // Specific list values that exist (this.section["parents"] = HTMLElement)
      const lists = this.layout.list_default
        .map(x => this.section[x])
        .filter(x => x != undefined)
      // Add line breaks after every two columns, and add order values to every item
      for (let i = 0; i < lists.length; i++) {
        const cur_list = lists[i]
        cur_list.style.order = this.layout.boxOrder++
        this.section.family.append(cur_list)
        this.layout.distance++
        if ((this.distance == 2) && (nobreak != true)) {
          const breaker = divider("onlyMobile")
          breaker.style.order = this.layout.boxOrder++
          this.section.family.append(breaker)
          this.resetCounters("breakers")
        }
      }
      // Return distance/flexBreaker counters to default values
      this.resetCounters("all")
    },
    /**
     * Take the longest column and make into a multicolumn list. Any other
     * columns that exist should be displayed as straight columns. Mode can
     * be "onlyMobile", "onlyDesktop", or "both".
     * TODO: have modes for both the breakers and the multicolumn classes
     */
    oneMultiColumn: (columns=0, breaker_mode="both", column_mode="both") => {
      // Decide which line breaker mode to use based on whether this comes after
      // a multicolumn, or just in the normal flow of adding columns
      let breaking_style = breaker_mode
      // The list order we're dealing with (strings "parents", "litter")
      const order = this.layout.list_default
        .filter(x => this.section[x] != undefined);
      // Specific list values that exist (this["parents"] = HTMLElement, ...)
      const lists = this.layout.list_default
        .map(x => this.section[x])
        .filter(x => x != undefined)
      // Add line breaks after every two columns, and order-values to every item
      for (let i = 0; i < lists.length; i++) {
        const cur_list = lists[i]
        cur_list.style.order = this.layout.boxOrder++
        const list_name = order[i]
        const list_len = this.num[list_name]
        // What the multicolumn split should be
        if (list_len == this.longestList()) {
          let mc_count = columns
          if (mc_count == 0)
            mc_count = this.multiColumnCount(list_len)
          multiColumn(cur_list, mc_count)
          // Add a divider based on input mode
          this.layout.dividerMode = column_mode
          breaking_style = column_mode   // Will do an after-column-style break
        }
        this.section.family.append(cur_list)
        this.layout.distance++
        if ((this.layout.distance == 2) || (this.layout.dividerMode != false)) {
          const breaker = divider(breaking_style)
          breaker.style.order = this.layout.boxOrder++
          this.section.family.append(breaker)
          this.resetCounters("breakers")
          breaking_style = breaker_mode   // Revert to normal break style
        }
      }
      // Return distance/flexBreaker counters to default values
      this.resetCounters("all")
    },
    /**
     * Turn all lists into multi-columns on mobile, while only doing the long
     * lists as multi-column on the desktop.
     */
    allMultiColumns: (columns=0, breaker_mode="both", column_mode="both") => {
      // Decide which line breaker mode to use based on whether this comes after
      // a multicolumn, or just in the normal flow of adding columns
      let breaking_style = breaker_mode
      // The list order we're dealing with (strings "parents", "litter")
      const order = this.layout.list_default
        .filter(x => this.section[x] != undefined)
      // Specific list values that exist (this.section["parents"] = HTMLElement)
      const lists = this.layout.list_default
        .map(x => this.section[x])
        .filter(x => x != undefined);
      // Add line breaks after every two columns, and order-values to every item
      for (let i = 0; i < lists.length; i++) {
        const cur_list = lists[i]
        cur_list.style.order = this.layout.boxOrder++;
        const list_name = order[i]
        const list_len = this.num[list_name]
        // What the multicolumn split should be. Flatten two-item lists also
        if (list_len <= 2) {
          multiColumn(cur_list, 2, "onlyMobile")
        } else {
          let mc_count = columns
          if (mc_count == 0)
            mc_count = this.multiColumnCount(list_len)
          multiColumn(cur_list, mc_count)
        }
        this.layout.dividerMode = column_mode   // Add a divider based on input mode
        breaking_style = column_mode   //Will do an after-column-style break
        this.section.family.append(cur_list)
        this.layout.distance++
        if ((this.layout.distance == 2) || (this.layout.dividerMode != false)) {
          var breaker = divider(breaking_style)
          breaker.style.order = this.layout.boxOrder++
          this.section.family.append(breaker)
          this.resetCounters("breakers")
          breaking_style = breaker_mode   // Revert to normal break style
        }
      }
      // Return distance/flexBreaker counters to default values
      this.resetCounters("all")
    },
    /** Flatten a single column (the first one) both on mobile and desktop */
    flattenSimple: (mode="onlyMobile") => {
      // Specific list values that exist (this.section["parents"] = HTMLElement)
      const lists = this.layout.list_default
        .map(x => this.section[x])
        .filter(x => x != undefined);
      // Add line breaks after every two columns, and order-values to every item
      for (let i = 0; i < lists.length; i++) {
        const cur_list = lists[i]
        cur_list.style.order = this.layout.boxOrder++
        // Flatten the first list
        if (i == 0) {
          flatten(cur_list, mode)
          this.layout.dividerMode = mode
        }
        this.section.family.append(cur_list)
        this.distance++
        if ((this.layout.distance == 2) || (this.layout.dividerMode != false)) {
          const breaker = divider("onlyMobile")
          breaker.style.order = this.boxOrder++
          this.section.family.append(breaker)
          this.resetCounters("breakers")
        }
      }
      // Return distance/flexBreaker counters to default values
      this.resetCounters("all")
    },
    /** 
     * Combination of flattenTop and multiColumn.
     * 
     * TODO: need desktop or mobile modal flags for BOTH the flattening and the
     * multicolumn mode
     */
    flattenPlusMultiColumn: (columns=0, breaker_mode="both", column_mode="both") => {
      // Decide which line breaker mode to use based on whether this comes after
      // a multicolumn, or just in the normal flow of adding columns
      let breaking_style = breaker_mode
      // The list order we're dealing with (strings "parents", "litter")
      const order = this.layout.list_default
        .filter(x => this.section[x] != undefined);
      // Specific list values that exist (this.section["parents"] = HTMLElement)
      const lists = this.layout.list_default
        .map(x => this.section[x])
        .filter(x => x != undefined)
      // Add line breaks after every two columns, and order-values to every item
      for (let i = 0; i < lists.length; i++) {
        const cur_list = lists[i]
        cur_list.style.order = this.layout.boxOrder++
        const list_name = order[i]
        const list_len = this.num[list_name]
        // Flatten the first list, but only on mobile.
        if (i == 0)
          flatten(cur_list, "onlyMobile")
        // What the multicolumn split should be
        let mc_count = columns;
        if (mc_count == 0)
          mc_count = this.multiColumnCount(list_len)
        if (list_len == this.longestList()) {
          multiColumn(cur_list, mc_count)
          // Add a divider based on input mode
          this.layout.dividerMode = column_mode
          breaking_style = column_mode   // Will do an after-column-style break
        }
        this.section.family.append(cur_list)
        this.layout.distance++
        // Add a divider unless we've just processed the final column
        if (((this.layout.distance == 2) || (this.layout.dividerMode != false)) && 
            (i != lists.length - 1)) {
          const breaker = divider(breaking_style)
          breaker.style.order = this.boxOrder++
          this.section.family.append(breaker)
          this.resetCounters("breakers")
          breaking_style = breaker_mode   // Revert to normal break style
        }
      }
      // Return distance/flexBreaker counters to default values
      this.resetCounters("all")
    },
    /**
     * For a four-column layout with 2, 2, 1, long orientation, we want a
     * three-multicolumn on desktop, and a two-multicolumn on mobile. Put the
     * two-width lists first, followed by the one-width lists, and then lastly,
     * the long list. If it's a 2, 1, 1 orientation, flatten the parents list.
     */
    fourListOneLong: () => {
      // The list order we're dealing with (strings "parents", "litter")
      const order = this.layout.list_default
        .filter(x => this.section[x] != undefined)
      // Change the list order so that it's most to least, and then put the
      // longest list at the end. This guarantees best spread on desktop and
      // mobile.
      order.sort((a, b) => this.num[b] > this.num[a] ? 1 : -1)
      order.push(order[0])
      order.shift()
      // Put parent at the beginning of the list regardless
      order.splice(order.indexOf("parents"), 1)
      order.unshift("parents")
      // Specific list values that exist (this["parents"] = HTMLElement)
      const lists = order.map(x => this.section[x]).filter(x => x != undefined)
      for (let i = 0; i < lists.length; i++) {
        const cur_list = lists[i]
        cur_list.style.order = this.layout.boxOrder++
        const list_name = order[i]
        const list_len = this.num[list_name]
        // If both the short columns are length 1, flatten the parents list
        // but only on mobile.
        if (this.num[order[1]] == 1 && this.num[order[2]] == 1 && i == 0) {
          flatten(cur_list, "onlyMobile")
        }
        const mc_count = 3   // Collapses to 2 on mobile if needed
        if (list_len == this.longestList()) {
          multiColumn(cur_list, mc_count)
        }
        this.section.family.append(cur_list)
        this.layout.distance++
        // Add a divider unless we've just processed the final column
        if (((this.layout.distance == 3) || (this.layout.dividerMode != false)) && 
            (i != lists.length - 1)) {
          const breaker = divider("both")
          breaker.style.order = this.layout.boxOrder++
          this.section.family.append(breaker)
          this.resetCounters("breakers")
        }
      }
      // Return distance/flexBreaker counters to default values
      this.resetCounters("all")
    },
    /**
     * Four-column layouts are the trickiest, and when two of those columns are
     * very long, we need to do a multi-column flow where the short columns
     * squeeze left, and the longer ones get flattened into 2-wide-multicols or
     * 3-wide-multicols.
     */
    fourListTwoLong: (mode="onlyDesktop") => {
      this.section.family.classList.add("vertical")
      if (mode == "onlyDesktop") {
        this.section.family.classList.add(mode)
      }
      // Balance columns modeled as single-column-lists
      const split_point = this.balance.verticalTwoMultiColumns()
      // Iterate through the list order
      for (let i = 0; i < this.layout.list_order.length ; i++) {
        const list_name = this.layout.list_order[i]
        const cur_list = this.section[list_name]
        const list_len = this.num[list_name]
        // Set a multicolumn if necessary
        if ((list_len >= 3) && (list_name != "litter")) {
          multiColumn(cur_list)
        }
        else if ((i == 3) && (list_len > 1)) {
          multiColumn(cur_list)
        }
        cur_list.style.order = this.layout.boxOrder++;   // Force to show last
        this.section.family.append(cur_list)
      }
      // Set height of the container div based on balancing info.
      if (mediaQuery().matches == false) {
        // Use the desktop height in desktop mode
        this.section.family.style.height = this.layout.height_desktop;
        // Store this value on the div for later use
        this.section.family.dataset.height_desktop = this.layout.height_desktop
      }
      // Return distance/flexBreaker counters to default values
      this.resetCounters("all")
    },
    /** 
     * When sparse columns stacked up may be nearly as long as a third column,
     * kick the little ones out and let the longer column run. If a fourth
     * column appears, display it underneath the long column.
     * 
     * hr/line breaks in vertical flow don't work. Uses a height constraint to
     * influence the final displayed flow. Also see the mediaQuery event
     * listeners in this module.
     */
    longRun: (mode="onlyMobile") => {
      this.section.family.classList.add("vertical")
      if (mode == "onlyMobile") {
        this.section.family.classList.add(mode)
      }
      // Balance columns modeled as single-column-lists
      const split_point = this.balance.verticalMobile()
      // Iterate through the list order
      for (let i = 0; i < this.layout.list_order.length ; i++) {
        const list_name = this.layout.list_order[i]
        const cur_list = this.section[list_name]
        cur_list.style.order = this.boxOrder++
        this.section.family.append(cur_list)
      }
      // Set height of the container div based on balancing info
      // Make sure it applies immediately
      if (mediaQuery().matches == true)
        this.section.family.style.height = this.layout.height_mobile
      // Store this value on the div for later use
      this.section.family.dataset.height_mobile = this.layout.height_mobile
      // Return distance/flexBreaker counters to default values
      this.resetCounters("all")
    },
    /**
     * With three columns, and one of them long, we often need to flow two of
     * them into a single column. On mobile row-flow might be fine, but on desktop, 
     * column-flow is preferable. We still need multi-column lists though, and
     * calculating the list heights will depend on how flattened these multicolumn
     * lists might be. Assumes the multi-column list is only two-wide, since the
     * first column is already used by two short columns.
     */
    threeListOneLong: (mode="onlyDesktop") => {
      this.section.family.classList.add("vertical")
      if (mode == "onlyDesktop") {
        this.section.family.classList.add(mode)
      }
      // Balance columns modeled as single-column-lists
      const split_point = this.balance.verticalOneMultiColumn(2)
      // Iterate through the list order
      for (let i = 0; i < this.layout.list_order.length ; i++) {
        const list_name = this.layout.list_order[i]
        const cur_list = this.section[list_name]
        const list_len = this.num[list_name]
        // Set a multicolumn if necessary
        if (list_len == this.longestList()) {
          multiColumn(cur_list, 2)
          // Force to show last
          cur_list.style.order = this.existingColumns()
        } else {
          cur_list.style.order = this.boxOrder++
        }
        this.section.family.append(cur_list)
      }
      // Set height of the container div based on balancing info
      // Make sure it applies immediately
      if (mediaQuery().matches == false)
        this.section.family.style.height = this.layout.height_desktop
      // Store this value on the div for later use
      this.section.family.dataset.height_desktop = this.layout.height_desktop
      // Return distance/flexBreaker counters to default values
      this.resetCounters("all")
    },
    /**
     * If the switchboard lookup finds no arrangement, use these default
     * heuristics:
     * 
     * Two columns, one short and one long? `flattenTopMultiColumn`
     * 
     * Similar columns no deeper than four? `columns`
     * 
     * A long column, two shorts, and long column is 8 or less? `longRun`
     * 
     * A long column, two shorts, and long column is 9 or more: `multiColumn`
     * 
     * Two long columns, shorter <= 5, longest >= 8? `longRun`
     * 
     * A long column of 9+? Take all columns >= 5 and `multiColumn` them
     */
    default: () => {
      // Heuristics based on column sizing. More specific to less specific 
      if ((this.longestList() > 4) && (this.existingColumns() == 1)) {
        // One really long column? Multi-column-split it based on available space. TEST: Pam
        return this.arrange.oneMultiColumn();
      } else if ((this.longestList() <= 6) && (this.existingColumns() == 3)) {
        return this.arrange.longRun("onlyMobile");
      } else if ((this.longestList() >= 8) && (this.existingColumns() == 4) && 
                (this.sum() - this.longestList() >= this.longestList())) {
        return this.arrange.fourListTwoLong("onlyDesktop");
      } else if ((this.longestList() >= 8) && (this.existingColumns() == 4) &&
                (this.sum() - this.longestList() <= 5)) {
        // TEST: Luna / Akiyoshidai
        return this.arrange.fourListOneLong();
      } else if ((this.longestList() >= 8) && (this.existingColumns() == 3) && 
                 (this.sum() - this.longestList() >= this.longestList())) {
        // TEST: Koto
        return this.arrange.longRun("onlyMobile");
      } else if ((this.longestList() <= 9) && (this.existingColumns() == 4)) {
        return this.arrange.longRun("onlyMobile");
      } else if ((this.longestList() > 9) && (this.existingColumns() == 4)) {
        // TEST: Seita
        return this.arrange.fourListTwoLong("onlyDesktop");
      } else if ((this.longestList() > 5) && (this.existingColumns() == 3) && (this.sum() - this.longestList() <= 4)) {
        return this.arrange.threeListOneLong("onlyDesktop");
      } else if ((this.longestList() > 5) && (this.existingColumns() == 3) && 
                (this.sum() - this.longestList() - 2 >= 3)) {
        // TEST: Futa, Beilei 2010. 
        // TODO: layout mode that can triple a long column underneath balanced top ones
        return this.arrange.longRun("onlyMobile")
      } else if ((this.longestList() > 5) && 
                 (this.existingColumns() == 2) &&
                 (this.sum() - this.longestList() <= 2)) {
        // Two parents, and a long multicolumn below. TEST: Fan-Fan, Marimo
        return this.arrange.flattenPlusMultiColumn(2)
      } else {
        // Fallback: just treat everything like a single column
        return this.arrange.columns();
      }
    }
  }

  /** 
   * Namespace for instance methods that calculate height estimates and
   * multi-column split points.
   */
  balance = {
    /**
     * Given a multicolumn mobile layout with two lanes for lists, determine
     * the optimal balance of column content. The parents will always appear
     * first, but other elements can have line breaks inserted to change the
     * balance. This will change the layout.list_order. Returns the split point
     * for displaying the columns we want, and sets the max `layout.height_*`.
     */
    verticalMobile: () => {
      // Ordering permutations we want to try. 
      const valid_list = this.layout.list_default
        .filter(x => this.num[x] != 0)
      // Always keep parents first, or whatever the earliest valid entry is
      // Litter should never come last unless... TODO
      const listPermutations = permutations(valid_list)
        .filter(x => x[0] == valid_list[0])
      // How many lines worth of space do we count the gap between lists?
      // Two lines, since it's spacing and a column header
      const between_list_pad = 2
      // Estimated height of our lines, based on 14pt and padding. Also, necessary
      // values to calculate the final box-height.
      const line_height = "35px"
      const list_count_height = "22px"
      // Our desired order and spacing. Split at the middle by default, rounded down
      let minimum_space = Math.pow(2, 32) - 1
      let minimum_split = Math.floor(valid_list.length / 2)
      for (const list_order of listPermutations) {
        for (const list_name of list_order) {
          if (list_name == list_order[list_order.length - 1]) {
            break;   // Exit the inner loop
          }
          const split_point = list_order.indexOf(list_name)
          const left_no_lists = split_point + 1
          const right_no_lists = list_order.length - left_no_lists
          // Padding between lists is taken into account
          const left_padding = between_list_pad * (left_no_lists - 1)
          const right_padding = between_list_pad * (right_no_lists - 1)
          // Isolate left and right sides, and calculate the spacing difference
          const left_lists = list_order.slice(0, split_point + 1)
          const right_lists =
            list_order.slice(split_point + 1, this.layout.list_default.length + 1)
          // Array accumulator to count number of list entries in a desired set of lists
          const left_sum =
            left_lists.map(x => 
              this.num[x]).reduce((acc, cv) => acc + cv) + left_padding
          const right_sum =
            right_lists.map(x => 
              this.num[x]).reduce((acc, cv) => acc + cv) + right_padding
          const difference = Math.abs(right_sum - left_sum)
          if (difference == 0) {
            // If perfect balance, great! We're done
            this.layout.list_order = list_order
            minimum_split = split_point
            const longest = (left_sum > right_sum) ? left_sum : right_sum
            const longest_list_count = (left_lists.length > right_lists.length)
              ? left_lists.length
              : right_lists.length
            // Account for item line height, and the heading/gap height as well
            this.layout.height_mobile =
              (longest * parseInt(line_height)) +
              (longest_list_count * parseInt(list_count_height))
            return minimum_split
          } else if (difference < minimum_space) {
            // Otherwise, keep optimizing as best we can
            this.layout.list_order = list_order
            minimum_space = difference
            minimum_split = split_point
            const longest = (left_sum > right_sum) ? left_sum : right_sum;
            const longest_list_count = (left_lists.length > right_lists.length)
              ? left_lists.length
              : right_lists.length
            // Account for item line height, and the heading/gap height as well
            this.layout.height_mobile =
              (longest * parseInt(line_height)) +
              (longest_list_count * parseInt(list_count_height))
          } else {
            continue
          }
        }
      }
      // Use best available values stored from the loop
      return minimum_split
    },
    /** Hacky calculation for vertical balance of multicolumn vertical flow */
    verticalOneMultiColumn: (multi_cols) => {
      // How many lines worth of space do we count the gap between lists?
      // Two lines, since it's spacing and a column header
      const between_list_pad = 2
      // Estimated height of our lines, based on 14pt and padding. Also, necessary
      // values to calculate the final box-height.
      const line_height = "42px"
      const list_count_height = "30px"
      // Do list order based on what things exist or not
      this.layout.list_order = this.layout.list_default
        .filter(x => this.num[x] != 0)
      // Max items in the multicolumn list is just the list count / 2
      const squeeze_count = (this.existingColumns() > 3) ? 3 : 2
      const padding = between_list_pad * (parseInt(list_count_height) * squeeze_count)
      // Typically the max number of parents and litter
      const squeeze_num = this.sum() - this.longestList()
      const squeeze_height = padding + (squeeze_num * parseInt(line_height))
      const multi_column_cnt = Math.ceil(this.longestList() / multi_cols)
      const multi_column_height = multi_column_cnt * parseInt(line_height)
      if (multi_column_height > squeeze_height) {
        this.layout.height_desktop = multi_column_height
        return 2   // Split at the third column
      } else {
        this.layout.height_desktop = squeeze_height;
        return 0   // Split at the first column
      }
    },
    /** 
     * Even hackier vertical balancing of two multicolumns. Assume the
     * multicolumns are two-wide, and that they're taller than the left gutter
     */
    verticalTwoMultiColumns: () => {
      this.layout.list_order = this.layout.list_default
      // How many lines worth of space do we count the gap between lists?
      // Two lines, since it's spacing and a column header
      const between_list_pad = 3
      // Estimated height of our lines, based on 14pt and padding. Also, necessary
      // values to calculate the final box-height.
      const line_height = "40px";
      const list_count_height = "40px";
      const sibling_col_cnt = 2;   // TODO: better calculate this
      const children_col_cnt = 2;
      const siblings_num = Math.ceil(this.num.siblings / sibling_col_cnt);
      const children_num = Math.ceil(this.num.children / children_col_cnt);
      const siblings_height = siblings_num * parseInt(line_height);
      const children_height = children_num * parseInt(line_height);
      const padding = between_list_pad * parseInt(list_count_height);
      this.layout.height_desktop = siblings_height + children_height + padding;
      return 2   // Split at the third column
    }
  }

  /**
   * The arrangement switchboard, a shortcut for specific arrangements that
   * are known to be good and working for specific panda result cards.
   */
  switchboard = {
    /** One list item? Simple column layout is fine. */
    div1_1_0_0_0: () => this.arrange.columns(),
    /** Two list items, flattened to save space. TEST: Harumaki (0001) */
    div2_2_0_0_0: () => this.arrange.flattenSimple("both"),
    /** Two list items, in their own columns. */
    div2_1_1_0_0: () => this.arrange.columns(),
    /** Three list item arrangements all use column mode. */
    div3_2_1_0_0: () => this.arrange.columns(),
    div3_0_1_1_1: () => this.arrange.columns(),
    div3_0_0_3_0: () => this.arrange.columns(),
    div3_3_0_0_0: () => this.arrange.columns(),
    /** 
     * Four list items. Two parents and two in a second column. 
     * TEST: Shizuku (0138)
     */
    div4_2_2_0_0: () => this.arrange.columns(),
    /** Four list items. Two in one category and singles. */
    div4_2_1_1_0: () => this.arrange.longRun("onlyMobile"),
    // Four list items. Three in one category
    div4_0_0_3_1: () => this.arrange.columns(),
    /** Four list items. Longer lists will get multiColumn'ed. */
    div4_0_0_4_0: () => this.arrange.columns(),
    /** Four list items. Possible parents */
    div4_4_0_0_0: () => this.arrange.columns(),
    /** Five list items. Two parents and three in a second column. TEST: Keti */
    div5_2_0_3_0: () => this.arrange.columns(),
    /** 
     * Five list items. Two parents and a two/one split.
     * TODO: consider flattenTop for this style of layout
     */
    div5_2_2_1_0: () => this.arrange.longRun("onlyMobile"),
    /** Five list items. Two parents and three other columns */
    div5_2_1_1_1: () => this.arrange.longRun("onlyMobile"),
    /** Five list items. Four in one list, and a fifth */
    div5_0_0_4_1: () => this.arrange.columns(),
    /** Six list items. Two parents and others in a single column */
    div6_2_0_4_0: () => this.arrange.columns(),
    /** Six list items. Two parents and a short split */
    div6_2_1_3_0: () => this.arrange.longRun("onlyMobile"), 
    /** Six list items. Two parents and even columns. TEST: Asahi (0261) */
    div6_2_2_2_0: () => this.arrange.flattenSimple("onlyMobile"),
    /** Six list items. Two parents and spread */
    div6_2_2_1_1: () => this.arrange.columns(),
    /** Six list items. Mostly or all in one column */
    div6_0_0_5_1: () => this.arrange.oneMultiColumn(2),
    /** Six list items. All in two columns */
    div6_0_0_3_3: () => this.arrange.columns(),
    /** Seven list items. Parents, litter, and three siblings */
    div7_2_2_3_0: () => this.arrange.longRun("onlyMobile"),
    /** Seven list items. parents/litter/siblings/children, straight columns */
    div7_2_2_2_1: () => this.arrange.columns(),
    /** 
     * Seven list items. A predominant list with parents. The three item list is
     * last, but we can shift it up a little. TEST: Gin (0017)
     */
    div7_2_1_3_1: () => this.arrange.longRun("onlyMobile"),
    /** 
     * Seven list items. A predominant list with no litter. Place the one below
     * the parents, and the four kicked right.
     */
    div7_2_0_4_1: () => this.arrange.longRun("onlyMobile"),
    /** Eight list items. Two animals per list type */
    div8_2_2_2_2: () => this.arrange.columns(),
    /** Eight list items. Mostly balanced but a three-and-one on the right */
    div8_2_2_3_1: () => this.arrange.longRun("onlyMobile"),
    /** Eight list items, a long column and two shorties */
    div8_2_2_4_0: () => this.arrange.longRun("onlyMobile"),
    div8_2_1_5_0: () => this.arrange.longRun("onlyMobile"),
    /** 
     * Eight list items. Do the four column below the one, but kick it up.
     * TEST: Mitarashi (0282)
     */
    div8_2_1_4_1: () => this.arrange.longRun("onlyMobile"),
    /** Nine items. Do a balancing act. TEST: Shiratama (0285) */
    div9_2_1_4_2: () => this.arrange.longRun("onlyMobile"),
    /** Nine list items. Two single columns sneaking on the left */
    div9_2_1_5_1: () => this.arrange.longRun("onlyMobile"),
    /** 
     * Nine list items. A long column goes multiColumn. On mobile the broader
     * multicolumn lists should shrink down to two columns
     */
    div9_2_2_5_0: () => this.arrange.oneMultiColumn(2, "onlyMobile", "onlyMobile"),
    /** 
     * Nine list items. Parents and two similar length lists. TEST: Mugi (0005)
     */
    div9_2_0_3_4: () => this.arrange.flattenSimple("onlyMobile"),
    /** 
     * Nine list items. Multi-column, and flow the smaller ones left.
     * TEST: Furin (0085)
     */
    div9_2_1_6_0: () => this.arrange.threeListOneLong("onlyDesktop"),
    /** Wouldn't normally flatten the one. Might not need this */
    div9_0_0_8_1: () => this.arrange.flattenPlusMultiColumn(3),
    /** Ten list items. Parents and balanced elsewhere */
    div10_2_0_4_4: () => this.arrange.flattenSimple("onlyMobile"),
    /** Ten list items. Spread out evenly and wide */
    div10_2_2_3_3: () => this.arrange.columns(),
    /** Ten list items. Balance these */
    div10_2_1_4_3: () => this.arrange.longRun("onlyMobile"),
    /** Ten list items. Flatten the top, and multicolumn the largest one */
    div10_2_2_5_1: () => this.arrange.flattenPlusMultiColumn(2),
    /** Another arrangement of that 10 looks better a different way */
    div10_2_1_5_2: () => this.arrange.longRun("onlyMobile"),
    /** 
     * Ten list items. Balanced lists and a muticolumn
     * TODO: On mobile, flatten all the short columns.
     */
    div10_2_2_6_0: () => this.arrange.threeListOneLong("onlyDesktop"),
    /** Ten list items. Sneak the singles down the left */
    div10_2_1_6_1: () => this.arrange.longRun("onlyMobile"),
    /** Ten list items. Too long to be a long run. TEST: Fuuna (0045) */
    div10_2_0_7_1: () => this.arrange.threeListOneLong("onlyDesktop"),
    /** Ten list items. No parents layout, even stevens. Spread out on desktop */
    div10_0_0_5_5: () => this.arrange.oneMultiColumn(2, 'onlyDesktop'),
    /**
     * Ten list items. On mobile this looks fine as two columns.
     * On desktop the multicolumn div needs to be split out.
     */
    div10_0_0_6_4: () => this.arrange.oneMultiColumn(2, 'onlyDesktop'),
    /** Ten list items. Seven-long columns are too much. */
    div10_0_0_7_3: () => this.arrange.flattenPlusMultiColumn(2, 'onlyMobile'),
    /** 
     * Eleven items: force a two-column flatten, since 9 will default to 3
     * columns otherwise
     */
    div11_2_0_9_0: () => this.arrange.flattenPlusMultiColumn(2),
    div11_2_2_7_0: () => this.arrange.threeListOneLong("onlyDesktop"),
    /**
     * Eleven items: do a vertical flow on desktop and mobile
     * TODO: vertical flow on desktop and mobile. Different heights stored.
     * Adjust other code to use special heights for mobile versus desktop.
     * TEST: Yan-Yan (0112)
     */
    // div11_2_1_3_5: () => this.arrange.verticalFlow(),
    /** Twelve items: Force multicolumns to be just two wide */
    div12_2_1_9_0: () => this.arrange.threeListOneLong("onlyDesktop")
  }
}

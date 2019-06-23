/*
    Layout functionality for doing CSS and JS conditionals of panda families
    displayed on the search results pages. A layout object should exist for each 
    panda we work with, so there's no global version of this.
    
    Optimize for the amount of screen space used, clarity in unordered-list
    logical ordering (by birthday), and for unambiguousness in vertical list
    order (no 2x2 lists)
*/

var Layout = {};   /* Namespace */

Layout.L = {};   /* Prototype */

Layout.init = function(family, info, parents, litter, siblings, children) {
  var layout = Object.create(Layout.L);
  // Set up item counts, since this is easier than pulling them from HTML.
  // Either both parents are displayed (one as undefined), or neither.
  if ((info.dad != undefined) || (info.mom != undefined)) {
    layout.num.parents = 2;
  } else {
    layout.num.parents = 0;
  }
  layout.num.litter = info.litter.length;
  layout.num.siblings = info.siblings.length;
  layout.num.children = info.children.length;
  // Make sure children objects checks can see this object's counts
  layout.arrangement.num = layout.num;
  // Set up the divs themselves
  layout.family = layout.arrangement.family = family;
  layout.parents = layout.arrangement.parents = parents;
  layout.litter = layout.arrangement.litter = litter;
  layout.siblings = layout.arrangement.siblings = siblings;
  layout.children = layout.arrangement.children = children;
  return layout;
}

// Is a number between a range of two values?
Layout.between = function(test, a, b, mode) {
  if (mode == "exclusive") {
    return (test > a) && (test < b);
  } else if (mode == "left inclusive") {
    return (test >= a) && (test < b);
  } else if (mode == "right inclusive") {
    return (test > a) && (test <= b);
  } else {   // Inclusive
    return (test >= a) && (test <= b);
  }
}

/* Create a divider. This is a horizontal rule element with 100% width. 
   Works great for breaking the flow of either a flex box or a multiColumn box */
Layout.divider = function(className) {
  var breaker = document.createElement('hr');
  breaker.className = "divider";
  breaker.classList.add(className);
  return breaker;
}

/* Take a div list, and apply flatten classes to it. When adding a flattened class,
   we need to add a line-break entity afterwards, and bump the flex box display
   order of subsequent inserted divs. */
Layout.flatten = function(div, mode) {
  div.childNodes[1].classList.add("double");
  if (mode == "onlyMobile") {
    div.childNodes[1].classList.add("onlyMobile");
  }
  return div;
}

/* Tells JS to do operations on either a mobile or desktop size window */
Layout.media = window.matchMedia("(max-width: 670px)");

/* Take a div list, and apply a column-mode class to it. */
Layout.multiColumn = function(div, columnCount=2, extraStyle=undefined) {
  if (columnCount == 2) {
    div.childNodes[1].classList.add("double");
    div.classList.add("double");
  }
  if (columnCount == 3) {
    div.childNodes[1].classList.add("triple");
    div.classList.add("triple");
  }
  if (extraStyle != undefined) {
    div.childNodes[1].classList.add(extraStyle);
  }
  return div;
}

/* Create all permutations of an input array. This is used to determine the
   arrangements of parents and children in the layout function */
Layout.permutations = function(input) {
  var results = [];
  if (input.length == 1) {
    return input;
  }
  for (var i = 0; i < input.length; i++) {
    var firstVal = input[i];
    var valsLeft = input.slice(0, i).concat(input.slice(i + 1));
    var innerPermutations = this.permutations(valsLeft);
    for (var j = 0; j < innerPermutations.length; j++) {
      results.push([firstVal].concat(innerPermutations[j]));
    }
  }
  return results;
}

/* For vertical flow elements, the height is used to display content properly.
   For now, these vertical flow details only exist in mobile mode, so we can
   turn them off when setting height values outside mobile. */
Layout.recomputeHeight = function(e) {
  var families = document.getElementsByClassName("family");
  if ((e.matches == false) || (e.type == "DOMContentLoaded")) {
    // Not in a mobile mode
    for (family_div of families) {
      if (family_div.classList.contains("onlyMobile")) {
        // Disable height when in desktop mode for onlyMobile divs
        family_div.style.height = "";
      } else {
        // Recalculate height after media query change
        family_div.style.height = family_div.dataset.height_desktop;
      }
    }
  } else {
    for (family_div of families) {
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

// Look for span elements that are children of links, in the family bars.
// Any of these that are displayed in the page larger than 100px, need to get shrunk.
Layout.shrinkNames = function() {
  var shrinker = function(element, nth, width_select, condensed_width, ultraCondensed_width) {
    var span = element.childNodes[nth];
    var width = element.offsetWidth;   // Default to outer width
    if (width_select == "inner") {
      width = span.offsetWidth;
    }
    if (width > ultraCondensed_width) {
      span.classList.add("ultraCondensed");
    } else if (width > condensed_width) {
      span.classList.add("condensed");
    }
    // Fix the spacing for strings that have mixed character sets.
    // Fixes long mixed-range strings like "Erin Curry博士"
    var latin = Pandas.def.ranges['en'].some(function(range) {
      return range.test(span.innerText);
    });
    var cjk = Pandas.def.ranges['jp'].some(function(range) {
      return range.test(span.innerText);
    });
    if (latin && cjk) {
      span.classList.add("adjusted");
    }
  }

  var expander = function(element, nth, _, _) {
    var span = element.childNodes[nth];
    span.classList.remove("condensed");
    span.classList.remove("ultraCondensed");
    span.classList.remove("adjusted");
  }

  var action = shrinker;
  if (Layout.media.matches == false) {
    action = expander;
  }

  var link_nodes = document.getElementsByClassName("geneaologyListName");
  var caption_nodes = document.getElementsByClassName("caption birthdayMessage");
  for (let link of link_nodes) {
    shrinker(link, 1, "outer", 120, 138);
  }
  for (let caption of caption_nodes) {
    action(caption, 0, "inner", 130, 140);
  }
}

/* Media-query height adjustments, plus making sure the height adjustment works
   on the initial page load. */
Layout.media.addListener(Layout.shrinkNames);
Layout.media.addListener(Layout.recomputeHeight);
document.addEventListener("DOMContentLoaded", Layout.recomputeHeight);   

/* Layout manager. Looks at counts of each element, and gives an arrangement */
Layout.L.layout = function() {
  // Given the counts and sum, create a function name to call as an index
  var sum = (this.num.parents + this.num.litter + this.num.siblings + this.num.children).toString();
  var orders = Layout.permutations(this.arrangement.list_order);
  // Find the name of an arrangement function based on the lits counts.
  // divn_parentcnt_littercnt_siblingcnt_childcnt => example: div6_2_1_3_0
  var arrange_id = undefined;
  for (order of orders) {
    this.arrangement.list_order = order;
    var test = "div" + sum + "_" + order.map(list => this.num[list]).join("_");
    if (test in this.arrangement) {
      arrange_id = test;
      break;
    }
  }
  // Call an arrangement function if it exists. If not, use a default layout heuristic.
  // This will result in an updated this.arrangement.family div getting written.
  if (arrange_id != undefined) {
    this.arrangement[arrange_id]();
  } else {
    this.arrangement.default();
  }
  return this.arrangement.family;
}

Layout.L.num = {};
Layout.L.num.parents = 0;
Layout.L.num.litter = 0;
Layout.L.num.siblings = 0;
Layout.L.num.children = 0;

/* All details of creating new content and arranging that content happens in the 
   arrangement object. This includes layout rules, list ordering, and the actual
   HTMLNode containers of div contents. */
Layout.L.arrangement = {};
// Flex box order. Determines display groupings.
// Increment whenever we plan on making a new row.
Layout.L.arrangement.boxOrder = 0;
// Cutoffs for the number of columns in a multi-column list.
// m[2] = 4 here means a two-column list must have greater than 4 items in it.
Layout.L.arrangement.cutoffs = [0, 0, 4, 8, 16];
// Distance in list-count since the last divider. When this gets to two,
// or after a flat element, a divider should be added
Layout.L.arrangement.distance = 0;
// Modal check to add a divider to the layout flow.
// May be true/false, or an mobileOnly options
Layout.L.arrangement.dividerMode = false;
// Height value to apply to the family box when in vertical flow mode.
// This is required for flex-box to properly flow the elements. Arbitrary default
Layout.L.arrangement.height_desktop = "500px";
Layout.L.arrangement.height_mobile = "500px";
// List arrangement values
Layout.L.arrangement.list_default = ["parents", "litter", "siblings", "children"];
Layout.L.arrangement.list_order = ["parents", "litter", "siblings", "children"];
// Cutoffs for the number of columns in a multi-column list.
// m[2] = 4 here means a two-column list must have greater than 4 items in it.
Layout.L.arrangement.cutoffs = [0, 0, 4, 8, 16];
// Actual HTMLNode outputs of this layout tool
Layout.L.arrangement.family = undefined;
Layout.L.arrangement.parents = undefined;
Layout.L.arrangement.litter = undefined;
Layout.L.arrangement.siblings = undefined;
Layout.L.arrangement.children = undefined;

// TODO: this may be the basis of a basic layout which takes arguments:
// flattenTop, multiColumn, others.
// Take all inputs and display as straight columns.
Layout.L.arrangement.columns = function(nobreak=false) {
  // Specific list values that exist (this["parents"] = HTMLElement, ...)
  var lists = this.list_default.map(x => this[x]).filter(x => x != undefined);
  // Add line breaks after every two columns, and add order values to every item
  for (let i = 0; i < lists.length; i++) {
    var cur_list = lists[i];
    cur_list.style.order = this.boxOrder++;
    this.family.append(cur_list);
    this.distance++;
    if ((this.distance == 2) && (nobreak != true)) {
      var breaker = Layout.divider("onlyMobile");
      breaker.style.order = this.boxOrder++;
      this.family.append(breaker);
      this.resetCounters("breakers");
    }
  }
  // Return distance/flexBreaker counters to default values
  this.resetCounters("all");
}

/* Given either a value or a range of values, validate that the available animals
   in that list matches the count given of them. For simplicity, assume inclusive */
Layout.L.arrangement.count = function(p=0, l=0, s=0, c=0) {
  // Create ranges out of inputs
  var range = {
    "parents": p,
    "litter": l,
    "siblings": s,
    "children": c
  };
  // Standardize on ranges
  for (key in range) {
    value = range[key];
    if (isFinite(arg)) {
      range[key] = [value, value]
    } else if (Array.isArray(value)) {
      if (isFinite(value[0]) && isFinite(value[1])) {
        range[key] = [value[0], value[1]];
      } else {
        range[key] = [0, 0];
      }
    }
  }
  // Confirm the values of each input
  return ((Layout.between(this.num.parents, range["parents"][0], range["parents"][1])) &&
          (Layout.between(this.num.litter, range["litter"][0], range["litter"][1])) &&
          (Layout.between(this.num.siblings, range["siblings"][0], range["siblings"][1])) &&
          (Layout.between(this.num.children, range["children"][0], range["children"][1])));
}

// Take the longest column and make into a multicolumn list.
// Any other columns that exist should be displayed as straight columns.
// Mode can be "onlyMobile", "onlyDesktop", or "both".
// TODO: have modes for both the breakers and the multicolumn classes
Layout.L.arrangement.oneMultiColumn = function(columns=0, breaker_mode="both", column_mode="both") {
  // Decide which line breaker mode to use based on whether this comes after
  // a multicolumn, or just in the normal flow of adding columns
  var breaking_style = breaker_mode;
  // The list order we're dealing with (strings "parents", "litter")
  var order = this.list_default.filter(x => this[x] != undefined);
  // Specific list values that exist (this["parents"] = HTMLElement, ...)
  var lists = this.list_default.map(x => this[x]).filter(x => x != undefined);
  // Add line breaks after every two columns, and add order values to every item
  for (let i = 0; i < lists.length; i++) {
    var cur_list = lists[i];
    cur_list.style.order = this.boxOrder++;
    var list_name = order[i];
    var list_len = this.num[list_name];
    // What the multicolumn split should be
    if (list_len == this.longestList()) {
      var mc_count = columns;
      if (mc_count == 0) { mc_count = this.multiColumnCount(list_len) }
      Layout.multiColumn(cur_list, mc_count);
      this.dividerMode = column_mode;   /* Add a divider based on input mode */
      breaking_style = column_mode;     /* Will do an after-column-style break */
    }
    this.family.append(cur_list);
    this.distance++;
    if ((this.distance == 2) || (this.dividerMode != false)) {
      var breaker = Layout.divider(breaking_style);
      breaker.style.order = this.boxOrder++;
      this.family.append(breaker);
      this.resetCounters("breakers");
      breaking_style = breaker_mode;   /* Revert to normal break style */
    }
  }
  // Return distance/flexBreaker counters to default values
  this.resetCounters("all");
}

// Turn all lists into multi-columns on mobile, while only doing the long lists as
// multi-column on the desktop.
Layout.L.arrangement.allMultiColumns = function(columns=0, breaker_mode="both", column_mode="both") {
  // Decide which line breaker mode to use based on whether this comes after
  // a multicolumn, or just in the normal flow of adding columns
  var breaking_style = breaker_mode;
  // The list order we're dealing with (strings "parents", "litter")
  var order = this.list_default.filter(x => this[x] != undefined);
  // Specific list values that exist (this["parents"] = HTMLElement, ...)
  var lists = this.list_default.map(x => this[x]).filter(x => x != undefined);
  // Add line breaks after every two columns, and add order values to every item
  for (let i = 0; i < lists.length; i++) {
    var cur_list = lists[i];
    cur_list.style.order = this.boxOrder++;
    var list_name = order[i];
    var list_len = this.num[list_name];
    // What the multicolumn split should be. Flatten two-item lists also
    if (list_len <= 2) {
      Layout.multiColumn(cur_list, 2, "onlyMobile");
    } else {
      var mc_count = columns;
      if (mc_count == 0) { mc_count = this.multiColumnCount(list_len) }
      Layout.multiColumn(cur_list, mc_count);
    }
    this.dividerMode = column_mode;   /* Add a divider based on input mode */
    breaking_style = column_mode;     /* Will do an after-column-style break */
    this.family.append(cur_list);
    this.distance++;
    if ((this.distance == 2) || (this.dividerMode != false)) {
      var breaker = Layout.divider(breaking_style);
      breaker.style.order = this.boxOrder++;
      this.family.append(breaker);
      this.resetCounters("breakers");
      breaking_style = breaker_mode;   /* Revert to normal break style */
    }
  }
  // Return distance/flexBreaker counters to default values
  this.resetCounters("all");
}

// Flatten a single column (the first one) both on mobile and desktop
Layout.L.arrangement.flatten = function(mode="onlyMobile") {
  // Specific list values that exist (this["parents"] = HTMLElement, ...)
  var lists = this.list_default.map(x => this[x]).filter(x => x != undefined);
  // Add line breaks after every two columns, and add order values to every item
  for (let i = 0; i < lists.length; i++) {
    var cur_list = lists[i];
    cur_list.style.order = this.boxOrder++;
    // Flatten the first list
    if (i == 0) {
      Layout.flatten(cur_list, mode);
      this.dividerMode = mode;
    }
    this.family.append(cur_list);
    this.distance++;
    if ((this.distance == 2) || (this.dividerMode != false)) {
      var breaker = Layout.divider("onlyMobile");
      breaker.style.order = this.boxOrder++;
      this.family.append(breaker);
      this.resetCounters("breakers");
    }
  }
  // Return distance/flexBreaker counters to default values
  this.resetCounters("all");
}

// Combination of flattenTop and multiColumn.
// TODO: need desktop or mobile modal flags for BOTH the flattening and the multicolumn mode
Layout.L.arrangement.flattenPlusMultiColumn = function(columns=0, breaker_mode="both", column_mode="both") {
  // Decide which line breaker mode to use based on whether this comes after
  // a multicolumn, or just in the normal flow of adding columns
  var breaking_style = breaker_mode;
  // The list order we're dealing with (strings "parents", "litter")
  var order = this.list_default.filter(x => this[x] != undefined);
  // Specific list values that exist (this["parents"] = HTMLElement, ...)
  var lists = this.list_default.map(x => this[x]).filter(x => x != undefined);
  // Add line breaks after every two columns, and add order values to every item
  for (let i = 0; i < lists.length; i++) {
    var cur_list = lists[i];
    cur_list.style.order = this.boxOrder++;
    var list_name = order[i];
    var list_len = this.num[list_name];
    // Flatten the first list, but only on mobile.
    if (i == 0) {
      Layout.flatten(cur_list, "onlyMobile");
    }
    // What the multicolumn split should be
    var mc_count = columns;
    if (mc_count == 0) { mc_count = this.multiColumnCount(list_len) }
    if (list_len == this.longestList()) {
      Layout.multiColumn(cur_list, mc_count);
      this.dividerMode = column_mode;   /* Add a divider based on input mode */
      breaking_style = column_mode;     /* Will do an after-column-style break */
    }
    this.family.append(cur_list);
    this.distance++;
    // Add a divider unless we've just processed the final column
    if (((this.distance == 2) || (this.dividerMode != false)) && (i != lists.length - 1)) {
      var breaker = Layout.divider(breaking_style);
      breaker.style.order = this.boxOrder++;
      this.family.append(breaker);
      this.resetCounters("breakers");
      breaking_style = breaker_mode;   /* Revert to normal break style */
    }
  }
  // Return distance/flexBreaker counters to default values
  this.resetCounters("all");
}

// For a four-column layout with 2, 2, 1, long orientation, we want a three-multicolumn
// on desktop, and a two-multicolumn on mobile. Put the two-width lists first, followed by
// the one-width lists, and then lastly, the long list. If it's a 2, 1, 1 orientation,
// flatten the parents list.
Layout.L.arrangement.fourListOneLong = function() {
  // The list order we're dealing with (strings "parents", "litter")
  var order = this.list_default.filter(x => this[x] != undefined);
  // Change the list orders so that it's most to least, and then put the longest list
  // at the end. This guarantees best spread on desktop and mobile.
  order.sort((a, b) => this.num[b] > this.num[a] ? 1 : -1);
  order.push(order[0]);
  order.shift();
  // Put parent at the beginning of the list regardless
  order.splice(order.indexOf("parents"), 1);
  order.unshift("parents");
  // Specific list values that exist (this["parents"] = HTMLElement, ...)
  var lists = order.map(x => this[x]).filter(x => x != undefined);
  for (let i = 0; i < lists.length; i++) {
    var cur_list = lists[i];
    cur_list.style.order = this.boxOrder++;
    var list_name = order[i];
    var list_len = this.num[list_name];
    // If both the short columns are length 1, flatten the parents list
    // but only on mobile.
    if (this.num[order[1]] == 1 && this.num[order[2]] == 1 && i == 0) {
      Layout.flatten(cur_list, "onlyMobile");
    }
    var mc_count = 3;   // Collapses to 2 on mobile if needed
    if (list_len == this.longestList()) {
      Layout.multiColumn(cur_list, mc_count);
    }
    this.family.append(cur_list);
    this.distance++;
    // Add a divider unless we've just processed the final column
    if (((this.distance == 3) || (this.dividerMode != false)) && (i != lists.length - 1)) {
      var breaker = Layout.divider("both");
      breaker.style.order = this.boxOrder++;
      this.family.append(breaker);
      this.resetCounters("breakers");
    }
  }
  // Return distance/flexBreaker counters to default values
  this.resetCounters("all");
}

// Four-column layouts are the trickiest, and when two of those columns are
// very long, we need to do a multi-column flow where the short columns squeeze
// left, and the longer ones get flattened into 2-wide-multicols or 3-wide-multicols.
Layout.L.arrangement.fourListTwoLong = function(mode="onlyDesktop") {
  this.family.classList.add("vertical");
  if (mode == "onlyDesktop") {
    this.family.classList.add(mode);
  }
  // Balance columns modeled as single-column-lists
  var split_point = this.verticalBalanceTwoMultiColumns();
  // Iterate through the list order
  for (let i = 0; i < this.list_order.length ; i++) {
    var list_name = this.list_order[i];
    var cur_list = this[list_name];
    var list_len = this.num[list_name];
    // Set a multicolumn if necessary
    if ((list_len >= 3) && (list_name != "litter")) {
      Layout.multiColumn(cur_list);
    }
    else if (i == 1) { 
      // Make sure multicolumns don't flow into the first lane under litter
      cur_list.style.height = "50%";
    }
    else if ((i == 3) && (list_len > 1)) {
      Layout.multiColumn(cur_list);
    }
    cur_list.style.order = this.boxOrder++;   /* Force to show last */
    this.family.append(this[list_name]);
  }
  // Set height of the container div based on balancing info.
  if (window.matchMedia("(max-width: 670px)").matches == false) {
    this.family.style.height = this.height_desktop;             /* Use the desktop height in desktop mode */
    this.family.dataset.height_desktop = this.height_desktop;   /* Store this value on the div for later use */
  }
  // Return distance/flexBreaker counters to default values
  this.resetCounters("all"); 
}

// When sparse columns stacked up may be nearly as long as a third column,
// kick the little ones out and let the longer column run. If a fourth column
// appears, display it underneath the long column..
// hr/line breaks in vertical flow don't work. Uses a height constraint to
// influence the final displayed flow. Also see the event listeners at the
// bottom of this file.
Layout.L.arrangement.longRun = function(mode="onlyMobile") {
  this.family.classList.add("vertical");
  if (mode == "onlyMobile") {
    this.family.classList.add(mode);
  }
  // Balance columns modeled as single-column-lists
  var split_point = this.verticalBalanceMobile();
  // Iterate through the list order
  for (let i = 0; i < this.list_order.length ; i++) {
    var list_name = this.list_order[i];
    var cur_list = this[list_name];
    cur_list.style.order = this.boxOrder++;
    this.family.append(this[list_name]);
  }
  // Set height of the container div based on balancing info
  if (window.matchMedia("(max-width: 670px)").matches == true) {
    this.family.style.height = this.height_mobile;   /* Make sure it applies immediately */
  }
  this.family.dataset.height_mobile = this.height_mobile;   /* Store this value on the div for later use */
  // Return distance/flexBreaker counters to default values
  this.resetCounters("all");
}

// With three columns, and one of them long, we often need to flow two of them
// into a single column. On mobile row-flow might be fine, but on desktop, 
// column-flow is preferable. We still need multi-column lists though, and
// calculating the list heights will depend on how flattened these multicolumn
// lists might be. Assumes the multi-column list is only two-wide, since the
// first column is already used by two short columns.
Layout.L.arrangement.threeListOneLong = function(mode="onlyDesktop") {
  this.family.classList.add("vertical");
  if (mode == "onlyDesktop") {
    this.family.classList.add(mode);
  }
  // Balance columns modeled as single-column-lists
  var split_point = this.verticalBalanceOneMultiColumn(2);
  // Iterate through the list order
  for (let i = 0; i < this.list_order.length ; i++) {
    var list_name = this.list_order[i];
    var cur_list = this[list_name];
    var list_len = this.num[list_name];
    // Set a multicolumn if necessary
    if (list_len == this.longestList()) {
      Layout.multiColumn(cur_list, 2);
      cur_list.style.order = this.existingColumns();   /* Force to show last */
    } else {
      cur_list.style.order = this.boxOrder++;
    }
    this.family.append(this[list_name]);
  }
  // Set height of the container div based on balancing info
  if (window.matchMedia("(max-width: 670px)").matches == false) {
    this.family.style.height = this.height_desktop;   /* Make sure it applies immediately */
  }
  this.family.dataset.height_desktop = this.height_desktop;   /* Store this value on the div for later use */
  // Return distance/flexBreaker counters to default values
  this.resetCounters("all"); 
}

// If the lookup tables find no arrangement, use these default heuristics.
// -- Two columns, one short and one long? => flattenTopMultiColumn
// -- Similar columns no deeper than four? => columns
// -- One long column, two shorts, and long column is 8 or less? => longRun
// -- One long column, two shorts, and long column is 9 or more => multiColumn
// -- Two long columns, shorter no less than 5, longest no more than 8? => longRun
// -- Long column of 9 or more? Take all columns longer than 5 and multiColumn them
Layout.L.arrangement.default = function() {
  // Heuristics based on column sizing. More specific to less specific 
  if ((this.longestList() > 4) && (this.existingColumns() == 1)) {
    // One really long column? Multi-column-split it based on available space. TEST: Pam
    return this.oneMultiColumn();
  } else if ((this.longestList() <= 6) && (this.existingColumns() == 3)) {
    return this.longRun("onlyMobile");
  } else if ((this.longestList() >= 8) && (this.existingColumns() == 4) && 
             (this.sum() - this.longestList() >= this.longestList())) {
    // TEST: Seita
    return this.fourListTwoLong("onlyDesktop");
  } else if ((this.longestList() >= 8) && (this.existingColumns() == 4) &&
             (this.sum() - this.longestList() <= 5)) {
    // TEST: Luna / Akiyoshidai
    return this.fourListOneLong();
  } else if ((this.longestList() >= 8) && (this.existingColumns() == 3) && 
             (this.sum() - this.longestList() >= this.longestList())) {
    // TEST: Koto
    return this.longRun("onlyMobile");
  } else if ((this.longestList() <= 9) && (this.existingColumns() == 4)) {
    return this.longRun("onlyMobile");
  } else if ((this.longestList() > 9) && (this.existingColumns() == 4)) {
    return this.fourListTwoLong("onlyDesktop");
  } else if ((this.longestList() > 5) && (this.existingColumns() == 3) && (this.sum() - this.longestList() <= 4)) {
    return this.threeListOneLong("onlyDesktop");
  } else if ((this.longestList() > 5) && (this.existingColumns() == 3) && 
             (this.sum() - this.longestList() - 2 >= 3)) {
    // TEST: Futa, Beilei 2010. 
    // TODO: layout mode that can triple a long column underneath balanced top ones
    return this.longRun("onlyMobile");
  } else if ((this.longestList() > 5) && (this.existingColumns() == 2) && (this.sum() - this.longestList() <= 2)) {
    // Two parents, and a long multicolumn below. TEST: Fan-Fan, Marimo
    return this.flattenPlusMultiColumn(2);
  } else {
    // Default: just treat everything like a single column
    return this.columns();
  }
} 

// Get the number of non-empty columns
Layout.L.arrangement.existingColumns = function() {
  return Object.values(this.num).filter(function(a){return a != 0}).length;
}

// Find the list with the most pandas in it
Layout.L.arrangement.longestList = function() {
  return Object.values(this.num).reduce(function(a, b){return a > b ? a : b });
}

// In the cutoff list that describes how many columns to use, find the first value
// greater than the number of elements in the list you're measuring. Then, step back
// one entry in that array, and that n'th index to the cutoff list becomes the CSS 
// column-count for the list. IOW the cutoff column reads the number of list items
// underneath which it should remain in n columns.
Layout.L.arrangement.multiColumnCount = function(list_len) {
  return this.cutoffs.indexOf(this.cutoffs.filter(x => x >= list_len)[0]) - 1;
}

// Clear state after doing a layout operation. Partial clears are useful
// after adding a divider, so support that as the default.
Layout.L.arrangement.resetCounters = function(mode="partial") {
  if (mode=="all") {
    this.boxOrder = 0;
    this.list_order = this.list_default;
  }
  this.distance = 0;
  this.dividerMode = false;
}

Layout.L.arrangement.sum = function() {
  return this.num.parents + this.num.litter + this.num.siblings + this.num.children;
}

// Given a multicolumn mobile layout with two lanes for lists, determine
// the optimal balance of column content. The parents will always appear
// first, but other elements can have line breaks inserted to change the balance.
// This will change the L.arrangement.list_order. Returns the split point which
// to display the columns we want, and sets the max L.arrangement.height.
Layout.L.arrangement.verticalBalanceMobile = function() {
  // Ordering permutations we want to try. 
  var valid_list = this.list_default.filter(x => this.num[x] != 0);
  // Always keep parents first, or whatever the earliest valid entry is
  // Litter should never come last unless... TODO
  var permutations = Layout.permutations(valid_list).filter(x => x[0] == valid_list[0]);
  // How many lines worth of space do we count the gap between lists?
  // Two lines, since it's spacing and a column header
  var between_list_pad = 2;
  // Estimated height of our lines, based on 14pt and padding. Also, necessary
  // values to calculate the final box-height.
  var line_height = "35px";
  var list_count_height = "22px";
  var longest = 0;
  // Our desired order and spacing. Split at the middle by default, rounded down
  var minimum_space = Math.pow(2, 32) - 1;
  var minimum_split = Math.floor(valid_list.length / 2);
  for (var list_order of permutations) {
    for (var list_name of list_order) {
      if (list_name == list_order[list_order.length - 1]) {
        break;   // Exit the inner loop
      }
      var left_sum = 0;
      var right_sum = 0;
      var split_point = list_order.indexOf(list_name);
      var left_no_lists = split_point + 1;
      var right_no_lists = list_order.length - left_no_lists;
      // Padding between lists is taken into account
      var left_padding = between_list_pad * (left_no_lists - 1);
      var right_padding = between_list_pad * (right_no_lists - 1);
      // Isolate left and right sides, and calculate the spacing difference
      var left_lists = list_order.slice(0, split_point + 1);
      var right_lists = list_order.slice(split_point + 1, this.list_default.length + 1);
      // Array accumulator to count number of list entries in a desired set of lists
      var left_sum = left_lists.map(x => this.num[x]).reduce((acc, cv) => acc + cv) + left_padding;
      var right_sum = right_lists.map(x => this.num[x]).reduce((acc, cv) => acc + cv) + right_padding;
      var difference = Math.abs(right_sum - left_sum);
      if (difference == 0) {
        // If perfect balance, great! We're done
        this.list_order = list_order;
        minimum_split = split_point;
        longest = (left_sum > right_sum) ? left_sum : right_sum;
        longest_list_count = (left_lists.length > right_lists.length) ? left_lists.length : right_lists.length;
        // Account for item line height, and the heading/gap height as well
        this.height_mobile = (longest * parseInt(line_height)) + (longest_list_count * parseInt(list_count_height));
        return minimum_split;
      } else if (difference < minimum_space) {
        // Otherwise, keep optimizing as best we can
        this.list_order = list_order;
        minimum_space = difference;
        minimum_split = split_point;
        longest = (left_sum > right_sum) ? left_sum : right_sum;
        longest_list_count = (left_lists.length > right_lists.length) ? left_lists.length : right_lists.length;
        // Account for item line height, and the heading/gap height as well
        this.height_mobile = (longest * parseInt(line_height)) + (longest_list_count * parseInt(list_count_height));
      } else {
        continue;
      }
    }
  }
  // Use best available values stored from the loop
  return minimum_split;
}

// Much more hacky calculation for vertical balance of multicolumn vertical flow
Layout.L.arrangement.verticalBalanceOneMultiColumn = function(multi_cols) {
  // How many lines worth of space do we count the gap between lists?
  // Two lines, since it's spacing and a column header
  var between_list_pad = 2;
  // Estimated height of our lines, based on 14pt and padding. Also, necessary
  // values to calculate the final box-height.
  var line_height = "42px";
  var list_count_height = "30px";
  // Do list order based on what things exist or not
  this.list_order = this.list_default.filter(x => this.num[x] != 0);
  // Max items in the multicolumn list is just the list count / 2
  var squeeze_count = (this.existingColumns() > 3) ? 3 : 2;
  var padding = between_list_pad * (parseInt(list_count_height) * squeeze_count);
  var squeeze_num = this.sum() - this.longestList();  // Typically the max number of parents and litter
  var squeeze_height = padding + (squeeze_num * parseInt(line_height));
  var multi_column_cnt = Math.ceil(this.longestList() / multi_cols);
  var multi_column_height = multi_column_cnt * parseInt(line_height);
  if (multi_column_height > squeeze_height) {
    this.height_desktop = multi_column_height;
    return 2;   // Split at the third column
  } else {
    this.height_desktop = squeeze_height;
    return 0;   // Split at the first column
  }
}

// And even hackier vertical balancing of two multicolumns. Assume the multicolumns
// are two-wide, and that they're taller than the left gutter
Layout.L.arrangement.verticalBalanceTwoMultiColumns = function() {
  this.list_order = this.list_default;
  // How many lines worth of space do we count the gap between lists?
  // Two lines, since it's spacing and a column header
  var between_list_pad = 3;
  // Estimated height of our lines, based on 14pt and padding. Also, necessary
  // values to calculate the final box-height.
  var line_height = "35px";
  var list_count_height = "40px";
  var sibling_col_cnt = 2;   // TODO: better calculate this
  var children_col_cnt = 2;
  var siblings_num = Math.ceil(this.num.siblings / sibling_col_cnt);
  var children_num = Math.ceil(this.num.children / children_col_cnt);
  var siblings_height = siblings_num * parseInt(line_height);
  var children_height = children_num * parseInt(line_height);
  var padding = between_list_pad * parseInt(list_count_height);
  this.height_desktop = siblings_height + children_height + padding;
  return 2;   // Split at the third column
}

/* The arrangement switchboard. Set these arrangement names so they return
   the actual functions that will perform the layout duties. Use "return" syntax
   so that the originating object "this" is preserved. */
// One list item? Simple column layout is fine. TEST: Mai (Buna's Mom)
Layout.L.arrangement.div1_1_0_0_0 = function() { return this.columns() };
// Two list items, horizontal display to save space. TEST: Harumaki, You-You (Hirakata)
Layout.L.arrangement.div2_2_0_0_0 = function() { return this.flatten("both") };
// Two list items, in their own columns.
Layout.L.arrangement.div2_1_1_0_0 = function() { return this.columns() };
// Three item arrangements all use column mode. TEST: Roshani
Layout.L.arrangement.div3_2_1_0_0 = function() { return this.columns() };
Layout.L.arrangement.div3_0_1_1_1 = function() { return this.columns() };
Layout.L.arrangement.div3_0_0_3_0 = function() { return this.columns() };
// Four list items. Two parents and two in a second column. TEST: Shizuku
Layout.L.arrangement.div4_2_2_0_0 = function() { return this.columns() };
// Four list items. Two in one category and singles. TEST: Taiyo (Nishiyama)
Layout.L.arrangement.div4_2_1_1_0 = function() { return this.longRun("onlyMobile") };
// Four list items. Three in one category
Layout.L.arrangement.div4_0_0_3_1 = function() { return this.columns() };
// Four list items. Longer lists will get multiColumn'ed. Test: You-You (Noichi)
Layout.L.arrangement.div4_0_0_4_0 = function() { return this.columns() };
// Five list items. Two parents and three in a second column. TEST: Keti
Layout.L.arrangement.div5_2_0_3_0 = function() { return this.columns() };
// Five list items. Two parents and a two/one split.
// TODO: consider flattenTop for this style of layout
Layout.L.arrangement.div5_2_2_1_0 = function() { return this.longRun("onlyMobile") };
// Five list items. Two parents and three other columns
Layout.L.arrangement.div5_2_1_1_1 = function() { return this.longRun("onlyMobile") };
// Five list items. Four in one list, and a fifth
Layout.L.arrangement.div5_0_0_4_1 = function() { return this.columns() };
// Six list items. Two parents and others in a single column
Layout.L.arrangement.div6_2_0_4_0 = function() { return this.columns() };
// Six list items. Two parents and a short split
Layout.L.arrangement.div6_2_1_3_0 = function() { return this.longRun("onlyMobile") }; 
// Six list items. Two parents and even columns. TEST: Asahi (Kobe), Kiari
Layout.L.arrangement.div6_2_2_2_0 = function() { return this.flatten("onlyMobile") };
// Six list items. Two parents and spread
Layout.L.arrangement.div6_2_2_1_1 = function() { return this.columns() };
// Six list items. Mostly or all in one column
Layout.L.arrangement.div6_0_0_5_1 = function() { return this.oneMultiColumn(2) };
// Six list items. All in two columns
Layout.L.arrangement.div6_0_0_3_3 = function() { return this.columns() };
// Seven list items. Parents, litter, and three siblings
Layout.L.arrangement.div7_2_2_3_0 = function() { return this.longRun("onlyMobile") };
// Seven list items. parents, litter, siblings, and children, all straight columns
Layout.L.arrangement.div7_2_2_2_1 = function() { return this.columns() };
// Seven list items. A predominant list with parents.
// The three item list is last, but we can shift it up a little. TEST: Gin
Layout.L.arrangement.div7_2_1_3_1 = function() { return this.longRun("onlyMobile") };
// Seven list items. a predominant list with no litter. 
// Place the one below the parents, and the four kicked right.
Layout.L.arrangement.div7_2_0_4_1 = function() { return this.longRun("onlyMobile") };
// Eight list items. Two animals per list type
Layout.L.arrangement.div8_2_2_2_2 = function() { return this.columns() };
// Eight list items. Mostly balanced but a three-and-one on the right
Layout.L.arrangement.div8_2_2_3_1 = function() { return this.longRun("onlyMobile") };
// Eight list items, a long column and two shorties
Layout.L.arrangement.div8_2_2_4_0 = function() { return this.longRun("onlyMobile") };
Layout.L.arrangement.div8_2_1_5_0 = function() { return this.longRun("onlyMobile") };
// Eight list items. Do the four column below the one, but kick it up. TEST: Mitarashi
Layout.L.arrangement.div8_2_1_4_1 = function() { return this.longRun("onlyMobile") };
// Nine items. Do a balancing act. TEST: Shiratama
Layout.L.arrangement.div9_2_1_4_2 = function() { return this.longRun("onlyMobile")};
// Nine list items. Two single columns sneaking on the left
Layout.L.arrangement.div9_2_1_5_1 = function() { return this.longRun("onlyMobile") };
// Nine list items. A long column goes multiColumn. 
// On mobile the broader multicolumn lists should shrink down to two columns
Layout.L.arrangement.div9_2_2_5_0 = function() { return this.oneMultiColumn(2, "onlyMobile", "onlyMobile") };
// Nine list items. Parents and two similar length lists. TEST: Mugi
Layout.L.arrangement.div9_2_0_3_4 = function() { return this.flatten("onlyMobile") };
// Nine list items. Multi-column, and flow the smaller ones left. TEST: Furin
Layout.L.arrangement.div9_2_1_6_0 = function() { return this.threeListOneLong("onlyDesktop") };
// Wouldn't normally flatten the one. Might not need this
Layout.L.arrangement.div9_0_0_8_1 = function() { return this.flattenPlusMultiColumn(3) };
// Ten list items. Parents and balanced elsewhere
Layout.L.arrangement.div10_2_0_4_4 = function() { return this.flatten("onlyMobile") };
// Ten list items. Spread out wide
Layout.L.arrangement.div10_2_2_3_3 = function() { return this.columns() };
// Ten list items. Balance these
Layout.L.arrangement.div10_2_1_4_3 = function() { return this.longRun("onlyMobile") };
// Ten list items. Flatten the top, and multicolumn the largest one
Layout.L.arrangement.div10_2_2_5_1 = function() { return this.flattenPlusMultiColumn(2) };
// Another arrangement of that 10 looks better a different way
Layout.L.arrangement.div10_2_1_5_2 = function() { return this.longRun("onlyMobile") };
// Ten list items. Balanced lists and a muticolumn
// TODO: On mobile, flatten all the short columns.
Layout.L.arrangement.div10_2_2_6_0 = function() { return this.threeListOneLong("onlyDesktop") };
// Ten list items. Sneak the singles down the left
Layout.L.arrangement.div10_2_1_6_1 = function() { return this.longRun("onlyMobile") };
// Ten list items. Too long to be a long run. TEST: Fuuna
Layout.L.arrangement.div10_2_0_7_1 = function() { return this.threeListOneLong("onlyDesktop") };
// Ten list items. No parents layouts, even stevens. Spread out on desktop
Layout.L.arrangement.div10_0_0_5_5 = function() { return this.oneMultiColumn(2, 'onlyDesktop') };
// Ten list items. On mobile this looks fine as two columns.
// On desktop the multicolumn div needs to be split out.
Layout.L.arrangement.div10_0_0_6_4 = function() { return this.oneMultiColumn(2, 'onlyDesktop') };
// Ten list items. Seven-long columns are too much.
Layout.L.arrangement.div10_0_0_7_3 = function() { return this.flattenPlusMultiColumn(2, 'onlyMobile') };
// Eleven items: force a two-column flatten, since 9 will default to 3 columns otherwise
Layout.L.arrangement.div11_2_0_9_0 = function() { return this.flattenPlusMultiColumn(2)};
Layout.L.arrangement.div11_2_2_7_0 = function() { return this.threeListOneLong("onlyDesktop") };
// Eleven items: do a vertical flow on desktop and mobile
// TODO: vertical flow on desktop and mobile. Different heights stored. Adjust other code
// to use special heights for mobile versus desktop. Yan-Yan Nishiyama
// Layout.L.arrangement.div11_2_1_3_5 = function { return this.verticalFlow() };
// Twelve items: Force multicolumns to be just two wide
Layout.L.arrangement.div12_2_1_9_0 = function() { return this.threeListOneLong("onlyDesktop") };

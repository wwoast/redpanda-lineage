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

/* Take a div list, and apply flatten classes to it. When adding a flattened class,
   we need to add a line-break entity afterwards, and bump the flex box display
   order of subsequent inserted divs. */
Layout.flatten = function(div, onlyMobile=false) {
  if (onlyMobile == true) {
    div.childNodes[1].classList.add("onlyMobileFlat");
  } else {
    // Mobile and Desktop flattened divs generally only appear alone, so give
    // them a 100%-width singleton entry into the family list.
    div.classList.add("singleton");
    div.childNodes[1].classList.add("flat");
  }
  return div;
}

/* Create a flex divider. This is a horizontal rule element with 100% width. */
Layout.flexDivider = function(className) {
  var breaker = document.createElement('hr');
  breaker.className = "flexDivider";
  breaker.classList.add(className);
  return breaker;
}

/* Take a div list, and apply a column-mode class to it. */
Layout.multiColumn = function(div, columnCount=2) {
  if (columnCount == 2) {
    div.childNodes[1].classList.add("double");
  }
  if (columnCount == 3) {
    div.childNodes[1].classList.add("triple");
  }
  return div;
}

/* Create all permutations of an input string. This is used to determine the
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

/* Swap the target column with the destination column. On mobile, include logic
    that pushes the swapped column up to be even with the swapped column. */
Layout.swapColumn = function(target, destination, height_adjust, destination_cnt) {
  var tmp_order = target.style.order;
  target.style.order = destination.style.order;
  destination.style.order = tmp_order;
  // Take the sibling column height, subtract 90 for the parents div (always 3*30px),
  // and move the litter column up accordingly. Estimate the height since it's not rendered yet
  if (height_adjust == true) {
    height = (destination_cnt + 1) * 30;
    shift = (height * -1) + 90;
    if (shift < 0) {   // Only move sibling up if we have space to move it up
      target.style.marginTop = shift.toString() + "px";
      target.classList.add("adjustedMarginTop");
    }
  }  
  // Fix sibling div z-index to make things clickable on Firefox
  destination.style.zIndex = 2;
  // When doing a swap, move the line break element that might exist after the target, to
  // after the swapped destination instead. This is an ordering switch
  var divBreak = target.nextSibling;
  divBreak.style.order = parseInt(destination.style.order) + 1;
}


/* Given either a value or a range of values, validate that the available animals
   in that list matches the count given of them. For simplicity, assume inclusive */
Layout.L.count = function(p=0, l=0, s=0, c=0) {
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


/* WIP Layout manager. Looks at counts of each element, and gives an arrangement */
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
Layout.L.arrangement.columns = function() {
  // Specific list values that exist (this["parents"] = HTMLElement, ...)
  var lists = this.list_default.map(x => this[x]).filter(x => x != undefined);
  // Add line breaks after every two columns, and add order values to every item
  for (let i = 0; i < lists.length; i++) {
    var cur_list = lists[i];
    cur_list.style.order = this.boxOrder++;
    this.family.append(cur_list);
    this.distance++;
    if (this.distance == 2) {
      var breaker = Layout.flexDivider("onlyMobile");
      breaker.style.order = this.boxOrder++;
      this.family.append(breaker);
      this.resetCounters("breakers");
    }
  }
  // Return distance/flexBreaker counters to default values
  this.resetCounters("all");
}

// Take the longest column and make into a multicolumn list.
// Any other columns that exist should be displayed as straight columns.
// Mode can be "onlyMobile", "onlyDesktop", or "both".
// TODO: have modes for both the breakers and the multicolumn classes
Layout.L.arrangement.multiColumn = function(columns, breaker_mode="both", column_mode="both") {
  // Decide which line breaker mode to use based on whether this comes after
  // a multicolumn, or just in the normal flow of adding columns
  var breaking_style = breaker_mode;
  // The list order we're dealing with (strings "parents", "litter")
  var order = this.list_default.map(x => this[x] != undefined);
  // Specific list values that exist (this["parents"] = HTMLElement, ...)
  var lists = this.list_default.map(x => this[x]).filter(x => x != undefined);
  // Add line breaks after every two columns, and add order values to every item
  for (let i = 0; i < lists.length; i++) {
    var cur_list = lists[i];
    cur_list.style.order = this.boxOrder++;
    var list_name = order[i];
    var list_len = this.num[list_name];
    // What the multicolumn split should be
    var mc_count = this.multiColumnCount(list_len);
    if (list_len == this.largestColumn()) {
      Layout.multiColumn(cur_list, mc_count);
      this.dividerMode = column_mode;   /* Add a divider based on input mode */
      breaking_style = column_node;     /* Will do an after-column-style break */
    }
    this.family.append(cur_list);
    this.distance++;
    if ((this.distance == 2) || (this.dividerMode != false)) {
      var breaker = Layout.flexDivider(breaking_style);
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
    // If just a single list, add a singleton class to adjust width on desktop
    if (lists.length == 1) {
      cur_list.classList.add("singleton");
      this.dividerMode = mode;
    }
    this.family.append(cur_list);
    this.distance++;
    if ((this.distance == 2) || (this.dividerMode != false)) {
      var breaker = Layout.flexDivider("onlyMobile");
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
Layout.L.arrangement.flattenPlusMultiColumn = function(columns, breaker_mode="both", column_mode="both") {
  // Decide which line breaker mode to use based on whether this comes after
  // a multicolumn, or just in the normal flow of adding columns
  var breaking_style = breaker_mode;
  // Specific list values that exist (this["parents"] = HTMLElement, ...)
  var lists = this.list_default.map(x => this[x]).filter(x => x != undefined);
  // Add line breaks after every two columns, and add order values to every item
  for (let i = 0; i < lists.length; i++) {
    var cur_list = lists[i];
    // Flatten the first list
    if (i == 0) {
      Layout.flatten(cur_list, mode);
    }
    // What the multicolumn split should be
    var mc_count = this.multiColumnCount(list_len);
    if (list_len == this.largestColumn()) {
      Layout.multiColumn(cur_list, mc_count);
      this.dividerMode = column_mode;   /* Add a divider based on input mode */
      breaking_style = column_node;     /* Will do an after-column-style break */
    }
    // If just a single list, add a singleton class to adjust width on desktop
    if (lists.length == 1) {
      cur_list.classList.add("singleton");
    }
    cur_list.style.order = this.boxOrder++;
    this.family.append(cur_list);
    this.distance++;
    if ((this.distance == 2) || (this.dividerMode != false)) {
      var breaker = Layout.flexDivider(breaker_mode);
      breaker.style.order = this.boxOrder++;
      this.family.append(breaker);
      this.resetCounters("breakers");
      breaking_style = breaker_mode;   /* Revert to normal break style */
    }
  }
  // Return distance/flexBreaker counters to default values
  this.resetCounters("all");
}

// In some extraordinary cases on mobile, multiColumn on three-element lists 
// may look better than the other alternatives. Use this layout to guarantee
// that short lists still get flowed multicolumn.
Layout.L.arrangement.shortMultiColumn = function(columns, mode="both") {
  return;
}

// When sparse columns stacked up may be nearly as long as a third column,
// kick the little ones out and let the longer column run. If a fourth column
// appears, display it underneath the long column. This is easier done using
// a multicolumn-flow for divs, instead of the normal flex flow.
Layout.L.arrangement.longRun = function() {
  return;
}

// Where the last column displayed in the order must be the longest on mobile
// for space to be preserved. This is easier done using a multicolumn-flow for divs, 
// instead of the normal flex flow.
Layout.L.arrangement.lastColumnLong = function() {
  return;
}

// If the lookup tables find no arrangement, use these default heuristics.
// -- Two columns, one short and one long? => flattenTopMultiColumn
// -- Similar columns no deeper than four? => columns
// -- One long column, two shorts, and long column is 8 or less? => longRun
// -- One long column, two shorts, and long column is 9 or more => multiColumn
// -- Two long columns, shorter no less than 5, longest no more than 8? => longRun
// -- Long column of 9 or more? Take all columns longer than 5 and multiColumn them
// TOWRITE: for now, just default to columns
Layout.L.arrangement.default = Layout.L.arrangement.columns;

// TODO: remove, as this is only used in legacy layouts!!
// Adds a divider if necessary. The "dividerMode" value doubles as a 
// class name to apply to the divider, so for detecting names, filter 
// the normal boolean "true" and "false" values. In flex layouts, these
// line breakers must have monotonic CSS order values to arrange properly.
Layout.L.arrangement.addFlexDivider = function(mainDiv) {
  // Increment distance when considering whether a divider should be added.
  // On mobile, dividers must be added after every 2nd list at least.
  if (this.dividerMode == false) {
    this.distance++;
    if (this.distance == 2) {
      this.dividerMode = "onlyMobile";
    }
  }
  // Verify if we need to add a divider yet
  if (this.dividerMode == false) {
    return;
  }
  // We're going to add a divider
  var breaker = undefined;
  if ((this.dividerMode != false) && (this.dividerMode != true)) {
    breaker = Layout.flexDivider(this.dividerMode);
  } else {
    breaker = Layout.flexDivider(true);
  }
  breaker.style.order = this.boxOrder++;
  mainDiv.appendChild(breaker);
  // Reset the distance and mode settings
  this.distance = 0;
  this.dividerMode = false;
}

// Find the longest column
Layout.L.arrangement.largestColumn = function() {
  var num = this.num;   /* Annoying scoping */
  return Object.keys(num).reduce(function(a, b){return num[a] > num[b] ? num[a] : num[b] });
}

// Clear state after doing a layout operation. Partial clears are useful
// after adding a divider, so support that as the default.
Layout.L.arrangement.resetCounters = function(mode="partial") {
  if (mode=="all") {
    Layout.L.arrangement.boxOrder = 0;
  }
  Layout.L.arrangement.distance = 0;
  Layout.L.arrangement.dividerMode = false;
}

// In the cutoff list that describes how many columns to use, find the first value
// greater than the number of elements in the list you're measuring. That is the 
// i'th value of the cutoff list, and i becomes the CSS column-count for the list.
Layout.L.arrangement.multiColumnCount = function(list_len) {
  return this.cutoffs.indexOf(this.cutoffs.map(x => x >= list_len)[0]);
}

/* The arrangement switchboard. Set these arrangement names so they return
   the actual functions that will perform the layout duties. Use "return" syntax
   so that the originating object "this" is preserved. */
// TODO: remove any switchboard entries that don't need speical behavior!!
// One list item? Simple column layout is fine.
Layout.L.arrangement.div1_1_0_0_0 = function() { return this.columns() }
// Two list items, horizontal display to save space. 
Layout.L.arrangement.div2_2_0_0_0 = function() { return this.flatten("both") }
// Two list items, in their own columns
Layout.L.arrangement.div2_1_1_0_0 = function() { return this.columns() }
// Three list items. Two parents and a single third
Layout.L.arrangement.div3_2_1_0_0 = function() { return this.columns() }
// Three list items. One each in three lists
Layout.L.arrangement.div3_0_1_1_1 = function() { return this.columns() }
// Three list items. One column of three items
Layout.L.arrangement.div3_0_0_3_0 = function() { return this.columns() }
// Four list items. Two parents and two in a second column
Layout.L.arrangement.div4_2_2_0_0 = function() { return this.columns() }
// Four list items. Two in one category and singles
// TODO: possibly long run, but find a way to kick the spacers right
Layout.L.arrangement.div4_2_1_1_0 = function() { return this.flatten("onlyMobile") }
// Four list items. Three in one category
Layout.L.arrangement.div4_0_0_3_1 = function() { return this.columns() }
// Four list items. All in one category. Longer lists will get multiColumn'ed
Layout.L.arrangement.div4_0_0_4_0 = function() { return this.columns() }
// Five list items. Two parents and three in a second column
Layout.L.arrangement.div5_2_0_3_0 = function() { return this.columns() }
// Five list items. Two parents and a two/one split.
// TODO: consider flattenTop for this style of layout
Layout.L.arrangement.div5_2_2_1_0 = function() { return this.columns() }
// Five list items. Two parents and three other columns
Layout.L.arrangement.div5_2_1_1_1 = function() { return this.columns() }
// Five list items. Four in one list, and a fifth
Layout.L.arrangement.div5_0_0_4_1 = function() { return this.columns() }
// Five list items. One list, but split multicolumn
Layout.L.arrangement.div5_0_0_5_0 = function() { return this.multiColumn(2) }
// Six list items. Two parents and others in a single column
Layout.L.arrangement.div6_2_0_4_0 = function() { return this.columns() }
// Six list items. Two parents and a short split
// TODO: implement
// Layout.L.arrangement.div6_2_3_1_0 = Layout.L.arrangement.longRun;
// Six list items. Two parents and even columns
Layout.L.arrangement.div6_2_2_2_0 = function() { return this.flatten("onlyMobile") }
// Six list items. Two parents and spread
Layout.L.arrangement.div6_2_2_1_1 = function() { return this.columns() }
// Six list items. Mostly or all in one column
Layout.L.arrangement.div6_0_0_5_1 = function() { return this.multiColumn(2) }
Layout.L.arrangement.div6_0_0_6_0 = function() { return this.multiColumn(2) }
// Six list items. All in two columns
Layout.L.arrangement.div6_0_0_3_3 = function() { return this.columns() }
// Seven list items. Parents, and a multicolumn
Layout.L.arrangement.div7_2_0_5_0 = function() { return this.flattenPlusMultiColumn(2) };
// Seven list items. Parents, litter, and three siblings
// TODO: impelement
// Layout.L.arrangement.div7_2_2_3_0 = Layout.L.arrangement.longRun;
// Seven list items. parents, litter, siblings, and children, all straight columns
Layout.L.arrangement.div7_2_2_2_1 = function() { return this.columns() }
// Seven list items. A predominant list with parents.
// The three item list is last, but we can shift it up a little
// TODO: might try a flat layout on top, and a longRun lower down
// TODO: implement
// Layout.L.arrangement.div7_2_1_3_1 = Layout.L.arrangement.longRun;
// Seven list items. a predominant list with no litter. 
// Place the one below the parents, and the four kicked right.
// TODO: impelment
// Layout.L.arrangement.div7_2_0_4_1 = Layout.L.arrangement.longRun;
// Eight list items. Two animals per list type
Layout.L.arrangement.div8_2_2_2_2 = function() { return this.columns() }
// Eight list items. Mostly balanced but a three-and-one on the right
// TODO: implement
// Layout.L.arrangement.div8_2_2_3_1 = Layout.L.arrangement.longRun;
// Eight list items, a long column and two shorties
// TODO: implement
// Layout.L.arrangement.div8_2_2_4_0 = Layout.L.arrangement.longRun;
// Layout.L.arrangement.div8_2_1_5_0 = Layout.L.arrangement.longRun;
// Eight list items. Do the four column below the one, but kick it up
// TODO: implement
// Layout.L.arrangement.div8_2_1_4_1 = Layout.L.arrangement.lastColumnLong;
// Eight list items. Flatten the top and multicolumn the other one
Layout.L.arrangement.div8_2_0_6_0 = function() { return this.flattenPlusMultiColumn(2) };
// Nine list items. Mostly balanced
Layout.L.arrangement.div9_2_2_3_3 = function() { return this.columns() }
// Nine list items. Mostly balanced, but kick the last column up slightly
// TODO: implement
// Layout.L.arrangement.div9_2_1_4_2 = Layout.L.arrangement.lastColumnLong;
// Nine list items. Two single columns sneaking on the left
// TODO: implement
// Layout.L.arrangement.div9_2_1_5_1 = Layout.L.arrangement.longRun;
// Nine list items. A long column goes multiColumn. 
// On mobile the broader multicolumn lists should shrink down to two columns
Layout.L.arrangement.div9_2_2_5_0 = function() { return this.multiColumn(2) }
Layout.L.arrangement.div9_2_1_6_0 = function() { return this.multiColumn(2) }
// Nine list items, but a single column of three looks out of place here.
// TODO: IMPLEMENT
// Layout.L.arrangement.div9_0_0_6_3 = Layout.L.arrangement.shortMultiColumn(2);
Layout.L.arrangement.div9_2_0_7_0 = function() { return this.flattenPlusMultiColumn(2) };
Layout.L.arrangement.div9_0_0_8_1 = function() { return this.flattenPlusMultiColumn(3) };
Layout.L.arrangement.div9_0_0_9_0 = function() { return this.flattenPlusMultiColumn(4) };
// Ten list items. Parents and balanced elsewhere
Layout.L.arrangement.div10_2_0_4_4 = function() { return this.flatten("onlyMobile") }
// Ten list items. Spread out wide
Layout.L.arrangement.div10_2_2_3_3 = function() { return this.columns() }
// TODO: impelment
// Layout.L.arrangement.div10_2_1_4_3 = Layout.L.arrangement.lastColumnLong;
// Ten list items. Flatten the top, and multicolumn the largest one
Layout.L.arrangement.div10_2_2_5_1 = function() { return this.flattenPlusMultiColumn(2) };
// Ten list items. Balanced lists and a muticolumn
Layout.L.arrangement.div10_2_2_6_0 = function() { return this.multiColumn(2) }
// Ten list items. Sneak the singles down the left
// TODO: implement
// Layout.L.arrangement.div10_2_1_6_1 = Layout.L.arrangement.longRun;
// Ten list items. Too long to be a long run.
Layout.L.arrangement.div10_2_0_7_1 = function() { return this.multiColumn(2) }
// Ten list items. No parents layouts, even stevens. Spread out on desktop
Layout.L.arrangement.div10_0_0_5_5 = function() { return this.multiColumn(2, 'onlyDesktop') }
// Ten list items. On mobile this looks fine as two columns.
// On desktop the multicolumn div needs to be split out.
Layout.L.arrangement.div10_0_0_6_4 = function() { return this.multiColumn(2, 'onlyDesktop') }
// Ten list items. Seven-long columns are too much.
// TODO: Implement
// Layout.L.arrangement.div10_0_0_7_3 = Layout.L.arrangement.shortMultiColumn(2);
// Ten list items. With parents, flatten the top
Layout.L.arrangement.div10_2_0_8_0 = function() { return this.flattenPlusMultiColumn(2) };
// Ten list items. Two columns of five should both be multiColumn'ed
// TODO




var mobile = window.matchMedia("(max-width: 670px)");
var last_offset = {};
mobile.addListener(function(e) {
  var columns = document.getElementsByClassName("adjustedMarginTop");
  if (e.matches == false) {
    for (col of columns) {
      last_offset[col.style.className] = col.style.marginTop;
      col.style.marginTop = "0px";
    }
  } else {
    for (col of columns) {
      col.style.marginTop = last_offset[col.style.className];
    }
  }
});

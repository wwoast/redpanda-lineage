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
    layout.checks.num = layout.num;
    // Set up the divs themselves
    layout.family = layout.arrangement.family = family;
    layout.parents = layout.arrangement.parents = parents;
    layout.litter = layout.arrangement.litter = litter;
    layout.siblings = layout.arrangement.siblings = siblings;
    layout.children = layout.arrangement.children = children;
    return layout;
}

/* Take a div list, and apply flatten classes to it. When adding a flattened class,
   we need to add a line-break entity afterwards, and bump the flex box display
   order of subsequent inserted divs. */
Layout.flatten = function(div, onlyMobile=false) {
  if (onlyMobile == true) {
    div.childNodes[1].classList.add("onlyMobileFlat");
    this.dividerMode = "onlyMobile";
  } else {
    // Mobile and Desktop flattened divs generally only appear alone, so give
    // them a 100%-width singleton entry into the family list.
    div.classList.add("singleton");
    div.childNodes[1].classList.add("flat");
  }
  return div;
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
  return ((this.between(this.num.parents, range["parents"][0], range["parents"][1])) &&
          (this.between(this.num.litter, range["litter"][0], range["litter"][1])) &&
          (this.between(this.num.siblings, range["siblings"][0], range["siblings"][1])) &&
          (this.between(this.num.children, range["children"][0], range["children"][1])));
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
    if (this.arrangement.indexOf(test) != -1) {
      arrange_id = test;
      break;
    }
  }
  // Call an arrangement function if it exists. If not, use a default layout heuristic
  if (arrange_id != undefined) {
    this.arrangement[arrange_id]();
  } else {
    this.arrangement.default();
  }
}

/* TODO: Remove this old layout manager
    The layout generator basically prods all the possible arrangements of 
    parents/litter/siblings/children, and based on hand-layout-optimizing, chooses
    what the best layout should be for each possible set of inputs. */
Layout.L.layoutFamily = function() {
  var height_adjust = (this.parents == 2);
  // Parent layout logic
  if (this.parents != undefined) {
    this.parents.style.order = this.arrangement.boxOrder++;
    // Just parents? Make it flat on desktop and mobile
    if (this.checks.onlyParentsNotOthers()) {
      this.parents = Layout.flatten(this.parents, onlyMobile=false);
    }
    // If small number of siblings or children
    if (this.checks.manyChildrenNoSiblings() || this.checks.manySiblingsNoChildren()) {
      this.parents = Layout.flatten(this.parents, onlyMobile=true);
    }
    // If no litter column on mobile, and five or more children or siblings, 
    // flatten the parents before doing others
    if (this.checks.parentsButNoLitter() && this.checks.singleLongChildrenOrSiblingsList()) {
      this.parents = Layout.flatten(this.parents, onlyMobile=true);
    }
    // If no litter column, and two short columns of children and siblings, 
    // flatten the parents before doing others
    if (this.checks.parentsButNoLitter() && this.checks.twoShortChildrenAndSiblingsLists()) {
      this.parents = Layout.flatten(this.parents, onlyMobile=true);
    }
    // Append parents div to the family display
    this.family.appendChild(this.parents);
    // Add dividers as instructed by earlier layout checks
    this.arrangement.addFlexDivider(this.family);
  }

  // Litter layout logic
  if (this.litter != undefined) {
    this.litter.style.order = this.arrangement.boxOrder++;
    // Only a litter div of two entries, and no others. Make it flat on desktop and mobile
    if (this.checks.onlyLitterNotOthers()) {
      this.litter = Layout.flatten(this.litter, onlyMobile=false);
    }
    // Append litter div to the family display
    this.family.appendChild(this.litter);
    // Add dividers as instructed by earlier layout checks.
    this.arrangement.addFlexDivider(this.family);
  }

  // Siblings layout logic
  if (this.siblings != undefined) {
    this.siblings.style.order = this.arrangement.boxOrder++;
    // Spread out the siblings column if we have space
    if (this.checks.manySiblingsNoChildren()) {
      this.siblings = Layout.multiColumn(this.siblings, 2);
    }
    // Append siblings div to the family display
    this.family.appendChild(this.siblings);
    // If litter is much shorter than siblings on mobile, apply ordering to change display.
    // This is only done once so it won't work when changing orientations in Web Inspector.
    // TODO: make an event to do column switching live on demand
    if ((this.checks.litterExists()) && this.checks.onlySiblingsNotChildren() && this.checks.smallScreen()) {
      Layout.swapColumn(this.litter, this.siblings, height_adjust, this.num.siblings);
    }
    // Add dividers as instructed by earlier layout checks. If it's two columns since a
    // break was added, add another one.
    this.arrangement.addFlexDivider(this.family);
  }

  // Children layout logic
  if (this.children != undefined) {
    this.children.style.order = this.arrangement.boxOrder++;
    // Spread out the children column if we have space
    if (this.checks.manyChildrenNoSiblings()) {
      this.children = Layout.multiColumn(this.children, 2);
    }
    // Append children div to the family display
    this.family.appendChild(this.children);
    // No more dividers to add after children
    // If litter is much shorter than children on mobile, apply ordering to change display.
    // This is only done once so it won't work when changing orientations in Web Inspector.
    // TODO: make an event to do column switching live on demand
    if ((this.checks.litterExists()) && this.checks.onlyChildrenNotSiblings() && this.checks.smallScreen()) {
      Layout.swapColumn(this.litter, this.children, height_adjust, this.num.children);
    }
  }
  this.arrangement.reset();   // Clear historical values for future layout calls
  return this.family;
}

Layout.L.num = {};
Layout.L.num.parents = 0;
Layout.L.num.litter = 0;
Layout.L.num.siblings = 0;
Layout.L.num.children = 0;

/* All details of creating new content and arranging that content happens in the 
   arrangement object. */
Layout.L.arrangement = {};
// Flex box order. Determines display groupings.
// Increment whenever we plan on making a new row.
Layout.L.arrangement.boxOrder = 0;
// Distance in list-count since the last divider. When this gets to two,
// or after a flat element, a divider should be added
Layout.L.arrangement.distance = 0;
// Modal check to add a divider to the layout flow.
// May be true/false, or an mobileOnly options
Layout.L.arrangement.dividerMode = false;
// List arrangement values
Layout.L.arrangement.list_default = ["parents", "litter", "siblings", "children"];
Layout.L.arrangement.list_order = ["parents", "litter", "siblings", "children"];
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
  return;
}

// Take the longest column and make into a multicolumn list.
// Any other columns that exist should be displayed as straight columns.
// Mode can be "onlyMobile", "onlyDesktop", or "both"
Layout.L.arrangement.multiColumn = function(columns, mode="both") {
  return;
}

// Flatten a single column, both on mobile and desktop
Layout.L.arrangement.flatten = function() {
  Layout.L.div.flatten(this.parents);
}

// Flatten the first column, but keep the others. 
// Top flat column is only done on mobile layouts
Layout.L.arrangement.flattenTop = function() {
  return;
}

// Combination of flattenTop and multiColumn.
// TODO: need desktop or mobile modal flags for BOTH the flattening and the multicolumn mode
Layout.L.arrangement.flattenTopMultiColumn = function(columns, mode="both") {
  return;
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
Layout.L.arrangement.default = function() {
  return;
}

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
  if (this.dividerMode != false) {
    var breaker = document.createElement('hr');
    breaker.className = "flexDivider";
    if ((this.dividerMode != false) && (this.dividerMode != true)) {
      breaker.classList.add(this.dividerMode);
      breaker.style.order = this.boxOrder++;
    }
    mainDiv.appendChild(breaker);
    this.distance = 0;
  }
  // Reset divider and distance settings
  if (this.distance == 0) {
    this.dividerMode = false;
  }
}

// Clear state after doing a layout operation
Layout.L.arrangement.reset = function() {
  Layout.L.arrangement.boxOrder = 0;
  Layout.L.arrangement.distance = 0;
  Layout.L.arrangement.dividerMode = false;
}


/* The arrangement switchboard. Set these arrangement names equivalent 
   to the actual functions that will perform the layout duties.
   Comments refer to mobile layout considerations. */
// TODO: remove any switchboard entries that don't need speical behavior!!
// One list item? Simple column layout is fine.
Layout.L.arrangement.div1_1_0_0_0 = Layout.L.arrangement.flatten;
// Two list items, horizontal display to save space. 
Layout.L.arrangement.div2_2_0_0_0 = Layout.L.arrangement.flatten;
// Two list items, in their own columns
Layout.L.arrangement.div2_1_1_0_0 = Layout.L.arrangement.columns;
// Three list items. Two parents and a single third
Layout.L.arrangement.div3_2_1_0_0 = Layout.L.arrangement.columns;
// Three list items. One each in three lists
Layout.L.arrangement.div3_0_1_1_1 = Layout.L.arrangement.columns;
// Three list items. One column of three items
Layout.L.arrangement.div3_0_0_3_0 = Layout.L.arrangement.columns;
// Four list items. Two parents and two in a second column
Layout.L.arrangement.div4_2_2_0_0 = Layout.L.arrangement.columns;
// Four list items. Two in one category and singles
// TODO: possibly long run, but find a way to kick the spacers right
Layout.L.arrangement.div4_2_1_1_0 = Layout.L.arrangement.flattenTop;
// Four list items. Three in one category
Layout.L.arrangement.div4_0_0_3_1 = Layout.L.arrangement.columns;
// Four list items. All in one category. Longer lists will get multiColumn'ed
Layout.L.arrangement.div4_0_0_4_0 = Layout.L.arrangement.columns;
// Five list items. Two parents and three in a second column
Layout.L.arrangement.div5_2_0_3_0 = Layout.L.arrangement.columns;
// Five list items. Two parents and a two/one split.
// TODO: consider flattenTop for this style of layout
Layout.L.arrangement.div5_2_2_1_0 = Layout.L.arrangement.columns;
// Five list items. Two parents and three other columns
Layout.L.arrangement.div5_2_1_1_1 = Layout.L.arrangement.columns;
// Five list items. Four in one list, and a fifth
Layout.L.arrangement.div5_0_0_4_1 = Layout.L.arrangement.columns;
// Five list items. One list, but split multicolumn
Layout.L.arrangement.div5_0_0_5_0 = Layout.L.arrangement.multiColumn(2);
// Six list items. Two parents and others in a single column
Layout.L.arrangement.div6_2_0_4_0 = Layout.L.arrangement.columns;
// Six list items. Two parents and a short split
Layout.L.arrangement.div6_2_3_1_0 = Layout.L.arrangement.longRun;
// Six list items. Two parents and even columns
Layout.L.arrangement.div6_2_2_2_0 = Layout.L.arrangement.flattenTop;
// Six list items. Two parents and spread
Layout.L.arrangement.div6_2_2_1_1 = Layout.L.arrangement.columns;
// Six list items. Mostly or all in one column
Layout.L.arrangement.div6_0_0_5_1 = Layout.L.arrangement.multiColumn(2);
Layout.L.arrangement.div6_0_0_6_0 = Layout.L.arrangement.multiColumn(2);
// Six list items. All in two columns
Layout.L.arrangement.div6_0_0_3_3 = Layout.L.arrangement.columns;
// Seven list items. Parents, and a multicolumn
Layout.L.arrangement.div7_2_0_5_0 = Layout.L.arrangement.flattenTopMultiColumn(2);
// Seven list items. Parents, litter, and three siblings
Layout.L.arrangement.div7_2_2_3_0 = Layout.L.arrangement.longRun;
// Seven list items. parents, litter, siblings, and children, all straight columns
Layout.L.arrangement.div7_2_2_2_1 = Layout.L.arrangement.columns;
// Seven list items. A predominant list with parents.
// The three item list is last, but we can shift it up a little
// TODO: might try a flat layout on top, and a longRun lower down
Layout.L.arrangement.div7_2_1_3_1 = Layout.L.arrangement.longRun;
// Seven list items. a predominant list with no litter. 
// Place the one below the parents, and the four kicked right.
Layout.L.arrangement.div7_2_0_4_1 = Layout.L.arrangement.longRun;
// Eight list items. Two animals per list type
Layout.L.arrangement.div8_2_2_2_2 = Layout.L.arrangement.columns;
// Eight list items. Mostly balanced but a three-and-one on the right
Layout.L.arrangement.div8_2_2_3_1 = Layout.L.arrangement.longRun;
// Eight list items, a long column and two shorties
Layout.L.arrangement.div8_2_2_4_0 = Layout.L.arrangement.longRun;
Layout.L.arrangement.div8_2_1_5_0 = Layout.L.arrangement.longRun;
// Eight list items. Do the four column below the one, but kick it up
Layout.L.arrangement.div8_2_1_4_1 = Layout.L.arrangement.lastColumnLong;
// Eight list items. Flatten the top and multicolumn the other one
Layout.L.arrangement.div8_2_0_6_0 = Layout.L.arrangement.flattenTopMultiColumn(2);
// Nine list items. Mostly balanced
Layout.L.arrangement.div9_2_2_3_3 = Layout.L.arrangement.columns;
// Nine list items. Mostly balanced, but kick the last column up slightly
Layout.L.arrangement.div9_2_1_4_2 = Layout.L.arrangement.lastColumnLong;
// Nine list items. Two single columns sneaking on the left
Layout.L.arrangement.div9_2_1_5_1 = Layout.L.arrangement.longRun;
// Nine list items. A long column goes multiColumn. 
// On mobile the broader multicolumn lists should shrink down to two columns
Layout.L.arrangement.div9_2_2_5_0 = Layout.L.arrangement.multiColumn(2);
Layout.L.arrangement.div9_2_1_6_0 = Layout.L.arrangement.multiColumn(2);
// Nine list items, but a single column of three looks out of place here.
Layout.L.arrangement.div9_0_0_6_3 = Layout.L.arrangement.shortMultiColumn(2);
Layout.L.arrangement.div9_2_0_7_0 = Layout.L.arrangement.flattenTopMultiColumn(2);
Layout.L.arrangement.div9_0_0_8_1 = Layout.L.arrangement.flattenTopMultiColumn(3);
Layout.L.arrangement.div9_0_0_9_0 = Layout.L.arrangement.flattenTopMultiColumn(4);
// Ten list items. Parents and balanced elsewhere
Layout.L.arrangement.div10_2_0_4_4 = Layout.L.arrangement.flattenTop;
// Ten list items. Spread out wide
Layout.L.arrangement.div10_2_2_3_3 = Layout.L.arrangement.columns;
Layout.L.arrangement.div10_2_1_4_3 = Layout.L.arrangement.lastColumnLong;
// Ten list items. Flatten the top, and multicolumn the largest one
Layout.L.arrangement.div10_2_2_5_1 = Layout.L.arrangement.flattenTopMultiColumn(2);
// Ten list items. Balanced lists and a muticolumn
Layout.L.arrangement.div10_2_2_6_0 = Layout.L.arrangement.multiColumn(2);
// Ten list items. Sneak the singles down the left
Layout.L.arrangement.div10_2_1_6_1 = Layout.L.arrangement.longRun;
// Ten list items. Too long to be a long run.
Layout.L.arrangement.div10_2_0_7_1 = Layout.L.arrangement.multiColumn(2);
// Ten list items. No parents layouts, even stevens. Spread out on desktop
Layout.L.arrangement.div10_0_0_5_5 = Layout.L.arrangement.multiColumn(2, 'onlyDesktop');
// Ten list items. On mobile this looks fine as two columns.
// On desktop the multicolumn div needs to be split out.
Layout.L.arrangement.div10_0_0_6_4 = Layout.L.arrangement.multiColumn(2, 'onlyDesktop');
// Ten list items. Seven-long columns are too much.
Layout.L.arrangement.div10_0_0_7_3 = Layout.L.arrangement.shortMultiColumn(2);
// Ten list items. With parents, flatten the top
Layout.L.arrangement.div10_2_0_8_0 = Layout.L.arrangement.flattenTopMultiColumn(2);
// Ten list items. Two columns of five should both be multiColumn'ed
// TODO

/* Logic checks relevant to the arrangement functions */
Layout.L.checks = {};
// If children and siblings within one animal difference of each other in size,
// return true. Ignore lists longer than a mobile page height in length (7 or greater)
Layout.L.checks.balancedChildrenAndSiblings = function() {
  var difference = this.num.siblings - this.num.children;
  return ((this.between(difference, -1, 1, "inclusive")) &&
          (this.num.siblings < 7) && (this.num.chidren < 7));
}
Layout.L.checks.between = function(test, a, b, mode) {
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
Layout.L.checks.litterExists = function() {
  return this.num.litter > 0;
}
// Five or more children, and no other litter/children
Layout.L.checks.manyChildrenNoSiblings = function() {
  return ((this.num.children >= 5) && (this.num.litter == 0) &&
          (this.num.siblings == 0));
}
// Five or more siblings, and no other litter/children
Layout.L.checks.manySiblingsNoChildren = function() {
  return ((this.num.siblings >= 5) && (this.num.litter == 0) &&
          (this.num.children == 0));
}
Layout.L.checks.onlyChildrenNotSiblings = function() {
  return (this.num.children > 0) && (this.num.siblings == 0);
}
Layout.L.checks.onlyLitterNotOthers = function() {
  return ((this.num.parents == 0) && (this.num.litter > 0) &&
          (this.num.siblings == 0) && (this.num.children == 0));
}
Layout.L.checks.onlyParentsNotOthers = function() {
  return ((this.num.parents > 0) && (this.num.litter == 0) && 
          (this.num.siblings == 0) && (this.num.children == 0));
}
Layout.L.checks.onlySiblingsNotChildren = function() {
  return (this.num.siblings > 0) && (this.num.children == 0);
}
// If no litter, but at least one siblings and children column plus parents, return true
Layout.L.checks.parentsButNoLitter = function() {
  return ((this.num.parents > 0) && (this.num.litter == 0) &&
          ((this.num.siblings > 0) || (this.num.children > 0)));
}
// If we have twice as many children as siblings, factor=2 will return true
Layout.L.checks.ratioChildrenToSiblings = function(factor) {
  var ctos = this.num.children / this.num.siblings;
  var stoc = this.num.siblings / this.num.children;
  return (ctos >= factor) || (stoc >= factor);
}
Layout.L.checks.singleChildrenOrSiblingsList = function() {
  return ((this.onlyChildrenNotSiblings()) || this.onlySiblingsNotChildren());
}
// Have only a single column of at least five children or five siblings.
Layout.L.checks.singleLongChildrenOrSiblingsList = function() {
  return ((this.manyChildrenNoSiblings()) || (this.manySiblingsNoChildren()));
}
// Have only a single column of less than five children or five siblings
Layout.L.checks.singleShortChildrenOrSiblingsList = function() {
  return ((this.onlyOneOfSiblingsOrChildrenLists()) && 
          (this.num.children < 5) && (this.num.siblings < 5));
}
// Determine if in mobile/portrait mode for layout tasks
Layout.L.checks.smallScreen = function() {
  return (window.matchMedia("(max-width: 670px)").matches == true);
}
Layout.L.checks.twoShortChildrenAndSiblingsLists = function() {
  return (this.between(this.num.children, 2, 5, "inclusive") &&
          this.between(this.num.siblings, 2, 5, "inclusive"));
}
Layout.L.checks.twoLongChildrenAndSiblingsLists = function() {
  return (this.num.siblings >= 6) && (this.num.children >= 6);
}
/* More generic checks */
// True if all lists in the input set have no members
Layout.L.checks.emptyLists = function(lists) {
  return lists.map(list_name => this.num[list_name] == 0).indexOf(false) == - 1;
}
// Choose a list, and ensure that no other lists have members
Layout.L.checks.onlyThisListHasMembers = function(list_name) {
  var other_lists = Object.keys(this.num).filter(i => i != list_name);
  return ((this.num[list_name] != 0) && (this.emptyLists(other_lists)));
}


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

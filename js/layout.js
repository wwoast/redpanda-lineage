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
    // Make sure checks can see this object's counts
    layout.checks.num = layout.num;
    // Set up the divs themselves
    layout.family = family;
    layout.parents = parents;
    layout.litter = litter;
    layout.siblings = siblings;
    layout.children = children;
    return layout;
}

Layout.L.num = {};
Layout.L.num.parents = 0;
Layout.L.num.litter = 0;
Layout.L.num.siblings = 0;
Layout.L.num.children = 0;

Layout.L.family = undefined;   /* Output of this layout tool */
Layout.L.parents = undefined;
Layout.L.litter = undefined;
Layout.L.siblings = undefined;
Layout.L.children = undefined;

Layout.L.arrangements = {};
// TOWRITE: define arrangements here, instead of nesting them in the generate.layout.
// Include column swaps, tr swaps, and things in these functions.

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

Layout.L.div = {}
// Flex box order. Determines display groupings.
// Increment whenever we plan on making a new row.
Layout.L.div.order = 0;
/* Take a div list, and apply flatten classes to it. When adding a flattened class,
   we need to add a line-break entity afterwards, and bump the flex box display
   order of subsequent inserted divs. */
Layout.L.div.flatten = function(div, mobileOnly=false) {
  if (mobileOnly == true) {
    div.childNodes[1].classList.add("mobileOnlyFlat");
    div.style.order = this.order++;
  } else {
    // Mobile and Desktop flattened divs generally only appear alone, so give
    // them a 100%-width singleton entry into the family list.
    div.classList.add("singleton");
    div.childNodes[1].classList.add("flat");
  }
  return div;
}

/* Take a div list, and apply a column-mode class to it. */
Layout.L.div.multiColumn = function(div, columnCount=2) {
  if (columnCount == 2) {
    div.childNodes[1].classList.add("double");
    div.style.order = this.order++;
  }
  if (columnCount == 3) {
    div.childNodes[1].classList.add("triple");
    div.style.order = this.order++;
  }
  return div;
}

/* Swap the target column with the destination column */
Layout.L.div.swapColumn = function(target, destination, destination_cnt) {
  var tmp_order = destination.style.order + 1;
  target.style.order = tmp_order;
  // Take the sibling column height, subtract 90 for the parents div (always 3*30px),
  // and move the litter column up accordingly. Estimate the height since it's not rendered yet
  height = (destination_cnt + 1) * 30;
  shift = (height * -1) + 90;
  if (shift < 0) {   // Only move sibling up if we have space to move it up
    target.style.marginTop = shift.toString() + "px";
  }
  // When doing a swap, move the line break element that might exist after the target, to
  // after the swapped destination instead.
  var divBreak = target.nextSibling;
  target.parentNode.removeChild(divBreak);
  destination.parentNode.insertBefore(divBreak, destination.nextSibling);
}

// Adds a divider. The mode doubles as a flag to describe whether or not flex
// dividers are necessary, so filter out "true" and "false" for class names
Layout.L.div.flexDivider = function(mode) {
  var divider = document.createElement('hr');
  divider.className = "flexDivider";
  if ((mode != false) && (mode != true)) {
    divider.classList.add(mode);
  }
  return divider;
}

/* The layout generator basically prods all the possible arrangements of 
   parents/litter/siblings/children, and based on hand-layout-optimizing, chooses
   what the best layout should be for each possible set of inputs. */
Layout.L.layout = function() {
  // TOWRITE. don't do parents/children/siblings/etc divs separately. Write out tons of code,
  // and make it so that each path is as shallow as possible.
  var divider = false;
  var distance = 0;   /* Distance since the last line break */

  // Parent layout logic
  if (this.parents != undefined) {
    this.parents.style.order = this.div.order;
    // Just parents? Make it flat on desktop and mobile
    if (this.checks.onlyParentsNotOthers()) {
      this.parents = this.div.flatten(this.parents, mobileOnly=false);
    }
    // If small number of siblings or children
    if (this.checks.manyChildrenNoSiblings() || this.checks.manySiblingsNoChildren()) {
      this.parents = this.div.flatten(this.parents, mobileOnly=true);
      divider = "onlyMobile";
    }
    // If no litter column on mobile, and five or more children or siblings, 
    // flatten the parents before doing others
    if (this.checks.parentsButNoLitter() && this.checks.singleLongChildrenOrSiblingsList()) {
      this.parents = this.div.flatten(this.parents, mobileOnly=true);
      divider = "onlyMobile";
    }
    // If no litter column, and two short columns of children and siblings, 
    // flatten the parents before doing others
    if (this.checks.parentsButNoLitter() && this.checks.twoShortChildrenAndSiblingsLists()) {
      this.parents = this.div.flatten(this.parents, mobileOnly=true);
      divider = "onlyMobile";
    }
    // Append parents div to the family display
    this.family.appendChild(this.parents);
    // Add dividers as instructed by earlier layout checks
    ((divider == false) && (distance++));
    ((divider != false) && (this.family.appendChild(this.div.flexDivider(divider))) && (distance = 0));
    ((distance == 0) && (divider = false));
  }

  // Litter layout logic
  if (this.litter != undefined) {
    this.litter.style.order = this.div.order;

    // Only a litter div of two entries, and no others. Make it flat on desktop and mobile
    if (this.checks.onlyLitterNotOthers()) {
      this.litter = this.div.flatten(this.litter, mobileOnly=false);
    }
    // Append litter div to the family display
    this.family.appendChild(this.litter);
    // Add dividers as instructed by earlier layout checks.
    ((divider == false) && (distance++));
    ((distance == 2) && (divider = "onlyMobile"));
    ((divider != false) && (this.family.appendChild(this.div.flexDivider(divider))) && (distance = 0));
    ((distance == 0) && (divider = false));
  }

  // Siblings layout logic
  if (this.siblings != undefined) {
    this.siblings.style.order = this.div.order;

    // Spread out the siblings column if we have space
    if (this.checks.manySiblingsNoChildren()) {
      this.siblings = this.div.multiColumn(this.siblings, 2);
    }
    // Append siblings div to the family display
    this.family.appendChild(this.siblings);
    // If litter is much shorter than siblings on mobile, apply ordering to change display.
    // This is only done once so it won't work when changing orientations in Web Inspector.
    // TODO: make an event to do column switching live on demand
    if ((this.checks.litterExists()) && this.checks.onlySiblingsNotChildren() && this.checks.smallScreen()) {
      this.div.swapColumn(this.litter, this.siblings, this.num.siblings);
    }

    // Add dividers as instructed by earlier layout checks. If it's two columns since a
    // break was added, add another one.
    ((divider == false) && (distance++));
    ((distance == 2) && (divider = "onlyMobile"));
    ((divider != false) && (this.family.appendChild(this.div.flexDivider(divider))) && (distance = 0));
    ((distance == 0) && (divider = false));
  }

  // Children layout logic
  if (this.children != undefined) {
    this.children.style.order = this.div.order;

    // Spread out the children column if we have space
    if (this.checks.manyChildrenNoSiblings()) {
      this.children = this.div.multiColumn(this.children, 2);
    }
    // Append children div to the family display
    this.family.appendChild(this.children);
    // If litter is much shorter than children on mobile, apply ordering to change display.
    // This is only done once so it won't work when changing orientations in Web Inspector.
    // TODO: make an event to do column switching live on demand
    if ((this.checks.litterExists()) && this.checks.onlyChildrenNotSiblings() && this.checks.smallScreen()) {
      this.div.swapColumn(this.litter, this.children, this.num.children);
    }

    // No more dividers to add after children
  }
  return this.family;
}

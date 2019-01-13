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
        layout.count.parents = 2;
    }
    layout.count.litter = info.litter.length;
    layout.count.siblings = info.siblings.length;
    layout.count.children = info.children.length;
    // Set up the divs themselves
    layout.family = family;
    layout.parents = parents;
    layout.litter = litter;
    layout.siblings = siblings;
    layout.children = children;
    return layout;
}

Layout.num = {};
Layout.num.parents = 0;
Layout.num.litter = 0;
Layout.num.siblings = 0;
Layout.num.children = 0;

Layout.family = undefined;   /* Output of this layout tool */
Layout.parents = undefined;
Layout.litter = undefined;
Layout.siblings = undefined;
Layout.children = undefined;

Layout.arrangements = {};
// TOWRITE: define arrangements here, instead of nesting them in the generate.layout.
// Include column swaps, tr swaps, and things in these functions.

Layout.checks = {};
// If children and siblings within one animal difference of each other in size,
// return true. Ignore lists longer than a mobile page height in length (7 or greater)
Layout.checks.balancedChildrenAndSiblings = function() {
  var difference = this.num.siblings - this.num.children;
  return ((this.checks.between(difference, -1, 1, "inclusive")) &&
          (this.num.siblings < 7) && (this.num.chidren < 7));
}
Layout.checks.between = function(test, a, b, mode) {
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
Layout.checks.litterExists = function() {
  return this.num.litter > 0;
}
// Five or more children, and no other litter/children
Layout.checks.manyChildrenNoSiblings = function() {
  return ((this.num.children >= 5) && (this.num.litter == 0) &&
          (this.num.siblings == 0));
}
// Five or more siblings, and no other litter/children
Layout.checks.manySiblingsNoChildren = function() {
  return ((this.num.siblings >= 5) && (this.num.litter == 0) &&
          (this.num.children == 0));
}
Layout.checks.onlyChildrenNotSiblings = function() {
  return (this.num.children > 0) && (this.num.siblings == 0);
}
Layout.checks.onlyLitterNotOthers = function() {
  return ((this.num.parents == 0) && (this.num.litter > 0) &&
          (this.num.siblings == 0) && (this.num.children == 0));
}
Layout.checks.onlyParentsNotOthers = function() {
  return ((this.num.parents > 0) && (this.num.litter == 0) && 
          (this.num.siblings == 0) && (this.num.childen == 0));
}
Layout.checks.onlySiblingsNotChildren = function() {
  return (this.num.siblings > 0) && (this.num.children == 0);
}
// If no litter, but at least one siblings and children column plus parents, return true
Layout.checks.parentsButNoLitter = function() {
  return ((this.num.parents > 0) && (this.num.litter == 0) &&
          ((this.num.siblings > 0) || (this.num.children > 0)));
}
// If we have twice as many children as siblings, factor=2 will return true
Layout.checks.ratioChildrenToSiblings = function(factor) {
  var ctos = this.num.children / this.num.siblings;
  var stoc = this.num.siblings / this.num.children;
  return (ctos >= factor) || (stoc >= factor);
}
Layout.checks.singleChildrenOrSiblingsList = function() {
  return ((this.checks.onlyChildrenNotSiblings()) || this.checks.onlySiblingsNotChildren());
}
// Have only a single column of at least five children or five siblings.
Layout.checks.singleLongChildrenOrSiblingsList = function() {
  return ((this.checks.manyChildrenNoSiblings()) || (this.checks.manySiblingsNoChildren()));
}
// Have only a single column of less than five children or five siblings
Layout.checks.singleShortChildrenOrSiblingsList = function() {
  return ((this.checks.onlyOneOfSiblingsOrChildrenLists()) && 
          (this.num.children < 5) && (this.num.siblings < 5));
}
// Determine if in mobile/portrait mode for layout tasks
Layout.checks.smallScreen = function() {
  return (window.matchMedia("(max-width: 670px)").matches == true);
}
Layout.checks.twoShortChildrenAndSiblingsLists = function() {
  return (this.checks.between(this.num.children, 2, 5, "inclusive") &&
          this.checks.between(this.num.siblings, 2, 5, "inclusive"));
}
Layout.checks.twoLongChildrenAndSiblingsLists = function() {
  return (this.num.siblings >= 6) && (this.num.children >= 6);
}

// Adds a divider. The mode doubles as a flag to describe whether or not flex
// dividers are necessary, so filter out "true" and "false" for class names
Layout.flexDivider = function(mode) {
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
Layout.layout = function() {
  // TOWRITE. don't do parents/children/siblings/etc divs separately. Write out tons of code,
  // and make it so that each path is as shallow as possible.
  var divider = false;
  var order = 0;   /* Flex box order, determines display groupings,
                      Increment whenever we plan on making a new row */
  var distance = 0;   /* Distance since the last line break */

  // Parent layout logic
  if (this.parents != undefined) {
    this.parents.style.order = order;

    // Just parents? Make it flat on desktop and mobile
    if (this.checks.onlyParentsNotOthers()) {
      this.parents.classList.add('singleton');
      this.parents.childNodes[1].classList.add('flat');
      this.parents.style.order = order++;
    }
    // If small number of siblings or children
    if ((this.checks.manyChildrenNoSiblings()) || (this.checks.manySiblingsNoChildren())) {
      this.parents.childNodes[1].classList.add('onlyMobileFlat');
      this.parents.style.order = order++;
      divider = "onlyMobile";
    }
    // If no litter column on mobile, and five or more children or siblings, 
    // flatten the parents before doing others
    if ((this.checks.parentsButNoLitter()) && this.checks.singleLongChildrenOrSiblingsList()) {
      this.parents.childNodes[1].classList.add('onlyMobileFlat');
      this.parents.style.order = order++;
      divider = "onlyMobile";
    }
    // If no litter column, and two short columns of children and siblings, 
    // flatten the parents before doing others
    if ((this.checks.parentsButNoLitter()) && (this.checks.twoShortChildrenAndSiblingsLists())) {
      this.parents.childNodes[1].classList.add('onlyMobileFlat');
      this.parents.style.order = order++;
      divider = "onlyMobile";
    }

    // Append parents div to the family display
    this.family.appendChild(this.parents);
    // Add dividers as instructed by earlier layout checks
    ((divider == false) && (distance++));
    ((divider != false) && (this.family.appendChild(this.flexDivider(divider))) && (distance = 0));
    ((distance == 0) && (divider = false));
  }

  // Litter layout logic
  if (this.litter != undefined) {
    this.litter.style.order = order;

    // Only a litter div of two entries, and no others. Make it flat on desktop and mobile
    if (this.checks.onlyLitterNoOthers()) {
      this.litter.classList.add('singleton');
      this.litter.childNodes[1].classList.add('flat');
    }

    this.family.appendChild(this.litter);
    // Add dividers as instructed by earlier layout checks.
    ((divider == false) && (distance++));
    ((distance == 2) && (divider = "onlyMobile"));
    ((divider != false) && (this.family.appendChild(this.flexDivider(divider))) && (distance = 0));
    ((distance == 0) && (divider = false));
  }

  // Siblings layout logic
  if (this.siblings != undefined) {
    this.siblings.style.order = order;

    // Spread out the siblings column if we have space
    if (this.checks.manySiblingsNoChildren()) {
      this.siblings.childNodes[1].classList.add('double');
      this.siblings.style.order = order++;
    }

    this.family.appendChild(this.siblings);
    // If litter is much shorter than siblings on mobile, apply ordering to change display.
    // This is only done once so it won't work when changing orientations in Web Inspector.
    // TODO: make an event to do column switching live on demand
    if ((this.checks.litterExists()) && this.checks.onlySiblingsNotChildren() && this.checks.smallScreen()) {
      order = this.siblings.style.order + 1;
      this.litter.style.order = order;
      // Take the sibling column height, subtract 90 for the parents div (always 3*30px),
      // and move the litter column up accordingly. Estimate the height since it's not rendered yet
      height = (this.num.siblings + 1) * 30;
      shift = (height * -1) + 90;
      if (shift < 0) {   // Only move sibling up if we have space to move it up
        this.litter.style.marginTop = shift.toString() + "px";
      }
      // When doing a swap, move the line break element that might exist after the litter, to
      // after the sibling instead.
      var divBreak = this.litter.nextSibling;
      this.family.removeChild(this.litter.nextSibling);
      this.siblings.parentNode.insertBefore(divBreak, this.siblings.nextSibling);
    }

    // Add dividers as instructed by earlier layout checks. If it's two columns since a
    // break was added, add another one.
    ((divider == false) && (distance++));
    ((distance == 2) && (divider = "onlyMobile"));
    ((divider != false) && (this.family.appendChild(this.flexDivider(divider))) && (distance = 0));
    ((distance == 0) && (divider = false));
  }

  // Children layout logic
  if (this.children != undefined) {
    this.children.style.order = order;

    this.family.appendChild(children);
    // If litter is much shorter than children on mobile, apply ordering to change display.
    // This is only done once so it won't work when changing orientations in Web Inspector.
    // TODO: make an event to do column switching live on demand
    if ((this.checks.litterExists()) && this.checks.onlyChildrenNotSiblings() && Show.smallScreen()) {
      order = this.children.style.order + 1;
      this.litter.style.order = order;
      // Take the children column height, subtract 90 for the parents div (always 3*30px),
      // and move the litter column up accordingly. Estimate the height since it's not rendered yet
      height = (this.num.children + 1) * 30;
      shift = (height * -1) + 90;
      if (shift < 0) {   // Only move sibling up if we have space to move it up
        this.litter.style.marginTop = shift.toString() + "px";
      }
      // When doing a swap, move the line break element that might exist after the litter, to
      // after the children instead.
      var divBreak = this.litter.nextSibling;
      this.family.removeChild(this.litter.nextSibling);
      this.children.parentNode.insertBefore(divBreak, this.children.nextSibling);
    }

    // No more dividers to add after children
  }
  return Layout.family;
}

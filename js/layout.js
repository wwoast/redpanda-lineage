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

Layout.count = {};
Layout.count.parents = 0;
Layout.count.litter = 0;
Layout.count.siblings = 0;
Layout.count.children = 0;

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
  var difference = Layout.count.siblings - Layout.count.children;
  return ((Layout.checks.between(difference, -1, 1, "inclusive")) &&
          (Layout.count.siblings < 7) && (Layout.count.chidren < 7));
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
  return Layout.count.litter > 0;
}
// Five or more children, and no other litter/children
Layout.checks.manyChildrenNoSiblings = function() {
  return ((Layout.count.children >= 5) && (Layout.count.litter == 0) &&
          (Layout.count.siblings == 0));
}
// Five or more siblings, and no other litter/children
Layout.checks.manySiblingsNoChildren = function() {
  return ((Layout.count.siblings >= 5) && (Layout.count.litter == 0) &&
          (Layout.count.children == 0));
}
Layout.checks.onlyChildrenNotSiblings = function() {
  return (Layout.count.children > 0) && (Layout.count.siblings == 0);
}
Layout.checks.onlyLitterNotOthers = function() {
  return ((Layout.count.parents == 0) && (Layout.count.litter > 0) &&
          (Layout.count.siblings == 0) && (Layout.count.children == 0));
}
Layout.checks.onlyParentsNotOthers = function() {
  return ((Layout.count.parents > 0) && (Layout.count.litter == 0) && 
          (Layout.count.siblings == 0) && (Layout.count.childen == 0));
}
Layout.checks.onlySiblingsNotChildren = function() {
  return (Layout.count.siblings > 0) && (Layout.count.children == 0);
}
// If no litter, but at least one siblings and children column plus parents, return true
Layout.checks.parentsButNoLitter = function() {
  return ((Layout.count.parents > 0) && (Layout.count.litter == 0) &&
          ((Layout.count.siblings > 0) || (Layout.count.children > 0)));
}
// If we have twice as many children as siblings, factor=2 will return true
Layout.checks.ratioChildrenToSiblings = function(factor) {
  var ctos = Layout.count.children / Layout.count.siblings;
  var stoc = Layout.count.siblings / Layout.count.children;
  return (ctos >= factor) || (stoc >= factor);
}
Layout.checks.singleChildrenOrSiblingsList = function() {
  return ((Layout.checks.onlyChildrenNotSiblings()) || Layout.checks.onlySiblingsNotChildren());
}
// Have only a single column of at least five children or five siblings.
Layout.checks.singleLongChildrenOrSiblingsList = function() {
  return ((Layout.checks.manyChildrenNoSiblings()) || (Layout.checks.manySiblingsNoChildren()));
}
// Have only a single column of less than five children or five siblings
Layout.checks.singleShortChildrenOrSiblingsList = function() {
  return ((Layout.checks.onlyOneOfSiblingsOrChildrenLists()) && (Layout.count.children < 5) &&
          (Layout.count.siblings < 5));
}
Layout.checks.twoShortChildrenAndSiblingsLists = function() {
  return (Layout.checks.between(Layout.count.children, 2, 5, "inclusive") &&
          Layout.checks.between(Layout.count.siblings, 2, 5, "inclusive"));
}
Layout.checks.twoLongChildrenAndSiblingsLists = function() {
  return (Layout.count.siblings >= 6) && (Layout.count.children >= 6);
}
// Determine if in mobile/portrait mode for layout tasks
Layout.checks.smallScreen = function() {
  return (window.matchMedia("(max-width: 670px)").matches == true);
}
// bothParentsDocumented, lessThanFiveChildren, lessThanFiveSiblings,
// neitherParentsDocumented

Layout.generate = {};
// Adds a divider. The mode doubles as a flag to describe whether or not flex
// dividers are necessary, so filter out "true" and "false" for class names
Layout.generate.flexDivider = function(mode) {
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
Layout.generate.layout = function() {
  // TOWRITE. don't do parents/children/siblings/etc divs separately. Write out tons of code,
  // and make it so that each path is as shallow as possible.
  return Layout.family;
}

//TOWRITE: REFACTOR into generate.layout
// Given the parents/litter/siblings/children lists, apply classes
// and styles and reorder the lists to optimize for space. These classes
// have CSS media query logic for mobile/widescreen, and therefore don't 
// need JS hooks when the viewport changes. There are a number of
// constraints this logic attempts to enforce, since family lists are
// only logically ordered by birthdates:
//   - No lists shorter than 5 will get multicolumn-split
//   - No lists other than length 2 will get flattened
Show.familyListLayout = function(family, info, parents, litter, siblings, children) {
    var divider = false;
    var order = 0;   /* Flex box order, determines display groupings,
                        Increment whenever we plan on making a new row */
    var distance = 0;   /* Distance since the last line break */
  
    // Parent layout logic
    if (parents != undefined) {
      parents.style.order = order;
  
      // Just parents? Make it flat on desktop and mobile
      if (Show.onlyParents(info)) {
        parents.classList.add('singleton');
        parents.childNodes[1].classList.add('flat');
        parents.style.order = order++;
      }
      // If small number of siblings or children
      if ((Show.manySiblingsNoChildren(info)) || (Show.manyChildrenNoSiblings(info))) {
        parents.childNodes[1].classList.add('onlyMobileFlat');
        parents.style.order = order++;
        divider = "onlyMobile";
      }
      // If no litter column on mobile, and five or more children or siblings, 
      // flatten the parents before doing others
      if ((Show.parentsButNoLitter(info)) && Show.singleLongChildrenOrSiblingsColumn(info)) {
        parents.childNodes[1].classList.add('onlyMobileFlat');
        parents.style.order = order++;
        divider = "onlyMobile";
      }
      // If no litter column, and two short columns of children and siblings, 
      // flatten the parents before doing others
      if ((Show.parentsButNoLitter(info)) && (Show.twoShortSiblingAndChildrenColumns(info))) {
        parents.childNodes[1].classList.add('onlyMobileFlat');
        parents.style.order = order++;
        divider = "onlyMobile";
      }
      // Append parents div to the family display
      family.appendChild(parents);
      // Add dividers as instructed by earlier layout checks
      ((divider == false) && (distance++));
      ((divider != false) && (family.appendChild(Show.flexDivider(divider))) && 
       (distance = 0) && (divider = false));
    }
  
    // Litter layout logic
    if (litter != undefined) {
      litter.style.order = order;
  
      // Only a litter div of two entries, and no others. Make it flat on desktop and mobile
      if (Show.onlyLitter(info)) {
        litter.classList.add('singleton');
        litter.childNodes[1].classList.add('flat');
      }
      family.appendChild(litter);
      // Add dividers as instructed by earlier layout checks.
      ((divider == false) && (distance++));
      ((distance == 2) && (divider = "onlyMobile"));
      ((divider != false) && (family.appendChild(Show.flexDivider(divider))) && (distance = 0));
      ((distance == 0) && (divider = false));
    }
  
    // Siblings layout logic
    if (siblings != undefined) {
      siblings.style.order = order;
  
      // Spread out the siblings column if we have space
      if (Show.manySiblingsNoChildren(info)) {
        siblings.childNodes[1].classList.add('double');
        siblings.style.order = order++;
      }
      family.appendChild(siblings);
      // If litter is much shorter than siblings on mobile, apply ordering to change display.
      // This is only done once so it won't work when changing orientations in Web Inspector.
      if ((Show.litterExists(info)) && Show.onlySiblingsNotChildren(info) && Show.smallWidthScreen()) {
        order = siblings.style.order + 1;
        litter.style.order = order;
        // Take the sibling column height, subtract 90 for the parents div (always 3*30px),
        // and move the litter column up accordingly. Estimate the height since it's not rendered yet
        height = (info.siblings.length + 1) * 30;
        litter.style.marginTop = ((height * -1) + 90).toString() + "px";
        // When doing a swap, move the line break element that might exist after the litter, to
        // after the sibling instead.
        var divBreak = litter.nextSibling;
        family.removeChild(litter.nextSibling);
        siblings.parentNode.insertBefore(divBreak, siblings.nextSibling);
      }
  
      // Add dividers as instructed by earlier layout checks. If it's two columns since a
      // break was added, add another one.
      ((divider == false) && (distance++));
      ((distance == 2) && (divider = "onlyMobile"));
      ((divider != false) && (family.appendChild(Show.flexDivider(divider))) && (distance = 0));
      ((distance == 0) && (divider = false));
    }
  
    // Children layout logic
    if (children != undefined) {
      children.style.order = order;
  
      family.appendChild(children);
      // If litter is much shorter than children on mobile, apply ordering to change display.
      // This is only done once so it won't work when changing orientations in Web Inspector.
      if ((Show.litterExists(info)) && Show.onlyChildrenNotSiblings(info) && Show.smallWidthScreen()) {
        order = children.style.order + 1;
        litter.style.order = order;
        // Take the children column height, subtract 90 for the parents div (always 3*30px),
        // and move the litter column up accordingly. Estimate the height since it's not rendered yet
        height = (info.children.length + 1) * 30;
        litter.style.marginTop = ((height * -1) + 90).toString() + "px";
        // When doing a swap, move the line break element that might exist after the litter, to
        // after the children instead.
        var divBreak = litter.nextSibling;
        family.removeChild(litter.nextSibling);
        children.parentNode.insertBefore(divBreak, children.nextSibling);
      }
  
      // No more dividers to add after children
    }
    return family;
  }
  
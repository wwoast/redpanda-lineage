// TOUCH-EVENTS SINGLE-FINGER SWIPE-SENSING JAVASCRIPT
// Heavily adapted from original code on PADILICIOUS.COM and MACOSXAUTOMATION.COM
var Touch = {};   // Namespace

Touch.T = {};     // Prototype

Touch.init = function() {
  var touch = Object.create(Touch.T);
  touch.triggerElementID = null;    // Used to identity the triggering element
  touch.fingerCount = 0;
  touch.startX = 0;
  touch.startY = 0;
  touch.curX = 0;
  touch.curY = 0;
  touch.deltaX = 0;
  touch.deltaY = 0;
  touch.horzDiff = 0;
  touch.vertDiff = 0;
  touch.minLength = 64;   // the shortest distance the user may swipe
  touch.swipeLength = 0;
  touch.swipeAngle = null;
  touch.swipeDirection = null;
  return touch;
}

// The 4 Touch Event Handlers
Touch.T.start = function(event, passedName) {
  // get the total number of fingers touching the screen
  this.fingerCount = event.touches.length;
  // since we're looking for a swipe (single finger) and not a gesture (multiple fingers),
  // check that only one finger was used
  if (this.fingerCount == 1) {
    // get the coordinates of the touch
    this.startX = event.touches[0].pageX;
    this.startY = event.touches[0].pageY;
    // store the triggering element ID
    this.triggerElementID = passedName;
  } else {
    // more than one finger touched so cancel
    this.cancel();
  }
}

Touch.T.move = function(event) {
  // event.preventDefault();
  if (event.touches.length == 1) {
    this.curX = event.touches[0].pageX;
    this.curY = event.touches[0].pageY;
  } else {
    this.cancel();
  }
}

Touch.T.end = function(event) {
  event.preventDefault();
  if (this.fingerCount == 1 && this.curX != 0) {
    // A swipe just happened. Use the distance formula
    // to determine the length of the swipe
    this.swipeLength = Math.round(Math.sqrt(Math.pow(this.curX - this.startX,2) + 
                                            Math.pow(this.curY - this.startY,2)));
    // If the swipe is longer than the minimum length, do an interface task
    if (this.swipeLength >= this.minLength) {
      this.angle();
      this.determine();   // What the swipe direction and angle are
      this.process();     // Do something in the RPF interface
      this.cancel();      // Reset the variables
    } else {
      this.cancel();
    }
  } else {
    this.cancel();
  }
}

Touch.T.cancel = function() {
  // reset the variables back to default values
  this.fingerCount = 0;
  this.startX = 0;
  this.startY = 0;
  this.curX = 0;
  this.curY = 0;
  this.deltaX = 0;
  this.deltaY = 0;
  this.horzDiff = 0;
  this.vertDiff = 0;
  this.swipeLength = 0;
  this.swipeAngle = null;
  this.swipeDirection = null;
  this.triggerElementID = null;
}

Touch.T.angle = function() {
  var X = this.startX - this.curX;
  var Y = this.curY - this.startY;
  // var Z = Math.round(Math.sqrt(Math.pow(X,2) + Math.pow(Y,2))); // the distance - rounded - in pixels
  var r = Math.atan2(Y,X); // angle in radians (Cartesian system)
  this.swipeAngle = Math.round(r*180/Math.PI); // angle in degrees
  if (this.swipeAngle < 0) { 
    this.swipeAngle = 360 - Math.abs(this.swipeAngle);
  }
}

Touch.T.determine = function() {
  if ((this.swipeAngle <= 45) && (this.swipeAngle >= 0)) {
    this.swipeDirection = 'left';
  } else if ((T.swipeAngle <= 360) && (this.swipeAngle >= 315)) {
    this.swipeDirection = 'left';
  } else if ((T.swipeAngle >= 135) && (this.swipeAngle <= 225)) {
    this.swipeDirection = 'right';
  } else if ((T.swipeAngle > 45) && (this.swipeAngle < 135)) {
    this.swipeDirection = 'down';
  } else {
    this.swipeDirection = 'up';
  }
}

// Callback to change the photo based on where the touch event happened
Touch.T.process = function() {
  var animal_id = this.triggerElementID.split('/')[0];
  var navigator_id = animal_id + "/navigator";
  var navigator = document.getElementById(navigator_id);
  var span = navigator.childNodes[0];
  if (this.swipeDirection == 'right') {
    Gallery.G.photoPrevious(animal_id);
    Gallery.condenseDogEar(span);
    Show.fade(navigator);
  } else if (this.swipeDirection == 'left') {
    Gallery.G.photoNext(animal_id);
    Gallery.condenseDogEar(span);
    Show.fade(navigator);
  }
}

// Touchable carousels for every loaded photo.
Touch.addHandler = function(photo_element) {
  photo_element.addEventListener('touchstart', function(event) {
    T.start(event, photo_element.id);
  }, true);
  photo_element.addEventListener('touchend', function(event) {
    T.end(event);
  }, true);
  photo_element.addEventListener('touchmove', function(event) {
    T.move(event);
  }, true);
  photo_element.addEventListener('touchcancel', function() {
    T.cancel();
  }, true);
}

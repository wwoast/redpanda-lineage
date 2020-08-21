// TOUCH-EVENTS SINGLE-FINGER SWIPE-SENSING JAVASCRIPT
// Heavily adapted from original code on PADILICIOUS.COM and MACOSXAUTOMATION.COM
var Touch = {};   // Namespace

Touch.T = {};     // Prototype

Touch.init = function() {
  var touch = Object.create(Touch.T);
  touch.fingerCount = 0;
  touch.startX = 0;
  touch.startY = 0;
  touch.startTime = 0;
  touch.endTime = 0;
  touch.curX = 0;
  touch.curY = 0;
  touch.deltaX = 0;
  touch.xTurn = 0;
  touch.turnCount = 0;
  touch.horzDiff = 0;
  touch.vertDiff = 0;
  touch.minLength = 64;   // the shortest distance the user may swipe
  touch.swipeLength = 0;
  touch.swipeAngle = null;
  touch.swipeDirection = null;
  return touch;
}

// The 4 Touch Event Handlers
Touch.T.start = function(event) {
  // get the total number of fingers touching the screen
  this.fingerCount = event.touches.length;
  // timer for long press events
  this.startTime = new Date().getTime();
  // since we're looking for a swipe (single finger) and not a gesture (multiple fingers),
  // check that only one finger was used
  if (this.fingerCount == 1) {
    // get the coordinates of the touch
    this.startX = event.touches[0].pageX;
    this.startY = event.touches[0].pageY;
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
    // Gesture length calculation
    if (this.xTurn == 0) {
      var newDeltaX = Math.abs(this.curX - this.startX);
      if (newDeltaX > this.deltaX) {
        this.deltaX = newDeltaX;
      } else {
        this.xTurn = this.curX;
        this.horzDiff = this.horzDiff + this.deltaX;
        this.deltaX = 0;
        this.turnCount = this.turnCount + 1;
      }
    } else {
      var newDeltaX = Math.abs(this.xTurn - this.curX);
      if (newDeltaX > this.deltaX) {
        this.deltaX = newDeltaX;
      } else {
        // We turned again, so cancel
        this.horzDiff = this.horzDiff + this.deltaX;
        this.xTurn = 0;
        this.deltaX = 0;
        this.turnCount = this.turnCount + 1;
      }
    }
  } else {
    this.cancel();
  }
}

Touch.T.swipeEnd = function(event, element_id, callback) {
  event.preventDefault();
  this.endTime = new Date().getTime();
  if (this.fingerCount == 1 && this.curX != 0) {
    // A swipe just happened. Use the distance formula
    // to determine the length of the swipe
    this.swipeLength = Math.round(Math.sqrt(Math.pow(this.curX - this.startX,2) + 
                                            Math.pow(this.curY - this.startY,2)));
    // If the swipe is longer than the minimum length, or if the
    // length of the swipe is long enough, do an interface task
    if ((this.swipeLength >= this.minLength) || 
        (this.horzDiff > 2*this.minLength)) {
      this.angle();
      this.determine();   // What the swipe direction and angle are
      // Do something in the RPF interface.
      // Must be scoped to the touch handler
      callback.apply(this, [element_id]);
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
  this.startTime = 0;
  this.endTime = 0;
  this.curX = 0;
  this.curY = 0;
  this.deltaX = 0;
  this.xTurn = 0;
  this.turnCount = 0;
  this.horzDiff = 0;
  this.vertDiff = 0;
  this.swipeLength = 0;
  this.swipeAngle = null;
  this.swipeDirection = null;
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
Touch.T.processPhoto = function(element_id) {
  var animal_id = element_id.split('/')[0];
  var navigator_id = animal_id + "/navigator";
  var navigator = document.getElementById(navigator_id);
  var span = navigator.childNodes[0];
  if (((this.horzDiff > 2*this.minLength) && (this.turnCount > 0)) &&
      ((this.swipeDirection == 'right') || (this.swipeDirection == 'left'))) {
    // At least one direction turn, and a swipe twice as long as a normal
    // left-right directional swipe
    Gallery.G.photoRandom(animal_id);
    Gallery.condenseDogEar(span);
    Show.fade(navigator);
    window.dispatchEvent(Page.profile.qr_update);
  } else if (this.swipeDirection == 'right') {
    Gallery.G.photoPrevious(animal_id);
    Gallery.condenseDogEar(span);
    Show.fade(navigator);
    window.dispatchEvent(Page.profile.qr_update);
  } else if (this.swipeDirection == 'left') {
    Gallery.G.photoNext(animal_id);
    Gallery.condenseDogEar(span);
    Show.fade(navigator);
    window.dispatchEvent(Page.profile.qr_update);
  }
}

// Swipe/gesture event handler. 
// Adds a listener for touch events on the photo carousels,
// and defines a callback function for when that touch element is finished.
Touch.addSwipeHandler = function(input_elem, callback) {
  input_elem.addEventListener('touchstart', function(event) {
    T.start(event);
  }, true);
  input_elem.addEventListener('touchend', function(event) {
    T.swipeEnd(event, input_elem.id, callback);
  }, true);
  input_elem.addEventListener('touchmove', function(event) {
    T.move(event);
  }, true);
  input_elem.addEventListener('touchcancel', function() {
    T.cancel();
  }, true);
}

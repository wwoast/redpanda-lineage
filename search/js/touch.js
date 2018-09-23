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
Touch.start = function(event, T, passedName) {
  // disable the standard ability to select the touched object
  // event.preventDefault();
  // get the total number of fingers touching the screen
  T.fingerCount = event.touches.length;
  // since we're looking for a swipe (single finger) and not a gesture (multiple fingers),
  // check that only one finger was used
  if (T.fingerCount == 1) {
    // get the coordinates of the touch
    T.startX = event.touches[0].pageX;
    T.startY = event.touches[0].pageY;
    // store the triggering element ID
    T.triggerElementID = passedName;
  } else {
    // more than one finger touched so cancel
    Touch.cancel(T);
  }
}

Touch.move = function(event, T) {
  // event.preventDefault();
  if (event.touches.length == 1) {
    T.curX = event.touches[0].pageX;
    T.curY = event.touches[0].pageY;
  } else {
    Touch.cancel(T);
  }
}

Touch.end = function(event, T) {
  // event.preventDefault();
  if (T.fingerCount == 1 && T.curX != 0) {
    // A swipe just happened. Use the distance formula
    // to determine the length of the swipe
    T.swipeLength = Math.round(Math.sqrt(Math.pow(T.curX - T.startX,2) + 
                                         Math.pow(T.curY - T.startY,2)));
    // If the swipe is longer than the minimum length, do an interface task
    if (T.swipeLength >= T.minLength) {
      Touch.angle(T);
      Touch.swipeDirection(T);
      Touch.process(T);   // Interface task
      Touch.cancel(T); // Reset the variables
    } else {
      Touch.cancel(T);
    }
  } else {
    Touch.cancel(T);
  }
}

Touch.cancel = function(T) {
  // reset the variables back to default values
  T.fingerCount = 0;
  T.startX = 0;
  T.startY = 0;
  T.curX = 0;
  T.curY = 0;
  T.deltaX = 0;
  T.deltaY = 0;
  T.horzDiff = 0;
  T.vertDiff = 0;
  T.swipeLength = 0;
  T.swipeAngle = null;
  T.swipeDirection = null;
  T.triggerElementID = null;
}

Touch.angle = function(T) {
  var X = T.startX - T.curX;
  var Y = T.curY - T.startY;
  // var Z = Math.round(Math.sqrt(Math.pow(X,2) + Math.pow(Y,2))); // the distance - rounded - in pixels
  var r = Math.atan2(Y,X); // angle in radians (Cartesian system)
  T.swipeAngle = Math.round(r*180/Math.PI); // angle in degrees
  if (T.swipeAngle < 0) { 
    T.swipeAngle = 360 - Math.abs(T.swipeAngle);
  }
}

Touch.swipeDirection = function(T) {
  if ((T.swipeAngle <= 45) && (T.swipeAngle >= 0)) {
    T.swipeDirection = 'left';
  } else if ((T.swipeAngle <= 360) && (T.swipeAngle >= 315)) {
    T.swipeDirection = 'left';
  } else if ((T.swipeAngle >= 135) && (T.swipeAngle <= 225)) {
    T.swipeDirection = 'right';
  } else if ((T.swipeAngle > 45) && (T.swipeAngle < 135)) {
    T.swipeDirection = 'down';
  } else {
    T.swipeDirection = 'up';
  }
}

// Callback to change the photo based on where the touch event happened
Touch.process = function(T) {
  var animal_id = T.triggerElementID.split('/')[0];
  if ( T.swipeDirection == 'right' ) {
    Show.photoPrevious(animal_id);
  } else if ( T.swipeDirection == 'left' ) {
    Show.photoNext(animal_id);
  }
}
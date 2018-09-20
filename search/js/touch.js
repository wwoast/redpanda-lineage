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
  touch.minLength = 72;   // the shortest distance the user may swipe
  touch.swipeLength = 0;
  touch.swipeAngle = null;
  touch.swipeDirection = null;
  return touch;
}

// The 4 Touch Event Handlers
Touch.start = function(event, passedName) {
  // disable the standard ability to select the touched object
  event.preventDefault();
  // get the total number of fingers touching the screen
  Touch.fingerCount = event.touches.length;
  // since we're looking for a swipe (single finger) and not a gesture (multiple fingers),
  // check that only one finger was used
  if (Touch.fingerCount == 1) {
    // get the coordinates of the touch
    Touch.startX = event.touches[0].pageX;
    Touch.startY = event.touches[0].pageY;
    // store the triggering element ID
    Touch.triggerElementID = passedName;
  } else {
    // more than one finger touched so cancel
    Touch.cancel(event);
  }
}

Touch.move = function(event) {
  event.preventDefault();
  if (event.touches.length == 1) {
    Touch.curX = event.touches[0].pageX;
    Touch.curY = event.touches[0].pageY;
  } else {
    Touch.cancel(event);
  }
}

Touch.end = function(event) {
  event.preventDefault();
  if (Touch.fingerCount == 1 && Touch.curX != 0) {
    // A swipe just happened. Use the distance formula
    // to determine the length of the swipe
    Touch.swipeLength = Math.round(Math.sqrt(Math.pow(Touch.curX - Touch.startX,2) + 
                                             Math.pow(Touch.curY - Touch.startY,2)));
    // If the swipe is longer than the minimum length, do an interface task
    if (Touch.swipeLength >= Touch.minLength) {
      Touch.angle();
      Touch.swipeDirection();
      Touch.process();   // Interface task
      Touch.cancel(event); // Reset the variables
    } else {
      Touch.cancel(event);
    }
  } else {
    Touch.cancel(event);
  }
}

Touch.cancel = function() {
  // reset the variables back to default values
  Touch.fingerCount = 0;
  Touch.startX = 0;
  Touch.startY = 0;
  Touch.curX = 0;
  Touch.curY = 0;
  Touch.deltaX = 0;
  Touch.deltaY = 0;
  Touch.horzDiff = 0;
  Touch.vertDiff = 0;
  Touch.swipeLength = 0;
  Touch.swipeAngle = null;
  Touch.swipeDirection = null;
  Touch.triggerElementID = null;
}

Touch.angle = function() {
  var X = Touch.startX - Touch.curX;
  var Y = Touch.curY - Touch.startY;
  // var Z = Math.round(Math.sqrt(Math.pow(X,2) + Math.pow(Y,2))); // the distance - rounded - in pixels
  var r = Math.atan2(Y,X); // angle in radians (Cartesian system)
  Touch.swipeAngle = Math.round(r*180/Math.PI); // angle in degrees
  if (Touch.swipeAngle < 0) { 
    Touch.swipeAngle = 360 - Math.abs(Touch.swipeAngle);
  }
}

Touch.swipeDirection = function() {
  if ((Touch.swipeAngle <= 45) && (Touch.swipeAngle >= 0)) {
    Touch.swipeDirection = 'left';
  } else if ((Touch.swipeAngle <= 360) && (Touch.swipeAngle >= 315)) {
    Touch.swipeDirection = 'left';
  } else if ((Touch.swipeAngle >= 135) && (Touch.swipeAngle <= 225)) {
    Touch.swipeDirection = 'right';
  } else if ((Touch.swipeAngle > 45) && (Touch.swipeAngle < 135)) {
    Touch.swipeDirection = 'down';
  } else {
    Touch.swipeDirection = 'up';
  }
}

// Callback to change the photo based on where the touch event happened
Touch.process = function() {
  var animal_id = triggerElementID.split('/')[0];
  if ( Touch.swipeDirection == 'right' ) {
    Show.photoPrevious(animal_id);
  } else if ( Touch.swipeDirection == 'left' ) {
    Show.photoNext(animal_id);
  }
}
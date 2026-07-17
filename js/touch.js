import * as Gallery from './gallery.js'
import * as Page from './page.js'

/** 
 * TOUCH-EVENTS SINGLE-FINGER SWIPE-SENSING JAVASCRIPT
 * Heavily adapted from original code on PADILICIOUS.COM and MACOSXAUTOMATION.COM
 */

/** State defaults to initial values at page load */
const touch = {
  fingerCount: 0,
  startX: 0,
  startY: 0,
  startTime: 0,
  endTime: 0,
  curX: 0,
  curY: 0,
  deltaX: 0,
  xTurn: 0,
  turnCount: 0,
  horzDiff: 0,
  vertDiff: 0,
  minLength: 64,   // the shortest distance the user may swipe
  swipeLength: 0,
  swipeAngle: null,
  swipeDirection: null
}

// The 4 Touch Event Handlers
function start(event) {
  // get the total number of fingers touching the screen
  touch.fingerCount = event.touches.length;
  // timer for long press events
  touch.startTime = new Date().getTime();
  // since we're looking for a swipe (single finger) and not a gesture (multiple fingers),
  // check that only one finger was used
  if (touch.fingerCount == 1) {
    // get the coordinates of the touch
    touch.startX = event.touches[0].pageX;
    touch.startY = event.touches[0].pageY;
  } else {
    // more than one finger touched so cancel
    cancel()
  }
}

function move(event) {
  if (event.touches.length == 1) {
    touch.curX = event.touches[0].pageX
    touch.curY = event.touches[0].pageY
    // Gesture length calculation
    if (touch.xTurn == 0) {
      const newDeltaX = Math.abs(touch.curX - touch.startX)
      if (newDeltaX > touch.deltaX) {
        touch.deltaX = newDeltaX;
      } else {
        touch.xTurn = touch.curX
        touch.horzDiff = touch.horzDiff + touch.deltaX;
        touch.deltaX = 0
        touch.turnCount = touch.turnCount + 1
      }
    } else {
      const newDeltaX = Math.abs(touch.xTurn - touch.curX)
      if (newDeltaX > this.deltaX) {
        touch.deltaX = newDeltaX
      } else {
        // We turned again, so cancel
        touch.horzDiff = touch.horzDiff + touch.deltaX;
        touch.xTurn = 0;
        touch.deltaX = 0;
        touch.turnCount = touch.turnCount + 1;
      }
    }
  } else {
    cancel()
  }
}

function swipeEnd(event, gallery, elementId, callback) {
  event.preventDefault()
  touch.endTime = new Date().getTime();
  if (touch.fingerCount == 1 && touch.curX != 0) {
    // A swipe just happened. Use the distance formula
    // to determine the length of the swipe
    touch.swipeLength = Math.round(
      Math.sqrt(Math.pow(touch.curX - touch.startX,2) + 
                Math.pow(touch.curY - touch.startY,2)))
    // If the swipe is longer than the minimum length, or if the
    // length of the swipe is long enough, do an interface task
    if ((touch.swipeLength >= touch.minLength) || 
        (touch.horzDiff > 2*touch.minLength)) {
      angle()
      determine()   // What the swipe direction and angle are
      // Do something in the RPF interface
      callback.apply(null, [gallery, elementId]);
      cancel()      // Reset the variables
    } else {
      cancel()
    }
  } else {
    cancel()
  }
}

/** Reset the touch state variables back to default values */
function cancel() {
  touch = {...{
    fingerCount: 0,
    startX: 0,
    startY: 0,
    startTime: 0,
    endTime: 0,
    curX: 0,
    curY: 0,
    deltaX: 0,
    xTurn: 0,
    turnCount: 0,
    horzDiff: 0,
    vertDiff: 0,
    swipeLength: 0,
    swipeAngle: null,
    swipeDirection: null
  }}
}

/** Calculate the angle of a particular swipe */
function angle() {
  const X = touch.startX - touch.curX
  const Y = touch.curY - touch.startY
  const r = Math.atan2(Y,X)   // angle in radians (Cartesian system)
  touch.swipeAngle = Math.round(r*180/Math.PI)   // angle in degrees
  if (touch.swipeAngle < 0) { 
    touch.swipeAngle = 360 - Math.abs(touch.swipeAngle)
  }
}

/** Decide the primary cardinal direction of a swipe is based on the angle */
function determine() {
  if ((touch.swipeAngle <= 45) && (touch.swipeAngle >= 0)) {
    touch.swipeDirection = 'left'
  } else if ((touch.swipeAngle <= 360) && (touch.swipeAngle >= 315)) {
    touch.swipeDirection = 'left'
  } else if ((touch.swipeAngle >= 135) && (touch.swipeAngle <= 225)) {
    touch.swipeDirection = 'right'
  } else if ((touch.swipeAngle > 45) && (touch.swipeAngle < 135)) {
    touch.swipeDirection = 'down'
  } else {
    touch.swipeDirection = 'up'
  }
}

/** Callback to change the photo based on where the touch event happened */
export function processPhoto(gallery, elementId) {
  const animalId = elementId.split('/')[0]
  const navigatorId = `${animalId}/navigator`
  const navigator = document.getElementById(navigatorId)
  const span = navigator.childNodes[0]
  if (((touch.horzDiff > 2*touch.minLength) && (touch.turnCount > 0)) &&
      ((touch.swipeDirection == 'right') || (touch.swipeDirection == 'left'))) {
    // TODO ES6
    // At least one direction turn, and a swipe twice as long as a normal
    // left-right directional swipe
    gallery.photoRandom(animalId)
    Gallery.condenseDogEar(span)
    Show.fade(navigator)
    window.dispatchEvent(Page.profile.qr_update)
  } else if (touch.swipeDirection == 'right') {
    gallery.photoPrevious(animalId)
    Gallery.condenseDogEar(span)
    Show.fade(navigator)
    window.dispatchEvent(Page.profile.qr_update)
  } else if (touch.swipeDirection == 'left') {
    gallery.photoNext(animalId)
    Gallery.condenseDogEar(span)
    Show.fade(navigator)
    window.dispatchEvent(Page.profile.qr_update)
  }
}

/**
 * Swipe/gesture event handler. Adds a listener for touch events on the photo
 * carousels, and defines a callback function for when the touch ends.
 */
export function addSwipeHandler(gallery, inputElement, callback) {
  inputElement.addEventListener('touchstart', (event) => start(event), true)
  inputElement.addEventListener(
    'touchend', 
    (event) => swipeEnd(event, gallery, inputElement.id, callback),
    true
  )
  inputElement.addEventListener('touchmove', (event) => move(event), true)
  inputElement.addEventListener('touchcancel', cancel, true)
}

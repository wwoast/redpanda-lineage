import * as Gallery from './gallery.ts'
import * as Page from './page.ts'
import * as Show from './show.ts'

/** 
 * TOUCH-EVENTS SINGLE-FINGER SWIPE-SENSING JAVASCRIPT
 * Heavily adapted from code on PADILICIOUS.COM and MACOSXAUTOMATION.COM
 */

interface TouchStats {
  /** Current X-coordinate of the finger */
  curX: number,
  /** Current Y-coordinate of the finger */
  curY: number,
  /** The amount of pixels between startX and curX */
  deltaX: number,
  /** Total horizontal distance the finger has travelled */
  diffHorz: number,
  /** How many fingers are currently touching the screen */
  fingerCount: number,
  /** X-coordinate where finger first touched the screen */
  startX: number,
  /** Y-coordinate where finger first touched the screen */
  startY: number,
  /** The angle formed between the startXY and curXY coordinates */
  swipeAngle: number | null,
  /** Rounded up or down every 45 degrees from the swipeAngle */
  swipeDirection: "down" | "left" | "right" | "up" | null
  /** Distance between final curXY and startXY coordinates */
  swipeLength: number,
  /** Unix time in MS the swipe ended */
  timeEnd: number,
  /** Unix time in MS the started ended */
  timeStart: number,
  /** Tally of direction changes during this touch (left to right) */
  turnCount: number,
  /** The last X-coordinate where the finger changed direction */
  xTurn: number
}

const MinLength = 64   // the shortest distance the user may swipe

// The 4 Touch Event Handlers
function start(event: TouchEvent, touch: TouchStats) {
  // get the total number of fingers touching the screen
  touch.fingerCount = event.touches.length
  // timer for long press events
  touch.timeStart = new Date().getTime()
  // since we're looking for a swipe (single finger) and not a gesture (multiple fingers),
  // check that only one finger was used
  if (touch.fingerCount == 1) {
    // get the coordinates of the touch
    touch.startX = event.touches[0].pageX
    touch.startY = event.touches[0].pageY
  } else {
    // more than one finger touched so cancel
    cancel(touch)
  }
}

function move(event: TouchEvent, touch: TouchStats) {
  event.preventDefault()
  if (event.touches.length == 1) {
    touch.curX = event.touches[0].pageX
    touch.curY = event.touches[0].pageY
    // Gesture length calculation
    if (touch.xTurn == 0) {
      const newDeltaX = Math.abs(touch.curX - touch.startX)
      if (newDeltaX > touch.deltaX) {
        touch.deltaX = newDeltaX
      } else {
        touch.xTurn = touch.curX
        touch.diffHorz = touch.diffHorz + touch.deltaX
        touch.deltaX = 0
        touch.turnCount = touch.turnCount + 1
      }
    } else {
      const newDeltaX = Math.abs(touch.xTurn - touch.curX)
      if (newDeltaX > touch.deltaX) {
        touch.deltaX = newDeltaX
      } else {
        // We turned again, so cancel
        touch.diffHorz = touch.diffHorz + touch.deltaX
        touch.xTurn = 0
        touch.deltaX = 0
        touch.turnCount = touch.turnCount + 1
      }
    }
  } else {
    cancel(touch)
  }
}

function end(
  event: TouchEvent,
  touch: TouchStats,
  gallery,
  elementId: string,
  callback: Function
) {
  event.preventDefault()
  touch.timeEnd = new Date().getTime()
  if (touch.fingerCount == 1 && touch.curX != 0) {
    // A swipe just happened. Use the distance formula
    // to determine the length of the swipe
    touch.swipeLength = Math.round(
      Math.sqrt(Math.pow(touch.curX - touch.startX,2) + 
                Math.pow(touch.curY - touch.startY,2)))
    // If the swipe is longer than the minimum length, or if the
    // length of the swipe is long enough, do an interface task
    if ((touch.swipeLength >= MinLength) || 
        (touch.diffHorz > 2*MinLength)) {
      angle(touch)
      determine(touch)   // What the swipe direction and angle are
      // Do something in the RPF interface
      callback.apply(null, [touch, gallery, elementId])
    }
  }
  cancel(touch)      // Reset the variables
}

/** Reset the touch state variables back to default values */
function cancel(touch: TouchStats) {
  touch.curX = 0
  touch.curY = 0
  touch.deltaX = 0
  touch.diffHorz = 0
  touch.fingerCount = 0
  touch.startX = 0
  touch.startY = 0
  touch.swipeAngle = null
  touch.swipeDirection = null
  touch.swipeLength = 0
  touch.timeEnd = 0
  touch.timeStart = 0
  touch.turnCount = 0
  touch.xTurn = 0
}

/** Calculate the angle of a particular swipe */
function angle(touch: TouchStats) {
  const X = touch.startX - touch.curX
  const Y = touch.curY - touch.startY
  const r = Math.atan2(Y,X)   // angle in radians (Cartesian system)
  touch.swipeAngle = Math.round(r*180/Math.PI)   // angle in degrees
  if (touch.swipeAngle < 0) { 
    touch.swipeAngle = 360 - Math.abs(touch.swipeAngle)
  }
}

/** Decide the primary cardinal direction of a swipe is based on the angle */
function determine(touch: TouchStats) {
  if (touch.swipeAngle == null) {
    return
  } else if ((touch.swipeAngle <= 45) && (touch.swipeAngle >= 0)) {
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
export function processPhoto(touch: TouchStats, gallery, elementId: string) {
  const animalId = elementId.split('/')[0]
  const navigatorId = `${animalId}/navigator`
  const navigator = document.getElementById(navigatorId)
  const span = navigator?.childNodes[0]
  if (((touch.diffHorz > 2*MinLength) && (touch.turnCount > 0)) &&
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
export function addSwipeHandler(
  gallery,
  inputElement: Element,
  callback: Function
) {
  /** Initial values when creating a listener */
  const touch = {
    curX: 0,
    curY: 0,
    deltaX: 0,
    diffHorz: 0,
    fingerCount: 0,
    startX: 0,
    startY: 0,
    swipeAngle: null,
    swipeDirection: null,
    swipeLength: 0,
    timeEnd: 0,
    timeStart: 0,
    turnCount: 0,
    xTurn: 0
  }
  inputElement.addEventListener('touchstart',
    (event: Event) => start(event, touch),
    true)
  inputElement.addEventListener('touchend', 
    (event: Event) => end(event, touch, gallery, inputElement.id, callback),
    true)
  inputElement.addEventListener('touchmove',
    (event: Event) => move(event, touch),
    true)
  inputElement.addEventListener('touchcancel',
    () => cancel(touch),
    true)
}

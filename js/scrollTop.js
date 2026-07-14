let btn

/** 
 * Create listeners to make the floating top-of-page button appear after a 
 * breif amount of vertical scrolling, and for it to disappear in response
 * to client-side page redraw events.
 */
export function init() {
  btn = document.getElementById("scrollTopBtn")
  if (!btn) return
  window.addEventListener("scroll", update, { passive: true })
  window.addEventListener("resize", update)
  // IMPORTANT: DOM gets rebuilt in this app
  window.addEventListener("hashchange", update)
  window.addEventListener("panda_data", update)
  btn.addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: "smooth" });
  })
  update();
}

/** 
 * The floating top-of-page button sits higher on the viewport, above the
 * footer bar, when the page is scrolled to the very bottom.
 */
function update() {
  if (!btn) return
  btn.classList.toggle("visible", window.scrollY > 200)
  const footer = document.getElementById("footer")   // ALWAYS re-fetch
  const baseOffset = 24;
  if (!footer) {
    btn.style.bottom = `${baseOffset}px`
    return
  }
  const rect = footer.getBoundingClientRect()
  const windowHeight = window.innerHeight
  // only adjust if footer is visible
  if (rect.top < windowHeight) {
    const overlap = windowHeight - rect.top
    btn.style.bottom = `${(overlap + 10)}px`
  } else {
    btn.style.bottom = `${baseOffset}px`
  }
}

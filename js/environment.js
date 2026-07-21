/** 
 * Settings for redpandafinder page rendering and search queries, in the
 * current browser tab, acting as a readable and writable "global environment"
 * for other modules.
 */
export default env = {
  /** 
   * Stores callback to the current page render function for redraws.
   * Default mode is to show panda results, pointing to the `resultsPage`
   * render function, after the `ResultsPage` class is instantiated, in
   * `init.js`.
   */
  current: undefined,
  /** 
   * The current display language for redpandafinder. Default is set by
   * `language.js#defaultDisplayLanguage`. */
  language = undefined,
  /** 
   * When un-clicking Links/About, go back to the last page viewed, or possibly
   * the last panda you searched for.
   */  
  lastSearch: "#home",
  /**
   * When displaying results, by default we display zoo and panda _entities_.
   * However, other output modes are supported based on the supplied types. The
   * _credit_ search shows a spread of photos credited to a particular user.
   */
  output_mode: "entities",
  /** Details about paging through search results */
  paging: {
    /** 
     * Callback for how the next button loads new content on this page,
     * and what frame DIV it spools that content into.
     */
    callback: {
      /** Page number must always come first in the arguments list */
      arguments: [],
      function: undefined,
      frame_id: undefined
    },
    /** If a query has enough results for multiple pages, display the button */
    display_button: false,
    media_count: 10,
    results_count: 15,
    /** Paging seed, set to when the page was last loaded */
    seed: Date.now(),
    /** Shown counter, for page refreshes */
    shown_pages: 1
  },
  /** Credit for photos being shown */
  preserve_case: false,
  /** If a URI indicates a specific photo, indicate which one here */
  specific_photo: undefined,
}
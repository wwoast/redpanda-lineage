/** 
 * Settings for redpandafinder page rendering and search queries, in the
 * current browser tab, acting as a readable and writable "global environment"
 * for other modules.
 */
const env = {
  current: undefined,
  language: "en",
  lastSearch: "#home",
  output_mode: "entities",
  paging: {
    callback: {
      arguments: [],
      function: undefined,
      frame_id: undefined
    },
    display_button: false,
    media_count: 10,
    results_count: 15,
    seed: Date.now(),
    shown_pages: 1
  },
  preserve_case: false,
  specific_photo: undefined
};
export default env;

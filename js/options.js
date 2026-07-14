/** All available options / default values */
export const data = {
  hideDeadPandas: false
}

/** On page refresh, load the options settings from `LocalStorage` */
export function init() {
  load()
}

/** Call a function to update the options */
export function update(func) {
  // Run the given function to update the data
  func(data)
  save()
  // Report options have been updated
  window.dispatchEvent(new Event('options_updated'));
}

/** Save current option values to local storage */ 
function save() {
  window.localStorage.setItem('options', JSON.stringify(data))
} 

/** Load option values from local storage */
function load() {
  const localSavedOptions = window.localStorage.getItem('options')
  if (localSavedOptions !== null) {
    data = JSON.parse(localSavedOptions);
  }
}

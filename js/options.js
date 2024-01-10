/*
    Options helper methods
*/
var Options = {};   // Namespace

Options.init = function() {
  Options.load();
}

// All available options
Options.data = {
  deadPandas: false
};

Options.update = function(func) {
  // Run the update func
  func(Options.data);

  Options.save();

  // Report options have been updated
  window.dispatchEvent(new Event('options_updated'));
}

// Save current option values to local storage
Options.save = function() {
  window.localStorage.setItem('options', JSON.stringify(Options.data));
}

// Load option values from local storage
Options.load = function() {
  var localData = window.localStorage.getItem('options');

  if (localData !== null) {
    Options.data = JSON.parse(localData);
  }
}

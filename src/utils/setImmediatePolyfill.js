// setImmediate polyfill para entornos web
if (typeof setImmediate === 'undefined') {
  window.setImmediate = function(callback) {
    return setTimeout(callback, 0);
  };
  
  window.clearImmediate = function(timeoutId) {
    clearTimeout(timeoutId);
  };
}

export default {};

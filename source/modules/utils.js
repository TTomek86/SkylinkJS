/**
 * Module that handles utilities functions.
 * @class SkylinkUtils
 * @private
 * @for Skylink
 * @since 0.7.0
 */
var SkylinkUtils = {

  /**
   * Function that clones <kbd>Object</kbd> keys and values.
   * @method objectCloneFn
   * @param {Object} obj The <kbd>Object</kbd> to clone.
   * @return {Object} The cloned <kbd>Object</kbd>.
   * @private
   * @for SkylinkUtils
   * @since 0.7.0
   */
  objectCloneFn: function (obj) {
    if (!(typeof obj === 'object' && obj !== null)) {
      return obj;
    }

    /*var self = this;
    var copy = {};

    var clone  = function (passedObj) {
      if (Array.isArray(passedObj)) {
        return passedObj.splice();

      } else if (typeof passedObj === 'object' && passedObj !== null) {
        // Loops for 3 levels
        self.objectLoopFn(passedObj, function (val, key) {
          passedObj[key] = clone(val);
        });
      } else if (typeof passedObj === 'string') {
        return passedObj + '';

      } else if (typeof passedObj === 'boolean') {
        return passedObj === true;

      } else if (typeof passedObj === 'number') {
        return passedObj + 0;
      }

      return passedObj;
    };

    return clone(obj);*/

    /* NOTE: Very dirty hack yet it works better than clone() functions available */
    return JSON.parse(JSON.stringify(obj))
  },

  /**
   * Function that loops for <kbd>Object</kbd> keys and values.
   * @method objectLoopFn
   * @param {Array|String|JSON} obj The <kbd>Object</kbd> to loop.
   * @param {Function} fn The function callback triggered for each loop.<br>
   *   Return <code>true</code> in function callback to break looping execution.
   * @private
   * @for SkylinkUtils
   * @since 0.7.0
   */
  objectLoopFn: function (obj, fn) {
    // Loops for Arrays and Strings
    if (Array.isArray(obj)) {
      var arrayCI = 0,
          arrayLen = obj.length;

      while (arrayLen > arrayCI) {
        if (fn(obj[arrayCI], arrayCI)) {
          break;
        }

        arrayCI++;
      }

    // Loops for Object keys and values
    } else if (typeof obj === 'object') {
      var keys = Object.keys(obj),
          objCI = 0,
          objLen = keys.length;

      while (objLen > objCI) {
        if (fn(obj[keys[objCI]], keys[objCI])) {
          break;
        }

        objCI++;
      }
    }
  },

  /**
   * Function that checks if <kbd>Object</kbd> contains the value provided.
   * @method objectContainsFn
   * @param {Array|String|JSON} obj The <kbd>Object</kbd> to check.
   * @param {Any} value The value to check if it exists in <kbd>Object</kbd>.
   * @return {Boolean} The flag that indicates if value exists in <kbd>Object</kbd>.
   * @private
   * @for SkylinkUtils
   * @since 0.7.0
   */
  objectContainsFn: function (obj, value) {
    var exists = false;

    this.objectLoopFn(obj, function (currentValue) {
      if (currentValue === value) {
        exists = true;
        return true;
      }
    });

    return exists;
  }
};
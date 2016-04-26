/**
 * Module that allows <kbd>Objects</kbd> to mixin functions for event subscriptions and dispatching.
 * @class SkylinkEvent
 * @private
 * @for Skylink
 * @since 0.7.0
 */
var SkylinkEvent = {

  /**
   * Method that subscribes a <code>listener</code> function to an <a href="#events">Event</a> which would be triggered
   *   every time when the <a href="#events">Event</a> is dispatched.
   * @method on
   * @param {String} eventName The parameter name of the <a href="#events">Event</a> to subscribe to.
   * @param {Function} listenerFn The parameter <code>listener</code> function to bind to the subscription.
   * @example
   *   // Parameters: on(eventName, listenerFn)
   *   SkylinkDemo.on("peerJoined", function (peerId) {
   *     console.log(peerID + " has joined the Room");
   *     ///-[Handle UI view when Peer has joined the Room]
   *   });
   * @linksTo #events|See the list of available Events to subscribe to
   * @for Skylink
   * @since 0.7.0
   */
  on: function(event, callback) {
    // Prevent subscription if invalid Event name is provided
    if (!Array.isArray(this._listeners.on[event])) {
      throw new Error('Failed on subscription as invalid Event name is provided.');
    }

    this._listeners.on[event].push(callback);

    // Prevent chaining for now
    //return this;
  },

  /**
   * Method that unsubscribes <code>listener</code> functions from <a href="#events">Events</a>.
   * @method off
   * @param {String} [eventName] <blockquote class="panel-info">
   *     Not providing this parameter value removes all <code>listener</code> functions from
   *     all <a href="#events">Events</a>.
   *   </blockquote>
   *   The parameter name of the <a href="#events">Event</a> to unsubscribe <code>listener</code> functions.<br>
   * @param {Function} [listenerFn] <blockquote class="panel-info">
   *     Not providing this parameter value removes all <code>listener</code> functions from
   *     the provided <code>eventName</code> parameter <a href="#events">Event</a>.
   *   </blockquote>
   *   The parameter of a particular <code>listener</code> function to unsubscribe from the
   *   provided <code>eventName</code> parameter <a href="#events">Event</a>.
   * @example
   *   // Parameters: off(eventName, listenerFn)
   *   //! Unsubscribes this specific listener function from "iceConnectionState" Event
   *   var listenerFn = function (state, peerId) {
   *     console.log(peerId + " connection state: " + state);
   *   };
   *
   *   SkylinkDemo.off("iceConnectionState", listenerFn);
   *
   *   // Parameters: off(eventName)
   *   //! Unsubscribes all listener functions from "peerJoined" Event
   *   SkylinkDemo.off("peerJoined");
   *
   *   // Parameters: off()
   *   //! Unsubscribes all listener functions from all Events
   *
   *   SkylinkDemo.off();
   * @linksTo #events|See the list of available Events to subscribe to
   * @for Skylink
   * @since 0.7.0
   */
  off: function(event, callback) {
    // Prevent unsubscription if invalid Event name is provided
    if (!(Array.isArray(this._listeners.once[event]) || Array.isArray(this._listeners.on[event]))) {
      throw new Error('Failed unsubscription as invalid Event name is provided.');
    }

    //Remove all listeners if event is not provided
    if (typeof event === 'undefined') {
      this._listeners.on = {};
      this._listeners.once = {};
    }

    //Remove all callbacks of the specified events if callback is not provided
    if (typeof callback === 'undefined') {
      this._listeners.on[event] = [];
      this._listeners.once[event] = [];
    } else {

      //Remove single on callback
      if (this._listeners.on[event]) {
        this._removeListener(this._listeners.on[event], callback);
      }

      //Remove single once callback
      if (this._listeners.once[event]) {
        this._removeListener(this._listeners.once[event], callback);
      }
    }

    // Prevent chaining for now
    //return this;
  },

  /**
   * Method that subscribes a <code>listener</code> function to an <a href="#events">Event</a> which would be triggered
   *   only once when the <a href="#events">Event</a> is dispatched.
   * @method once
   * @param {String} eventName The parameter name of the <a href="#events">Event</a> to subscribe to.
   * @param {Function} listenerFn The parameter listener function to bind to the subscription.
   * @param {Function} [conditionalFn] <blockquote class="panel-info">
   *     This function will trigger every time the <a href="#events">Event</a> is dispatched.
   *     Return <code>true</code> in this function to complete the <code>conditional</code> function.
   *   </blockquote> The parameter <code>conditional</code> function
   *   that halts the triggering of the <code>listener</code> function until the
   *   <code>conditional</code> function returns <code>true</code>.
   * @example
   *   // Parameters: once(eventName, listenerFn)
   *   SkylinkDemo.on("mediaAccessSuccess", function (stream) {
   *     console.log("Received local stream", stream);
   *     ///-[Handle UI view when user has given access to local Stream]
   *   });
   *
   *   // Parameters: once(eventName, listenerFn, conditionalFn)
   *   SkylinkDemo.on("dataChannelState", function (state, peerId) {
   *     console.info("P2P messaging are now available with " + peerId);
   *     ///-[Handle UI view when P2P messaging is available]
   *   }, function (state, peerId, error, channelName, channelType) {
   *     //! Condition to ensure that Datachannel is opened and is for messaiging Datachannel
   *     return state === SkylinkDemo.DATA_CHANNEL_STATE.OPEN &&
   *       channelType === SkylinkDemo.DATA_CHANNEL_TYPE.MESSAGING;
   *   });
   * @linksTo #events|See the list of available Events to subscribe to
   * @for Skylink
   * @since 0.7.0
   */
  once: function(event, callback, condition) {
    // Prevent subscription if invalid Event name is provided
    if (!Array.isArray(this._listeners.once[event])) {
      throw new Error('Failed once subscription as invalid Event name is provided.');
    }

    if (typeof condition !== 'function') {
      condition = function() {
        return true;
      };
    }
    this._listeners.once[event].push([callback, condition]);

    // Prevent chaining for now
    //return this;
  },

  /**
   * <blockquote class="panel-warning">
   *   Parameters after the <code>eventName</code> parameter value is
   *   considered the Event parameters payload.
   * </blockquote>
   * Function that dispatches <a href="#events">Event</a> to all listeners.
   * @method _trigger
   * @param {String} eventName The Event name.
   * @private
   * @for SkylinkEvent
   * @since 0.7.0
   */
  _trigger: function(event) {
    var args = Array.prototype.slice.call(arguments, 1);

    if (this._listeners.on[event]) {
      for (var i = 0; i < this._listeners.on[event].length; i++) {
        this._listeners.on[event][i].apply(this, args);
      }
    }

    if (this._listeners.once[event]) {
      for (var j = 0; j < this._listeners.once[event].length; j++) {
        if (this._listeners.once[event][j][1].apply(this, args)) {
          this._listeners.once[event][j][0].apply(this, args);
          this._listeners.once[event].splice(j, 1);
          j--;
        }
      }
    }

    // Prevent chaining for now
    //return this;
  },

  /**
   * Function that removes a specific listener function from
   *   a specific <a href="#events">Event</a> from a list of listeners.
   * @method _removeListener
   * @param {Array} listeners The array of listeners.
   * @param {Function} listener The specific listener to remove from the
   *   array of listeners.
   * @private
   * @for SkylinkEvent
   * @since 0.7.0
   */
  _removeListener: function(listeners, listener) {
    for (var i = 0; i < listeners.length; i++) {
      var listenerIndex = listeners[i];
      // Use the callback not the once condition
      if (Array.isArray(listenerIndex)) {
        listenerIndex = listeners[i][0];
      }
      if (listenerIndex === listener) {
        listeners.splice(i, 1);
        return;
      }
    }
  },

  /**
   * Function that allows mixin of all <kbd>SkylinkEvent</kbd> functions
   *   to the <kbd>Object</kbd>.
   * @method _mixin
   * @param {Object} object The <kbd>Object</kbd> to mixin functions for event subscriptions and dispatching.
   * @private
   * @for SkylinkEvent
   * @since 0.7.0
   */
  _mixin: function(object, eventList) {
    var methods = ['on', 'off', 'once', '_trigger', '_removeListener'];
    for (var i = 0; i < methods.length; i++) {
      if (SkylinkEvent.hasOwnProperty(methods[i])) {
        if (typeof object === 'function') {
          object.prototype[methods[i]] = SkylinkEvent[methods[i]];
        } else {
          object[methods[i]] = SkylinkEvent[methods[i]];
        }
      }
    }

    object._listeners = {
      on: SkylinkUtils.objectCloneFn(eventList),
      once: SkylinkUtils.objectCloneFn(eventList)
    };

    // Prevent chaining for now
    //return object;
  }
};
(function() {

'use strict';

/* IE < 10 Polyfills */
// Mozilla provided polyfill for Object.keys()
if (!Object.keys) {
  Object.keys = (function() {
    var hasOwnProperty = Object.prototype.hasOwnProperty,
      hasDontEnumBug = !({
        toString: null
      }).propertyIsEnumerable('toString'),
      dontEnums = [
        'toString',
        'toLocaleString',
        'valueOf',
        'hasOwnProperty',
        'isPrototypeOf',
        'propertyIsEnumerable',
        'constructor'
      ],
      dontEnumsLength = dontEnums.length;

    return function(obj) {
      if (typeof obj !== 'object' && typeof obj !== 'function' || obj === null) throw new TypeError('Object.keys called on non-object');

      var result = [];

      for (var prop in obj) {
        if (hasOwnProperty.call(obj, prop)) result.push(prop);
      }

      if (hasDontEnumBug) {
        for (var i = 0; i < dontEnumsLength; i++) {
          if (hasOwnProperty.call(obj, dontEnums[i])) result.push(dontEnums[i]);
        }
      }
      return result;
    }
  })()
}

var objForEach = function (obj, callback) {
  for (var key in obj) {
    if (obj.hasOwnProperty(key)) {
      callback(obj[key], key);
    }
  }
};

// Mozilla provided polyfill for Date.getISOString()
(function() {
  function pad(number) {
    if (number < 10) {
      return '0' + number;
    }
    return number;
  }

  Date.prototype.toISOString = function() {
    return this.getUTCFullYear() +
      '-' + pad(this.getUTCMonth() + 1) +
      '-' + pad(this.getUTCDate()) +
      'T' + pad(this.getUTCHours()) +
      ':' + pad(this.getUTCMinutes()) +
      ':' + pad(this.getUTCSeconds()) +
      '.' + (this.getUTCMilliseconds() / 1000).toFixed(3).slice(2, 5) +
      'Z';
  };
})();

// addEventListener polyfill 1.0 / Eirik Backer / MIT Licence
(function(win, doc){
  if(win.addEventListener) return; //No need to polyfill

  function docHijack(p){var old = doc[p];doc[p] = function(v){ return addListen(old(v)) }}
  function addEvent(on, fn, self){
    return (self = this).attachEvent('on' + on, function(e){
      var e = e || win.event;
      e.preventDefault  = e.preventDefault  || function(){e.returnValue = false}
      e.stopPropagation = e.stopPropagation || function(){e.cancelBubble = true}
      fn.call(self, e);
    });
  }
  function addListen(obj, i){
    if(i = obj.length)while(i--)obj[i].addEventListener = addEvent;
    else obj.addEventListener = addEvent;
    return obj;
  }

  addListen([doc, win]);
  if('Element' in win)win.Element.prototype.addEventListener = addEvent; //IE8
  else{                                     //IE < 8
    doc.attachEvent('onreadystatechange', function(){addListen(doc.all)}); //Make sure we also init at domReady
    docHijack('getElementsByTagName');
    docHijack('getElementById');
    docHijack('createElement');
    addListen(doc.all);
  }
})(window, document);

// global clone function
var clone = function (obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  var copy = obj.constructor();
  for (var attr in obj) {
    if (obj.hasOwnProperty(attr)) {
      copy[attr] = obj[attr];
    }
  }
  return copy;
};

/**
 * <h2>Before using Skylink</h2>
 * Please invoke {{#crossLink "Skylink/init:method"}}init(){{/crossLink}} method
 * first to initialise the Application Key before using any functionalities in Skylink.
 *
 * If you do not have an Application Key, you may register for a Skylink platform developer account
 *   [to create one](http://developer.temasys.com.sg/register).
 *
 * To get started you may [visit the getting started page](https://temasys.github.io/how-to/2014/08/08/
 * Getting_started_with_WebRTC_and_SkylinkJS/), or alternatively fork a ready made demo application
 * that uses Skylink Web SDK at [getaroom.io](http://getaroom.io/).
 *
 * For tips on using skylink and troubleshooting you can visit
 *   [our support portal](http://support.temasys.com.sg/support/solutions/folders/5000267498).
 * @class Skylink
 * @constructor
 * @example
 *   // Here's a simple example on how you can start using Skylink
 *   var SkylinkDemo = new Skylink();
 *
 *   // Subscribe all events first before init()
 *   SkylinkDemo.on("incomingStream", function (peerId, stream, peerInfo, isSelf) {
 *     if (isSelf) {
 *       attachMediaStream(document.getElementById("selfVideo"), stream);
 *     } else {
 *       var peerVideo = document.createElement("video");
 *       peerVideo.id = peerId;
 *       peerVideo.autoplay = "autoplay";
 *       document.getElementById("peersVideo").appendChild(peerVideo);
 *       attachMediaStream(peerVideo, stream);
 *     }
 *   });
 *
 *   SkylinkDemo.on("peerLeft", function (peerId, peerInfo, isSelf) {
 *     if (!isSelf) {
 *       var peerVideo = document.getElementById(peerId);
 *       // do a check if peerVideo exists first
 *       if (peerVideo) {
 *         document.getElementById("peersVideo").removeChild(peerVideo);
 *       } else {
 *         console.error("Peer video for " + peerId + " is not found.");
 *       }
 *     }
 *   });
 *
 *  // never call joinRoom in readyStateChange event subscription.
 *  // call joinRoom after init() callback if you want to joinRoom instantly.
 *  SkylinkDemo.on("readyStateChange", function (state, room) {
 *    console.log("Room (" + room + ") state: ", room);
 *  })
 *
 *  // always remember to call init()
 *  SkylinkDemo.init("YOUR_APP_KEY_HERE", function (error, success) {
 *    // do a check for error or success
 *    if (error) {
 *      console.error("Init failed: ", error);
 *    } else {
 *      SkylinkDemo.joinRoom("my_room", {
 *        userData: "My Username",
 *        audio: true,
 *        video: true
 *      });
 *    }
 *  });
 * @for Skylink
 * @since 0.5.0
 */
function Skylink() {
  if (!(this instanceof Skylink)) {
    return new Skylink();
  }

  /**
   * The current version of Skylink Web SDK.
   * @attribute VERSION
   * @type String
   * @readOnly
   * @for Skylink
   * @since 0.1.0
   */
  this.VERSION = '@@version';

  /**
   * Helper function that generates an Unique ID (UUID) string.
   * @method generateUUID
   * @return {String} Generated Unique ID (UUID) string.
   * @example
   *    // Get Unique ID (UUID)
   *    var uuid = SkylinkDemo.generateUUID();
   * @for Skylink
   * @since 0.5.9
   */
  this.generateUUID = function() {
    var d = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = (d + Math.random() * 16) % 16 | 0;
      d = Math.floor(d / 16);
      return (c == 'x' ? r : (r & 0x7 | 0x8)).toString(16);
    });
    return uuid;
  };
}

/**
 * These are the list of room initialization ready states that Skylink would trigger.
 * - The states indicates if the required connection information has been retrieved successfully from
 *   the platform server to start a connection.
 * - These states are triggered when {{#crossLink "Skylink/init:method"}}init(){{/crossLink}} or
 *   {{#crossLink "Skylink/joinRoom:attr"}}joinRoom(){{/crossLink}} is invoked.
 * @attribute READY_STATE_CHANGE
 * @type JSON
 * @param {Number} INIT <small>Value <code>0</code></small>
 *   The state when Skylink is at the initial state before retrieval.<br>
 * If all dependencies has been loaded, this would proceed to <code>LOADING</code> state.
 * @param {Number} LOADING <small>Value <code>1</code></small>
 *   The state when Skylink starts retrieving the connection information from the platform server.<br>
 * This state occurs after <code>INIT</code> state and if retrieval is successful, this would
 *   proceed to <code>COMPLETED</code> state.
 * @param {Number} COMPLETED <small>Value <code>2</code></small>
 *   The state when the connection information has been retrieved successfully.<br>
 * This state occurs after <code>LOADING</code>, and if it's
 *   {{#crossLink "Skylink/joinRoom:attr"}}joinRoom(){{/crossLink}} that is invoked, room connection
 *   would commerce.
 * @param {Number} ERROR <small>Value <code>-1</code></small>
 *   The state when an exception occured while retrieving the connection information.<br>
 * This state might be triggered when dependencies failed to load or HTTP retrieval fails.<br>
 * Reference {{#crossLink "Skylink/READY_STATE_CHANGE_ERROR:attr"}}READY_STATE_CHANGE_ERROR{{/crossLink}}
 *   to see the list of errors that might have triggered the <code>ERROR</code> state.
 * @readOnly
 * @component Room
 * @for Skylink
 * @since 0.1.0
 */
Skylink.prototype.READY_STATE_CHANGE = {
  INIT: 0,
  LOADING: 1,
  COMPLETED: 2,
  ERROR: -1
};

/**
 * These are the list of room initialization ready state errors that Skylink has.
 * - Ready state errors like <code>ROOM_LOCKED</code>, <code>API_NOT_ENOUGH_CREDIT</code>,
 *   <code>API_NOT_ENOUGH_PREPAID_CREDIT</code>, <code>API_FAILED_FINDING_PREPAID_CREDIT</code> and
 *   <code>SCRIPT_ERROR</code> has been removed as they are no longer supported.
 * @attribute READY_STATE_CHANGE_ERROR
 * @type JSON
 * @param {Number} API_INVALID <small>Value <code>4001</code></small>
 *   The error when provided Application Key does not exists <em>(invalid)</em>.<br>
 * For this error, it's recommended that you check if the Application Key exists in your account
 *   in the developer console.
 * @param {Number} API_DOMAIN_NOT_MATCH <small>Value <code>4002</code></small>
 *   The error when application accessing from backend IP address is not valid for provided Application Key.<br>
 * This rarely (and should not) occur and it's recommended to report this issue if this occurs.
 * @param {Number} API_CORS_DOMAIN_NOT_MATCH <small>Value <code>4003</code></small>
 *   The error when application accessing from the CORS domain is not valid for provided Application Key.<br>
 * For this error, it's recommended that you check the CORS configuration for the provided Application Key
 *   in the developer console.
 * @param {Number} API_CREDENTIALS_INVALID <small>Value <code>4004</code></small>
 *   The error when credentials provided is not valid for provided Application Key.<br>
 * For this error, it's recommended to check the <code>credentials</code> provided in
 *   {{#crossLink "Skylink/init:method"}}init() configuration{{/crossLink}}.
 * @param {Number} API_CREDENTIALS_NOT_MATCH <small>Value <code>4005</code></small>
 *   The error when credentials does not match as expected generated credentials for provided Application Key.<br>
 * For this error, it's recommended to check the <code>credentials</code> provided in
 *   {{#crossLink "Skylink/init:method"}}init() configuration{{/crossLink}}.
 * @param {Number} API_INVALID_PARENT_KEY <small>Value <code>4006</code></small>
 *   The error when provided alias Application Key has an error because parent Application Key does not exists.<br>
 * For this error, it's recommended to provide another alias Application Key.
 * @param {Number} API_NO_MEETING_RECORD_FOUND <small>Value <code>4010</code></small>
 *   The error when there is no meeting currently that is open or available to join
 *   for self at the current time in the selected room.<br>
 * For this error, it's recommended to retrieve the list of meetings and check if it exists using
 *   the [Meeting Resource REST API](https://temasys.atlassian.net/wiki/display/TPD/SkylinkAPI+-+Meeting+%28Persistent+Room%29+Resources).
 * @param {Number} NO_SOCKET_IO <small>Value <code>1</code></small>
 *   The error when socket.io dependency is not loaded.<br>
 * For this error, it's recommended to load the
 *   [correct socket.io-client dependency](http://socket.io/download/) from the CDN.
 * @param {Number} NO_XMLHTTPREQUEST_SUPPORT <small>Value <code>2</code></small>
 *   The error when XMLHttpRequest is not supported in current browser.<br>
 * For this error, it's recommended to ask user to switch to another browser that supports <code>XMLHttpRequest</code>.
 * @param {Number} NO_WEBRTC_SUPPORT <small>Value <code>3</code></small>
 *   The error when WebRTC is not supported in current browser.<br>
 * For this error, it's recommended to ask user to switch to another browser that supports WebRTC.
 * @param {Number} NO_PATH <small>Value <code>4</code></small>
 *   The error when constructed path is invalid.<br>
 * This rarely (and should not) occur and it's recommended to report this issue if this occurs.
 * @param {Number} INVALID_XMLHTTPREQUEST_STATUS <small>Value <code>5</code></small>
 *   The error when XMLHttpRequest does not return a HTTP status code of <code>200</code> but a HTTP failure.<br>
 * This rarely (and should not) occur and it's recommended to report this issue if this occurs.
 * @param {Number} ADAPTER_NO_LOADED <small>Value <code>7</code></small>
 *   The error when AdapterJS dependency is not loaded.<br>
 * For this error, it's recommended to load the
 *   [correct AdapterJS dependency](https://github.com/Temasys/AdapterJS/releases) from the CDN.
 * @param {Number} XML_HTTP_REQUEST_ERROR <small>Value <code>-1</code></small>
 *   The error when XMLHttpRequest failure on the network level when attempting to
 *   connect to the platform server to retrieve selected room connection information.<br>
 * This might happen when connection timeouts. If this is a persistent issue, it's recommended to report this issue.
 * @readOnly
 * @component Room
 * @for Skylink
 * @since 0.4.0
 */
Skylink.prototype.READY_STATE_CHANGE_ERROR = {
  API_INVALID: 4001,
  API_DOMAIN_NOT_MATCH: 4002,
  API_CORS_DOMAIN_NOT_MATCH: 4003,
  API_CREDENTIALS_INVALID: 4004,
  API_CREDENTIALS_NOT_MATCH: 4005,
  API_INVALID_PARENT_KEY: 4006,
  API_NO_MEETING_RECORD_FOUND: 4010,
  //ROOM_LOCKED: 5001,
  XML_HTTP_REQUEST_ERROR: -1,
  NO_SOCKET_IO: 1,
  NO_XMLHTTPREQUEST_SUPPORT: 2,
  NO_WEBRTC_SUPPORT: 3,
  NO_PATH: 4,
  //INVALID_XMLHTTPREQUEST_STATUS: 5,
  //SCRIPT_ERROR: 6,
  ADAPTER_NO_LOADED: 7
};

/**
 * These are the list of available platform signaling servers Skylink
 *   should connect to for faster connectivity.
 * @attribute REGIONAL_SERVER
 * @type JSON
 * @param {String} APAC1 <small>Value <code>"sg"</code></small>
 *   The option to select the Asia pacific server 1 regional server.
 * @param {String} US1 <small>Value <code>"us2"</code></small>
 *   The option to select the US server 1 regional server.
 * @deprecated Signaling server selection is handled on
 *    the server side based on load and latency.
 * @readOnly
 * @component Room
 * @for Skylink
 * @since 0.5.0
 */
Skylink.prototype.REGIONAL_SERVER = {
  APAC1: 'sg',
  US1: 'us2'
};

/**
 * These are the list of DataChannel connection states that Skylink would trigger.
 * - Some of the state references the [w3c WebRTC Specification Draft](http://w3c.github.io/webrtc-pc/#idl-def-RTCDataChannelState),
 *   except the <code>ERROR</code> state, which is an addition provided state by Skylink
 *   to inform exception during the DataChannel connection with Peers.
 * @attribute DATA_CHANNEL_STATE
 * @type JSON
 * @param {String} CONNECTING <small>Value <code>"connecting"</code></small>
 *   The state when DataChannel is attempting to establish a connection.<br>
 *   This is the initial state when a DataChannel connection is created.
 * @param {String} OPEN <small>Value <code>"open"</code></small>
 *   The state when DataChannel connection is established.<br>
 *   This happens usually after <code>CONNECTING</code> state, or not when DataChannel connection
 *   is from initializing Peer (the one who begins the DataChannel connection).
 * @param {String} CLOSING <small>Value <code>"closing"</code></small>
 *   The state when DataChannel connection is closing.<br>
 *   This happens when DataChannel connection is closing and happens after <code>OPEN</code>.
 * @param {String} CLOSED <small>Value <code>"closed"</code></small>
 *   The state when DataChannel connection is closed.<br>
 *   This happens when DataChannel connection has closed and happens after <code>CLOSING</code>
 *   (or sometimes <code>OPEN</code> depending on the browser implementation).
 * @param {String} ERROR <small>Value <code>"error"</code></small>
 *   The state when DataChannel connection have met with an exception.<br>
 *   This may happen during any state not after <code>CLOSED</code>.
 * @readOnly
 * @component DataChannel
 * @for Skylink
 * @since 0.1.0
 */
Skylink.prototype.DATA_CHANNEL_STATE = {
  CONNECTING: 'connecting',
  OPEN: 'open',
  CLOSING: 'closing',
  CLOSED: 'closed',
  ERROR: 'error'
};

/**
 * These are the types of DataChannel connection that Skylink provides.
 * - Different channels serves different functionalities.
 * @attribute DATA_CHANNEL_TYPE
 * @type JSON
 * @param {String} MESSAGING <small><b>MAIN connection</b> | Value <code>"messaging"</code></small>
 *   This DataChannel connection is used for P2P messaging only, as used in
 *   {{#crossLink "Skylink/sendP2PMessage:method"}}sendP2PMessage(){{/crossLink}}.<br>
 * Unless if self connects with Peers connecting from the mobile SDK platform applications,
 *   this connection would be used for data transfers as used in
 *   {{#crossLink "Skylink/sendBlobData:method"}}sendBlobData(){{/crossLink}} and
 *   and {{#crossLink "Skylink/sendURLData:method"}}sendURLData(){{/crossLink}}, which allows
 *   only one outgoing and incoming data transfer one at a time (no multi-transfer support).<br>
 *   This connection will always be kept alive until the Peer connection has ended.
 * @param {String} DATA <small>Value <code>"data"</code></small>
 *   This DataChannel connection is used for a data transfer, as used in
 *   {{#crossLink "Skylink/sendBlobData:method"}}sendBlobData(){{/crossLink}}
 *   and {{#crossLink "Skylink/sendURLData:method"}}sendURLData(){{/crossLink}}.<br>
 * If self connects with Peers with DataChannel connections of this type,
 *   it indicates that multi-transfer is supported.<br>
 *   This connection will be closed once the data transfer has completed or terminated.
 * @readOnly
 * @component DataChannel
 * @for Skylink
 * @since 0.6.1
 */
Skylink.prototype.DATA_CHANNEL_TYPE = {
  MESSAGING: 'messaging',
  DATA: 'data'
};

/**
 * The current version of the internal <u>Data Transfer (DT)</u> Protocol that Skylink is using.<br>
 * - This is not a feature for developers to use but rather for SDK developers to
 *   see the Protocol version used in this Skylink version.
 * - In some cases, this information may be used for reporting issues with Skylink.
 * - DT_PROTOCOL VERSION: <code>0.1.0</code>.
 * @attribute DT_PROTOCOL_VERSION
 * @type String
 * @readOnly
 * @component DataTransfer
 * @for Skylink
 * @since 0.5.10
 */
Skylink.prototype.DT_PROTOCOL_VERSION = '0.1.0';

/**
 * These are the list of Peer connection ICE connection states that Skylink would trigger.
 * - These states references the [w3c WebRTC Specification Draft](http://www.w3.org/TR/webrtc/#idl-def-RTCIceConnectionState),
 *   except the <code>TRICKLE_FAILED</code> state, which is an addition provided state by Skylink
 *   to inform that trickle ICE has failed.
 * @attribute ICE_CONNECTION_STATE
 * @type JSON
 * @param {String} STARTING <small>Value <code>"starting"</code></small>
 *   The state when the ICE agent is gathering addresses and/or waiting
 *   for remote candidates to be supplied.<br>
 * This state occurs when Peer connection has just been initialised.
 * @param {String} CHECKING <small>Value <code>"checking"</code></small>
 *   The state when the ICE agent has received remote candidates
 *   on at least one component, and is checking candidate pairs but has
 *   not yet found a connection. In addition to checking, it may also
 *   still be gathering.<br>
 * This state occurs after <code>STARTING</code> state.
 * @param {String} CONNECTED <small>Value <code>"connected"</code></small>
 *  The state when the ICE agent has found a usable connection
 *   for all components but is still checking other candidate pairs to see
 *   if there is a better connection. It may also still be gathering.<br>
 * This state occurs after <code>CHECKING</code>.
 * @param {String} COMPLETED <small>Value <code>"completed"</code></small>
 *   The state when the ICE agent has finished gathering and
 *   checking and found a connection for all components.<br>
 * This state occurs after <code>CONNECTED</code> (or sometimes after <code>CHECKING</code>).
 * @param {String} FAILED <small>Value <code>"failed"</code></small>
 *   The state when the ICE agent is finished checking all
 *   candidate pairs and failed to find a connection for at least one
 *   component.<br>
 * This state occurs during the ICE connection attempt after <code>STARTING</code> state.
 * @param {String} DISCONNECTED <small>Value <code>"disconnected"</code></small>
 *   The state when liveness checks have failed for one or
 *   more components. This is more aggressive than "failed", and may
 *   trigger intermittently (and resolve itself without action) on
 *   a flaky network.<br>
 * This state occurs after <code>CONNECTED</code> or <code>COMPLETED</code> state.
 * @param {String} CLOSED <small>Value <code>"closed"</code></small>
 *   The state when the ICE agent has shut down and is no
 *   longer responding to STUN requests.<br>
 * This state occurs after Peer connection has been disconnected <em>(closed)</em>.
 * @param {String} TRICKLE_FAILED <small>Value <code>"trickeFailed"</code></small>
 *   The state when attempting to connect successfully with ICE connection fails
 *    with trickle ICE connections.<br>
 * Trickle ICE would be disabled after <code>3</code> attempts to have a better
 *   successful ICE connection.
 * @readOnly
 * @since 0.1.0
 * @component ICE
 * @for Skylink
 */
Skylink.prototype.ICE_CONNECTION_STATE = {
  STARTING: 'starting',
  CHECKING: 'checking',
  CONNECTED: 'connected',
  COMPLETED: 'completed',
  CLOSED: 'closed',
  FAILED: 'failed',
  TRICKLE_FAILED: 'trickleFailed',
  DISCONNECTED: 'disconnected'
};

/**
 * These are the list of available transports that
 *   Skylink would use to connect to the TURN servers with.
 * - For example as explanation how these options works below, let's take that
 *   these are list of TURN servers given by the platform signaling:<br>
 *   <small><code>turn:turnurl:123?transport=tcp</code><br>
 *   <code>turn:turnurl?transport=udp</code><br>
 *   <code>turn:turnurl:1234</code><br>
 *   <code>turn:turnurl</code></small>
 * @attribute TURN_TRANSPORT
 * @type JSON
 * @param {String} TCP <small>Value <code>"tcp"</code></small>
 *   The option to connect using only TCP transports.
 *   <small>EXAMPLE OUTPUT<br>
 *   <code>turn:turnurl:123?transport=tcp</code><br>
 *   <code>turn:turnurl?transport=tcp</code><br>
 *   <code>turn:turnurl:1234?transport=tcp</code></small>
 * @param {String} UDP <small>Value <code>"udp"</code></small>
 *   The option to connect using only UDP transports.
 *   <small>EXAMPLE OUTPUT<br>
 *   <code>turn:turnurl:123?transport=udp</code><br>
 *   <code>turn:turnurl?transport=udp</code><br>
 *   <code>turn:turnurl:1234?transport=udp</code></small>
 * @param {String} ANY <small><b>DEFAULT</b> | Value <code>"any"</code></small>
 *   This option to use any transports that is preconfigured by provided by the platform signaling.
 *   <small>EXAMPLE OUTPUT<br>
 *   <code>turn:turnurl:123?transport=tcp</code><br>
 *   <code>turn:turnurl?transport=udp</code><br>
 *   <code>turn:turnurl:1234</code><br>
 *   <code>turn:turnurl</code></small>
 * @param {String} NONE <small>Value <code>"none"</code></small>
 *   This option to set no transports.
 *   <small>EXAMPLE OUTPUT<br>
 *   <code>turn:turnurl:123</code><br>
 *   <code>turn:turnurl</code><br>
 *   <code>turn:turnurl:1234</code></small>
 * @param {String} ALL <small>Value <code>"all"</code></small>
 *   This option to use both TCP and UDP transports.
 *   <small>EXAMPLE OUTPUT<br>
 *   <code>turn:turnurl:123?transport=tcp</code><br>
 *   <code>turn:turnurl:123?transport=udp</code><br>
 *   <code>turn:turnurl?transport=tcp</code><br>
 *   <code>turn:turnurl?transport=udp</code><br>
 *   <code>turn:turnurl:1234?transport=tcp</code><br>
 *   <code>turn:turnurl:1234?transport=udp</code></small>
 * @readOnly
 * @since 0.5.4
 * @component ICE
 * @for Skylink
 */
Skylink.prototype.TURN_TRANSPORT = {
  UDP: 'udp',
  TCP: 'tcp',
  ANY: 'any',
  NONE: 'none',
  ALL: 'all'
};

/**
 * These are the list of Peer connection signaling states that Skylink would trigger.
 * - Some of the state references the [w3c WebRTC Specification Draft](http://www.w3.org/TR/webrtc/#idl-def-RTCSignalingState).
 * @attribute PEER_CONNECTION_STATE
 * @type JSON
 * @param {String} STABLE <small>Value <code>"stable"</code></small>
 *   The state when there is no handshaking in progress and when
 *   handshaking has just started or close.<br>
 * This state occurs when Peer connection has just been initialised and after
 *   <code>HAVE_LOCAL_OFFER</code> or <code>HAVE_REMOTE_OFFER</code>.
 * @param {String} HAVE_LOCAL_OFFER <small>Value <code>"have-local-offer"</code></small>
 *   The state when the local session description <code>"offer"</code> is generated and to be sent.<br>
 * This state occurs after <code>STABLE</code> state.
 * @param {String} HAVE_REMOTE_OFFER <small>Value <code>"have-remote-offer"</code></small>
 *   The state when the remote session description <code>"offer"</code> is received.<br>
 * At this stage, this indicates that the Peer connection signaling handshaking has been completed, and
 *   likely would go back to <code>STABLE</code> after local <code>"answer"</code> is received by Peer.
 * @param {String} CLOSED <small>Value <code>"closed"</code></small>
 *   The state when the Peer connection is closed.<br>
 * This state occurs when connection with Peer has been closed, usually when Peer leaves the room.
 * @readOnly
 * @component Peer
 * @for Skylink
 * @since 0.5.0
 */
Skylink.prototype.PEER_CONNECTION_STATE = {
  STABLE: 'stable',
  HAVE_LOCAL_OFFER: 'have-local-offer',
  HAVE_REMOTE_OFFER: 'have-remote-offer',
  CLOSED: 'closed'
};

/**
 * These are the types of server Peers that Skylink would connect with.
 * - Different server Peers that serves different functionalities.
 * - The server Peers functionalities are only available depending on the
 *   Application Key configuration.
 * - Eventually, this list will be populated as there are more server Peer
 *   functionalities provided by the Skylink platform.
 * @attribute SERVER_PEER_TYPE
 * @param {String} MCU <small>Value <code>"mcu"</code></small>
 *   This server Peer is a MCU server connection.
 * @type JSON
 * @readOnly
 * @component Peer
 * @for Skylink
 * @since 0.6.1
 */
Skylink.prototype.SERVER_PEER_TYPE = {
  MCU: 'mcu'
  //SIP: 'sip'
};

/**
 * These are the list of Peer connection handshake states that Skylink would trigger.
 * - Do not be confused with {{#crossLink "Skylink/PEER_CONNECTION_STATE:attr"}}PEER_CONNECTION_STATE{{/crossLink}}.
 *   This is the Peer recognition connection that is established with the platform signaling protocol, and not
 *   the Peer connection signaling state itself.
 * - In this case, this happens before the {{#crossLink "Skylink/PEER_CONNECTION_STATE:attr"}}PEER_CONNECTION_STATE
 *   handshaking states. {{/crossLink}} The <code>OFFER</code> and <code>ANSWER</code> relates to the
 *   {{#crossLink "Skylink/PEER_CONNECTION_STATE:attr"}}PEER_CONNECTION_STATE states{{/crossLink}}.
 * - For example as explanation how these state works below, let's make self as the offerer and
 *   the connecting Peer as the answerer.
 * @attribute HANDSHAKE_PROGRESS
 * @type JSON
 * @param {String} ENTER <small>Value <code>"enter"</code></small>
 *   The state when Peer have received <code>ENTER</code> from self,
 *   and Peer connection with self is initialised with self.<br>
 * This state will occur for both self and Peer as <code>ENTER</code>
 *   message is sent to ping for Peers in the room.<br>
 * At this state, Peer would sent <code>WELCOME</code> to the peer to
 *   start the session description connection handshake.<br>
 * <table class="table table-condensed">
 *   <thead><tr><th class="col-md-1"></th><th class="col-md-5">Self</th><th>Peer</th></thead>
 *   <tbody>
 *     <tr><td class="col-md-1">1.</td>
 *       <td class="col-md-5">Sends <code>ENTER</code></td><td>Sends <code>ENTER</code></td></tr>
 *     <tr><td class="col-md-1">2.</td>
 *       <td class="col-md-5">-</td><td>Receives self <code>ENTER</code></td></tr>
 *     <tr><td class="col-md-1">3.</td>
 *       <td class="col-md-5">-</td><td>Sends self <code>WELCOME</code></td></tr>
 *   </tbody>
 * </table>
 * @param {String} WELCOME <small>Value <code>"welcome"</code></small>
 *   The state when self have received <code>WELCOME</code> from Peer,
 *   and Peer connection is initialised with Peer.<br>
 * At this state, self would start the session description connection handshake and
 *   send the local <code>OFFER</code> session description to Peer.
 * <table class="table table-condensed">
 *   <thead><tr><th class="col-md-1"></th><th class="col-md-5">Self</th><th>Peer</th></thead>
 *   <tbody>
 *     <tr><td class="col-md-1">4.</td>
 *       <td class="col-md-5">Receives <code>WELCOME</code></td><td>-</td></tr>
 *     <tr><td class="col-md-1">5.</td>
 *       <td class="col-md-5">Generates <code>OFFER</code></td><td>-</td></tr>
 *     <tr><td class="col-md-1">6.</td>
 *       <td class="col-md-5">Sets local <code>OFFER</code><sup>REF</sup></td><td>-</td></tr>
 *     <tr><td class="col-md-1">7.</td>
 *       <td class="col-md-5">Sends <code>OFFER</code></td><td>-</td></tr>
 *   </tbody>
 * </table>
 * <sup>REF</sup>: The will cause {{#crossLink "Skylink/PEER_CONNECTION_STATE:attr"}}PEER_CONNECTION_STATE{{/crossLink}}
 *   state go to <code>HAVE_LOCAL_OFFER</code>.
 * @param {String} OFFER <small>Value <code>"offer"</code></small>
 *   The state when Peer received <code>OFFER</code> from self.
 * At this state, Peer would set the remote <code>OFFER</code> session description and
 *   start to send local <code>ANSWER</code> session description to self.<br>
 * <table class="table table-condensed">
 *   <thead><tr><th class="col-md-1"></th><th class="col-md-5">Self</th><th>Peer</th></thead>
 *   <tbody>
 *     <tr><td class="col-md-1">8.</td>
 *        <td class="col-md-5">-</td><td>Receives <code>OFFER</code></td></tr>
 *     <tr><td class="col-md-1">9.</td>
 *        <td class="col-md-5">-</td><td>Sets remote <code>OFFER</code><sup>REF</sup></td></tr>
 *     <tr><td class="col-md-1">10.</td>
 *        <td class="col-md-5">-</td><td>Generates <code>ANSWER</code></td></tr>
 *     <tr><td class="col-md-1">11.</td>
 *        <td class="col-md-5">-</td><td>Sets local <code>ANSWER</code></td></tr>
 *     <tr><td class="col-md-1">12.</td>
 *        <td class="col-md-5">-</td><td>Sends <code>ANSWER</code></td></tr>
 *   </tbody>
 * </table>
 * <sup>REF</sup>: The will cause {{#crossLink "Skylink/PEER_CONNECTION_STATE:attr"}}PEER_CONNECTION_STATE{{/crossLink}}
 *   state go to <code>HAVE_REMOTE_OFFER</code>.
 * @param {String} ANSWER <small>Value <code>"answer"</code></small>
 *   The state when self received <code>ANSWER</code> from Peer.<br>
 * At this state, self would set the remote <code>ANSWER</code> session description and
 *   the connection handshaking progress has been completed.<br>
 * <table class="table table-condensed">
 *   <thead><tr><th class="col-md-1"></th><th class="col-md-5">Self</th><th>Peer</th></thead>
 *   <tbody>
 *     <tr><td class="col-md-1">13.</td>
 *        <td class="col-md-5">Receives <code>ANSWER</code></td><td>-</td></tr>
 *     <tr><td class="col-md-1">14.</td>
 *        <td class="col-md-5">Sets remote <code>ANSWER</code></td><td>-</td></tr>
 *   </tbody>
 * </table>
 * @param {String} ERROR <small>Value <code>"error"</code></small>
 *   The state when connection handshake has occurred and exception,
 *   in this which the connection handshake could have been aborted abruptly
 *   and no Peer connection is established.
 * @readOnly
 * @component Peer
 * @for Skylink
 * @since 0.1.0
 */
Skylink.prototype.HANDSHAKE_PROGRESS = {
  ENTER: 'enter',
  WELCOME: 'welcome',
  OFFER: 'offer',
  ANSWER: 'answer',
  ERROR: 'error'
};

/**
 * These are the list of Peer list retrieval states that Skylink would trigger.
 * - This relates to and requires the Privileged Key feature where Peers using
 *   that Privileged alias Key becomes a privileged Peer with privileged functionalities.
 * @attribute GET_PEERS_STATE
 * @type JSON
 * @param {String} ENQUIRED <small>Value <code>"enquired"</code></small>
 *   The state when the privileged Peer already enquired signaling for list of peers.
 * @param {String} RECEIVED <small>Value <code>"received"</code></small>
 *   The state when the privileged Peer received list of peers from signaling.
 * @readOnly
 * @component Peer
 * @for Skylink
 * @since 0.6.1
 */
Skylink.prototype.GET_PEERS_STATE = {
  ENQUIRED: 'enquired',
  RECEIVED: 'received'
};

/**
 * These are the list of Peer introduction states that Skylink would trigger.
 * - This relates to and requires the Privileged Key feature where Peers using
 *   that Privileged alias Key becomes a privileged Peer with privileged functionalities.
 * @attribute INTRODUCE_STATE
 * @type JSON
 * @param {String} INTRODUCING <small>Value <code>"enquired"</code></small>
 *   The state when the privileged Peer have sent the introduction signal.
 * @param {String} ERROR <small>Value <code>"error"</code></small>
 *   The state when the Peer introduction has occurred an exception.
 * @readOnly
 * @component Peer
 * @for Skylink
 * @since 0.6.1
 */
Skylink.prototype.INTRODUCE_STATE = {
  INTRODUCING: 'introducing',
  ERROR: 'error'
};

/**
 * These are the list of platform signaling system actions that Skylink would be given with.
 * - Upon receiving from the signaling, the application has to reflect the
 *   relevant actions given.
 * - You may refer to {{#crossLink "Skylink/SYSTEM_ACTION_REASON:attribute"}}SYSTEM_ACTION_REASON{{/crossLink}}
 *   for the types of system action reasons that would be given.
 * @attribute SYSTEM_ACTION
 * @type JSON
 * @param {String} WARNING <small>Value <code>"warning"</code></small>
 *   This action serves a warning to self. Usually if
 *   warning is not heeded, it may result in an <code>REJECT</code> action.
 * @param {String} REJECT <small>Value <code>"reject"</code></small>
 *   This action means that self has been kicked out
 *   of the current signaling room connection, and subsequent Peer connections
 *   would be disconnected.
 * @readOnly
 * @component Room
 * @for Skylink
 * @since 0.5.1
 */
Skylink.prototype.SYSTEM_ACTION = {
  WARNING: 'warning',
  REJECT: 'reject'
};

/**
 * These are the list of Skylink platform signaling codes as the reason
 *   for the system action given by the platform signaling that Skylink would receive.
 * - You may refer to {{#crossLink "Skylink/SYSTEM_ACTION:attribute"}}SYSTEM_ACTION{{/crossLink}}
 *   for the types of system actions that would be given.
 * - Reason codes like <code>FAST_MESSAGE</code>, <code>ROOM_FULL</code>, <code>VERIFICATION</code> and
 *   <code>OVER_SEAT_LIMIT</code> has been removed as they are no longer supported.
 * @attribute SYSTEM_ACTION_REASON
 * @type JSON
 * @param {String} ROOM_LOCKED <small>Value <code>"locked"</code> | Action ties with <code>REJECT</code></small>
 *   The reason code when room is locked and self is rejected from joining the room.
 * @param {String} DUPLICATED_LOGIN <small>Value <code>"duplicatedLogin"</code> | Action ties with <code>REJECT</code></small>
 *   The reason code when the credentials given is already in use, which the platform signaling
 *   throws an exception for this error.<br>
 * This rarely occurs as Skylink handles this issue, and it's recommended to report this issue if this occurs.
 * @param {String} SERVER_ERROR <small>Value <code>"serverError"</code> | Action ties with <code>REJECT</code></small>
 *   The reason code when the connection with the platform signaling has an exception with self.<br>
 * This rarely (and should not) occur and it's recommended to  report this issue if this occurs.
 * @param {String} EXPIRED <small>Value <code>"expired"</code> | Action ties with <code>REJECT</code></small>
 *   The reason code when the persistent room meeting has expired so self is unable to join the room as
 *   the end time of the meeting has ended.<br>
 * Depending on other meeting timings available for this room, the persistent room will appear expired.<br>
 * This relates to the persistent room feature configured in the Application Key.
 * @param {String} ROOM_CLOSED <small>Value <code>"roomclose"</code> | Action ties with <code>REJECT</code></small>
 *   The reason code when the persistent room meeting has ended and has been rendered expired so self is rejected
 *   from the room as the meeting is over.<br>
 * This relates to the persistent room feature configured in the Application Key.
 * @param {String} ROOM_CLOSING <small>Value <code>"toclose"</code> | Action ties with <code>WARNING</code></small>
 *   The reason code when the persistent room meeting is going to end soon, so this warning is given to inform
 *   users before self is rejected from the room.<br>
 * This relates to the persistent room feature configured in the Application Key.
 * @readOnly
 * @component Room
 * @for Skylink
 * @since 0.5.2
 */
Skylink.prototype.SYSTEM_ACTION_REASON = {
  //FAST_MESSAGE: 'fastmsg',
  ROOM_LOCKED: 'locked',
  //ROOM_FULL: 'roomfull',
  DUPLICATED_LOGIN: 'duplicatedLogin',
  SERVER_ERROR: 'serverError',
  //VERIFICATION: 'verification',
  EXPIRED: 'expired',
  ROOM_CLOSED: 'roomclose',
  ROOM_CLOSING: 'toclose'
};

/**
 * These are the logging levels that Skylink provides.
 * - This manipulates the debugging messages sent to <code>console</code> object.
 * - Refer to [Javascript Web Console](https://developer.mozilla.org/en/docs/Web/API/console).
 * @attribute LOG_LEVEL
 * @type JSON
 * @param {Number} DEBUG <small>Value <code>4</code> | Level higher than <code>LOG</code></small>
 *   Displays debugging logs from <code>LOG</code> level onwards with <code>DEBUG</code> logs.
 * @param {Number} LOG <small>Value <code>3</code> | Level higher than <code>INFO</code></small>
 *   Displays debugging logs from <code>INFO</code> level onwards with <code>LOG</code> logs.
 * @param {Number} INFO <small>Value <code>2</code> | Level higher than <code>WARN</code></small>
 *   Displays debugging logs from <code>WARN</code> level onwards with <code>INFO</code> logs.
 * @param {Number} WARN <small>Value <code>1</code> | Level higher than <code>ERROR</code></small>
 *   Displays debugging logs of <code>ERROR</code> level with <code>WARN</code> logs.
 * @param {Number} ERROR <small><b>DEFAULT</b> | Value <code>0</code> | Lowest level</small>
 *   Displays only <code>ERROR</code> logs.
 * @readOnly
 * @component Log
 * @for Skylink
 * @since 0.5.4
 */
Skylink.prototype.LOG_LEVEL = {
  DEBUG: 4,
  LOG: 3,
  INFO: 2,
  WARN: 1,
  ERROR: 0
};

/**
 * These are the list of socket connection error states that Skylink would trigger.
 * - These error states references the [socket.io-client events](http://socket.io/docs/client-api/).
 * @attribute SOCKET_ERROR
 * @type JSON
 * @param {Number} CONNECTION_FAILED <small>Value <code>0</code></small>
 *   The error state when Skylink have failed to establish a socket connection with
 *   platform signaling in the first attempt.
 * @param {String} RECONNECTION_FAILED <small>Value <code>-1</code></small>
 *   The error state when Skylink have failed to
 *   reestablish a socket connection with platform signaling after the first attempt
 *   <code>CONNECTION_FAILED</code>.
 * @param {String} CONNECTION_ABORTED <small>Value <code>-2</code></small>
 *   The error state when attempt to reestablish socket connection
 *   with platform signaling has been aborted after the failed first attempt
 *   <code>CONNECTION_FAILED</code>.
 * @param {String} RECONNECTION_ABORTED <small>Value <code>-3</code></small>
 *   The error state when attempt to reestablish socket connection
 *   with platform signaling has been aborted after several failed reattempts
 *   <code>RECONNECTION_FAILED</code>.
 * @param {String} RECONNECTION_ATTEMPT <small>Value <code>-4</code></small>
 *   The error state when Skylink is attempting to reestablish
 *   a socket connection with platform signaling after a failed attempt
 *   <code>CONNECTION_FAILED</code> or <code>RECONNECTION_FAILED</code>.
 * @readOnly
 * @component Socket
 * @for Skylink
 * @since 0.5.6
 */
Skylink.prototype.SOCKET_ERROR = {
  CONNECTION_FAILED: 0,
  RECONNECTION_FAILED: -1,
  CONNECTION_ABORTED: -2,
  RECONNECTION_ABORTED: -3,
  RECONNECTION_ATTEMPT: -4
};

/**
 * The current version of the internal <u>Signaling Message (SM)</u> Protocol that Skylink is using.<br>
 * - This is not a feature for developers to use but rather for SDK developers to
 *   see the Protocol version used in this Skylink version.
 * - In some cases, this information may be used for reporting issues with Skylink.
 * - SM_PROTOCOL VERSION: <code>0.1.</code>.
 * @attribute SM_PROTOCOL_VERSION
 * @type String
 * @required
 * @component Socket
 * @for Skylink
 * @since 0.6.0
 */
Skylink.prototype.SM_PROTOCOL_VERSION = '0.1.1';

/**
 * These are the list of available video codecs settings that Skylink would use
 *   when streaming video stream with Peers.
 * - The video codec would be used if the self and Peer's browser supports the selected codec.
 * - This would default to the browser selected codec. In most cases, option <code>VP8</code> is
 *   used by default.
 * @attribute VIDEO_CODEC
 * @param {String} AUTO <small><b>DEFAULT</b> | Value <code>"auto"</code></small>
 *   The option to let Skylink use any video codec selected by the browser generated session description.
 * @param {String} VP8 <small>Value <code>"VP8"</code></small>
 *   The option to let Skylink use the [VP8](https://en.wikipedia.org/wiki/VP8) codec.<br>
 *   This is the common and mandantory video codec used by most browsers.
 * @param {String} H264 <small>Value <code>"H264"</code></small>
 *   The option to let Skylink use the [H264](https://en.wikipedia.org/wiki/H.264/MPEG-4_AVC) codec.<br>
 *   This only works if the browser supports the H264 video codec.
 * @type JSON
 * @readOnly
 * @component Stream
 * @for Skylink
 * @since 0.5.10
 */
Skylink.prototype.VIDEO_CODEC = {
  AUTO: 'auto',
  VP8: 'VP8',
  H264: 'H264'
};

/**
 * These are the list of available audio codecs settings that Skylink would use
 *   when streaming audio stream with Peers.
 * - The audio codec would be used if the self and Peer's browser supports the selected codec.
 * - This would default to the browser selected codec. In most cases, option <code>OPUS</code> is
 *   used by default.
 * @attribute AUDIO_CODEC
 * @param {String} AUTO <small><b>DEFAULT</b> | Value <code>"auto"</code></small>
 *   The option to let Skylink use any audio codec selected by the browser generated session description.
 * @param {String} OPUS <small>Value <code>"opus"</code></small>
 *   The option to let Skylink use the [OPUS](https://en.wikipedia.org/wiki/Opus_(audio_format)) codec.<br>
 *   This is the common and mandantory audio codec used.
 * @param {String} ISAC <small>Value <code>"ISAC"</code></small>
 *   The option to let Skylink use the [iSAC](https://en.wikipedia.org/wiki/Internet_Speech_Audio_Codec).<br>
 *   This only works if the browser supports the iSAC video codec.
 * @type JSON
 * @readOnly
 * @component Stream
 * @for Skylink
 * @since 0.5.10
 */
Skylink.prototype.AUDIO_CODEC = {
  AUTO: 'auto',
  ISAC: 'ISAC',
  OPUS: 'opus'
};

/**
 * These are the list of socket connection error states that Skylink would trigger.
 * - These error states references the [socket.io-client events](http://socket.io/docs/client-api/).
 * @attribute SOCKET_ERROR
 * @type JSON
 * @param {Number} CONNECTION_FAILED <small>Value <code>0</code></small>
 *   The error state when Skylink have failed to establish a socket connection with
 *   platform signaling in the first attempt.
 * @param {String} RECONNECTION_FAILED <small>Value <code>-1</code></small>
 *   The error state when Skylink have failed to
 *   reestablish a socket connection with platform signaling after the first attempt
 *   <code>CONNECTION_FAILED</code>.
 * @param {String} CONNECTION_ABORTED <small>Value <code>-2</code></small>
 *   The error state when attempt to reestablish socket connection
 *   with platform signaling has been aborted after the failed first attempt
 *   <code>CONNECTION_FAILED</code>.
 * @param {String} RECONNECTION_ABORTED <small>Value <code>-3</code></small>
 *   The error state when attempt to reestablish socket connection
 *   with platform signaling has been aborted after several failed reattempts
 *   <code>RECONNECTION_FAILED</code>.
 * @param {String} RECONNECTION_ATTEMPT <small>Value <code>-4</code></small>
 *   The error state when Skylink is attempting to reestablish
 *   a socket connection with platform signaling after a failed attempt
 *   <code>CONNECTION_FAILED</code> or <code>RECONNECTION_FAILED</code>.
 * @readOnly
 * @component Socket
 * @for Skylink
 * @since 0.5.6
 */
Skylink.prototype.SOCKET_ERROR = {
  CONNECTION_FAILED: 0,
  RECONNECTION_FAILED: -1,
  CONNECTION_ABORTED: -2,
  RECONNECTION_ABORTED: -3,
  RECONNECTION_ATTEMPT: -4
};

/**
 * These are the list of fallback attempt types that Skylink would attempt with.
 * @attribute SOCKET_FALLBACK
 * @type JSON
 * @param {String} NON_FALLBACK <small>Value <code>"nonfallback"</code> | Protocol <code>"http:"</code>,
 * <code>"https:"</code> | Transports <code>"WebSocket"</code>, <code>"Polling"</code></small>
 *   The current socket connection attempt
 *   is using the first selected socket connection port for
 *   the current selected transport <code>"Polling"</code> or <code>"WebSocket"</code>.
 * @param {String} FALLBACK_PORT <small>Value <code>"fallbackPortNonSSL"</code> | Protocol <code>"http:"</code>
 *  | Transports <code>"WebSocket"</code></small>
 *   The current socket connection reattempt
 *   is using the next selected socket connection port for
 *   <code>HTTP</code> protocol connection with the current selected transport
 *   <code>"Polling"</code> or <code>"WebSocket"</code>.
 * @param {String} FALLBACK_PORT_SSL <small>Value <code>"fallbackPortSSL"</code> | Protocol <code>"https:"</code>
 *  | Transports <code>"WebSocket"</code></small>
 *   The current socket connection reattempt
 *   is using the next selected socket connection port for
 *   <code>HTTPS</code> protocol connection with the current selected transport
 *   <code>"Polling"</code> or <code>"WebSocket"</code>.
 * @param {String} LONG_POLLING <small>Value <code>"fallbackLongPollingNonSSL"</code> | Protocol <code>"http:"</code>
 *  | Transports <code>"Polling"</code></small>
 *   The current socket connection reattempt
 *   is using the next selected socket connection port for
 *   <code>HTTP</code> protocol connection with <code>"Polling"</code> after
 *   many attempts of <code>"WebSocket"</code> has failed.
 *   This occurs only for socket connection that is originally using
 *   <code>"WebSocket"</code> transports.
 * @param {String} LONG_POLLING_SSL <small>Value <code>"fallbackLongPollingSSL"</code> | Protocol <code>"https:"</code>
 *  | Transports <code>"Polling"</code></small>
 *   The current socket connection reattempt
 *   is using the next selected socket connection port for
 *   <code>HTTPS</code> protocol connection with <code>"Polling"</code> after
 *   many attempts of <code>"WebSocket"</code> has failed.
 *   This occurs only for socket connection that is originally using
 *   <code>"WebSocket"</code> transports.
 * @readOnly
 * @component Socket
 * @for Skylink
 * @since 0.5.6
 */
Skylink.prototype.SOCKET_FALLBACK = {
  NON_FALLBACK: 'nonfallback',
  FALLBACK_PORT: 'fallbackPortNonSSL',
  FALLBACK_SSL_PORT: 'fallbackPortSSL',
  LONG_POLLING: 'fallbackLongPollingNonSSL',
  LONG_POLLING_SSL: 'fallbackLongPollingSSL'
};

/**
 * These are the list of platform signaling system actions that Skylink would be given with.
 * - Upon receiving from the signaling, the application has to reflect the
 *   relevant actions given.
 * - You may refer to {{#crossLink "Skylink/SYSTEM_ACTION_REASON:attribute"}}SYSTEM_ACTION_REASON{{/crossLink}}
 *   for the types of system action reasons that would be given.
 * @attribute SYSTEM_ACTION
 * @type JSON
 * @param {String} WARNING <small>Value <code>"warning"</code></small>
 *   This action serves a warning to self. Usually if
 *   warning is not heeded, it may result in an <code>REJECT</code> action.
 * @param {String} REJECT <small>Value <code>"reject"</code></small>
 *   This action means that self has been kicked out
 *   of the current signaling room connection, and subsequent Peer connections
 *   would be disconnected.
 * @readOnly
 * @component Room
 * @for Skylink
 * @since 0.5.1
 */
Skylink.prototype.SYSTEM_ACTION = {
  WARNING: 'warning',
  REJECT: 'reject'
};

/**
 * These are the list of Skylink platform signaling codes as the reason
 *   for the system action given by the platform signaling that Skylink would receive.
 * - You may refer to {{#crossLink "Skylink/SYSTEM_ACTION:attribute"}}SYSTEM_ACTION{{/crossLink}}
 *   for the types of system actions that would be given.
 * - Reason codes like <code>FAST_MESSAGE</code>, <code>ROOM_FULL</code>, <code>VERIFICATION</code> and
 *   <code>OVER_SEAT_LIMIT</code> has been removed as they are no longer supported.
 * @attribute SYSTEM_ACTION_REASON
 * @type JSON
 * @param {String} ROOM_LOCKED <small>Value <code>"locked"</code> | Action ties with <code>REJECT</code></small>
 *   The reason code when room is locked and self is rejected from joining the room.
 * @param {String} DUPLICATED_LOGIN <small>Value <code>"duplicatedLogin"</code> | Action ties with <code>REJECT</code></small>
 *   The reason code when the credentials given is already in use, which the platform signaling
 *   throws an exception for this error.<br>
 * This rarely occurs as Skylink handles this issue, and it's recommended to report this issue if this occurs.
 * @param {String} SERVER_ERROR <small>Value <code>"serverError"</code> | Action ties with <code>REJECT</code></small>
 *   The reason code when the connection with the platform signaling has an exception with self.<br>
 * This rarely (and should not) occur and it's recommended to  report this issue if this occurs.
 * @param {String} EXPIRED <small>Value <code>"expired"</code> | Action ties with <code>REJECT</code></small>
 *   The reason code when the persistent room meeting has expired so self is unable to join the room as
 *   the end time of the meeting has ended.<br>
 * Depending on other meeting timings available for this room, the persistent room will appear expired.<br>
 * This relates to the persistent room feature configured in the Application Key.
 * @param {String} ROOM_CLOSED <small>Value <code>"roomclose"</code> | Action ties with <code>REJECT</code></small>
 *   The reason code when the persistent room meeting has ended and has been rendered expired so self is rejected
 *   from the room as the meeting is over.<br>
 * This relates to the persistent room feature configured in the Application Key.
 * @param {String} ROOM_CLOSING <small>Value <code>"toclose"</code> | Action ties with <code>WARNING</code></small>
 *   The reason code when the persistent room meeting is going to end soon, so this warning is given to inform
 *   users before self is rejected from the room.<br>
 * This relates to the persistent room feature configured in the Application Key.
 * @readOnly
 * @component Room
 * @for Skylink
 * @since 0.5.2
 */
Skylink.prototype.SYSTEM_ACTION_REASON = {
  //FAST_MESSAGE: 'fastmsg',
  ROOM_LOCKED: 'locked',
  //ROOM_FULL: 'roomfull',
  DUPLICATED_LOGIN: 'duplicatedLogin',
  SERVER_ERROR: 'serverError',
  //VERIFICATION: 'verification',
  EXPIRED: 'expired',
  ROOM_CLOSED: 'roomclose',
  ROOM_CLOSING: 'toclose'
};

/**
 * The current version of the internal <u>Signaling Message (SM)</u> Protocol that Skylink is using.<br>
 * - This is not a feature for developers to use but rather for SDK developers to
 *   see the Protocol version used in this Skylink version.
 * - In some cases, this information may be used for reporting issues with Skylink.
 * - SM_PROTOCOL VERSION: <code>0.1.</code>.
 * @attribute SM_PROTOCOL_VERSION
 * @type String
 * @required
 * @component Socket
 * @for Skylink
 * @since 0.6.0
 */
Skylink.prototype.SM_PROTOCOL_VERSION = '0.1.1';

/**
 * These are the list of available video codecs settings that Skylink would use
 *   when streaming video stream with Peers.
 * - The video codec would be used if the self and Peer's browser supports the selected codec.
 * - This would default to the browser selected codec. In most cases, option <code>VP8</code> is
 *   used by default.
 * @attribute VIDEO_CODEC
 * @param {String} AUTO <small><b>DEFAULT</b> | Value <code>"auto"</code></small>
 *   The option to let Skylink use any video codec selected by the browser generated session description.
 * @param {String} VP8 <small>Value <code>"VP8"</code></small>
 *   The option to let Skylink use the [VP8](https://en.wikipedia.org/wiki/VP8) codec.<br>
 *   This is the common and mandantory video codec used by most browsers.
 * @param {String} H264 <small>Value <code>"H264"</code></small>
 *   The option to let Skylink use the [H264](https://en.wikipedia.org/wiki/H.264/MPEG-4_AVC) codec.<br>
 *   This only works if the browser supports the H264 video codec.
 * @type JSON
 * @readOnly
 * @component Stream
 * @for Skylink
 * @since 0.5.10
 */
Skylink.prototype.VIDEO_CODEC = {
  AUTO: 'auto',
  VP8: 'VP8',
  H264: 'H264'
};

/**
 * These are the list of available audio codecs settings that Skylink would use
 *   when streaming audio stream with Peers.
 * - The audio codec would be used if the self and Peer's browser supports the selected codec.
 * - This would default to the browser selected codec. In most cases, option <code>OPUS</code> is
 *   used by default.
 * @attribute AUDIO_CODEC
 * @param {String} AUTO <small><b>DEFAULT</b> | Value <code>"auto"</code></small>
 *   The option to let Skylink use any audio codec selected by the browser generated session description.
 * @param {String} OPUS <small>Value <code>"opus"</code></small>
 *   The option to let Skylink use the [OPUS](https://en.wikipedia.org/wiki/Opus_(audio_format)) codec.<br>
 *   This is the common and mandantory audio codec used.
 * @param {String} ISAC <small>Value <code>"ISAC"</code></small>
 *   The option to let Skylink use the [iSAC](https://en.wikipedia.org/wiki/Internet_Speech_Audio_Codec).<br>
 *   This only works if the browser supports the iSAC video codec.
 * @type JSON
 * @readOnly
 * @component Stream
 * @for Skylink
 * @since 0.5.10
 */
Skylink.prototype.AUDIO_CODEC = {
  AUTO: 'auto',
  ISAC: 'ISAC',
  OPUS: 'opus'
};

/**
 * These are the list of suggested video resolutions that Skylink should configure
 *   when retrieving self user media video stream.
 * - Setting the resolution may not force set the resolution provided as it
 *   depends on the how the browser handles the resolution.
 * - It's recommended to use video resolution option to maximum <code>FHD</code>, as the other
 *   resolution options may be unrealistic and create performance issues. However, we provide them
 *   to allow developers to test with the browser capability, but do use it at your own risk.
 * - The higher the resolution, the more CPU usage might be used, hence it's recommended to
 *   use the default option <code>VGA</code>.
 * - This follows the
 *   [Wikipedia Graphics display resolution page](https://en.wikipedia.org/wiki/Graphics_display_resolution#Video_Graphics_Array)
 * @param {JSON} QQVGA <small>Value <code>{ width: 160, height: 120 }</code> | Aspect Ratio <code>4:3</code></small>
 *   The option to use QQVGA resolution.
 * @param {JSON} HQVGA <small>Value <code>{ width: 240, height: 160 }</code> | Aspect Ratio <code>3:2</code></small>
 *   The option to use HQVGA resolution.
 * @param {JSON} QVGA <small>Value <code>{ width: 320, height: 240 }</code> | Aspect Ratio <code>4:3</code></small>
 *   The option to use QVGA resolution.
 * @param {JSON} WQVGA <small>Value <code>{ width: 384, height: 240 }</code> | Aspect Ratio <code>16:10</code></small>
 *   The option to use WQVGA resolution.
 * @param {JSON} HVGA <small>Value <code>{ width: 480, height: 320 }</code> | Aspect Ratio <code>3:2</code></small>
 *   The option to use HVGA resolution.
 * @param {JSON} VGA <small><b>DEFAULT</b> | Value <code>{ width: 640, height: 480 }</code> | Aspect Ratio <code>4:3</code></small>
 *   The option to use VGA resolution.
 * @param {JSON} WVGA <small>Value <code>{ width: 768, height: 480 }</code> | Aspect Ratio <code>16:10</code></small>
 *   The option to use WVGA resolution.
 * @param {JSON} FWVGA <small>Value <code>{ width: 854, height: 480 }</code> | Aspect Ratio <code>16:9</code></small>
 *   The option to use FWVGA resolution.
 * @param {JSON} SVGA <small>Value <code>{ width: 800, height: 600 }</code> | Aspect Ratio <code>4:3</code></small>
 *   The option to use SVGA resolution.
 * @param {JSON} DVGA <small>Value <code>{ width: 960, height: 640 }</code> | Aspect Ratio <code>3:2</code></small>
 *   The option to use DVGA resolution.
 * @param {JSON} WSVGA <small>Value <code>{ width: 1024, height: 576 }</code> | Aspect Ratio <code>16:9</code></small>
 *   The option to use WSVGA resolution.
 * @param {JSON} HD <small>Value <code>{ width: 1280, height: 720 }</code> | Aspect Ratio <code>16:9</code></small>
 *   The option to use HD resolution.
 * @param {JSON} HDPLUS <small>Value <code>{ width: 1600, height: 900 }</code> | Aspect Ratio <code>16:9</code></small>
 *   The option to use HDPLUS resolution.
 * @param {JSON} FHD <small>Value <code>{ width: 1920, height: 1080 }</code> | Aspect Ratio <code>16:9</code></small>
 *   The option to use FHD resolution.
 * @param {JSON} QHD <small>Value <code>{ width: 2560, height: 1440 }</code> | Aspect Ratio <code>16:9</code></small>
 *   The option to use QHD resolution.
 * @param {JSON} WQXGAPLUS <small>Value <code>{ width: 3200, height: 1800 }</code> | Aspect Ratio <code>16:9</code></small>
 *   The option to use WQXGAPLUS resolution.
 * @param {JSON} UHD <small>Value <code>{ width: 3840, height: 2160 }</code> | Aspect Ratio <code>16:9</code></small>
 *   The option to use UHD resolution.
 * @param {JSON} UHDPLUS <small>Value <code>{ width: 5120, height: 2880 }</code> | Aspect Ratio <code>16:9</code></small>
 *   The option to use UHDPLUS resolution.
 * @param {JSON} FUHD <small>Value <code>{ width: 7680, height: 4320 }</code> | Aspect Ratio <code>16:9</code></small>
 *   The option to use FUHD resolution.
 * @param {JSON} QUHD <small>Value <code>{ width: 15360, height: 8640 }</code> | Aspect Ratio <code>16:9</code></small>
 *   The option to use QUHD resolution.
 * @attribute VIDEO_RESOLUTION
 * @type JSON
 * @readOnly
 * @component Stream
 * @for Skylink
 * @since 0.5.6
 */
Skylink.prototype.VIDEO_RESOLUTION = {
  QQVGA: { width: 160, height: 120, aspectRatio: '4:3' },
  HQVGA: { width: 240, height: 160, aspectRatio: '3:2' },
  QVGA: { width: 320, height: 240, aspectRatio: '4:3' },
  WQVGA: { width: 384, height: 240, aspectRatio: '16:10' },
  HVGA: { width: 480, height: 320, aspectRatio: '3:2' },
  VGA: { width: 640, height: 480, aspectRatio: '4:3' },
  WVGA: { width: 768, height: 480, aspectRatio: '16:10' },
  FWVGA: { width: 854, height: 480, aspectRatio: '16:9' },
  SVGA: { width: 800, height: 600, aspectRatio: '4:3' },
  DVGA: { width: 960, height: 640, aspectRatio: '3:2' },
  WSVGA: { width: 1024, height: 576, aspectRatio: '16:9' },
  HD: { width: 1280, height: 720, aspectRatio: '16:9' },
  HDPLUS: { width: 1600, height: 900, aspectRatio: '16:9' },
  FHD: { width: 1920, height: 1080, aspectRatio: '16:9' },
  QHD: { width: 2560, height: 1440, aspectRatio: '16:9' },
  WQXGAPLUS: { width: 3200, height: 1800, aspectRatio: '16:9' },
  UHD: { width: 3840, height: 2160, aspectRatio: '16:9' },
  UHDPLUS: { width: 5120, height: 2880, aspectRatio: '16:9' },
  FUHD: { width: 7680, height: 4320, aspectRatio: '16:9' },
  QUHD: { width: 15360, height: 8640, aspectRatio: '16:9' }
};

/**
 * These are the list of Peer connection handshake states that Skylink would trigger.
 * - Do not be confused with {{#crossLink "Skylink/PEER_CONNECTION_STATE:attr"}}PEER_CONNECTION_STATE{{/crossLink}}.
 *   This is the Peer recognition connection that is established with the platform signaling protocol, and not
 *   the Peer connection signaling state itself.
 * - In this case, this happens before the {{#crossLink "Skylink/PEER_CONNECTION_STATE:attr"}}PEER_CONNECTION_STATE
 *   handshaking states. {{/crossLink}} The <code>OFFER</code> and <code>ANSWER</code> relates to the
 *   {{#crossLink "Skylink/PEER_CONNECTION_STATE:attr"}}PEER_CONNECTION_STATE states{{/crossLink}}.
 * - For example as explanation how these state works below, let's make self as the offerer and
 *   the connecting Peer as the answerer.
 * @attribute HANDSHAKE_PROGRESS
 * @type JSON
 * @param {String} ENTER <small>Value <code>"enter"</code></small>
 *   The state when Peer have received <code>ENTER</code> from self,
 *   and Peer connection with self is initialised with self.<br>
 * This state will occur for both self and Peer as <code>ENTER</code>
 *   message is sent to ping for Peers in the room.<br>
 * At this state, Peer would sent <code>WELCOME</code> to the peer to
 *   start the session description connection handshake.<br>
 * <table class="table table-condensed">
 *   <thead><tr><th class="col-md-1"></th><th class="col-md-5">Self</th><th>Peer</th></thead>
 *   <tbody>
 *     <tr><td class="col-md-1">1.</td>
 *       <td class="col-md-5">Sends <code>ENTER</code></td><td>Sends <code>ENTER</code></td></tr>
 *     <tr><td class="col-md-1">2.</td>
 *       <td class="col-md-5">-</td><td>Receives self <code>ENTER</code></td></tr>
 *     <tr><td class="col-md-1">3.</td>
 *       <td class="col-md-5">-</td><td>Sends self <code>WELCOME</code></td></tr>
 *   </tbody>
 * </table>
 * @param {String} WELCOME <small>Value <code>"welcome"</code></small>
 *   The state when self have received <code>WELCOME</code> from Peer,
 *   and Peer connection is initialised with Peer.<br>
 * At this state, self would start the session description connection handshake and
 *   send the local <code>OFFER</code> session description to Peer.
 * <table class="table table-condensed">
 *   <thead><tr><th class="col-md-1"></th><th class="col-md-5">Self</th><th>Peer</th></thead>
 *   <tbody>
 *     <tr><td class="col-md-1">4.</td>
 *       <td class="col-md-5">Receives <code>WELCOME</code></td><td>-</td></tr>
 *     <tr><td class="col-md-1">5.</td>
 *       <td class="col-md-5">Generates <code>OFFER</code></td><td>-</td></tr>
 *     <tr><td class="col-md-1">6.</td>
 *       <td class="col-md-5">Sets local <code>OFFER</code><sup>REF</sup></td><td>-</td></tr>
 *     <tr><td class="col-md-1">7.</td>
 *       <td class="col-md-5">Sends <code>OFFER</code></td><td>-</td></tr>
 *   </tbody>
 * </table>
 * <sup>REF</sup>: The will cause {{#crossLink "Skylink/PEER_CONNECTION_STATE:attr"}}PEER_CONNECTION_STATE{{/crossLink}}
 *   state go to <code>HAVE_LOCAL_OFFER</code>.
 * @param {String} OFFER <small>Value <code>"offer"</code></small>
 *   The state when Peer received <code>OFFER</code> from self.
 * At this state, Peer would set the remote <code>OFFER</code> session description and
 *   start to send local <code>ANSWER</code> session description to self.<br>
 * <table class="table table-condensed">
 *   <thead><tr><th class="col-md-1"></th><th class="col-md-5">Self</th><th>Peer</th></thead>
 *   <tbody>
 *     <tr><td class="col-md-1">8.</td>
 *        <td class="col-md-5">-</td><td>Receives <code>OFFER</code></td></tr>
 *     <tr><td class="col-md-1">9.</td>
 *        <td class="col-md-5">-</td><td>Sets remote <code>OFFER</code><sup>REF</sup></td></tr>
 *     <tr><td class="col-md-1">10.</td>
 *        <td class="col-md-5">-</td><td>Generates <code>ANSWER</code></td></tr>
 *     <tr><td class="col-md-1">11.</td>
 *        <td class="col-md-5">-</td><td>Sets local <code>ANSWER</code></td></tr>
 *     <tr><td class="col-md-1">12.</td>
 *        <td class="col-md-5">-</td><td>Sends <code>ANSWER</code></td></tr>
 *   </tbody>
 * </table>
 * <sup>REF</sup>: The will cause {{#crossLink "Skylink/PEER_CONNECTION_STATE:attr"}}PEER_CONNECTION_STATE{{/crossLink}}
 *   state go to <code>HAVE_REMOTE_OFFER</code>.
 * @param {String} ANSWER <small>Value <code>"answer"</code></small>
 *   The state when self received <code>ANSWER</code> from Peer.<br>
 * At this state, self would set the remote <code>ANSWER</code> session description and
 *   the connection handshaking progress has been completed.<br>
 * <table class="table table-condensed">
 *   <thead><tr><th class="col-md-1"></th><th class="col-md-5">Self</th><th>Peer</th></thead>
 *   <tbody>
 *     <tr><td class="col-md-1">13.</td>
 *        <td class="col-md-5">Receives <code>ANSWER</code></td><td>-</td></tr>
 *     <tr><td class="col-md-1">14.</td>
 *        <td class="col-md-5">Sets remote <code>ANSWER</code></td><td>-</td></tr>
 *   </tbody>
 * </table>
 * @param {String} ERROR <small>Value <code>"error"</code></small>
 *   The state when connection handshake has occurred and exception,
 *   in this which the connection handshake could have been aborted abruptly
 *   and no Peer connection is established.
 * @readOnly
 * @component Peer
 * @for Skylink
 * @since 0.1.0
 */
Skylink.prototype.HANDSHAKE_PROGRESS = {
  ENTER: 'enter',
  WELCOME: 'welcome',
  OFFER: 'offer',
  ANSWER: 'answer',
  ERROR: 'error'
};


this.Skylink = Skylink;

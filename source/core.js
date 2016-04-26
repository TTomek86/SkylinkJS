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
 * @since 0.7.0
 */
function Skylink () {

  SkylinkEvent._mixin(this, SkylinkEventList);

  /**
   * Stores the global configuration made in <code>init()</code>.<br>
   * @attribute _globals
   * @type JSON
   * @param {JSON} current The current <code>init()</code> configuration.
   *   <small>Parameter fields follows <code>init()</code> <code>options</code> parameter.</small>
   * @param {JSON} defaults The default <code>init()</code> configuration.
   *   <small>Parameter fields follows <code>init()</code> <code>options</code> parameter.</small>
   * @private
   * @for Skylink
   * @since 0.7.0
   */
  this._globals = {
    current: {},
    defaults: {
      appKey: null,
      defaultRoom: null,
      selectedRoom: null,
      roomServer: '//api.temasys.com.sg',
      region: null,
      enableIceTrickle: true,
      enableDataChannel: true,
      enableTURNServer: true,
      enableSTUNServer: true,
      forceTURN: false,
      usePublicSTUN: true,
      TURNServerTransport: this.TURN_TRANSPORT.ANY,
      credentials: null,
      audioFallback: false,
      forceSSL: false,
      audioCodec: this.AUDIO_CODEC.AUTO,
      videoCodec: this.VIDEO_CODEC.AUTO,
      socketTimeout: 20000,
      forceTURNSSL: false
    }
  };

  /**
   * Stores the current connection session information.
   * @attribute _session
   * @type JSON
   * @private
   * @for Skylink
   * @since 0.7.0
   */
  this._session = {
    state: 0,
    url: null,
    data: null
  };

  /**
   * Stores the current user information.
   * @attribute _user
   * @type JSON
   * @private
   * @for Skylink
   * @since 0.7.0
   */
  this._user = {
    id: null,
    agent: {
      name: window.webrtcDetectedBrowser,
      version: window.webrtcDetectedVersion,
      os: window.navigator.platform,
      pluginVersion: null
    },
    data: null
  };

  /**
   * Stores the list of supported browsers information.
   * @attribute _supportedBrowsers
   * @type JSON
   * @private
   * @for Skylink
   * @since 0.7.0
   */
  this._supportedBrowsers = {
    chrome: 45,
    firefox: 40,
    opera: 32,
    IE: 9,
    safari: 7
  };
}
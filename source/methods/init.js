/* jshint ignore:start */
/**
 * <blockquote class="panel-warning">
 *   Note that this method is required to call before using any other functionalities
 *   except Event methods like <a href="#method_on"><u><code>on()</code> method</u></a>,
 *   <a href="#method_off"><u><code>off()</code> method</u></a>
 *   or <a href="#method_once"><u><code>once()</code> method</u></a>. By default,
 *   the SDK uses CORS authentication. To use credentials based authentication, configure the
 *   <code>credentials</code> parameter.
 * </blockquote>
 * Method that initializes the Skylink object to start connection session.
 * @method init
 * @param {String|JSON} options The parameter for configuration settings.<br>
 *   Providing this value as a <kbd>"String"</kbd> reads as <code>appKey</code>.
 * @param {String} options.appKey The parameter to configure the Application Key.
 * @param {String} [options.defaultRoom=&options.appKey] <blockquote class="panel-info">
 *     This fallbacks to the value of Application Key configured if not provided.
 *   </blockquote>
 *   The parameter to configure the default Room name that the SDK
 *   uses when no <code>room</code> parameter is
 *   provided in <a href="#method_joinRoom"><u><code>joinRoom()</code> method</u></a>.
 * @param {String} [options.roomServer] <blockquote class="panel-info">
 *     This is for SDK debugging purposes and it is <u>NOT RECOMMENDED</u> to modify the value.
 *     To use this, have to provide the Protocol Relative URL value (<code>"//"</code>) before the domain name.
 *     Ensure that no (<code>"/"</code>) value is provided at the end of the value.
 *   </blockquote>
 *   The parameter to configure the API server to start connection session.
 * @param {String} [options.region] <blockquote class="panel-info">
 *     This has been deprecated and it is not recommended to configure this value anymore.
 *   </blockquote>
 *   The parameter to configure the nearest regional server for the SDK to connect to.
 *   [Rel: Skylink.attr.REGIONAL_SERVER]
 * @param {Boolean} [options.enableIceTrickle=true] <blockquote class="panel-info">
 *     Note that setting this to <code>false</code> may result in a slower connection.
 *   </blockquote>
 *   The parameter to enable trickle ICE connections for faster connectivity.
 *   <small>See: <a href="#x">What is ICE and how it works</a></small>
 * @param {Boolean} [options.enableDataChannel=true] <blockquote class="panel-info">
 *     Note that setting this to <code>false</code> will disable
 *     <a href="#method_sendBlobData"><u><code>sendBlobData()</code> method</u></a>,
 *     <a href="#method_sendURLData"><u><code>sendURLData()</code> method</u></a> and
 *     <a href="#method_sendBlobData"><u><code>sendP2PMessage()</code> method</u></a> functionalities.
 *     You will not be able to receive any P2P messages as well.
 *     Additionally, even with this enabled,
 *     if there is a connecting Peer that does not have <code>enableDataChannel</code>
 *     enabled, the following above functionalities will not work with that particular Peer connection.
 *   </blockquote>
 *   The parameter to enable Datachannel connections.
 * @param {Boolean} [options.enableTURNServer=true] <blockquote class="panel-info">
 *     Note that this only filters the ICE servers when starting Peer connection. To enforce
 *     TURN connections, configure <code>forceTURN</code> parameter instead.
 *   </blockquote>
 *   The parameter to enable using TURN ICE servers when starting a Peer connection.<br>
 *   Disabling this will filter out all TURN ICE servers passed in Peer connections.
 * @param {Boolean} [options.enableSTUNServer=true] The parameter to
 *   enable using STUN ICE servers when starting a Peer connection.<br>
 *   Disabling this will filter out all STUN ICE servers passed in Peer connections.
 * @param {Boolean} [options.forceTURN=false] <blockquote class="panel-info">
 *     Note that if TURN is not enabled for the Application Key configured, Peer connections will not be
 *     able to connect.
 *   </blockquote>
 *   The parameter to enforce TURN ICE connections.<br>
 *   Enabling this will filter out all STUN ICE servers as well.
 * @param {Boolean} [options.usePublicSTUN=true] The parameter to
 *   enable using publicly available STUN ICE servers when starting a Peer connection.<br>
 *   Disabling this will filter out all publicly available STUN ICE servers.
 * @param {Boolean} [options.TURNServerTransport=#<Skylink.TURN_TRANSPORT.ANY>] The parameter to
 *   configure the TURN ICE servers transports.
 *   [Rel: Skylink.attr.TURN_TRANSPORT]
 * @param {JSON} [options.credentials] <blockquote class="panel-info">
 *   Note that you require the configure the correct <code>startDateTime</code> and
 *   <code>duration</code> used when generating the <code>credentials</code> to configure the SDK
 *   to use credentials based authentication, By default, when credentials is not provided,
 *   the SDK will use CORS based authentication. Additionally, take note that
 *   using credentials based authentication does not allow you to join the Room
 *   based on the <code>room</code> paramter provided in
 *   <a href="#method_joinRoom"><u><code>joinRoom()</code> method</u></a>.</blockquote>
 *   The parameter to use credentials based authentication to start connection session.
 *   <small>See:<a href="http://support.temasys.com.sg/support/solutions/articles/12000002712-authenticating-your-application-key-to-start-a-connection">
 *     Authenticating SDK connection sessions</a>.</small>
 * @param {String} options.credentials.startDateTime The parameter to configure the
 *   <code>credentials</code> starting DateTime. This value has to be set in
 *   (<a href="https://en.wikipedia.org/wiki/ISO_8601">ISO 8601 format</a>), which can be retrieved from
 *   the <kbd>Date</kbd> object <code>Date.getISOString()</code> method.
 * @param {Number} options.credentials.duration The parameter to configure the
 *   <code>credentials</code> connection session duration in Hours.
 *   <small>EXAMPLES:<br>
 *   30 mins: <code>0.5</code><br>
 *   1 hour, 24mins: <code>1.4</code><br>
 *   2 hours, 30mins: <code>2.5</code></small>
 * @param {String} options.credentials.credentials The parameter to configure the
 *   <code>credentials</code> connection session authentication string.<br>
 *   This requires you to generate with your configured Application Key <u>Secret</u>,
 *   provided <code>credentials</code> - <code>startDateTime</code>, <code>duration</code> and
 *   <code>defaultRoom</code> values.
 *   <small class="tip-box">
 *   <b>INSTRUCTIONS ON GENERATING CREDENTIALS STRING:</b>
 *   <ol>
 *   <li>Concatenate the <code>defaultRoom</code>, <code>credentials</code> - <code>duration</code> and <code>startDateTime</code>.
 *      <var>var <code>concatStr</code> = <code>defaultRoom</code> + "_" + <code>duration</code> + "_" + <code>startDateTimeStamp</code>;</var></li>
 *   <li>Hash the <code>concatStr</code> value with the Application Key <u>Secret</u> using SHA-1
 *      In this example, we use the <a href="https://code.google.com/p/crypto-js/#HMAC"><u><code>CryptoJS.HmacSHA1</code> function</u></a> .
 *      <var>var <code>hash</code> = CryptoJS.HmacSHA1(<code>concatStr</code>, <code>secret</code>);</var></li>
 *   <li>Convert the hash to a Base64 encoded string.
 *      In this example, we use the <a href="https://code.google.com/p/crypto-js/#The_Cipher_Output""><u><code>CryptoJS.enc.Base64</code> function</u></a>.
 *      <var>var <code>base64String</code> = <code>hash</code>.toString(CryptoJS.enc.Base64);</var></li>
 *   <li>Encode the Base64 encoded string to a URI component using UTF-8 encoding with
 *      <a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent"><u><code>encodeURIComponent()</code> function</u></a>.
 *      <var>var <code>credentialsStr</code> = encodeURIComponent(<code>base64String</code>);</var></li></ol></small>
 * @param {Boolean} [options.audioFallback=false] The parameter to configure to retrieve audio only
 *   as a fallback when retrieving audio and video fails in
 *   <a href="#method_getUserMedia"><u><code>getUserMedia()</code> method</u></a>.
 * @param {Boolean} [options.forceSSL=false] <blockquote class="panel-info">
 *   By default, if user is accessing the SDK from <code>https:</code> protocol, SSL connections are already enabled.</blockquote>
 *   The parameter to enforce SSL connections when starting connection session and Room socket connection.
 * @param {String} [options.audioCodec=#<Skylink.AUDIO_CODEC.AUTO>] The parameter to configure
 *   the audio codec for audio streams.
 *   [Rel: Skylink.attr.AUDIO_CODEC]
 * @param {String} [options.videoCodec=#<Skylink.VIDEO_CODEC.AUTO>] The parameter to configure
 *   the audio codec for video streams.
 *   [Rel: Skylink.attr.VIDEO_CODEC]
 * @param {Number} [options.socketTimeout=20000] The parameter to configure the timeout to wait when there is no
 *   connection response before triggering as <code>CONNECTION_FAILED</code> or <code>RECONNECTION_FAILED</code>.
 *   [Rel: Skylink.attr.SOCKET_ERROR]
 * @param {Boolean} [options.forceTURNSSL=false] <blockquote class="panel-info">
 *   By default, if user is accessing the SDK from <code>https:</code> protocol, TURN SSL connections are already enabled</code>.
 *   Note that if the browser does not support the <code>turns:</code> protocol, SSL ports will be used instead.</blockquote>
 *   The parameter to enforce SSL connections for TURN ICE server connections.
 * @param {Function} [callbackFn] The parameter <code>callback</code> function that would be triggered when
 *   after <code>init()</code> method process has completed.
 *   <blockquote class="sub">Method parameter payload signature: <var>function(<code>error</code>, <code>success</code>)</var></blockquote>
 * @param {JSON} callbackFn.error The <code>callback</code> function parameter payload that is defined when
 *   <code>init()</code> method process encountered an error.
 * @param {Number} callbackFn.error.errorCode The error code.
 *   [Rel: Skylink.attr.READY_STATE_CHANGE_ERROR]
 * @param {Error} callbackFn.error.error The error object.
 * @param {Number} callbackFn.error.status The HTTP status received when encountering the error.<br>
 *   [Rel: Skylink.attr.READY_STATE_CHANGE_ERROR_STATUS]
 * @param {JSON} callbackFn.success The <code>callback</code> function parameter payload that is defined when
 *   <code>init()</code> method process has completed without errors.
 * @param {String} callbackFn.success.serverUrl <blockquote class="panel-info">
 *   This has been deprecated and will be removed in the next releases.
 * </blockquote> The API HTTP request URL.
 * @param {String} callbackFn.success.readyState <blockquote class="panel-info">
 *   This has been deprecated and will be removed in the next releases.
 * </blockquote> The current connection session ready state.
 * @param {String} callbackFn.success.appKey The configured parameter <code>appKey</code> value.
 * @param {String} callbackFn.success.defaultRoom The configured parameter <code>defaultRoom</code> value.
 * @param {String} callbackFn.success.selectedRoom <blockquote class="panel-info">
 *   This has been deprecated in the callback and will be removed in the next releases.
 * </blockquote> The current selected Room name.
 * @param {String} callbackFn.success.roomServer The configured parameter <code>roomServer</code> value.
 * @param {Boolean} callbackFn.success.enableIceTrickle The configured parameter <code>enableIceTrickle</code> value.
 * @param {Boolean} callbackFn.success.enableDataChannel The configured parameter <code>enableDataChannel</code> value.
 * @param {Boolean} callbackFn.success.enableTURNServer The configured parameter <code>enableTURNServer</code> value.
 * @param {Boolean} callbackFn.success.enableSTUNServer The configured parameter <code>enableSTUNServer</code> value.
 * @param {Boolean} callbackFn.success.TURNTransport <blockquote class="panel-info">
 *   This will be renamed as <code>TURNServerTransport</code> in the next releases.
 * </blockquote> The configured parameter <code>TURNServerTransport</code> value.
 * @param {String} [callbackFn.success.serverRegion] <blockquote class="panel-info">
 *   This will be renamed as <code>region</code> in the next releases before removal of <code>region</code> parameter.
 * </blockquote> The configured parameter <code>region</code> value.
 * @param {Boolean} callbackFn.success.audioFallback The configured parameter <code>audioFallback</code> value.
 * @param {Boolean} callbackFn.success.forceSSL The configured parameter <code>forceSSL</code> value.
 * @param {String} callbackFn.success.audioCodec The configured parameter <code>audioCodec</code> value.
 * @param {String} callbackFn.success.videoCodec The configured parameter <code>videoCodec</code> value.
 * @param {Number} callbackFn.success.socketTimeout The configured parameter <code>socketTimeout</code> value.
 * @param {Boolean} callbackFn.success.forceTURNSSL The configured parameter <code>forceTURNSSL</code> value.
 * @param {Boolean} callbackFn.success.forceTURN The configured parameter <code>forceTURN</code> value.
 * @param {Boolean} callbackFn.success.usePublicSTUN The configured parameter <code>usePublicTURN</code> value.
 * @example
 *   // Parameters: Skylink.init(appKey);
 *   SkylinkDemo.init("<% Your Application Key value here %>");
 *
 *
 *   // Parameters: Skylink.init(options);
 *   SkylinkDemo.init({
 *     appKey: "<% Your Application Key value here %>",
 *     audioFallback: true,
 *     defaultRoom: "<% Your default Room name value here %>",
 *     forceSSL: true,
 *     forceTURNSSL: true
 *   });
 *
 *
 *   // Parameters: Skylink.init(options); - using credentials based authentication
 *   // ----------------------------------------------------------------------------------
 *   //  NOTE: It is not recommended to generate credentials on client side but server
 *   //        side for security. This is for illustration purposes.
 *   // ----------------------------------------------------------------------------------
 *   function generateCreds (room, duration, startDateTime) {
 *     var concatStr = room + "\_" + duration + "\_" + startDateTime;
 *     //! Do not EXPOSE to any users
 *     var hash = CryptoJS.HmacSHA1(concatStr, "<% Your Application Key secret value here %>");
 *     var base64String = hash.toString(CryptoJS.enc.Base64);
 *     return encodeURIComponent(base64String);
 *   }
 *
 *   //! This is the Room name that will only be joined for the connection session
 *   var room  = "<% Your Room name value here %>", //
 *       credentials  = {
 *        //! Set as 2 Hours.
 *         duration: 2,
 *         //! Currently is configure for Now. Can be configured with any starting date if preferred.
 *         startDateTime: (new Date()).toISOString(),
 *         credentials: null
 *       };
 *
 *   credentials.credentials = generateCreds(room, credentials.duration, credentials.startDateTime);
 *
 *   SkylinkDemo.init({
 *     appKey: "<% Your Application Key value here %>",
 *     defaultRoom: room,
 *     credentials: credentials
 *   });
 *
 *
 *   // Parameters: Skylink.init(options, callback);
 *   SkylinkDemo.init({
 *     appKey: "<% Your Application Key value here %>",
 *     audioFallback: true,
 *     defaultRoom: "<% Your default Room name value here %>",
 *     forceSSL: true,
 *     forceTURNSSL: true
 *   }, function(error, success){
 *     if (error) {
 *       ///-[Error: See &callbackFn error parameter payload.]
 *     } else{
 *       ///-[Success: See &callbackFn success parameter payload.]
 *     }
 *   });
 * @required
 * @for Skylink
 * @since 0.7.0
 */
/* jshint ignore:end */
Skylink.prototype.init = function (options, callback) {
  var self = this;

  self._globals.current = SkylinkUtils.objectCloneFn(self._globals.defaults);

  /**
   * Function that sets the init() ready state
   */
  var processSetStateFn = function (state, error) {
    log.log([null, 'Skylink', 'init()', 'Ready state ->'], state);

    self._session.state = state;

    self._trigger('readyStateChange', state, error || null, self._globals.current.selectedRoom);

    if ([self.READY_STATE_CHANGE.ERROR, self.READY_STATE_CHANGE.COMPLETED].indexOf(state) > -1) {
      var responseFn = typeof callback === 'function' ? callback : function () {};

      if (error) {
        log.error([null, 'Skylink', 'init()', 'Process failed with error ->'], error);

        responseFn({
          errorCode: error.errorCode,
          error: error.content,
          status: error.status
        }, null);

      } else {
        log.log([null, 'Skylink', 'init()', 'Process completed successfully']);

        responseFn(null, {
          serverUrl: self._session.url,
          readyState: state,
          appKey: self._appKey,
          roomServer: self._globals.current.roomServer,
          defaultRoom: self._globals.current.defaultRoom,
          selectedRoom: self._globals.current.selectedRoom,
          serverRegion: self._globals.current.region,
          enableDataChannel: self._globals.current.enableDataChannel,
          enableIceTrickle: self._globals.current.enableIceTrickle,
          enableTURNServer: self._globals.current.enableTURNServer,
          enableSTUNServer: self._globals.current.enableSTUNServer,
          TURNTransport: self._globals.current.TURNServerTransport,
          audioFallback: self._globals.current.audioFallback,
          forceSSL: self._globals.current.forceSSL,
          socketTimeout: self._globals.current.socketTimeout,
          forceTURNSSL: self._globals.current.forceTURNSSL,
          audioCodec: self._globals.current.audioCodec,
          videoCodec: self._globals.current.videoCodec,
          forceTURN: self._globals.current.forceTURN,
          usePublicSTUN: self._globals.current.usePublicSTUN
        });
      }
    }
  };

  log.debug([null, 'Skylink', 'init()', 'Parsing configuration options ->'], options);

  processSetStateFn(self.READY_STATE_CHANGE.INIT);

  /**
   * Parameter: init("appKey")
   */
  if (typeof options === 'string' && !!options) {
    self._globals.current.appKey = options;
    self._globals.current.defaultRoom = options;

  /**
   * Parameter: init({})
   */
  } else if (typeof options === 'object' && !!options) {
    /**
     * Parameter: init({ appKey: xxx })
     */
    if (typeof options.appKey === 'string' && !!options.appKey) {
      self._globals.current.appKey = options.appKey;

    /**
     * Parameter: init({ apiKey: xxx })
     */
    } else if (typeof options.apiKey === 'string' && !!options.apiKey) {
      self._globals.current.appKey = options.apiKey;

    /**
     * Parameter: init({ !appKey })
     */
    } else {
      processSetStateFn(self.READY_STATE_CHANGE.ERROR, {
        errorCode: self.READY_STATE_CHANGE_ERROR.NO_PATH,
        content: new Error('Failed configuration as "appKey" value provided is invalid'),
        status: self.READY_STATE_CHANGE_ERROR_STATUS.NO_REQUEST_MADE
      });
      return;
    }

    /**
     * Parameter: init({ defaultRoom: xxx })
     */
    if (typeof options.defaultRoom === 'string' && !!options.defaultRoom) {
      self._globals.current.defaultRoom = options.defaultRoom;

    } else {
      self._globals.current.defaultRoom = self._globals.current.appKey;
    }

    /**
     * Parameter: init({ roomServer: xxx })
     */
    if (typeof options.roomServer === 'string' && !!options.roomServer) {
      // Prevent invalid API servers provided
      if (!(options.roomServer.length > 3 &&
        options.roomServer.indexOf('//') === 0 &&
        options.roomServer.substring(2, options.roomServer.length).indexOf('/') === -1)) {

        processSetStateFn(self.READY_STATE_CHANGE.ERROR, {
          errorCode: self.READY_STATE_CHANGE_ERROR.NO_PATH,
          content: new Error('Failed configuration as "roomServer" value provided is invalid'),
          status: self.READY_STATE_CHANGE_ERROR_STATUS.NO_REQUEST_MADE
        });
        return;
      }

      self._globals.current.roomServer = options.roomServer;
    }

    /**
     * Parameter: init({ region: xxx })
     */
    if (typeof options.region === 'string' && !!options.region) {
      // Prevent invalid API servers provided
      if (!SkylinkUtils.objectContainsFn(self.REGIONAL_SERVER, options.region)) {
        processSetStateFn(self.READY_STATE_CHANGE.ERROR, {
          errorCode: self.READY_STATE_CHANGE_ERROR.NO_PATH,
          content: new Error('Failed configuration as "region" value provided is invalid'),
          status: self.READY_STATE_CHANGE_ERROR_STATUS.NO_REQUEST_MADE
        });
        return;
      }

      self._globals.current.region = options.region;
    }

    /**
     * Parameter: init({ enableIceTrickle: xxx })
     */
    if (typeof options.enableIceTrickle === 'boolean') {
      self._globals.current.enableIceTrickle = options.enableIceTrickle;
    }

    /**
     * Parameter: init({ enableDataChannel: xxx })
     */
    if (typeof options.enableDataChannel === 'boolean') {
      self._globals.current.enableDataChannel = options.enableDataChannel;
    }

    /**
     * Parameter: init({ enableTURNServer: xxx })
     */
    if (typeof options.enableTURNServer === 'boolean') {
      self._globals.current.enableTURNServer = options.enableTURNServer;
    }

    /**
     * Parameter: init({ enableSTUNServer: xxx })
     */
    if (typeof options.enableSTUNServer === 'boolean') {
      self._globals.current.enableSTUNServer = options.enableSTUNServer;
    }

    /**
     * Parameter: init({ forceTURN: xxx })
     */
    if (typeof options.forceTURN === 'boolean') {
      self._globals.current.forceTURN = options.forceTURN;
    }

    /**
     * Parameter: init({ usePublicSTUN: xxx })
     */
    if (typeof options.usePublicSTUN === 'boolean') {
      self._globals.current.usePublicSTUN = options.usePublicSTUN;
    }

    /**
     * Parameter: init({ TURNServerTransport: xxx })
     */
    if (typeof options.TURNServerTransport === 'string' && !!options.TURNServerTransport) {
      // Prevent invalid TURN ICE server transports provided
      if (!SkylinkUtils.objectContainsFn(self.TURN_TRANSPORT, options.TURNServerTransport)) {
        processSetStateFn(self.READY_STATE_CHANGE.ERROR, {
          errorCode: self.READY_STATE_CHANGE_ERROR.NO_PATH,
          content: new Error('Failed configuration as "TURNServerTransport" value provided is invalid'),
          status: self.READY_STATE_CHANGE_ERROR_STATUS.NO_REQUEST_MADE
        });
        return;
      }

      self._globals.current.TURNServerTransport = options.TURNServerTransport;
    }

    /**
     * Parameter: init({ credentials: {} })
     */
    if (typeof options.credentials === 'object' && !!options.credentials) {

      if (!(typeof options.credentials.startDateTime === 'string' &&
        !window.isNaN((new Date(options.credentials.startDateTime)).getTime()))) {

        processSetStateFn(self.READY_STATE_CHANGE.ERROR, {
          errorCode: self.READY_STATE_CHANGE_ERROR.NO_PATH,
          content: new Error('Failed configuration as "credentials.startDateTime" value provided is invalid'),
          status: self.READY_STATE_CHANGE_ERROR_STATUS.NO_REQUEST_MADE
        });
        return;
      }

      if (!(typeof options.credentials.duration === 'number' && options.credentials.duration > 0)) {
        processSetStateFn(self.READY_STATE_CHANGE.ERROR, {
          errorCode: self.READY_STATE_CHANGE_ERROR.NO_PATH,
          content: new Error('Failed configuration as "credentials.duration" value provided is invalid'),
          status: self.READY_STATE_CHANGE_ERROR_STATUS.NO_REQUEST_MADE
        });
        return;
      }

      if (!(typeof options.credentials.credentials === 'string' && !!options.credentials.credentials)) {
        processSetStateFn(self.READY_STATE_CHANGE.ERROR, {
          errorCode: self.READY_STATE_CHANGE_ERROR.NO_PATH,
          content: new Error('Failed configuration as "credentials.credentials" value provided is invalid'),
          status: self.READY_STATE_CHANGE_ERROR_STATUS.NO_REQUEST_MADE
        });
        return;
      }

      self._globals.current.credentials = {
        startDateTime: options.credentials.startDateTime,
        duration: options.credentials.duration,
        credentials: options.credentials.credentials
      };
    }

    /**
     * Parameter: init({ audioFallback: xxx })
     */
    if (typeof options.audioFallback === 'boolean') {
      self._globals.current.audioFallback = options.audioFallback;
    }

    /**
     * Parameter: init({ forceSSL: xxx })
     */
    if (typeof options.forceSSL === 'boolean' && window.location.protocol !== 'https:') {
      self._globals.current.forceSSL = options.forceSSL;
    }

    /**
     * Parameter: init({ audioCodec: xxx })
     */
    if (typeof options.audioCodec === 'string' && !!options.audioCodec) {
      // Prevent invalid audio codec provided
      if (!SkylinkUtils.objectContainsFn(self.AUDIO_CODEC, options.audioCodec)) {
        processSetStateFn(self.READY_STATE_CHANGE.ERROR, {
          errorCode: self.READY_STATE_CHANGE_ERROR.NO_PATH,
          content: new Error('Failed configuration as "audioCodec" value provided is invalid'),
          status: self.READY_STATE_CHANGE_ERROR_STATUS.NO_REQUEST_MADE
        });
        return;
      }

      self._globals.current.audioCodec = options.audioCodec;
    }

    /**
     * Parameter: init({ videoCodec: xxx })
     */
    if (typeof options.videoCodec === 'string' && !!options.videoCodec) {
      // Prevent invalid video codec provided
      if (!SkylinkUtils.objectContainsFn(self.VIDEO_CODEC, options.videoCodec)) {
        processSetStateFn(self.READY_STATE_CHANGE.ERROR, {
          errorCode: self.READY_STATE_CHANGE_ERROR.NO_PATH,
          content: new Error('Failed configuration as "videoCodec" value provided is invalid'),
          status: self.READY_STATE_CHANGE_ERROR_STATUS.NO_REQUEST_MADE
        });
        return;
      }

      self._globals.current.videoCodec = options.videoCodec;
    }

    /**
     * Parameter: init({ forceTURNSSL: xxx })
     */
    if (typeof options.forceTURNSSL === 'boolean' && window.location.protocol !== 'https:') {
      self._globals.current.forceTURNSSL = options.forceTURNSSL;
    }

  /**
   * Parameter: init(function () {})
   */
  } else {
    if (typeof options === 'function') {
      callback = options;
    }

    processSetStateFn(self.READY_STATE_CHANGE.ERROR, {
      errorCode: self.READY_STATE_CHANGE_ERROR.NO_PATH,
      content: new Error('Failed configuration as "appKey" value is not provided'),
      status: self.READY_STATE_CHANGE_ERROR_STATUS.NO_REQUEST_MADE
    });
    return;
  }


  /**
   * Dependency checks: AdapterJS
   */
  if (!window.AdapterJS) {
    processSetStateFn(self.READY_STATE_CHANGE.ERROR, {
      errorCode: self.READY_STATE_CHANGE_ERROR.ADAPTER_NO_LOADED,
      content: new Error('Failed loading required dependency AdapterJS.\n' +
        'Please load from https://github.com/Temasys/AdapterJS/releases/tag/@@adapterjsVersion'),
      status: self.READY_STATE_CHANGE_ERROR_STATUS.NO_REQUEST_MADE
    });
    return;

  } else if (window.AdapterJS.VERSION !== '@@adapterjsVersion') {
    log.warn([null, 'Skylink', 'init()', 'Dependency AdapterJS is loaded at the wrong version "' +
      window.AdapterJS.VERSION + '".\n' +
      'Please load from https://github.com/Temasys/AdapterJS/releases/tag/@@adapterjsVersion for ' +
      'the correct version']);
  }

  /**
   * Dependency checks: socket.io-client
   */
  if (!window.io) {
    processSetStateFn(self.READY_STATE_CHANGE.ERROR, {
      errorCode: self.READY_STATE_CHANGE_ERROR.NO_SOCKET_IO,
      content: new Error('Failed loading required dependency socket.io-client.\n' +
        'Please load from https://github.com/socketio/socket.io-client/releases/tag/@@socketioVersion'),
      status: self.READY_STATE_CHANGE_ERROR_STATUS.NO_REQUEST_MADE
    });
    return;
  }

  /**
   * Interface checks: XMLHttpRequest
   */
  if (['object', 'function'].indexOf(typeof window.XDomainRequest) && !window.XMLHttpRequest) {
    processSetStateFn(self.READY_STATE_CHANGE.ERROR, {
      errorCode: self.READY_STATE_CHANGE_ERROR.NO_XMLHTTPREQUEST_SUPPORT,
      content: new Error('Failed loading required API XMLHttpRequest. Please switch to a supported browser ' +
        'from https://github.com/Temasys/SkylinkJS#supported-browsers'),
      status: self.READY_STATE_CHANGE_ERROR_STATUS.NO_REQUEST_MADE
    });
    return;
  }

  // Load AdapterJS WebRTC functions
  window.AdapterJS.webRTCReady(function () {
    log.log([null, 'Skylink', 'init()', 'Loaded AdapterJS WebRTC functions']);

    /**
     * Interface checks: XMLHttpRequest
     */
    if (!window.RTCPeerConnection) {
      processSetStateFn(self.READY_STATE_CHANGE.ERROR, {
        errorCode: self.READY_STATE_CHANGE_ERROR.NO_WEBRTC_SUPPORT,
        content: new Error('Failed loading required API RTCPeerConnection. Please switch to a supported browser ' +
          'from https://github.com/Temasys/SkylinkJS#supported-browsers'),
        status: self.READY_STATE_CHANGE_ERROR_STATUS.NO_REQUEST_MADE
      });
      return;
    }

    /**
     * Browser checks: Version is supported?
     */
    if (!(typeof self._supportedBrowsers[self._user.agent.name] === 'number' &&
      self._supportedBrowsers[self._user.agent.name] <= self._user.agent.version)) {

      log.warn([null, 'Skylink', 'init()', 'You are currently using an unsupported browser which may cause ' +
        'connectivity issues later on. Please switch to a supported browser ' +
          'from https://github.com/Temasys/SkylinkJS#supported-browsers']);
    }

    // Configure plugin version
    if (!!window.AdapterJS.WebRTCPlugin && !!window.AdapterJS.WebRTCPlugin.plugin &&
      !!window.AdapterJS.WebRTCPlugin.plugin.VERSION) {

      self._user.agent.pluginVersion = window.AdapterJS.WebRTCPlugin.plugin.VERSION;

      log.info([null, 'Skylink', 'init()', 'You are using Temasys plugin version ->'], self._user.agent.pluginVersion);
    }

    self._globals.current.selectedRoom = self._globals.current.defaultRoom;

    log.debug([null, 'Skylink', 'init()', 'Starting connection session with configuration ->'], self._globals.current);


    processSetStateFn(self.READY_STATE_CHANGE.LOADING);

    // Start HTTP request to API server
    SkylinkAPI.requestFn(self._globals.current, function (state, data) {
      if (state === 'request') {
        log.debug([null, 'Skylink', 'init()', 'Starting connection session request to HTTP URL ->'], data);

        self._session.url = data;

      } else if (state === 'started') {
        log.info([null, 'Skylink', 'init()', 'Started connection session successfully ->'], data);

        self._session.data = data;

        processSetStateFn(self.READY_STATE_CHANGE.COMPLETED);

      } else if (state === 'error') {
        log.error([null, 'Skylink', 'init()', 'Failed starting connection session ->'], data);

        processSetStateFn(self.READY_STATE_CHANGE.ERROR, data);

      } else if (state === 'restart') {
        log.debug([null, 'Skylink', 'init()', 'Retrying starting connection session attempt ->'], data);
      }
    });

  });
};
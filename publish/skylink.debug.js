/*! skylinkjs - v0.7.0 - Wed Apr 27 2016 03:55:17 GMT+0800 (SGT) */

var logFn = function (method) {
  return function (logArray, logParam) {
    var ts = (new Date()),
        tsLog = ts.getFullYear().toString() + '.' +
                (ts.getMonth() + 1).toString() + '.' +
                ts.getDate().toString() + '.' +
                ts.getHours().toString() + ':' +
                ts.getMinutes().toString() + ':' +
                ts.getSeconds().toString() + ':' +
                ts.getMilliseconds().toString(),
        log = 'SkylinkJS [' + method.toUpperCase() + '] [@' + tsLog + '] ';

    if (logArray[1] === 'Skylink' && logArray[2]) {
      log += ':: ' + logArray[2] + ' ';

      if (logArray[0]) {
        if (Array.isArray(logArray[0])) {
          log += '-> (peerIds: [' + logArray[0].join(',') + ']) ';
        } else {
          log += '-> (peerId: ' + logArray[0] + ') ';
        }
      }

      log += '- ';

    } else {
      log += '- ';

      if (logArray[0]) {
        log += '[' + logArray[0] + '] ';
      }

      if (logArray[1]) {
        log += '<<' + logArray[1] + '>> ';
      }

      if (logArray[2]) {
        log += '(' + logArray[2] + ') ';
      }
    }

    log += logArray[3];

    if (typeof logParam !== 'undefined') {
      console[method](log, logParam);
    } else {
      console[method](log);
    }
  };
};

var log = {
  debug: logFn('debug'),
  log: logFn('log'),
  info: logFn('info'),
  warn: logFn('warn'),
  error: logFn('error')
};

/**
 * Module that handles logging.
 * @class Logger
 * @private
 * @for Skylink
 * @since 0.7.0
 */
var Logger = {
  // Stores the flags
  _flags: {
    // The current log level of Skylink.
    level: 0,

    // If trace is even needed
    trace: false,

    // The flag that indicates if Skylink should store the debug logs.
    store: true
  },

  // The header name that appears before every log
  _header: 'SkylinkJS',

  // Stores all the logs
  _storage: {
    debug: [],
    log: [],
    info: [],
    warn: [],
    error: []
  },

  // Stores the console methods
  _loggers: {},

  // Binds
  _appendLoggers: function () {
    var self = this;
    var templates = {
      debug: { template: '[DEBUG] :: ', fn: function () {} },
      log: { template: '[LOG  ] :: ', fn: function () {} },
      info: { template: '[INFO ] :: ', fn: function () {} },
      warn: { template: '[WARN ] :: ', fn: function () {} },
      error: { template: '[ERROR] :: ', fn: function () {} }
    };

    // Configure available consoles
    var consoleCopy = {};
    // Configure console.log copy
    consoleCopy.log = typeof console.log === 'function' ? window.console.log : function () {};
    // Point to console.debug function
    consoleCopy.debug = typeof console.debug === 'function' ? window.console.debug : consoleCopy.log;
    // Point to console.info function
    consoleCopy.info = typeof console.info === 'function' ? window.console.info : consoleCopy.log;
    // Point to console.warn function
    consoleCopy.warn = typeof console.warn === 'function' ? window.console.warn : consoleCopy.log;
    // Point to console.error function
    consoleCopy.error = typeof console.error === 'function' ? window.console.error : consoleCopy.log;
    // Point to console.trace function
    consoleCopy.trace = typeof console.trace === 'function' ? window.console.trace : consoleCopy.log;

    // Internal binding of console method
    var bind = function (m, displayConsole) {
      return function () {
        // Get the arguments
        var args = Array.prototype.slice.call(arguments);
        // Store the data
        if (self._flags.store) {
          self._storage[m].push([(new Date()).toISOString(), args]);
        }
        if (displayConsole) {
          var mn = m;
          var mt = '';
          // Preset to trace for that method
          if (self._flags.trace) {
            mn = 'trace';
            mt = '[' + m.toUpperCase() + '] :: ';
          }
          /*return Function.prototype.apply(
            consoleCopy[mn].bind(window.console, mt + self._header), this, arguments);*/
          return consoleCopy[mn].bind(window.console, mt + self._header);
        }
        return function () {};
      };
    };

    // Configure current loggers
    this._loggers = {};
    // Configure console.log, console.debug, console.info, console.warn and console.error defaults
    this._loggers.debug = bind('debug', false);
    this._loggers.log = bind('log', false);
    this._loggers.info = bind('info', false);
    this._loggers.warn = bind('warn', false);
    this._loggers.error = bind('error', false);



    // Configure the correct loggers based off the method
    switch (this._flags.level) {
      case 5:
        this._loggers.debug = bind('debug', true);
        /* falls through */
      case 4:
        this._loggers.log = bind('log', true);
        /* falls through */
      case 3:
        this._loggers.info = bind('info', true);
        /* falls through */
      case 2:
        this._loggers.warn = bind('warn', true);
        /* falls through */
      case 1:
        this._loggers.error = bind('error', true);
    }
  },

  // Appends the window console or else ignores based off level
  configure: function (options) {
    // Configure the flags and settings
    // [options === number]
    if (typeof options === 'number' && options > -1 && options < 6) {
      this._flags.level = options;
    // [options === {}]
    } else if (typeof options === 'object' && options !== null) {
      // Configure the level
      if (typeof options.level === 'number' && options.level > -1 && options.level < 6) {
        this._flags.level = options.level;
      }
      // Configure the trace
      if (typeof options.trace === 'boolean') {
        this._flags.trace = options.trace;
      }
      // Configure the store
      if (typeof options.store === 'boolean') {
        this._flags.store = options.store;
      }
    }

    // Bind the console methods
    this._appendLoggers();
  },

  // Mixin method for components to subscribe loggers to
  mixin: function (d, obj) {
    var self = this;
    var fn = function (type) {
      return function () {
        // Get logger parameters
        var args = Array.prototype.slice.call(arguments);
        // Extra params
        var data = d();
        for (var i = data.length; i > 0; i--) {
          args.splice(0, 0, data[i - 1]);
        }
        self._loggers[type].apply(this,args).apply(this,args);
        /*return function (cb) {
          return cb(self._loggers[type].apply(this,args), args);
        };*/
      };
    };
    obj._log = {
      debug: fn('debug'),
      log: fn('log'),
      info: fn('info'),
      warn: fn('warn'),
      error: fn('error')
    };
  }
};

Logger.configure();
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
Skylink.prototype.AUDIO_CODEC = {
  AUTO: 'auto',
  ISAC: 'ISAC',
  OPUS: 'opus',
  SILK: 'SILK',
  ILBC: 'iLBC',
  G722: 'G722',
  G711: 'G711'
};

/**
 * Contains the list of ICE gathering states of a Peer connection.
 * @attribute CANDIDATE_GENERATION_STATE
 * @param {String} NEW <small>Value <code>"new"</code></small>
 *   The state at the beginning before any ICE gathering.
 * @param {String} GATHERING <small>Value <code>"gathering"</code></small>
 *   The state when ICE gathering has started.
 * @param {String} COMPLETED <small>Value <code>"completed"</code></small>
 *   The state when ICE gathering has completed.
 * @link <a href="#x">What is ICE and how it works</a>
 * @type JSON
 * @readOnly
 * @for Skylink
 * @since 0.7.0
 */
Skylink.prototype.CANDIDATE_GENERATION_STATE = {
  NEW: 'new',
  GATHERING: 'gathering',
  COMPLETED: 'completed'
};

/**
 * Contains the list of Datachannel connection states.
 * @attribute DATA_CHANNEL_STATE
 * @param {String} CONNECTING <small>Value <code>"connecting"</code></small>
 *   The state when the Datachannel is attempting to open a connection.
 * @param {String} OPEN <small>Value <code>"open"</code></small>
 *   The state when the Datachannel connection has opened.
 * @param {String} CLOSING <small>Value <code>"closing"</code></small>
 *   The state when the Datachannel connection is closing.<br>
 *   This happens when a Peer has closed the Datachannel connection explicitly.
 * @param {String} CLOSED <small>Value <code>"closed"</code></small>
 *   The state when the Datachannel connection has closed.
 * @param {String} ERROR <small>Value <code>"error"</code></small>
 *   The state when the Datachannel connection has encountered an error.
 * @type JSON
 * @readOnly
 * @for Skylink
 * @since 0.7.0
 */
Skylink.prototype.DATA_CHANNEL_STATE = {
  CONNECTING: 'connecting',
  OPEN: 'open',
  CLOSING: 'closing',
  CLOSED: 'closed',
  ERROR: 'error'
};

/**
 * Contains the list of Datachannel types.
 * @attribute DATA_CHANNEL_TYPE
 * @param {String} MESSAGING <small><b>DEFAULT</b> | Value <code>"messaging"</code></small>
 *   <blockquote class="panel-info">If <a href="#method_init"><u><code>init()</code> method</u></a>
 *     <code>enableDataChannel</code> option is enabled for both Peers, there is
 *     only one of this Datachannel type that can occur in the connection</blockquote>
 *   The type where the Datachannel connection is primarily used for sending P2P messages.<br>
 *   This connection is persistent until the Peer connection of the Datachannel is closed,
 *     and can be used for data transfers when simultaneous transfers is not supported with
 *     the connecting Peer connection.
 * @param {String} DATA <small>Value <code>"data"</code></small>
 *   The type where the Datachannel connection is only used for data transfers.<br>
 *   This connection is closed once the data transfer has completed or terminated.
 * @readOnly
 * @type JSON
 * @for Skylink
 * @since 0.7.0
 */
Skylink.prototype.DATA_CHANNEL_TYPE = {
  MESSAGING: 'messaging',
  DATA: 'data'
};

/**
 * Contains the list of data transfer data types.
 * @attribute DATA_TRANSFER_DATA_TYPE
 * @param {String} BINARY_STRING <small>Value <code>"binaryString"</code></small>
 *   The data type where binary data packets are converted to string over
 *   the Datachannel connection for <kbd>Blob</kbd> data transfers.
 *   [Rel: Skylink.attr.DATA_TRANSFER_SESSION_TYPE]
 * @param {String} BINARY <small>Value <code>"binary"</code></small>
 *   The option to transfer binary data packets without conversion over
 *   the Datachannel connection for <kbd>Blob</kbd> data transfers.
 *   [Rel: Skylink.attr.DATA_TRANSFER_SESSION_TYPE]
 * @param {String} STRING <small>Value <code>"string"</code></small>
 *   The option to transfer string data over Datachannel connection for <kbd>Data URL</kbd> data transfers.
 *   [Rel: Skylink.attr.DATA_TRANSFER_SESSION_TYPE]
 * @readOnly
 * @type JSON
 * @for Skylink
 * @since 0.7.0
 */
Skylink.prototype.DATA_TRANSFER_DATA_TYPE = {
  BINARY_STRING: 'binaryString',
  BINARY: 'binary',
  STRING: 'string'
};

/**
 * <blockquote class="panel-warning">
 *   Note that for the next releases, this constant will be renamed as <code>DATA_TRANSFER_TYPE</code>.
 * </blockquote>
 * Contains the list of data transfers transfer types.
 * @attribute DATA_TRANSFER_SESSION_TYPE
 * @param {String} BLOB <small>Value <code>"blob"</code></small>
 *   The type of data transfer where it is transferring a Blob data.
 *   [Rel: Skylink.method.sendBlobData]
 * @param {String} DATAURL <small>Value <code>"dataURL"</code></small>
 *   The type of data transfer where it is transferring a DataURL string.
 *   [Rel: Skylink.method.sendURLData]
 * @type JSON
 * @readOnly
 * @for Skylink
 * @since 0.7.0
 */
Skylink.prototype.DATA_TRANSFER_SESSION_TYPE = {
  BLOB: 'blob',
  DATAURL: 'dataURL'
};

/**
 * Contains the list of data transfer states.
 * @attribute DATA_TRANSFER_STATE
 * @param {String} UPLOAD_REQUEST <small>Value <code>"request"</code></small>
 *   The state when request to start a downloading data transfer is received.
 *   [Rel: Skylink.method.acceptDataTransfer]
 * @param {String} UPLOAD_STARTED <small>Value <code>"uploadStarted"</code></small>
 *   The state when uploading data transfer has started.
 * @param {String} DOWNLOAD_STARTED <small>Value <code>"downloadStarted"</code></small>
 *   The state when downloading data transfer has started.
 * @param {String} REJECTED <small>Value <code>"rejected"</code></small>
 *   The state when downloading data transfer request is rejected.
 * @param {String} UPLOADING <small>Value <code>"uploading"</code></small>
 *   The state when uploading data transfer is in-progress.
 * @param {String} DOWNLOADING <small>Value <code>"downloading"</code></small>
 *   The state when downloading data transfer is in-progress.
 * @param {String} UPLOAD_COMPLETED <small>Value <code>"uploadCompleted"</code></small>
 *   The state when uploading data transfer has completed.
 * @param {String} DOWNLOAD_COMPLETED <small>Value <code>"downloadCompleted"</code></small>
 *   The state when downloading data transfer has completed.
 * @param {String} CANCEL <small>Value <code>"cancel"</code></small>
 *   The state when data transfer has been cancelled and is terminated.
 *   [Rel: Skylink.method.cancelDataTransfer]
 * @param {String} ERROR <small>Value <code>"error"</code></small>
 *   The state when data transfer has failed with errors and is terminated.
 * @type JSON
 * @readOnly
 * @for Skylink
 * @since 0.7.0
 */
Skylink.prototype.DATA_TRANSFER_STATE = {
  UPLOAD_REQUEST: 'request',
  UPLOAD_STARTED: 'uploadStarted',
  DOWNLOAD_STARTED: 'downloadStarted',
  REJECTED: 'rejected',
  CANCEL: 'cancel',
  ERROR: 'error',
  UPLOADING: 'uploading',
  DOWNLOADING: 'downloading',
  UPLOAD_COMPLETED: 'uploadCompleted',
  DOWNLOAD_COMPLETED: 'downloadCompleted'
};

/**
 * <blockquote class="panel-warning">
 *   Note that for the next releases, this constant will be renamed as <code>DATA_TRANSFER_DIRECTION</code>
 *   before removal in the next releases.
 * </blockquote>
 * Contains the list of data transfer directions.
 * @attribute DATA_TRANSFER_TYPE
 * @param {String} UPLOAD <small>Value <code>"upload"</code></small>
 *   The type of data transfer direction where it is uploading to Peer.
 * @param {String} DOWNLOAD <small>Value <code>"download"</code></small>
 *   The type of data transfer direction where is downloading from Peer.
 * @type JSON
 * @readOnly
 * @deprecated
 * @for Skylink
 * @since 0.7.0
 */
Skylink.prototype.DATA_TRANSFER_TYPE = {
  UPLOAD: 'upload',
  DOWNLOAD: 'download'
};

/**
 * Contains the current DT Protocol version of SkylinkJS.<br>
 * <blockquote class="sub">Current version: <code>0.1.0</code></blockquote>
 * @attribute DT_PROTOCOL_VERSION
 * @type String
 * @readOnly
 * @for Skylink
 * @since 0.7.0
 */
Skylink.prototype.DT_PROTOCOL_VERSION = '0.1.0';

/**
 * Contains the list of <a href="#method_getPeers"><u><code>getPeers()</code> method</u></a> retrieval states.
 * @attribute GET_PEERS_STATE
 * @type JSON
 * @param {String} ENQUIRED <small>Value <code>"enquired"</code></small>
 *   The state when SDK is attempting to retrieve the list of Peers and Rooms.
 * @param {String} RECEIVED <small>Value <code>"received"</code></small>
 *   The state when SDK has retrieved the list of Peers and Rooms successfully.
 * @param {String} ERROR <small>Value <code>"error"</code></small>
 *   The state when SDK has failed retrieving the list of Peers and Rooms.
 * @link <a href="http://support.temasys.com.sg">What is the Privileged Key feature and how to utilise it</a>
 * @readOnly
 * @for Skylink
 * @since 0.7.0
 */
Skylink.prototype.GET_PEERS_STATE = {
  ENQUIRED: 'enquired',
  RECEIVED: 'received'
};

/**
 * Contains the list of connection handshaking states of a Peer connection.
 * @attribute HANDSHAKE_PROGRESS
 * @param {String} ENTER <small>Value <code>"enter"</code></small>
 *   The state when Peer has just entered the Room.<br>
 *   As a response, <code>WELCOME</code> will be sent to notify of user existence.
 * @param {String} WELCOME <small>Value <code>"welcome"</code></small>
 *   The state when user is notified of Peer that is already in the Room.<br>
 *   As a response, <code>OFFER</code> will be sent to initiate connection handshaking.
 * @param {String} OFFER <small>Value <code>"offer"</code></small>
 *   The state when connection handshaking has been initiated.<br>
 *   As a response, <code>ANSWER</code> will be sent to complete the connection handshaking.
 *   [Rel: Skylink.attr.PEER_CONNECTION_STATE]
 * @param {String} ANSWER <small>Value <code>"answer"</code></small>
 *   The state when connection handshaking has been completed.
 *   [Rel: Skylink.attr.PEER_CONNECTION_STATE]
 * @param {String} ERROR <small>Value <code>"error"</code></small>
 *   The state when connection handshaking has encountered an error.
 *   [Rel: Skylink.attr.PEER_CONNECTION_STATE]
 * @type JSON
 * @readOnly
 * @for Skylink
 * @since 0.7.0
 */
Skylink.prototype.HANDSHAKE_PROGRESS = {
  ENTER: 'enter',
  WELCOME: 'welcome',
  OFFER: 'offer',
  ANSWER: 'answer',
  ERROR: 'error'
};

/**
 * Contains the list of ICE connection states of a Peer connection.
 * @attribute ICE_CONNECTION_STATE
 * @param {String} STARTING <small>Value <code>"starting"</code></small>
 *   The state when ICE agent is waiting for remote candidates supplied
 *   from ICE gathering from Peer.
 * @param {String} CHECKING <small>Value <code>"checking"</code></small>
 *   The state when ICE agent has received the remote candidates from Peer
 *   and is checking for a usable candidate pair to start ICE connection.
 * @param {String} CONNECTED <small>Value <code>"connected"</code></small>
 *   The state when ICE agent has found a usable connection but still
 *   checking if there is a better candidate pair for better ICE connection.<br>
 *   At this stage, ICE connection is already established and may not necessarily
 *   go to <code>COMPLETED</code>.
 * @param {String} COMPLETED <small>Value <code>"completed"</code></small>
 *   The state when ICE agent has finished checking for the best candidate pairs
 *   for the best ICE connection.<br>
 *   At this stage, ICE connection is has been already established.
 * @param {String} FAILED <small>Value <code>"failed"</code></small>
 *   The state when ICE agent had failed to find a ICE connection from all candidate pairs.
 * @param {String} DISCONNECTED <small>Value <code>"disconnected"</code></small>
 *   The state when ICE agent connection is disconnected abruptly and may happen on
 *   a flaky network.
 * @param {String} CLOSED <small>Value <code>"closed"</code></small>
 *   The state when ICE agent connection is closed and is no longer responding to any STUN requests.
 * @param {String} TRICKLE_FAILED <small>Value <code>"trickeFailed"</code></small>
 *   The state when after ICE agent connection state had gone to <code>FAILED</code> and
 *   <a href="#method_init"><code><u>init()</code> method</u></a> <code>enableIceTrickle</code> option is enabled.
 * @readOnly
 * @type JSON
 * @for Skylink
 * @since 0.7.0
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
 * Contains the list of <a href="#method_introducePeer"><u><code>introducePeer()</code> method</u></a>
 *   introduction states.
 * @attribute INTRODUCE_STATE
 * @param {String} INTRODUCING <small>Value <code>"introducing"</code></small>
 *   The state when the SDK is attempting to introduce the Peer (Sender) to Peer (Receiver).
 * @param {String} INTRODUCED <small>Value <code>"introduced"</code></small>
 *   The state when the SDK has introduced Peer (Sender) to Peer (Receiver) successfully.
 * @param {String} ERROR <small>Value <code>"error"</code></small>
 *   The state when the SDK had failed to introduce Peer (Sender) to Peer (Receiver).
 * @link <a href="http://support.temasys.com.sg">What is the Privileged Key feature and how to utilise it</a>
 * @type JSON
 * @readOnly
 * @for Skylink
 * @since 0.7.0
 */
Skylink.prototype.INTRODUCE_STATE = {
  INTRODUCING: 'introducing',
  INTRODUCED: 'introduced',
  ERROR: 'error'
};

/**
 * Contains the list of SDK log levels.
 * @attribute LOG_LEVEL
 * @param {Number} DEBUG <small>Value <code>4</code></small>
 *   The option to display additional logs for more code execution debugging state purposes.
 *   <small>LOG OUTPUTS<br>
 *   <code>DEBUG</code>, <code>LOG</code>, <code>INFO</code>, <code>WARN</code>, <code>ERROR</code></small>
 * @param {Number} LOG <small>Value <code>3</code> | Level higher than <code>INFO</code></small>
 *   The option to display additional logs for code execution state purposes.
 *   <small>LOG OUTPUTS<br>
 *   <code>LOG</code>, <code>INFO</code>, <code>WARN</code>, <code>ERROR</code></small>
 * @param {Number} INFO <small>Value <code>2</code></small>
 *   The option to display additional logs that are informative purposes.
 *   <small>LOG OUTPUTS<br>
 *   <code>INFO</code>, <code>WARN</code>, <code>ERROR</code></small>
 * @param {Number} WARN <small>Value <code>1</code></small>
 *   The option to display additional logs warning the user.
 *   <small>LOG OUTPUTS<br>
 *   <code>WARN</code>, <code>ERROR</code></small>
 * @param {Number} ERROR <small><b>DEFAULT</b> | Value <code>0</code></small>
 *   The option to display error logs.
 *   <small>LOG OUTPUTS<br>
 *   <code>ERROR</code></small>
 * @param {Number} NO_LOGS <small>Value <code>-1</code></small>
 *   The option to display no logs.
 *   <small>LOG OUTPUTS<br>
 *   <span>NONE</span></small>
 * @readOnly
 * @type JSON
 * @for Skylink
 * @since 0.7.0
 */
Skylink.prototype.LOG_LEVEL = {
  DEBUG: 4,
  LOG: 3,
  INFO: 2,
  WARN: 1,
  ERROR: 0,
  NO_LOGS: -1
};

/**
 * Contains the list of signaling states of a Peer connection.
 * @attribute PEER_CONNECTION_STATE
 * @param {String} STABLE <small>Value <code>"stable"</code></small>
 *   The state when there is currently no <code>OFFER</code> or <code>ANSWER</code> exchanged.
 * @param {String} HAVE_LOCAL_OFFER <small>Value <code>"have-local-offer"</code></small>
 *   The state when there is a local <code>OFFER</code> sent to Peer.<br>
 *   After receiving remote <code>ANSWER</code>, the state will go to <code>STABLE</code>.
 * @param {String} HAVE_REMOTE_OFFER <small>Value <code>"have-remote-offer"</code></small>
 *   The state when there is a remote <code>OFFER</code> received from Peer.<br>
 *   After sending local <code>ANSWER</code>, the state will go to <code>STABLE</code>.
 * @param {String} CLOSED <small>Value <code>"closed"</code></small>
 *   The state when signaling is closed and there is no
 *   <code>OFFER</code> or <code>ANSWER</code> exchanged anymore.
 * @param {String} ERROR <small>Value <code>"error"</code></small>
 *   The state when setting local / remote <code>OFFER</code> or <code>ANSWER</code> fails and
 *   might cause a failure in establishing Peer connection.
 * @type JSON
 * @readOnly
 * @for Skylink
 * @since 0.7.0
 */
Skylink.prototype.PEER_CONNECTION_STATE = {
  STABLE: 'stable',
  HAVE_LOCAL_OFFER: 'have-local-offer',
  HAVE_REMOTE_OFFER: 'have-remote-offer',
  CLOSED: 'closed',
  ERROR: 'error'
};

/**
 * Contains the list of <a href="#method_init"><u><code>init()</code> method</u></a>
 *   SDK initialization ready states.
 * @attribute READY_STATE_CHANGE
 * @param {Number} INIT <small>Value <code>0</code></small>
 *   The state when the SDK is initializing <code>init()</code> configuration settings.
 * @param {Number} LOADING <small>Value <code>1</code></small>
 *   The state when the SDK is attempting to start connection session.
 * @param {Number} COMPLETED <small>Value <code>2</code></small>
 *   The state when the SDK connection session has been state.
 * @param {Number} ERROR <small>Value <code>-1</code></small>
 *   The state when the SDK has failed initializing <code>init()</code> configuration settings
 *   or failed starting connection session.
 *   [Rel: Skylink.attr.READY_STATE_CHANGE_ERROR]
 * @type JSON
 * @readOnly
 * @for Skylink
 * @since 0.7.0
 */
Skylink.prototype.READY_STATE_CHANGE = {
  INIT: 0,
  LOADING: 1,
  COMPLETED: 2,
  ERROR: -1
};

/**
 * <blockquote class="panel-warning">
 *   Note that for the next releases, the Keys and Values will change for a more
 *   descriptive term.
 * </blockquote>
 * Contains the list of <a href="#method_init"><u><code>init()</code> method</u></a>
 *   SDK initialization errors.
 * @attribute READY_STATE_CHANGE_ERROR
 * @param {Number} API_INVALID <small>Value <code>4001</code></small>
 *   The error when provided Application Key is does not exists.
 *   <small>Resolve this by finding if Application Key exists in your
 *     <a href="https://developer.temasys.com.sg">Skylink Developer Account</a>.</small>
 * @param {Number} API_DOMAIN_NOT_MATCH <small>Value <code>4002</code></small>
 *   The error when accessing backend IP address does not match Application Key configured <var>domain</var>.
 *   <small>Resolve this by seeking support in
 *     <a href="http://support.temasys.com.sg">Temasys Support Portal</a>.</small>
 * @param {Number} API_CORS_DOMAIN_NOT_MATCH <small>Value <code>4003</code></small>
 *   The error when accessing CORS domain does not match Application Key configured <var>corsurl</var>.
 *   <small>Resolve this by configuring your Application Key <u>CORS Url</u> correctly in your
 *     <a href="https://developer.temasys.com.sg">Skylink Developer Account</a>.</small>
 * @param {Number} API_CREDENTIALS_INVALID <small>Value <code>4004</code></small>
 *   The error when credentials provided for Application Key is invalid.
 *   <small>Resolve this by checking if credentials are generated correctly, or <u>Secret</u> used for
 *      generating credentials is correct. See <a href="#method_init"><u><code>init()</code> method</u></a>
 *      on how to generate the credentials.</small>
 * @param {Number} API_CREDENTIALS_NOT_MATCH <small>Value <code>4005</code></small>
 *   The error when credentials provided for Application Key does not match provided <code>duration</code>
 *      and <code>startDate</code> in generated credentials.
 *   <small>Resolve this by checking if credentials are generated correctly.
 *      See <a href="#method_init"><u><code>init()</code> method</u></a> on how to generate the credentials.</small>
 * @param {Number} API_INVALID_PARENT_KEY <small>Value <code>4006</code></small>
 *   The error when provided Application Key has an invalid <var>parent</var> field value.
 *   <small>Resolve this by providing another Application Key. You may check if it's valid by
 *     accessing your <a href="https://developer.temasys.com.sg">Skylink Developer Account</a>
 *     and use any Application Keys from the displayed list of Application Keys.</small>
 * @param {Number} API_NO_MEETING_RECORD_FOUND <small>Value <code>4010</code></small>
 *   The error when provided Persistent Room enabled key does not have any meeting records that matches
 *   the credentials provided in <a href="#method_init"><u><code>init()</code> method</u></a>.
 *   <small>See <a href="#article">Persistent Rooms and how it works</a>.</small>
 * @param {Number} NO_SOCKET_IO <small>Value <code>1</code></small>
 *   The error when there is no <kbd>socket.io-client</kbd> dependency loaded before the SDK.
 *   <small>Resolve this by loading the dependency based on the correct versions following
 *     <a href="https://github.com/Temasys/SkylinkJS/releases">SkylinkJS release versions</a>.</small>
 * @param {Number} NO_XMLHTTPREQUEST_SUPPORT <small>Value <code>2</code></small>
 *   The error when there is no <kbd>XMLHttpRequest</kbd> API interface supported in the browser.
 *   <small>Resolve this by switching to one of our
 *     <a href="https://github.com/Temasys/SkylinkJS#supported-browsers">supported browsers list</a>.</small>
 * @param {Number} NO_WEBRTC_SUPPORT <small>Value <code>3</code></small>
 *   The error when there is no <kbd>RTCPeerConnection</kbd> API interface supported in the browser,
 *   which the <a href="https://plugin.temasys.com.sg">Temasys Plugin</a> does not support and is not
 *   installed in the browser.
 *   <small>Resolve this by switching to one of our
 *     <a href="https://github.com/Temasys/SkylinkJS#supported-browsers">supported browsers list</a>,
 *     or if browser is Safari or IE in our supported browsers list, prompt users to install the Temasys Plugin.</small>
 * @param {Number} NO_PATH <small>Value <code>4</code></small>
 *   The error when invalid <a href="#method_init"><u><code>init()</code> method</u></a> options are provided.
 *   <small>Resolve this by ensuring correct <code>init()</code> method options are provided.</small>
 * @param {Number} ADAPTER_NO_LOADED <small>Value <code>7</code></small>
 *   The error when there is no <kbd>adapterjs</kbd> dependency loaded before the SDK.
 *   <small>Resolve this by loading the dependency based on the correct versions following
 *     <a href="https://github.com/Temasys/SkylinkJS/releases">SkylinkJS release versions</a>.</small>
 * @param {Number} XML_HTTP_REQUEST_ERROR <small>Value <code>-1</code></small>
 *   The error when there is no response from server when requesting to start connection session.
 *   <small>Resolve this by diagnosing network connections or refreshing the page. You may
 *     report this to <a href="http://support.temasys.com.sg">Temasys Support Portal</a>
 *     if both solutions does not work.</small>
 * @type JSON
 * @readOnly
 * @for Skylink
 * @since 0.7.0
 */
Skylink.prototype.READY_STATE_CHANGE_ERROR = {
  API_INVALID: 4001,
  API_DOMAIN_NOT_MATCH: 4002,
  API_CORS_DOMAIN_NOT_MATCH: 4003,
  API_CREDENTIALS_INVALID: 4004,
  API_CREDENTIALS_NOT_MATCH: 4005,
  API_INVALID_PARENT_KEY: 4006,
  API_NO_MEETING_RECORD_FOUND: 4010,
  XML_HTTP_REQUEST_ERROR: -1,
  NO_SOCKET_IO: 1,
  NO_XMLHTTPREQUEST_SUPPORT: 2,
  NO_WEBRTC_SUPPORT: 3,
  NO_PATH: 4,
  ADAPTER_NO_LOADED: 7
};

/**
 * Contains the list of <a href="#method_init"><u><code>init()</code> method</u></a>
 *   SDK initialization errors current HTTP request status.
 * @attribute READY_STATE_CHANGE_ERROR_STATUS
 * @param {Number} NO_REQUEST_MADE <small>Value <code>-2</code></small>
 *   The status error when no HTTP request has been made due to invalid configuration passed in
 *   <a href="#method_init"><u><code>init()</code> method</u></a>.
 * @param {Number} REQUEST_ERROR <small>Value <code>-1</code></small>
 *   The status error when HTTP request had failed due to request errors.
 * @param {Number} REQUEST_EMPTY_RESULT <small>Value <code>0</code></small>
 *   The status error when HTTP request returns an empty response.
 * @param {Number} REQUEST_FAILED <small>Value <code>200</code></small>
 *   The status error when HTTP request returns a response but authentication to start
 *     connection session fails.
 * @type JSON
 * @readOnly
 * @for Skylink
 * @since 0.7.0
 */
Skylink.prototype.READY_STATE_CHANGE_ERROR_STATUS = {
  NO_REQUEST_MADE: -2,
  REQUEST_ERROR: -1,
  REQUEST_EMPTY_RESULT: 0,
  REQUEST_FAILED: 200
};

/**
 * <div class="panel-warning">
 *   Note that configurating the regional server is no longer required as the automatic
 *   selection for the nearest regional server is implemented based on load and latency.
 *   Hence, this has been deprecated and will be removed in the next releases.
 * </div>
 * Contains the list of regional server that the SDK can use to connect to.
 * @attribute REGIONAL_SERVER
 * @param {String} APAC1 <small>Value <code>"sg"</code></small>
 *   The option to connect to the Asia pacific 1 regional server.
 * @param {String} US1 <small>Value <code>"us2"</code></small>
 *   The option to connect to the US 1 regional server.
 * @type JSON
 * @readOnly
 * @deprecated
 * @for Skylink
 * @since 0.7.0
 */
Skylink.prototype.REGIONAL_SERVER = {
  APAC1: 'sg',
  US1: 'us2'
};

/**
 * Contains the list of connecting server Peer types.
 * @attribute SERVER_PEER_TYPE
 * @param {String} MCU <small>Value <code>"mcu"</code></small>
 *   The type that indicates connecting server Peer is <kbd>MCU</kbd>.
 *   <small>See: <a href="#">What is MCU and how it works</a></small>
 * @type JSON
 * @readOnly
 * @for Skylink
 * @since 0.7.0
 */
Skylink.prototype.SERVER_PEER_TYPE = {
  MCU: 'mcu'
  //SIP: 'sip'
};

/**
 * Contains the current SM Protocol version of SkylinkJS.
 * <blockquote class="sub">Current version: <code>0.1.1</code></blockquote>
 * @attribute SM_PROTOCOL_VERSION
 * @type String
 * @readOnly
 * @for Skylink
 * @since 0.7.0
 */
Skylink.prototype.SM_PROTOCOL_VERSION = '0.1.1';

/**
 * Contains the list of Room socket connection error states.
 * @attribute SOCKET_ERROR
 * @param {Number} CONNECTION_FAILED <small>Value <code>0</code></small>
 *   The error state when socket has failed connecting in the first attempt.
 * @param {String} RECONNECTION_FAILED <small>Value <code>-1</code></small>
 *   The error state when socket has failed reconnecting.
 * @param {String} CONNECTION_ABORTED <small>Value <code>-2</code></small>
 *   The error state when socket has aborted reconnections after
 *   the first attempt failure in <code>CONNECTION FAILED</code>.
 * @param {String} RECONNECTION_ABORTED <small>Value <code>-3</code></small>
 *   The error state when socket has aborted reconnections after
 *   several attempts failures in <code>RECONNECTION_FAILED</code>.
 * @param {String} RECONNECTION_ATTEMPT <small>Value <code>-4</code></small>
 *   The state when socket is attempting to reconnect to establish a succesful connection.
 * @type JSON
 * @readOnly
 * @for Skylink
 * @since 0.7.0
 */
Skylink.prototype.SOCKET_ERROR = {
  CONNECTION_FAILED: 0,
  RECONNECTION_FAILED: -1,
  CONNECTION_ABORTED: -2,
  RECONNECTION_ABORTED: -3,
  RECONNECTION_ATTEMPT: -4
};

/**
 * <blockquote class="panel-warning">
 *   Note that for the next releases, the Keys and Values will change for a more
 *   descriptive term.
 * </blockquote>
 * Contains the list of Room socket fallback states for a successful reconnection.
 * @attribute SOCKET_FALLBACK
 * @param {String} NON_FALLBACK <small>Value <code>"nonfallback"</code></small>
 *   <blockquote class="panel-info">This has been deprecated and will be eventually be removed
 *      or changed into other seperate states in next releases.</blockquote>
 *   The state when socket is attempting to reconnect the first port and transports used that had failed.
 *   <blockquote class="sub">Protocol: <code>http:</code>, <code>https:</code><br>
 *      Transports: <code>WebSocket</code>, <code>Polling</code></blockquote>
 * @param {String} FALLBACK_PORT <small>Value <code>"fallbackPortNonSSL"</code></small>
 *   The state when socket is attempting to reconnect the next available fallback port.
 *   <blockquote class="sub">Protocol: <code>http:</code><br>Transports: <code>WebSocket</code></blockquote>
 * @param {String} FALLBACK_PORT_SSL <small>Value <code>"fallbackPortSSL"</code></small>
 *   The state when socket is attempting to reconnect the next available fallback port.
 *   <blockquote class="sub">Protocol: <code>https:</code><br>Transports: <code>WebSocket</code></blockquote>
 * @param {String} LONG_POLLING <small>Value <code>"fallbackLongPollingNonSSL"</code></small>
 *   The state when socket switches to <kbd>Polling</kbd> transports from <kbd>WebSocket</kbd> transports
 *   for a better attempt at reconnectivity after all reconnection attempts with all available ports
 *   has failed.<br>The socket will start the reconnect attempt with
 *   next fallback port starting from the first port used.<br>
 *   This state may occur directly after <code>NON_FALLBACK</code>
 *   if <kbd>WebSocket</kbd> transports is not supported.
 *   <blockquote class="sub">Protocol: <code>http:</code><br>Transports: <code>Polling</code></blockquote>
 * @param {String} LONG_POLLING_SSL <small>Value <code>"fallbackLongPollingSSL"</code></small>
 *   The state when socket switches to <kbd>Polling</kbd> transports from <kbd>WebSocket</kbd> transports
 *   for a better attempt at reconnectivity after all reconnection attempts with all available ports
 *   has failed.<br>The socket will start the reconnect attempt with
 *   next fallback port starting from the first port used.<br>
 *   This state may occur directly after <code>NON_FALLBACK</code>
 *   if <kbd>WebSocket</kbd> transports is not supported.
 *   <blockquote class="sub">Protocol: <code>https:</code><br>Transports: <code>Polling</code></blockquote>
 * @type JSON
 * @readOnly
 * @for Skylink
 * @since 0.7.0
 */
Skylink.prototype.SOCKET_FALLBACK = {
  NON_FALLBACK: 'nonfallback',
  FALLBACK_PORT: 'fallbackPortNonSSL',
  FALLBACK_SSL_PORT: 'fallbackPortSSL',
  LONG_POLLING: 'fallbackLongPollingNonSSL',
  LONG_POLLING_SSL: 'fallbackLongPollingSSL'
};

/**
 * Contains the list of SDK connection session actions.
 * @attribute SYSTEM_ACTION
 * @param {String} WARNING <small>Value <code>"warning"</code></small>
 *   The action when SDK is warned that connection session may result in <code>REJECT</code> soon later.
 *   [Rel: Skylink.attr.SYSTEM_ACTION_REASON]
 * @param {String} REJECT <small>Value <code>"reject"</code></small>
 *   The action when SDK connection session has been rejected.
 *   [Rel: Skylink.attr.SYSTEM_ACTION_REASON]
 * @type JSON
 * @readOnly
 * @for Skylink
 * @since 0.7.0
 */
Skylink.prototype.SYSTEM_ACTION = {
  WARNING: 'warning',
  REJECT: 'reject'
};

/**
 * Contains the list of SDK connection session actions reasons.
 * @attribute SYSTEM_ACTION_REASON
 * @param {String} ROOM_LOCKED <small>Value <code>"locked"</code></small>
 *   The action reason when Room is locked and user is unable to join the Room.
 * <blockquote class="sub">Action associated: <code>REJECT</code></blockquote>
 * @param {String} DUPLICATED_LOGIN <small>Value <code>"duplicatedLogin"</code></small>
 *   The action reason when Room connection has a duplicated connection session credentials.
 *   <small>Resolve this by enquiring help from
 *     <a href="http://support.temasys.com.sg">Temasys Support Portal</a> if this occurs.</small>
 * <blockquote class="sub">Action associated: <code>REJECT</code></blockquote>
 * @param {String} SERVER_ERROR <small>Value <code>"serverError"</code></small>
 *   The action reason when Room connection encountered an error.
 *   <small>Resolve this by enquiring help from
 *     <a href="http://support.temasys.com.sg">Temasys Support Portal</a> if this occurs.</small>
 * <blockquote class="sub">Action associated: <code>REJECT</code></blockquote>
 * @param {String} EXPIRED <small>Value <code>"expired"</code></small>
 *   The action reason when Persistent Room connection session has expired.
 *   <small>See <a href="#article">Persistent Rooms and how it works</a>.</small>
 * <blockquote class="sub">Action associated: <code>REJECT</code></blockquote>
 * @param {String} ROOM_CLOSING <small>Value <code>"toclose"</code></small>
 *   The action reason when Room connection session is going to end soon.
 * <blockquote class="sub">Action associated: <code>WARNING</code></blockquote>
 * @param {String} ROOM_CLOSED <small>Value <code>"roomclose"</code></small>
 *   The action reason when Room connection session has ended.
 * <blockquote class="sub">action associated: <code>REJECT</code></blockquote>
 * @type JSON
 * @readOnly
 * @for Skylink
 * @since 0.7.0
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
 * <div class="panel-warning">
 *   Note that configuring these options might not necessarily result in the desired type (TCP/UDP) of connection
 *   as it is depends on how the browser connects the connection.
 * </div>
 * Contains the list of available TURN transports configuration options to pass when constructing a connection object.
 * @attribute TURN_TRANSPORT
 * @type JSON
 * @param {String} TCP <small>Value <code>"tcp"</code></small>
 *   The option to connect with setting only TCP transports.
 *   <small>EXAMPLE TURN URLS OUTPUT<br>
 *   <code>turn:turnurl:123?transport=tcp</code><br>
 *   <code>turn:turnurl?transport=tcp</code><br>
 *   <code>turn:turnurl:1234?transport=tcp</code></small>
 * @param {String} UDP <small>Value <code>"udp"</code></small>
 *   The option to connect with setting only UDP transports.
 *   <small>EXAMPLE TURN URLS OUTPUT<br>
 *   <code>turn:turnurl:123?transport=udp</code><br>
 *   <code>turn:turnurl?transport=udp</code><br>
 *   <code>turn:turnurl:1234?transport=udp</code></small>
 * @param {String} ANY <small><b>DEFAULT</b> | Value <code>"any"</code></small>
 *   The option to connect with any transports that is configured by the Skylink Platform.
 *   <small>EXAMPLE TURN URLS OUTPUT<br>
 *   <code>turn:turnurl:123?transport=tcp</code><br>
 *   <code>turn:turnurl?transport=udp</code><br>
 *   <code>turn:turnurl:1234</code><br>
 *   <code>turn:turnurl</code></small>
 * @param {String} NONE <small>Value <code>"none"</code></small>
 *   The option to connect without setting any transports.
 *   <small>EXAMPLE TURN URLS OUTPUT<br>
 *   <code>turn:turnurl:123</code><br>
 *   <code>turn:turnurl</code><br>
 *   <code>turn:turnurl:1234</code></small>
 * @param {String} ALL <small>Value <code>"all"</code></small>
 *   The option to connect with setting both TCP and UDP transports.
 *   <small>EXAMPLE TURN URLS OUTPUT<br>
 *   <code>turn:turnurl:123?transport=tcp</code><br>
 *   <code>turn:turnurl:123?transport=udp</code><br>
 *   <code>turn:turnurl?transport=tcp</code><br>
 *   <code>turn:turnurl?transport=udp</code><br>
 *   <code>turn:turnurl:1234?transport=tcp</code><br>
 *   <code>turn:turnurl:1234?transport=udp</code></small>
 * @readOnly
 * @for Skylink
 * @since 0.7.0
 */
Skylink.prototype.TURN_TRANSPORT = {
  UDP: 'udp',
  TCP: 'tcp',
  ANY: 'any',
  NONE: 'none',
  ALL: 'all'
};

/**
 * Contains the current SDK version of SkylinkJS.
 *   <blockquote class="sub">Current version: <code>(See documentation version)</code></blockquote>
 * @attribute VERSION
 * @type String
 * @readOnly
 * @for Skylink
 * @since 0.7.0
 */
Skylink.prototype.VERSION = '0.7.0';


/**
 * <div class="panel-warning">
 *   Note that configuring these options might not necessarily result in the video codec connection
 *   as it is depends on the browser supports.
 * </div>
 * Contains the list of video codec configuration options to use during connection with video streams.
 * @attribute VIDEO_CODEC
 * @param {String} AUTO <small><b>DEFAULT</b> | Value <code>"auto"</code></small>
 *   The option to use the browser selected video codec.
 * @param {String} VP8 <small>Value <code>"VP8"</code></small>
 *   The option to configure to use <a href="https://en.wikipedia.org/wiki/VP8">VP8</a> video codec.<br>
 *   This is the commonly supported video codec in most browsers.
 * @param {String} VP9 <small>Value <code>"VP9"</code></small>
 *   The option to configure to use <a href="https://en.wikipedia.org/wiki/VP9">VP9</a> video codec.
 * @param {String} H264 <small>Value <code>"H264"</code></small>
 *   The option to configure to use <a href="https://en.wikipedia.org/wiki/H.264/MPEG-4_AVC">H264</a> video codec.
 * @param {String} H264UC <small>Value <code>"H264UC"</code></small>
 *   The option to configure to use <a href="https://en.wikipedia.org/wiki/Scalable_Video_Coding">H264 SVC</a> video codec.
 * @type JSON
 * @readOnly
 * @for Skylink
 * @since 0.7.0
 */
Skylink.prototype.VIDEO_CODEC = {
  AUTO: 'auto',
  VP8: 'VP8',
  VP9: 'VP9',
  H264: 'H264',
  H264UC: 'H264UC'
};

/**
 * <div class="panel-warning">
 *   Note that configuring these options might not necessarily result in the desired resolution as it
 *   depends on how the browser renders the video stream resolution.
 * </div>
 * Contains the list of video resolution default presets.
 * @param {JSON} QQVGA <small>Value <code>{ width: 160, height: 120 }</code></small>
 *   The option to use QQVGA video resolution.
 *   <blockquote class="sub">Aspect Ratio <code>4:3</code></blockquote>
 * @param {JSON} HQVGA <small>Value <code>{ width: 240, height: 160 }</code></small>
 *   The option to use HQVGA resolution.
 *   <blockquote class="sub">Aspect Ratio <code>3:2</code></blockquote>
 * @param {JSON} QVGA <small>Value <code>{ width: 320, height: 240 }</code></small>
 *   The option to use QVGA video resolution.
 *   <blockquote class="sub">Aspect Ratio <code>4:3</code></blockquote>
 * @param {JSON} WQVGA <small>Value <code>{ width: 384, height: 240 }</code></small>
 *   The option to use WQVGA video resolution.
 *   <blockquote class="sub">Aspect Ratio <code>16:10</code></blockquote>
 * @param {JSON} HVGA <small>Value <code>{ width: 480, height: 320 }</code></small>
 *   The option to use HVGA video resolution.
 *   <blockquote class="sub">Aspect Ratio <code>3:2</code></blockquote>
 * @param {JSON} VGA <small><b>DEFAULT</b> | Value <code>{ width: 640, height: 480 }</code></small>
 *   The option to use VGA video resolution.
 *   <blockquote class="sub">Aspect Ratio <code>4:3</code></blockquote>
 * @param {JSON} WVGA <small>Value <code>{ width: 768, height: 480 }</code></small>
 *   The option to use WVGA video resolution.
 *   <blockquote class="sub">Aspect Ratio <code>16:10</code></blockquote>
 * @param {JSON} FWVGA <small>Value <code>{ width: 854, height: 480 }</code></small>
 *   The option to use FWVGA video resolution.
 *   <blockquote class="sub">Aspect Ratio <code>16:9</code></blockquote>
 * @param {JSON} SVGA <small>Value <code>{ width: 800, height: 600 }</code></small>
 *   The option to use SVGA video resolution.
 *   <blockquote class="sub">Aspect Ratio <code>4:3</code></blockquote>
 * @param {JSON} DVGA <small>Value <code>{ width: 960, height: 640 }</code></small>
 *   The option to use DVGA video resolution.
 *   <blockquote class="sub">Aspect Ratio <code>3:2</code></blockquote>
 * @param {JSON} WSVGA <small>Value <code>{ width: 1024, height: 576 }</code></small>
 *   The option to use WSVGA video resolution.
 *   <blockquote class="sub">Aspect Ratio <code>16:9</code></blockquote>
 * @param {JSON} HD <small>Value <code>{ width: 1280, height: 720 }</code></small>
 *   The option to use HD video resolution.
 *   <blockquote class="sub">Aspect Ratio <code>16:9</code></blockquote>
 * @param {JSON} HDPLUS <small>Value <code>{ width: 1600, height: 900 }</code></small>
 *   The option to use HDPLUS video resolution.
 *   <blockquote class="sub">Aspect Ratio <code>16:9</code></blockquote>
 * @param {JSON} FHD <small>Value <code>{ width: 1920, height: 1080 }</code></small>
 *   The option to use FHD video resolution.
 *   <blockquote class="sub">Aspect Ratio <code>16:9</code></blockquote>
 * @param {JSON} QHD <small>Value <code>{ width: 2560, height: 1440 }</code></small>
 *   The option to use QHD video resolution.
 *   <small>Note that this resolution may not be supported and may be unrealistic.</small>
 *   <blockquote class="sub">Aspect Ratio <code>16:9</code></blockquote>
 * @param {JSON} WQXGAPLUS <small>Value <code>{ width: 3200, height: 1800 }</code></small>
 *   The option to use WQXGAPLUS video resolution.
 *   <small>Note that this resolution may not be supported and may be unrealistic.</small>
 *   <blockquote class="sub">Aspect Ratio <code>16:9</code></blockquote>
 * @param {JSON} UHD <small>Value <code>{ width: 3840, height: 2160 }</code></small>
 *   The option to use UHD video resolution.
 *   <small>Note that this resolution may not be supported and may be unrealistic.</small>
 *   <blockquote class="sub">Aspect Ratio <code>16:9</code></blockquote>
 * @param {JSON} UHDPLUS <small>Value <code>{ width: 5120, height: 2880 }</code></small>
 *   The option to use UHDPLUS video resolution.
 *   <small>Note that this resolution may not be supported and may be unrealistic.</small>
 *   <blockquote class="sub">Aspect Ratio <code>16:9</code></blockquote>
 * @param {JSON} FUHD <small>Value <code>{ width: 7680, height: 4320 }</code></small>
 *   The option to use FUHD video resolution.
 *   <small>Note that this resolution may not be supported and may be unrealistic.</small>
 *   <blockquote class="sub">Aspect Ratio <code>16:9</code></blockquote>
 * @param {JSON} QUHD <small>Value <code>{ width: 15360, height: 8640 }</code></small>
 *   The option to use QUHD resolution.
 *   <small>Note that this resolution may not be supported and may be unrealistic.</small>
 *   <blockquote class="sub">Aspect Ratio <code>16:9</code></blockquote>
 * @attribute VIDEO_RESOLUTION
 * @type JSON
 * @readOnly
 * @for Skylink
 * @since 0.7.0
 */
Skylink.prototype.VIDEO_RESOLUTION = {
  QQVGA: { width: 160, height: 120 /*, aspectRatio: '4:3'*/ },
  HQVGA: { width: 240, height: 160 /*, aspectRatio: '3:2'*/ },
  QVGA: { width: 320, height: 240 /*, aspectRatio: '4:3'*/ },
  WQVGA: { width: 384, height: 240 /*, aspectRatio: '16:10'*/ },
  HVGA: { width: 480, height: 320 /*, aspectRatio: '3:2'*/ },
  VGA: { width: 640, height: 480 /*, aspectRatio: '4:3'*/ },
  WVGA: { width: 768, height: 480 /*, aspectRatio: '16:10'*/ },
  FWVGA: { width: 854, height: 480 /*, aspectRatio: '16:9'*/ },
  SVGA: { width: 800, height: 600 /*, aspectRatio: '4:3'*/ },
  DVGA: { width: 960, height: 640 /*, aspectRatio: '3:2'*/ },
  WSVGA: { width: 1024, height: 576 /*, aspectRatio: '16:9'*/ },
  HD: { width: 1280, height: 720 /*, aspectRatio: '16:9'*/ },
  HDPLUS: { width: 1600, height: 900 /*, aspectRatio: '16:9'*/ },
  FHD: { width: 1920, height: 1080 /*, aspectRatio: '16:9'*/ },
  QHD: { width: 2560, height: 1440 /*, aspectRatio: '16:9'*/ },
  WQXGAPLUS: { width: 3200, height: 1800 /*, aspectRatio: '16:9'*/ },
  UHD: { width: 3840, height: 2160 /*, aspectRatio: '16:9'*/ },
  UHDPLUS: { width: 5120, height: 2880 /*, aspectRatio: '16:9'*/ },
  FUHD: { width: 7680, height: 4320 /*, aspectRatio: '16:9'*/ },
  QUHD: { width: 15360, height: 8640 /*, aspectRatio: '16:9'*/ }
};


var SkylinkEventList = {
  /**
   * Event triggered when room connection information is being retrieved from platform server.
   * - This is also triggered when <a href="#method_init">init()</a> is invoked, but
   *   the socket connection events like <a href="#event_channelOpen">channelOpen</a> does
   *   not get triggered but stops at <u>readyStateChange</u> event.
   * @event readyStateChange
   * @param {String} readyState The current ready state of the retrieval when the event is triggered.
   *   [Rel: Skylink.READY_STATE_CHANGE]
   * @param {JSON} [error=null] The error object thrown when there is a failure in retrieval.
   *   If received as <code>null</code>, it means that there is no errors.
   * @param {Number} error.status Http status when retrieving information.
   *   May be empty for other errors.
   * @param {Number} error.errorCode The
   *   <a href="#attr_READY_STATE_CHANGE_ERROR">READY_STATE_CHANGE_ERROR</a>
   *   if there is an <a href="#event_readyStateChange">readyStateChange</a>
   *   event error that caused the failure for initialising Skylink.
   *   [Rel: Skylink.READY_STATE_CHANGE_ERROR]
   * @param {Object} error.content The exception thrown that caused the failure
   *   for initialising Skylink.
   * @param {Number} error.status The XMLHttpRequest status code received
   *   when exception is thrown that caused the failure for initialising Skylink.
   * @param {String} room The selected room connection information that Skylink is attempting
   *   to retrieve the information for to start connection to.
   * @component Events
   * @for Skylink
   * @since 0.4.0
   */
  readyStateChange: []
};
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
      errorCode: self.READY_STATE_CHANGE_ERROR.NO_PATH,
      content: new Error('Failed loading required dependency AdapterJS.\n' +
        'Please load from https://github.com/Temasys/AdapterJS/releases/tag/0.13.3'),
      status: self.READY_STATE_CHANGE_ERROR_STATUS.NO_REQUEST_MADE
    });
    return;

  } else if (window.AdapterJS.VERSION !== '0.13.3') {
    log.warn([null, 'Skylink', 'init()', 'Dependency AdapterJS is loaded at the wrong version "' +
      window.AdapterJS.VERSION + '".\n' +
      'Please load from https://github.com/Temasys/AdapterJS/releases/tag/0.13.3 for ' +
      'the correct version']);
  }

  /**
   * Dependency checks: socket.io-client
   */
  if (!window.io) {
    processSetStateFn(self.READY_STATE_CHANGE.ERROR, {
      errorCode: self.READY_STATE_CHANGE_ERROR.NO_SOCKET_IO,
      content: new Error('Failed loading required dependency socket.io-client.\n' +
        'Please load from https://github.com/socketio/socket.io-client/releases/tag/1.4.4'),
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
var SkylinkAPI = {
  /**
   * Function that builds the HTTP URL for the SDK to fetch and start connection session to.
   * @method URLBuilderFn
   * @param {JSON} options The parameter options.
   * @param {Boolean} forceSSL The <code>init()</code> <code>forceSSL</code> parameter option.
   * @param {String} appKey The <code>init()</code> <code>appKey</code> parameter option.
   * @param {String} roomServer The <code>init()</code> <code>roomServer</code> parameter option.
   * @param {String} region The <code>init()</code> <code>region</code> parameter option.
   * @param {JSON} credentials The <code>init()</code> <code>credentials</code> parameter option.
   * @param {String} selectedRoom The selected Room name to fetch and start connection session to.
   * @return {String} The generated HTTP URL based on options provided.
   * @private
   * @for SkylinkAPI
   * @since 0.7.0
   */
  URLBuilderFn: function (options) {
    var baseUrl = (options.forceSSL ? 'https:' : window.location.protocol),
        queries = ['rand=' + (new Date()).getTime()];

    // Append API url
    baseUrl += options.roomServer + '/api/' + options.appKey + '/' + options.selectedRoom;

    if (options.credentials) {
      baseUrl += '/' + options.credentials.startDateTime + '/' + options.credentials.duration;
      queries.splice(0, 0, 'cred=' + options.credentials.credentials);
    }

    if (options.region) {
      queries.splice(0, 0, 'rg=' + options.region);
    }

    return baseUrl + '?' + queries.join('&');
  },

  /**
   * Function that fetchs from HTTP URL (build from <code>options</code> parameter provided)
   *   to start connection session to.
   * @method URLBuilderFn
   * @param {JSON} options The parameter options.
   *   <small>See <code>URLBuilderFn()</code> function for full parameter options</small>
   * @param {Function} fn The parameter callback function that triggers on HTTP request state change.
   * @param {String} fn.state The callback function parameter payload to determine the current state
   *   of the HTTP request.<br>
   *   <blockquote class="sub">
   *   <code>"loading"</code>: The state when loading HTTP request.<br>
   *   <code>"loaded"</code>: The state when connection session has started.<br>
   *   <code>"error"</code>: The state when connection session has errors<br>
   *   <code>"retry"</code>: The state when retrying loading HTTP request when timeout.
   *     Maximum retries are <var>5</var></blockquote>
   * @param {JSON} fn.data The callback function parameter payload that contains the error object which
   *   follows the <code>readyStateChange</code> <code>error</code> event payload
   *   or the connection session data.
   * @private
   * @for SkylinkAPI
   * @since 0.7.0
   */
  requestFn: function (options, fn) {
    var self = this;
    var xhr = null,
        retries = 0;

    if (['object', 'function'].indexOf(typeof window.XDomainRequest) > -1) {
      xhr = new window.XDomainRequest();

    } else {
      xhr = new window.XMLHttpRequest();
    }

    var openFn = function () {
      var url = self.URLBuilderFn(options);

      fn('request', url);

      xhr.open('GET', url, true);
      xhr.send();
    };

    xhr.onload = function () {
      var result = JSON.parse(xhr.responseText || xhr.response || '{}');

      if (Object.keys(result).length === 0) {
        fn('error', {
          errorCode: Skylink.prototype.READY_STATE_CHANGE_ERROR.XML_HTTP_REQUEST_ERROR,
          content: new Error('Failed API request as loaded session is empty'),
          status: 0
        });
        return;
      }

      if (result.success) {
        fn('started', result);

      } else {
        fn('error', {
          errorCode: result.error,
          content: new Error(result.info),
          status: 200
        });
      }
    };

    xhr.onerror = function (error) {
      if (retries === 5) {
        fn('error', {
          errorCode: Skylink.prototype.READY_STATE_CHANGE_ERROR.XML_HTTP_REQUEST_ERROR,
          content: new Error('Failed API request as connection has timed out'),
          status: -1
        });
        return;
      }

      retries++;

      fn('restart', retries);

      openFn();
    };

    xhr.onprogress = function (evt) {
      fn('starting');
    };

    openFn();
  }

};
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
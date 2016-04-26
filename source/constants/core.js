/**
 * <div class="panel-warning">
 *   Note that configuring these options might not necessarily result in the audio codec connection
 *   as it is depends on the browser supports.
 * </div>
 * Contains the list of audio codec configuration options to use during connection with audio streams.
 * @attribute AUDIO_CODEC
 * @param {String} AUTO <small><b>DEFAULT</b> | Value <code>"auto"</code></small>
 *   The option to use the browser selected audio codec.
 * @param {String} OPUS <small>Value <code>"opus"</code></small>
 *   The option to configure to use <a href="https://en.wikipedia.org/wiki/Opus_(audio_format)">opus</a> audio codec.<br>
 *   This is the commonly supported audio codec.
 * @param {String} ISAC <small>Value <code>"ISAC"</code></small>
 *   The option to configure to use <a href="https://en.wikipedia.org/wiki/Internet_Speech_Audio_Codec">iSAC</a> audio codec.
 * @param {String} SILK <small>Value <code>"SILK"</code></small>
 *   The option to configure to use <a href="https://en.wikipedia.org/wiki/SILK">SILK</a> audio codec.
 * @param {String} ILBC <small>Value <code>"iLBC"</code></small>
 *   The option to configure to use <a href="https://en.wikipedia.org/wiki/Internet_Low_Bitrate_Codec">iLBC</a> audio codec.
 * @param {String} G722 <small>Value <code>"G722"</code></small>
 *   The option to configure to use <a href="https://en.wikipedia.org/wiki/G.722">G722</a> audio codec.<br>
 *   <small>This is experimental, so try this at your own risk.</small>
 * @param {String} G711 <small>Value <code>"G711"</code></small>
 *   The option to configure to use <a href="https://en.wikipedia.org/wiki/G.711">G711</a> audio codec.<br>
 *   <small>This is experimental, so try this at your own risk.</small>
 * @type JSON
 * @readOnly
 * @for Skylink
 * @since 0.7.0
 */
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
Skylink.prototype.VERSION = '@@version';


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


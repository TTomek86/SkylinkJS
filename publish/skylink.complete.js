/*! skylinkjs - v0.7.0 - Wed Apr 27 2016 04:28:11 GMT+0800 (SGT) */

(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.io = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){

module.exports =  _dereq_('./lib/');

},{"./lib/":2}],2:[function(_dereq_,module,exports){

module.exports = _dereq_('./socket');

/**
 * Exports parser
 *
 * @api public
 *
 */
module.exports.parser = _dereq_('engine.io-parser');

},{"./socket":3,"engine.io-parser":19}],3:[function(_dereq_,module,exports){
(function (global){
/**
 * Module dependencies.
 */

var transports = _dereq_('./transports');
var Emitter = _dereq_('component-emitter');
var debug = _dereq_('debug')('engine.io-client:socket');
var index = _dereq_('indexof');
var parser = _dereq_('engine.io-parser');
var parseuri = _dereq_('parseuri');
var parsejson = _dereq_('parsejson');
var parseqs = _dereq_('parseqs');

/**
 * Module exports.
 */

module.exports = Socket;

/**
 * Noop function.
 *
 * @api private
 */

function noop(){}

/**
 * Socket constructor.
 *
 * @param {String|Object} uri or options
 * @param {Object} options
 * @api public
 */

function Socket(uri, opts){
  if (!(this instanceof Socket)) return new Socket(uri, opts);

  opts = opts || {};

  if (uri && 'object' == typeof uri) {
    opts = uri;
    uri = null;
  }

  if (uri) {
    uri = parseuri(uri);
    opts.hostname = uri.host;
    opts.secure = uri.protocol == 'https' || uri.protocol == 'wss';
    opts.port = uri.port;
    if (uri.query) opts.query = uri.query;
  } else if (opts.host) {
    opts.hostname = parseuri(opts.host).host;
  }

  this.secure = null != opts.secure ? opts.secure :
    (global.location && 'https:' == location.protocol);

  if (opts.hostname && !opts.port) {
    // if no port is specified manually, use the protocol default
    opts.port = this.secure ? '443' : '80';
  }

  this.agent = opts.agent || false;
  this.hostname = opts.hostname ||
    (global.location ? location.hostname : 'localhost');
  this.port = opts.port || (global.location && location.port ?
       location.port :
       (this.secure ? 443 : 80));
  this.query = opts.query || {};
  if ('string' == typeof this.query) this.query = parseqs.decode(this.query);
  this.upgrade = false !== opts.upgrade;
  this.path = (opts.path || '/engine.io').replace(/\/$/, '') + '/';
  this.forceJSONP = !!opts.forceJSONP;
  this.jsonp = false !== opts.jsonp;
  this.forceBase64 = !!opts.forceBase64;
  this.enablesXDR = !!opts.enablesXDR;
  this.timestampParam = opts.timestampParam || 't';
  this.timestampRequests = opts.timestampRequests;
  this.transports = opts.transports || ['polling', 'websocket'];
  this.readyState = '';
  this.writeBuffer = [];
  this.policyPort = opts.policyPort || 843;
  this.rememberUpgrade = opts.rememberUpgrade || false;
  this.binaryType = null;
  this.onlyBinaryUpgrades = opts.onlyBinaryUpgrades;
  this.perMessageDeflate = false !== opts.perMessageDeflate ? (opts.perMessageDeflate || {}) : false;

  if (true === this.perMessageDeflate) this.perMessageDeflate = {};
  if (this.perMessageDeflate && null == this.perMessageDeflate.threshold) {
    this.perMessageDeflate.threshold = 1024;
  }

  // SSL options for Node.js client
  this.pfx = opts.pfx || null;
  this.key = opts.key || null;
  this.passphrase = opts.passphrase || null;
  this.cert = opts.cert || null;
  this.ca = opts.ca || null;
  this.ciphers = opts.ciphers || null;
  this.rejectUnauthorized = opts.rejectUnauthorized === undefined ? null : opts.rejectUnauthorized;

  // other options for Node.js client
  var freeGlobal = typeof global == 'object' && global;
  if (freeGlobal.global === freeGlobal) {
    if (opts.extraHeaders && Object.keys(opts.extraHeaders).length > 0) {
      this.extraHeaders = opts.extraHeaders;
    }
  }

  this.open();
}

Socket.priorWebsocketSuccess = false;

/**
 * Mix in `Emitter`.
 */

Emitter(Socket.prototype);

/**
 * Protocol version.
 *
 * @api public
 */

Socket.protocol = parser.protocol; // this is an int

/**
 * Expose deps for legacy compatibility
 * and standalone browser access.
 */

Socket.Socket = Socket;
Socket.Transport = _dereq_('./transport');
Socket.transports = _dereq_('./transports');
Socket.parser = _dereq_('engine.io-parser');

/**
 * Creates transport of the given type.
 *
 * @param {String} transport name
 * @return {Transport}
 * @api private
 */

Socket.prototype.createTransport = function (name) {
  debug('creating transport "%s"', name);
  var query = clone(this.query);

  // append engine.io protocol identifier
  query.EIO = parser.protocol;

  // transport name
  query.transport = name;

  // session id if we already have one
  if (this.id) query.sid = this.id;

  var transport = new transports[name]({
    agent: this.agent,
    hostname: this.hostname,
    port: this.port,
    secure: this.secure,
    path: this.path,
    query: query,
    forceJSONP: this.forceJSONP,
    jsonp: this.jsonp,
    forceBase64: this.forceBase64,
    enablesXDR: this.enablesXDR,
    timestampRequests: this.timestampRequests,
    timestampParam: this.timestampParam,
    policyPort: this.policyPort,
    socket: this,
    pfx: this.pfx,
    key: this.key,
    passphrase: this.passphrase,
    cert: this.cert,
    ca: this.ca,
    ciphers: this.ciphers,
    rejectUnauthorized: this.rejectUnauthorized,
    perMessageDeflate: this.perMessageDeflate,
    extraHeaders: this.extraHeaders
  });

  return transport;
};

function clone (obj) {
  var o = {};
  for (var i in obj) {
    if (obj.hasOwnProperty(i)) {
      o[i] = obj[i];
    }
  }
  return o;
}

/**
 * Initializes transport to use and starts probe.
 *
 * @api private
 */
Socket.prototype.open = function () {
  var transport;
  if (this.rememberUpgrade && Socket.priorWebsocketSuccess && this.transports.indexOf('websocket') != -1) {
    transport = 'websocket';
  } else if (0 === this.transports.length) {
    // Emit error on next tick so it can be listened to
    var self = this;
    setTimeout(function() {
      self.emit('error', 'No transports available');
    }, 0);
    return;
  } else {
    transport = this.transports[0];
  }
  this.readyState = 'opening';

  // Retry with the next transport if the transport is disabled (jsonp: false)
  try {
    transport = this.createTransport(transport);
  } catch (e) {
    this.transports.shift();
    this.open();
    return;
  }

  transport.open();
  this.setTransport(transport);
};

/**
 * Sets the current transport. Disables the existing one (if any).
 *
 * @api private
 */

Socket.prototype.setTransport = function(transport){
  debug('setting transport %s', transport.name);
  var self = this;

  if (this.transport) {
    debug('clearing existing transport %s', this.transport.name);
    this.transport.removeAllListeners();
  }

  // set up transport
  this.transport = transport;

  // set up transport listeners
  transport
  .on('drain', function(){
    self.onDrain();
  })
  .on('packet', function(packet){
    self.onPacket(packet);
  })
  .on('error', function(e){
    self.onError(e);
  })
  .on('close', function(){
    self.onClose('transport close');
  });
};

/**
 * Probes a transport.
 *
 * @param {String} transport name
 * @api private
 */

Socket.prototype.probe = function (name) {
  debug('probing transport "%s"', name);
  var transport = this.createTransport(name, { probe: 1 })
    , failed = false
    , self = this;

  Socket.priorWebsocketSuccess = false;

  function onTransportOpen(){
    if (self.onlyBinaryUpgrades) {
      var upgradeLosesBinary = !this.supportsBinary && self.transport.supportsBinary;
      failed = failed || upgradeLosesBinary;
    }
    if (failed) return;

    debug('probe transport "%s" opened', name);
    transport.send([{ type: 'ping', data: 'probe' }]);
    transport.once('packet', function (msg) {
      if (failed) return;
      if ('pong' == msg.type && 'probe' == msg.data) {
        debug('probe transport "%s" pong', name);
        self.upgrading = true;
        self.emit('upgrading', transport);
        if (!transport) return;
        Socket.priorWebsocketSuccess = 'websocket' == transport.name;

        debug('pausing current transport "%s"', self.transport.name);
        self.transport.pause(function () {
          if (failed) return;
          if ('closed' == self.readyState) return;
          debug('changing transport and sending upgrade packet');

          cleanup();

          self.setTransport(transport);
          transport.send([{ type: 'upgrade' }]);
          self.emit('upgrade', transport);
          transport = null;
          self.upgrading = false;
          self.flush();
        });
      } else {
        debug('probe transport "%s" failed', name);
        var err = new Error('probe error');
        err.transport = transport.name;
        self.emit('upgradeError', err);
      }
    });
  }

  function freezeTransport() {
    if (failed) return;

    // Any callback called by transport should be ignored since now
    failed = true;

    cleanup();

    transport.close();
    transport = null;
  }

  //Handle any error that happens while probing
  function onerror(err) {
    var error = new Error('probe error: ' + err);
    error.transport = transport.name;

    freezeTransport();

    debug('probe transport "%s" failed because of error: %s', name, err);

    self.emit('upgradeError', error);
  }

  function onTransportClose(){
    onerror("transport closed");
  }

  //When the socket is closed while we're probing
  function onclose(){
    onerror("socket closed");
  }

  //When the socket is upgraded while we're probing
  function onupgrade(to){
    if (transport && to.name != transport.name) {
      debug('"%s" works - aborting "%s"', to.name, transport.name);
      freezeTransport();
    }
  }

  //Remove all listeners on the transport and on self
  function cleanup(){
    transport.removeListener('open', onTransportOpen);
    transport.removeListener('error', onerror);
    transport.removeListener('close', onTransportClose);
    self.removeListener('close', onclose);
    self.removeListener('upgrading', onupgrade);
  }

  transport.once('open', onTransportOpen);
  transport.once('error', onerror);
  transport.once('close', onTransportClose);

  this.once('close', onclose);
  this.once('upgrading', onupgrade);

  transport.open();

};

/**
 * Called when connection is deemed open.
 *
 * @api public
 */

Socket.prototype.onOpen = function () {
  debug('socket open');
  this.readyState = 'open';
  Socket.priorWebsocketSuccess = 'websocket' == this.transport.name;
  this.emit('open');
  this.flush();

  // we check for `readyState` in case an `open`
  // listener already closed the socket
  if ('open' == this.readyState && this.upgrade && this.transport.pause) {
    debug('starting upgrade probes');
    for (var i = 0, l = this.upgrades.length; i < l; i++) {
      this.probe(this.upgrades[i]);
    }
  }
};

/**
 * Handles a packet.
 *
 * @api private
 */

Socket.prototype.onPacket = function (packet) {
  if ('opening' == this.readyState || 'open' == this.readyState) {
    debug('socket receive: type "%s", data "%s"', packet.type, packet.data);

    this.emit('packet', packet);

    // Socket is live - any packet counts
    this.emit('heartbeat');

    switch (packet.type) {
      case 'open':
        this.onHandshake(parsejson(packet.data));
        break;

      case 'pong':
        this.setPing();
        this.emit('pong');
        break;

      case 'error':
        var err = new Error('server error');
        err.code = packet.data;
        this.onError(err);
        break;

      case 'message':
        this.emit('data', packet.data);
        this.emit('message', packet.data);
        break;
    }
  } else {
    debug('packet received with socket readyState "%s"', this.readyState);
  }
};

/**
 * Called upon handshake completion.
 *
 * @param {Object} handshake obj
 * @api private
 */

Socket.prototype.onHandshake = function (data) {
  this.emit('handshake', data);
  this.id = data.sid;
  this.transport.query.sid = data.sid;
  this.upgrades = this.filterUpgrades(data.upgrades);
  this.pingInterval = data.pingInterval;
  this.pingTimeout = data.pingTimeout;
  this.onOpen();
  // In case open handler closes socket
  if  ('closed' == this.readyState) return;
  this.setPing();

  // Prolong liveness of socket on heartbeat
  this.removeListener('heartbeat', this.onHeartbeat);
  this.on('heartbeat', this.onHeartbeat);
};

/**
 * Resets ping timeout.
 *
 * @api private
 */

Socket.prototype.onHeartbeat = function (timeout) {
  clearTimeout(this.pingTimeoutTimer);
  var self = this;
  self.pingTimeoutTimer = setTimeout(function () {
    if ('closed' == self.readyState) return;
    self.onClose('ping timeout');
  }, timeout || (self.pingInterval + self.pingTimeout));
};

/**
 * Pings server every `this.pingInterval` and expects response
 * within `this.pingTimeout` or closes connection.
 *
 * @api private
 */

Socket.prototype.setPing = function () {
  var self = this;
  clearTimeout(self.pingIntervalTimer);
  self.pingIntervalTimer = setTimeout(function () {
    debug('writing ping packet - expecting pong within %sms', self.pingTimeout);
    self.ping();
    self.onHeartbeat(self.pingTimeout);
  }, self.pingInterval);
};

/**
* Sends a ping packet.
*
* @api private
*/

Socket.prototype.ping = function () {
  var self = this;
  this.sendPacket('ping', function(){
    self.emit('ping');
  });
};

/**
 * Called on `drain` event
 *
 * @api private
 */

Socket.prototype.onDrain = function() {
  this.writeBuffer.splice(0, this.prevBufferLen);

  // setting prevBufferLen = 0 is very important
  // for example, when upgrading, upgrade packet is sent over,
  // and a nonzero prevBufferLen could cause problems on `drain`
  this.prevBufferLen = 0;

  if (0 === this.writeBuffer.length) {
    this.emit('drain');
  } else {
    this.flush();
  }
};

/**
 * Flush write buffers.
 *
 * @api private
 */

Socket.prototype.flush = function () {
  if ('closed' != this.readyState && this.transport.writable &&
    !this.upgrading && this.writeBuffer.length) {
    debug('flushing %d packets in socket', this.writeBuffer.length);
    this.transport.send(this.writeBuffer);
    // keep track of current length of writeBuffer
    // splice writeBuffer and callbackBuffer on `drain`
    this.prevBufferLen = this.writeBuffer.length;
    this.emit('flush');
  }
};

/**
 * Sends a message.
 *
 * @param {String} message.
 * @param {Function} callback function.
 * @param {Object} options.
 * @return {Socket} for chaining.
 * @api public
 */

Socket.prototype.write =
Socket.prototype.send = function (msg, options, fn) {
  this.sendPacket('message', msg, options, fn);
  return this;
};

/**
 * Sends a packet.
 *
 * @param {String} packet type.
 * @param {String} data.
 * @param {Object} options.
 * @param {Function} callback function.
 * @api private
 */

Socket.prototype.sendPacket = function (type, data, options, fn) {
  if('function' == typeof data) {
    fn = data;
    data = undefined;
  }

  if ('function' == typeof options) {
    fn = options;
    options = null;
  }

  if ('closing' == this.readyState || 'closed' == this.readyState) {
    return;
  }

  options = options || {};
  options.compress = false !== options.compress;

  var packet = {
    type: type,
    data: data,
    options: options
  };
  this.emit('packetCreate', packet);
  this.writeBuffer.push(packet);
  if (fn) this.once('flush', fn);
  this.flush();
};

/**
 * Closes the connection.
 *
 * @api private
 */

Socket.prototype.close = function () {
  if ('opening' == this.readyState || 'open' == this.readyState) {
    this.readyState = 'closing';

    var self = this;

    if (this.writeBuffer.length) {
      this.once('drain', function() {
        if (this.upgrading) {
          waitForUpgrade();
        } else {
          close();
        }
      });
    } else if (this.upgrading) {
      waitForUpgrade();
    } else {
      close();
    }
  }

  function close() {
    self.onClose('forced close');
    debug('socket closing - telling transport to close');
    self.transport.close();
  }

  function cleanupAndClose() {
    self.removeListener('upgrade', cleanupAndClose);
    self.removeListener('upgradeError', cleanupAndClose);
    close();
  }

  function waitForUpgrade() {
    // wait for upgrade to finish since we can't send packets while pausing a transport
    self.once('upgrade', cleanupAndClose);
    self.once('upgradeError', cleanupAndClose);
  }

  return this;
};

/**
 * Called upon transport error
 *
 * @api private
 */

Socket.prototype.onError = function (err) {
  debug('socket error %j', err);
  Socket.priorWebsocketSuccess = false;
  this.emit('error', err);
  this.onClose('transport error', err);
};

/**
 * Called upon transport close.
 *
 * @api private
 */

Socket.prototype.onClose = function (reason, desc) {
  if ('opening' == this.readyState || 'open' == this.readyState || 'closing' == this.readyState) {
    debug('socket close with reason: "%s"', reason);
    var self = this;

    // clear timers
    clearTimeout(this.pingIntervalTimer);
    clearTimeout(this.pingTimeoutTimer);

    // stop event from firing again for transport
    this.transport.removeAllListeners('close');

    // ensure transport won't stay open
    this.transport.close();

    // ignore further transport communication
    this.transport.removeAllListeners();

    // set ready state
    this.readyState = 'closed';

    // clear session id
    this.id = null;

    // emit close event
    this.emit('close', reason, desc);

    // clean buffers after, so users can still
    // grab the buffers on `close` event
    self.writeBuffer = [];
    self.prevBufferLen = 0;
  }
};

/**
 * Filters upgrades, returning only those matching client transports.
 *
 * @param {Array} server upgrades
 * @api private
 *
 */

Socket.prototype.filterUpgrades = function (upgrades) {
  var filteredUpgrades = [];
  for (var i = 0, j = upgrades.length; i<j; i++) {
    if (~index(this.transports, upgrades[i])) filteredUpgrades.push(upgrades[i]);
  }
  return filteredUpgrades;
};

}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : {})
},{"./transport":4,"./transports":5,"component-emitter":15,"debug":17,"engine.io-parser":19,"indexof":23,"parsejson":26,"parseqs":27,"parseuri":28}],4:[function(_dereq_,module,exports){
/**
 * Module dependencies.
 */

var parser = _dereq_('engine.io-parser');
var Emitter = _dereq_('component-emitter');

/**
 * Module exports.
 */

module.exports = Transport;

/**
 * Transport abstract constructor.
 *
 * @param {Object} options.
 * @api private
 */

function Transport (opts) {
  this.path = opts.path;
  this.hostname = opts.hostname;
  this.port = opts.port;
  this.secure = opts.secure;
  this.query = opts.query;
  this.timestampParam = opts.timestampParam;
  this.timestampRequests = opts.timestampRequests;
  this.readyState = '';
  this.agent = opts.agent || false;
  this.socket = opts.socket;
  this.enablesXDR = opts.enablesXDR;

  // SSL options for Node.js client
  this.pfx = opts.pfx;
  this.key = opts.key;
  this.passphrase = opts.passphrase;
  this.cert = opts.cert;
  this.ca = opts.ca;
  this.ciphers = opts.ciphers;
  this.rejectUnauthorized = opts.rejectUnauthorized;

  // other options for Node.js client
  this.extraHeaders = opts.extraHeaders;
}

/**
 * Mix in `Emitter`.
 */

Emitter(Transport.prototype);

/**
 * Emits an error.
 *
 * @param {String} str
 * @return {Transport} for chaining
 * @api public
 */

Transport.prototype.onError = function (msg, desc) {
  var err = new Error(msg);
  err.type = 'TransportError';
  err.description = desc;
  this.emit('error', err);
  return this;
};

/**
 * Opens the transport.
 *
 * @api public
 */

Transport.prototype.open = function () {
  if ('closed' == this.readyState || '' == this.readyState) {
    this.readyState = 'opening';
    this.doOpen();
  }

  return this;
};

/**
 * Closes the transport.
 *
 * @api private
 */

Transport.prototype.close = function () {
  if ('opening' == this.readyState || 'open' == this.readyState) {
    this.doClose();
    this.onClose();
  }

  return this;
};

/**
 * Sends multiple packets.
 *
 * @param {Array} packets
 * @api private
 */

Transport.prototype.send = function(packets){
  if ('open' == this.readyState) {
    this.write(packets);
  } else {
    throw new Error('Transport not open');
  }
};

/**
 * Called upon open
 *
 * @api private
 */

Transport.prototype.onOpen = function () {
  this.readyState = 'open';
  this.writable = true;
  this.emit('open');
};

/**
 * Called with data.
 *
 * @param {String} data
 * @api private
 */

Transport.prototype.onData = function(data){
  var packet = parser.decodePacket(data, this.socket.binaryType);
  this.onPacket(packet);
};

/**
 * Called with a decoded packet.
 */

Transport.prototype.onPacket = function (packet) {
  this.emit('packet', packet);
};

/**
 * Called upon close.
 *
 * @api private
 */

Transport.prototype.onClose = function () {
  this.readyState = 'closed';
  this.emit('close');
};

},{"component-emitter":15,"engine.io-parser":19}],5:[function(_dereq_,module,exports){
(function (global){
/**
 * Module dependencies
 */

var XMLHttpRequest = _dereq_('xmlhttprequest-ssl');
var XHR = _dereq_('./polling-xhr');
var JSONP = _dereq_('./polling-jsonp');
var websocket = _dereq_('./websocket');

/**
 * Export transports.
 */

exports.polling = polling;
exports.websocket = websocket;

/**
 * Polling transport polymorphic constructor.
 * Decides on xhr vs jsonp based on feature detection.
 *
 * @api private
 */

function polling(opts){
  var xhr;
  var xd = false;
  var xs = false;
  var jsonp = false !== opts.jsonp;

  if (global.location) {
    var isSSL = 'https:' == location.protocol;
    var port = location.port;

    // some user agents have empty `location.port`
    if (!port) {
      port = isSSL ? 443 : 80;
    }

    xd = opts.hostname != location.hostname || port != opts.port;
    xs = opts.secure != isSSL;
  }

  opts.xdomain = xd;
  opts.xscheme = xs;
  xhr = new XMLHttpRequest(opts);

  if ('open' in xhr && !opts.forceJSONP) {
    return new XHR(opts);
  } else {
    if (!jsonp) throw new Error('JSONP disabled');
    return new JSONP(opts);
  }
}

}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : {})
},{"./polling-jsonp":6,"./polling-xhr":7,"./websocket":9,"xmlhttprequest-ssl":10}],6:[function(_dereq_,module,exports){
(function (global){

/**
 * Module requirements.
 */

var Polling = _dereq_('./polling');
var inherit = _dereq_('component-inherit');

/**
 * Module exports.
 */

module.exports = JSONPPolling;

/**
 * Cached regular expressions.
 */

var rNewline = /\n/g;
var rEscapedNewline = /\\n/g;

/**
 * Global JSONP callbacks.
 */

var callbacks;

/**
 * Callbacks count.
 */

var index = 0;

/**
 * Noop.
 */

function empty () { }

/**
 * JSONP Polling constructor.
 *
 * @param {Object} opts.
 * @api public
 */

function JSONPPolling (opts) {
  Polling.call(this, opts);

  this.query = this.query || {};

  // define global callbacks array if not present
  // we do this here (lazily) to avoid unneeded global pollution
  if (!callbacks) {
    // we need to consider multiple engines in the same page
    if (!global.___eio) global.___eio = [];
    callbacks = global.___eio;
  }

  // callback identifier
  this.index = callbacks.length;

  // add callback to jsonp global
  var self = this;
  callbacks.push(function (msg) {
    self.onData(msg);
  });

  // append to query string
  this.query.j = this.index;

  // prevent spurious errors from being emitted when the window is unloaded
  if (global.document && global.addEventListener) {
    global.addEventListener('beforeunload', function () {
      if (self.script) self.script.onerror = empty;
    }, false);
  }
}

/**
 * Inherits from Polling.
 */

inherit(JSONPPolling, Polling);

/*
 * JSONP only supports binary as base64 encoded strings
 */

JSONPPolling.prototype.supportsBinary = false;

/**
 * Closes the socket.
 *
 * @api private
 */

JSONPPolling.prototype.doClose = function () {
  if (this.script) {
    this.script.parentNode.removeChild(this.script);
    this.script = null;
  }

  if (this.form) {
    this.form.parentNode.removeChild(this.form);
    this.form = null;
    this.iframe = null;
  }

  Polling.prototype.doClose.call(this);
};

/**
 * Starts a poll cycle.
 *
 * @api private
 */

JSONPPolling.prototype.doPoll = function () {
  var self = this;
  var script = document.createElement('script');

  if (this.script) {
    this.script.parentNode.removeChild(this.script);
    this.script = null;
  }

  script.async = true;
  script.src = this.uri();
  script.onerror = function(e){
    self.onError('jsonp poll error',e);
  };

  var insertAt = document.getElementsByTagName('script')[0];
  if (insertAt) {
    insertAt.parentNode.insertBefore(script, insertAt);
  }
  else {
    (document.head || document.body).appendChild(script);
  }
  this.script = script;

  var isUAgecko = 'undefined' != typeof navigator && /gecko/i.test(navigator.userAgent);
  
  if (isUAgecko) {
    setTimeout(function () {
      var iframe = document.createElement('iframe');
      document.body.appendChild(iframe);
      document.body.removeChild(iframe);
    }, 100);
  }
};

/**
 * Writes with a hidden iframe.
 *
 * @param {String} data to send
 * @param {Function} called upon flush.
 * @api private
 */

JSONPPolling.prototype.doWrite = function (data, fn) {
  var self = this;

  if (!this.form) {
    var form = document.createElement('form');
    var area = document.createElement('textarea');
    var id = this.iframeId = 'eio_iframe_' + this.index;
    var iframe;

    form.className = 'socketio';
    form.style.position = 'absolute';
    form.style.top = '-1000px';
    form.style.left = '-1000px';
    form.target = id;
    form.method = 'POST';
    form.setAttribute('accept-charset', 'utf-8');
    area.name = 'd';
    form.appendChild(area);
    document.body.appendChild(form);

    this.form = form;
    this.area = area;
  }

  this.form.action = this.uri();

  function complete () {
    initIframe();
    fn();
  }

  function initIframe () {
    if (self.iframe) {
      try {
        self.form.removeChild(self.iframe);
      } catch (e) {
        self.onError('jsonp polling iframe removal error', e);
      }
    }

    try {
      // ie6 dynamic iframes with target="" support (thanks Chris Lambacher)
      var html = '<iframe src="javascript:0" name="'+ self.iframeId +'">';
      iframe = document.createElement(html);
    } catch (e) {
      iframe = document.createElement('iframe');
      iframe.name = self.iframeId;
      iframe.src = 'javascript:0';
    }

    iframe.id = self.iframeId;

    self.form.appendChild(iframe);
    self.iframe = iframe;
  }

  initIframe();

  // escape \n to prevent it from being converted into \r\n by some UAs
  // double escaping is required for escaped new lines because unescaping of new lines can be done safely on server-side
  data = data.replace(rEscapedNewline, '\\\n');
  this.area.value = data.replace(rNewline, '\\n');

  try {
    this.form.submit();
  } catch(e) {}

  if (this.iframe.attachEvent) {
    this.iframe.onreadystatechange = function(){
      if (self.iframe.readyState == 'complete') {
        complete();
      }
    };
  } else {
    this.iframe.onload = complete;
  }
};

}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : {})
},{"./polling":8,"component-inherit":16}],7:[function(_dereq_,module,exports){
(function (global){
/**
 * Module requirements.
 */

var XMLHttpRequest = _dereq_('xmlhttprequest-ssl');
var Polling = _dereq_('./polling');
var Emitter = _dereq_('component-emitter');
var inherit = _dereq_('component-inherit');
var debug = _dereq_('debug')('engine.io-client:polling-xhr');

/**
 * Module exports.
 */

module.exports = XHR;
module.exports.Request = Request;

/**
 * Empty function
 */

function empty(){}

/**
 * XHR Polling constructor.
 *
 * @param {Object} opts
 * @api public
 */

function XHR(opts){
  Polling.call(this, opts);

  if (global.location) {
    var isSSL = 'https:' == location.protocol;
    var port = location.port;

    // some user agents have empty `location.port`
    if (!port) {
      port = isSSL ? 443 : 80;
    }

    this.xd = opts.hostname != global.location.hostname ||
      port != opts.port;
    this.xs = opts.secure != isSSL;
  } else {
    this.extraHeaders = opts.extraHeaders;
  }
}

/**
 * Inherits from Polling.
 */

inherit(XHR, Polling);

/**
 * XHR supports binary
 */

XHR.prototype.supportsBinary = true;

/**
 * Creates a request.
 *
 * @param {String} method
 * @api private
 */

XHR.prototype.request = function(opts){
  opts = opts || {};
  opts.uri = this.uri();
  opts.xd = this.xd;
  opts.xs = this.xs;
  opts.agent = this.agent || false;
  opts.supportsBinary = this.supportsBinary;
  opts.enablesXDR = this.enablesXDR;

  // SSL options for Node.js client
  opts.pfx = this.pfx;
  opts.key = this.key;
  opts.passphrase = this.passphrase;
  opts.cert = this.cert;
  opts.ca = this.ca;
  opts.ciphers = this.ciphers;
  opts.rejectUnauthorized = this.rejectUnauthorized;

  // other options for Node.js client
  opts.extraHeaders = this.extraHeaders;

  return new Request(opts);
};

/**
 * Sends data.
 *
 * @param {String} data to send.
 * @param {Function} called upon flush.
 * @api private
 */

XHR.prototype.doWrite = function(data, fn){
  var isBinary = typeof data !== 'string' && data !== undefined;
  var req = this.request({ method: 'POST', data: data, isBinary: isBinary });
  var self = this;
  req.on('success', fn);
  req.on('error', function(err){
    self.onError('xhr post error', err);
  });
  this.sendXhr = req;
};

/**
 * Starts a poll cycle.
 *
 * @api private
 */

XHR.prototype.doPoll = function(){
  debug('xhr poll');
  var req = this.request();
  var self = this;
  req.on('data', function(data){
    self.onData(data);
  });
  req.on('error', function(err){
    self.onError('xhr poll error', err);
  });
  this.pollXhr = req;
};

/**
 * Request constructor
 *
 * @param {Object} options
 * @api public
 */

function Request(opts){
  this.method = opts.method || 'GET';
  this.uri = opts.uri;
  this.xd = !!opts.xd;
  this.xs = !!opts.xs;
  this.async = false !== opts.async;
  this.data = undefined != opts.data ? opts.data : null;
  this.agent = opts.agent;
  this.isBinary = opts.isBinary;
  this.supportsBinary = opts.supportsBinary;
  this.enablesXDR = opts.enablesXDR;

  // SSL options for Node.js client
  this.pfx = opts.pfx;
  this.key = opts.key;
  this.passphrase = opts.passphrase;
  this.cert = opts.cert;
  this.ca = opts.ca;
  this.ciphers = opts.ciphers;
  this.rejectUnauthorized = opts.rejectUnauthorized;

  // other options for Node.js client
  this.extraHeaders = opts.extraHeaders;

  this.create();
}

/**
 * Mix in `Emitter`.
 */

Emitter(Request.prototype);

/**
 * Creates the XHR object and sends the request.
 *
 * @api private
 */

Request.prototype.create = function(){
  var opts = { agent: this.agent, xdomain: this.xd, xscheme: this.xs, enablesXDR: this.enablesXDR };

  // SSL options for Node.js client
  opts.pfx = this.pfx;
  opts.key = this.key;
  opts.passphrase = this.passphrase;
  opts.cert = this.cert;
  opts.ca = this.ca;
  opts.ciphers = this.ciphers;
  opts.rejectUnauthorized = this.rejectUnauthorized;

  var xhr = this.xhr = new XMLHttpRequest(opts);
  var self = this;

  try {
    debug('xhr open %s: %s', this.method, this.uri);
    xhr.open(this.method, this.uri, this.async);
    try {
      if (this.extraHeaders) {
        xhr.setDisableHeaderCheck(true);
        for (var i in this.extraHeaders) {
          if (this.extraHeaders.hasOwnProperty(i)) {
            xhr.setRequestHeader(i, this.extraHeaders[i]);
          }
        }
      }
    } catch (e) {}
    if (this.supportsBinary) {
      // This has to be done after open because Firefox is stupid
      // http://stackoverflow.com/questions/13216903/get-binary-data-with-xmlhttprequest-in-a-firefox-extension
      xhr.responseType = 'arraybuffer';
    }

    if ('POST' == this.method) {
      try {
        if (this.isBinary) {
          xhr.setRequestHeader('Content-type', 'application/octet-stream');
        } else {
          xhr.setRequestHeader('Content-type', 'text/plain;charset=UTF-8');
        }
      } catch (e) {}
    }

    // ie6 check
    if ('withCredentials' in xhr) {
      xhr.withCredentials = true;
    }

    if (this.hasXDR()) {
      xhr.onload = function(){
        self.onLoad();
      };
      xhr.onerror = function(){
        self.onError(xhr.responseText);
      };
    } else {
      xhr.onreadystatechange = function(){
        if (4 != xhr.readyState) return;
        if (200 == xhr.status || 1223 == xhr.status) {
          self.onLoad();
        } else {
          // make sure the `error` event handler that's user-set
          // does not throw in the same tick and gets caught here
          setTimeout(function(){
            self.onError(xhr.status);
          }, 0);
        }
      };
    }

    debug('xhr data %s', this.data);
    xhr.send(this.data);
  } catch (e) {
    // Need to defer since .create() is called directly fhrom the constructor
    // and thus the 'error' event can only be only bound *after* this exception
    // occurs.  Therefore, also, we cannot throw here at all.
    setTimeout(function() {
      self.onError(e);
    }, 0);
    return;
  }

  if (global.document) {
    this.index = Request.requestsCount++;
    Request.requests[this.index] = this;
  }
};

/**
 * Called upon successful response.
 *
 * @api private
 */

Request.prototype.onSuccess = function(){
  this.emit('success');
  this.cleanup();
};

/**
 * Called if we have data.
 *
 * @api private
 */

Request.prototype.onData = function(data){
  this.emit('data', data);
  this.onSuccess();
};

/**
 * Called upon error.
 *
 * @api private
 */

Request.prototype.onError = function(err){
  this.emit('error', err);
  this.cleanup(true);
};

/**
 * Cleans up house.
 *
 * @api private
 */

Request.prototype.cleanup = function(fromError){
  if ('undefined' == typeof this.xhr || null === this.xhr) {
    return;
  }
  // xmlhttprequest
  if (this.hasXDR()) {
    this.xhr.onload = this.xhr.onerror = empty;
  } else {
    this.xhr.onreadystatechange = empty;
  }

  if (fromError) {
    try {
      this.xhr.abort();
    } catch(e) {}
  }

  if (global.document) {
    delete Request.requests[this.index];
  }

  this.xhr = null;
};

/**
 * Called upon load.
 *
 * @api private
 */

Request.prototype.onLoad = function(){
  var data;
  try {
    var contentType;
    try {
      contentType = this.xhr.getResponseHeader('Content-Type').split(';')[0];
    } catch (e) {}
    if (contentType === 'application/octet-stream') {
      data = this.xhr.response;
    } else {
      if (!this.supportsBinary) {
        data = this.xhr.responseText;
      } else {
        try {
          data = String.fromCharCode.apply(null, new Uint8Array(this.xhr.response));
        } catch (e) {
          var ui8Arr = new Uint8Array(this.xhr.response);
          var dataArray = [];
          for (var idx = 0, length = ui8Arr.length; idx < length; idx++) {
            dataArray.push(ui8Arr[idx]);
          }

          data = String.fromCharCode.apply(null, dataArray);
        }
      }
    }
  } catch (e) {
    this.onError(e);
  }
  if (null != data) {
    this.onData(data);
  }
};

/**
 * Check if it has XDomainRequest.
 *
 * @api private
 */

Request.prototype.hasXDR = function(){
  return 'undefined' !== typeof global.XDomainRequest && !this.xs && this.enablesXDR;
};

/**
 * Aborts the request.
 *
 * @api public
 */

Request.prototype.abort = function(){
  this.cleanup();
};

/**
 * Aborts pending requests when unloading the window. This is needed to prevent
 * memory leaks (e.g. when using IE) and to ensure that no spurious error is
 * emitted.
 */

if (global.document) {
  Request.requestsCount = 0;
  Request.requests = {};
  if (global.attachEvent) {
    global.attachEvent('onunload', unloadHandler);
  } else if (global.addEventListener) {
    global.addEventListener('beforeunload', unloadHandler, false);
  }
}

function unloadHandler() {
  for (var i in Request.requests) {
    if (Request.requests.hasOwnProperty(i)) {
      Request.requests[i].abort();
    }
  }
}

}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : {})
},{"./polling":8,"component-emitter":15,"component-inherit":16,"debug":17,"xmlhttprequest-ssl":10}],8:[function(_dereq_,module,exports){
/**
 * Module dependencies.
 */

var Transport = _dereq_('../transport');
var parseqs = _dereq_('parseqs');
var parser = _dereq_('engine.io-parser');
var inherit = _dereq_('component-inherit');
var yeast = _dereq_('yeast');
var debug = _dereq_('debug')('engine.io-client:polling');

/**
 * Module exports.
 */

module.exports = Polling;

/**
 * Is XHR2 supported?
 */

var hasXHR2 = (function() {
  var XMLHttpRequest = _dereq_('xmlhttprequest-ssl');
  var xhr = new XMLHttpRequest({ xdomain: false });
  return null != xhr.responseType;
})();

/**
 * Polling interface.
 *
 * @param {Object} opts
 * @api private
 */

function Polling(opts){
  var forceBase64 = (opts && opts.forceBase64);
  if (!hasXHR2 || forceBase64) {
    this.supportsBinary = false;
  }
  Transport.call(this, opts);
}

/**
 * Inherits from Transport.
 */

inherit(Polling, Transport);

/**
 * Transport name.
 */

Polling.prototype.name = 'polling';

/**
 * Opens the socket (triggers polling). We write a PING message to determine
 * when the transport is open.
 *
 * @api private
 */

Polling.prototype.doOpen = function(){
  this.poll();
};

/**
 * Pauses polling.
 *
 * @param {Function} callback upon buffers are flushed and transport is paused
 * @api private
 */

Polling.prototype.pause = function(onPause){
  var pending = 0;
  var self = this;

  this.readyState = 'pausing';

  function pause(){
    debug('paused');
    self.readyState = 'paused';
    onPause();
  }

  if (this.polling || !this.writable) {
    var total = 0;

    if (this.polling) {
      debug('we are currently polling - waiting to pause');
      total++;
      this.once('pollComplete', function(){
        debug('pre-pause polling complete');
        --total || pause();
      });
    }

    if (!this.writable) {
      debug('we are currently writing - waiting to pause');
      total++;
      this.once('drain', function(){
        debug('pre-pause writing complete');
        --total || pause();
      });
    }
  } else {
    pause();
  }
};

/**
 * Starts polling cycle.
 *
 * @api public
 */

Polling.prototype.poll = function(){
  debug('polling');
  this.polling = true;
  this.doPoll();
  this.emit('poll');
};

/**
 * Overloads onData to detect payloads.
 *
 * @api private
 */

Polling.prototype.onData = function(data){
  var self = this;
  debug('polling got data %s', data);
  var callback = function(packet, index, total) {
    // if its the first message we consider the transport open
    if ('opening' == self.readyState) {
      self.onOpen();
    }

    // if its a close packet, we close the ongoing requests
    if ('close' == packet.type) {
      self.onClose();
      return false;
    }

    // otherwise bypass onData and handle the message
    self.onPacket(packet);
  };

  // decode payload
  parser.decodePayload(data, this.socket.binaryType, callback);

  // if an event did not trigger closing
  if ('closed' != this.readyState) {
    // if we got data we're not polling
    this.polling = false;
    this.emit('pollComplete');

    if ('open' == this.readyState) {
      this.poll();
    } else {
      debug('ignoring poll - transport state "%s"', this.readyState);
    }
  }
};

/**
 * For polling, send a close packet.
 *
 * @api private
 */

Polling.prototype.doClose = function(){
  var self = this;

  function close(){
    debug('writing close packet');
    self.write([{ type: 'close' }]);
  }

  if ('open' == this.readyState) {
    debug('transport open - closing');
    close();
  } else {
    // in case we're trying to close while
    // handshaking is in progress (GH-164)
    debug('transport not open - deferring close');
    this.once('open', close);
  }
};

/**
 * Writes a packets payload.
 *
 * @param {Array} data packets
 * @param {Function} drain callback
 * @api private
 */

Polling.prototype.write = function(packets){
  var self = this;
  this.writable = false;
  var callbackfn = function() {
    self.writable = true;
    self.emit('drain');
  };

  var self = this;
  parser.encodePayload(packets, this.supportsBinary, function(data) {
    self.doWrite(data, callbackfn);
  });
};

/**
 * Generates uri for connection.
 *
 * @api private
 */

Polling.prototype.uri = function(){
  var query = this.query || {};
  var schema = this.secure ? 'https' : 'http';
  var port = '';

  // cache busting is forced
  if (false !== this.timestampRequests) {
    query[this.timestampParam] = yeast();
  }

  if (!this.supportsBinary && !query.sid) {
    query.b64 = 1;
  }

  query = parseqs.encode(query);

  // avoid port if default for schema
  if (this.port && (('https' == schema && this.port != 443) ||
     ('http' == schema && this.port != 80))) {
    port = ':' + this.port;
  }

  // prepend ? to query
  if (query.length) {
    query = '?' + query;
  }

  var ipv6 = this.hostname.indexOf(':') !== -1;
  return schema + '://' + (ipv6 ? '[' + this.hostname + ']' : this.hostname) + port + this.path + query;
};

},{"../transport":4,"component-inherit":16,"debug":17,"engine.io-parser":19,"parseqs":27,"xmlhttprequest-ssl":10,"yeast":30}],9:[function(_dereq_,module,exports){
(function (global){
/**
 * Module dependencies.
 */

var Transport = _dereq_('../transport');
var parser = _dereq_('engine.io-parser');
var parseqs = _dereq_('parseqs');
var inherit = _dereq_('component-inherit');
var yeast = _dereq_('yeast');
var debug = _dereq_('debug')('engine.io-client:websocket');
var BrowserWebSocket = global.WebSocket || global.MozWebSocket;

/**
 * Get either the `WebSocket` or `MozWebSocket` globals
 * in the browser or the WebSocket-compatible interface
 * exposed by `ws` for Node environment.
 */

var WebSocket = BrowserWebSocket || (typeof window !== 'undefined' ? null : _dereq_('ws'));

/**
 * Module exports.
 */

module.exports = WS;

/**
 * WebSocket transport constructor.
 *
 * @api {Object} connection options
 * @api public
 */

function WS(opts){
  var forceBase64 = (opts && opts.forceBase64);
  if (forceBase64) {
    this.supportsBinary = false;
  }
  this.perMessageDeflate = opts.perMessageDeflate;
  Transport.call(this, opts);
}

/**
 * Inherits from Transport.
 */

inherit(WS, Transport);

/**
 * Transport name.
 *
 * @api public
 */

WS.prototype.name = 'websocket';

/*
 * WebSockets support binary
 */

WS.prototype.supportsBinary = true;

/**
 * Opens socket.
 *
 * @api private
 */

WS.prototype.doOpen = function(){
  if (!this.check()) {
    // let probe timeout
    return;
  }

  var self = this;
  var uri = this.uri();
  var protocols = void(0);
  var opts = {
    agent: this.agent,
    perMessageDeflate: this.perMessageDeflate
  };

  // SSL options for Node.js client
  opts.pfx = this.pfx;
  opts.key = this.key;
  opts.passphrase = this.passphrase;
  opts.cert = this.cert;
  opts.ca = this.ca;
  opts.ciphers = this.ciphers;
  opts.rejectUnauthorized = this.rejectUnauthorized;
  if (this.extraHeaders) {
    opts.headers = this.extraHeaders;
  }

  this.ws = BrowserWebSocket ? new WebSocket(uri) : new WebSocket(uri, protocols, opts);

  if (this.ws.binaryType === undefined) {
    this.supportsBinary = false;
  }

  if (this.ws.supports && this.ws.supports.binary) {
    this.supportsBinary = true;
    this.ws.binaryType = 'buffer';
  } else {
    this.ws.binaryType = 'arraybuffer';
  }

  this.addEventListeners();
};

/**
 * Adds event listeners to the socket
 *
 * @api private
 */

WS.prototype.addEventListeners = function(){
  var self = this;

  this.ws.onopen = function(){
    self.onOpen();
  };
  this.ws.onclose = function(){
    self.onClose();
  };
  this.ws.onmessage = function(ev){
    self.onData(ev.data);
  };
  this.ws.onerror = function(e){
    self.onError('websocket error', e);
  };
};

/**
 * Override `onData` to use a timer on iOS.
 * See: https://gist.github.com/mloughran/2052006
 *
 * @api private
 */

if ('undefined' != typeof navigator
  && /iPad|iPhone|iPod/i.test(navigator.userAgent)) {
  WS.prototype.onData = function(data){
    var self = this;
    setTimeout(function(){
      Transport.prototype.onData.call(self, data);
    }, 0);
  };
}

/**
 * Writes data to socket.
 *
 * @param {Array} array of packets.
 * @api private
 */

WS.prototype.write = function(packets){
  var self = this;
  this.writable = false;

  // encodePacket efficient as it uses WS framing
  // no need for encodePayload
  var total = packets.length;
  for (var i = 0, l = total; i < l; i++) {
    (function(packet) {
      parser.encodePacket(packet, self.supportsBinary, function(data) {
        if (!BrowserWebSocket) {
          // always create a new object (GH-437)
          var opts = {};
          if (packet.options) {
            opts.compress = packet.options.compress;
          }

          if (self.perMessageDeflate) {
            var len = 'string' == typeof data ? global.Buffer.byteLength(data) : data.length;
            if (len < self.perMessageDeflate.threshold) {
              opts.compress = false;
            }
          }
        }

        //Sometimes the websocket has already been closed but the browser didn't
        //have a chance of informing us about it yet, in that case send will
        //throw an error
        try {
          if (BrowserWebSocket) {
            // TypeError is thrown when passing the second argument on Safari
            self.ws.send(data);
          } else {
            self.ws.send(data, opts);
          }
        } catch (e){
          debug('websocket closed before onclose event');
        }

        --total || done();
      });
    })(packets[i]);
  }

  function done(){
    self.emit('flush');

    // fake drain
    // defer to next tick to allow Socket to clear writeBuffer
    setTimeout(function(){
      self.writable = true;
      self.emit('drain');
    }, 0);
  }
};

/**
 * Called upon close
 *
 * @api private
 */

WS.prototype.onClose = function(){
  Transport.prototype.onClose.call(this);
};

/**
 * Closes socket.
 *
 * @api private
 */

WS.prototype.doClose = function(){
  if (typeof this.ws !== 'undefined') {
    this.ws.close();
  }
};

/**
 * Generates uri for connection.
 *
 * @api private
 */

WS.prototype.uri = function(){
  var query = this.query || {};
  var schema = this.secure ? 'wss' : 'ws';
  var port = '';

  // avoid port if default for schema
  if (this.port && (('wss' == schema && this.port != 443)
    || ('ws' == schema && this.port != 80))) {
    port = ':' + this.port;
  }

  // append timestamp to URI
  if (this.timestampRequests) {
    query[this.timestampParam] = yeast();
  }

  // communicate binary support capabilities
  if (!this.supportsBinary) {
    query.b64 = 1;
  }

  query = parseqs.encode(query);

  // prepend ? to query
  if (query.length) {
    query = '?' + query;
  }

  var ipv6 = this.hostname.indexOf(':') !== -1;
  return schema + '://' + (ipv6 ? '[' + this.hostname + ']' : this.hostname) + port + this.path + query;
};

/**
 * Feature detection for WebSocket.
 *
 * @return {Boolean} whether this transport is available.
 * @api public
 */

WS.prototype.check = function(){
  return !!WebSocket && !('__initialize' in WebSocket && this.name === WS.prototype.name);
};

}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : {})
},{"../transport":4,"component-inherit":16,"debug":17,"engine.io-parser":19,"parseqs":27,"ws":undefined,"yeast":30}],10:[function(_dereq_,module,exports){
// browser shim for xmlhttprequest module
var hasCORS = _dereq_('has-cors');

module.exports = function(opts) {
  var xdomain = opts.xdomain;

  // scheme must be same when usign XDomainRequest
  // http://blogs.msdn.com/b/ieinternals/archive/2010/05/13/xdomainrequest-restrictions-limitations-and-workarounds.aspx
  var xscheme = opts.xscheme;

  // XDomainRequest has a flow of not sending cookie, therefore it should be disabled as a default.
  // https://github.com/Automattic/engine.io-client/pull/217
  var enablesXDR = opts.enablesXDR;

  // XMLHttpRequest can be disabled on IE
  try {
    if ('undefined' != typeof XMLHttpRequest && (!xdomain || hasCORS)) {
      return new XMLHttpRequest();
    }
  } catch (e) { }

  // Use XDomainRequest for IE8 if enablesXDR is true
  // because loading bar keeps flashing when using jsonp-polling
  // https://github.com/yujiosaka/socke.io-ie8-loading-example
  try {
    if ('undefined' != typeof XDomainRequest && !xscheme && enablesXDR) {
      return new XDomainRequest();
    }
  } catch (e) { }

  if (!xdomain) {
    try {
      return new ActiveXObject('Microsoft.XMLHTTP');
    } catch(e) { }
  }
}

},{"has-cors":22}],11:[function(_dereq_,module,exports){
module.exports = after

function after(count, callback, err_cb) {
    var bail = false
    err_cb = err_cb || noop
    proxy.count = count

    return (count === 0) ? callback() : proxy

    function proxy(err, result) {
        if (proxy.count <= 0) {
            throw new Error('after called too many times')
        }
        --proxy.count

        // after first error, rest are passed to err_cb
        if (err) {
            bail = true
            callback(err)
            // future error callbacks will go to error handler
            callback = err_cb
        } else if (proxy.count === 0 && !bail) {
            callback(null, result)
        }
    }
}

function noop() {}

},{}],12:[function(_dereq_,module,exports){
/**
 * An abstraction for slicing an arraybuffer even when
 * ArrayBuffer.prototype.slice is not supported
 *
 * @api public
 */

module.exports = function(arraybuffer, start, end) {
  var bytes = arraybuffer.byteLength;
  start = start || 0;
  end = end || bytes;

  if (arraybuffer.slice) { return arraybuffer.slice(start, end); }

  if (start < 0) { start += bytes; }
  if (end < 0) { end += bytes; }
  if (end > bytes) { end = bytes; }

  if (start >= bytes || start >= end || bytes === 0) {
    return new ArrayBuffer(0);
  }

  var abv = new Uint8Array(arraybuffer);
  var result = new Uint8Array(end - start);
  for (var i = start, ii = 0; i < end; i++, ii++) {
    result[ii] = abv[i];
  }
  return result.buffer;
};

},{}],13:[function(_dereq_,module,exports){
/*
 * base64-arraybuffer
 * https://github.com/niklasvh/base64-arraybuffer
 *
 * Copyright (c) 2012 Niklas von Hertzen
 * Licensed under the MIT license.
 */
(function(chars){
  "use strict";

  exports.encode = function(arraybuffer) {
    var bytes = new Uint8Array(arraybuffer),
    i, len = bytes.length, base64 = "";

    for (i = 0; i < len; i+=3) {
      base64 += chars[bytes[i] >> 2];
      base64 += chars[((bytes[i] & 3) << 4) | (bytes[i + 1] >> 4)];
      base64 += chars[((bytes[i + 1] & 15) << 2) | (bytes[i + 2] >> 6)];
      base64 += chars[bytes[i + 2] & 63];
    }

    if ((len % 3) === 2) {
      base64 = base64.substring(0, base64.length - 1) + "=";
    } else if (len % 3 === 1) {
      base64 = base64.substring(0, base64.length - 2) + "==";
    }

    return base64;
  };

  exports.decode =  function(base64) {
    var bufferLength = base64.length * 0.75,
    len = base64.length, i, p = 0,
    encoded1, encoded2, encoded3, encoded4;

    if (base64[base64.length - 1] === "=") {
      bufferLength--;
      if (base64[base64.length - 2] === "=") {
        bufferLength--;
      }
    }

    var arraybuffer = new ArrayBuffer(bufferLength),
    bytes = new Uint8Array(arraybuffer);

    for (i = 0; i < len; i+=4) {
      encoded1 = chars.indexOf(base64[i]);
      encoded2 = chars.indexOf(base64[i+1]);
      encoded3 = chars.indexOf(base64[i+2]);
      encoded4 = chars.indexOf(base64[i+3]);

      bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
      bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
      bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63);
    }

    return arraybuffer;
  };
})("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/");

},{}],14:[function(_dereq_,module,exports){
(function (global){
/**
 * Create a blob builder even when vendor prefixes exist
 */

var BlobBuilder = global.BlobBuilder
  || global.WebKitBlobBuilder
  || global.MSBlobBuilder
  || global.MozBlobBuilder;

/**
 * Check if Blob constructor is supported
 */

var blobSupported = (function() {
  try {
    var a = new Blob(['hi']);
    return a.size === 2;
  } catch(e) {
    return false;
  }
})();

/**
 * Check if Blob constructor supports ArrayBufferViews
 * Fails in Safari 6, so we need to map to ArrayBuffers there.
 */

var blobSupportsArrayBufferView = blobSupported && (function() {
  try {
    var b = new Blob([new Uint8Array([1,2])]);
    return b.size === 2;
  } catch(e) {
    return false;
  }
})();

/**
 * Check if BlobBuilder is supported
 */

var blobBuilderSupported = BlobBuilder
  && BlobBuilder.prototype.append
  && BlobBuilder.prototype.getBlob;

/**
 * Helper function that maps ArrayBufferViews to ArrayBuffers
 * Used by BlobBuilder constructor and old browsers that didn't
 * support it in the Blob constructor.
 */

function mapArrayBufferViews(ary) {
  for (var i = 0; i < ary.length; i++) {
    var chunk = ary[i];
    if (chunk.buffer instanceof ArrayBuffer) {
      var buf = chunk.buffer;

      // if this is a subarray, make a copy so we only
      // include the subarray region from the underlying buffer
      if (chunk.byteLength !== buf.byteLength) {
        var copy = new Uint8Array(chunk.byteLength);
        copy.set(new Uint8Array(buf, chunk.byteOffset, chunk.byteLength));
        buf = copy.buffer;
      }

      ary[i] = buf;
    }
  }
}

function BlobBuilderConstructor(ary, options) {
  options = options || {};

  var bb = new BlobBuilder();
  mapArrayBufferViews(ary);

  for (var i = 0; i < ary.length; i++) {
    bb.append(ary[i]);
  }

  return (options.type) ? bb.getBlob(options.type) : bb.getBlob();
};

function BlobConstructor(ary, options) {
  mapArrayBufferViews(ary);
  return new Blob(ary, options || {});
};

module.exports = (function() {
  if (blobSupported) {
    return blobSupportsArrayBufferView ? global.Blob : BlobConstructor;
  } else if (blobBuilderSupported) {
    return BlobBuilderConstructor;
  } else {
    return undefined;
  }
})();

}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : {})
},{}],15:[function(_dereq_,module,exports){

/**
 * Expose `Emitter`.
 */

module.exports = Emitter;

/**
 * Initialize a new `Emitter`.
 *
 * @api public
 */

function Emitter(obj) {
  if (obj) return mixin(obj);
};

/**
 * Mixin the emitter properties.
 *
 * @param {Object} obj
 * @return {Object}
 * @api private
 */

function mixin(obj) {
  for (var key in Emitter.prototype) {
    obj[key] = Emitter.prototype[key];
  }
  return obj;
}

/**
 * Listen on the given `event` with `fn`.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.on =
Emitter.prototype.addEventListener = function(event, fn){
  this._callbacks = this._callbacks || {};
  (this._callbacks[event] = this._callbacks[event] || [])
    .push(fn);
  return this;
};

/**
 * Adds an `event` listener that will be invoked a single
 * time then automatically removed.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.once = function(event, fn){
  var self = this;
  this._callbacks = this._callbacks || {};

  function on() {
    self.off(event, on);
    fn.apply(this, arguments);
  }

  on.fn = fn;
  this.on(event, on);
  return this;
};

/**
 * Remove the given callback for `event` or all
 * registered callbacks.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.off =
Emitter.prototype.removeListener =
Emitter.prototype.removeAllListeners =
Emitter.prototype.removeEventListener = function(event, fn){
  this._callbacks = this._callbacks || {};

  // all
  if (0 == arguments.length) {
    this._callbacks = {};
    return this;
  }

  // specific event
  var callbacks = this._callbacks[event];
  if (!callbacks) return this;

  // remove all handlers
  if (1 == arguments.length) {
    delete this._callbacks[event];
    return this;
  }

  // remove specific handler
  var cb;
  for (var i = 0; i < callbacks.length; i++) {
    cb = callbacks[i];
    if (cb === fn || cb.fn === fn) {
      callbacks.splice(i, 1);
      break;
    }
  }
  return this;
};

/**
 * Emit `event` with the given args.
 *
 * @param {String} event
 * @param {Mixed} ...
 * @return {Emitter}
 */

Emitter.prototype.emit = function(event){
  this._callbacks = this._callbacks || {};
  var args = [].slice.call(arguments, 1)
    , callbacks = this._callbacks[event];

  if (callbacks) {
    callbacks = callbacks.slice(0);
    for (var i = 0, len = callbacks.length; i < len; ++i) {
      callbacks[i].apply(this, args);
    }
  }

  return this;
};

/**
 * Return array of callbacks for `event`.
 *
 * @param {String} event
 * @return {Array}
 * @api public
 */

Emitter.prototype.listeners = function(event){
  this._callbacks = this._callbacks || {};
  return this._callbacks[event] || [];
};

/**
 * Check if this emitter has `event` handlers.
 *
 * @param {String} event
 * @return {Boolean}
 * @api public
 */

Emitter.prototype.hasListeners = function(event){
  return !! this.listeners(event).length;
};

},{}],16:[function(_dereq_,module,exports){

module.exports = function(a, b){
  var fn = function(){};
  fn.prototype = b.prototype;
  a.prototype = new fn;
  a.prototype.constructor = a;
};
},{}],17:[function(_dereq_,module,exports){

/**
 * This is the web browser implementation of `debug()`.
 *
 * Expose `debug()` as the module.
 */

exports = module.exports = _dereq_('./debug');
exports.log = log;
exports.formatArgs = formatArgs;
exports.save = save;
exports.load = load;
exports.useColors = useColors;
exports.storage = 'undefined' != typeof chrome
               && 'undefined' != typeof chrome.storage
                  ? chrome.storage.local
                  : localstorage();

/**
 * Colors.
 */

exports.colors = [
  'lightseagreen',
  'forestgreen',
  'goldenrod',
  'dodgerblue',
  'darkorchid',
  'crimson'
];

/**
 * Currently only WebKit-based Web Inspectors, Firefox >= v31,
 * and the Firebug extension (any Firefox version) are known
 * to support "%c" CSS customizations.
 *
 * TODO: add a `localStorage` variable to explicitly enable/disable colors
 */

function useColors() {
  // is webkit? http://stackoverflow.com/a/16459606/376773
  return ('WebkitAppearance' in document.documentElement.style) ||
    // is firebug? http://stackoverflow.com/a/398120/376773
    (window.console && (console.firebug || (console.exception && console.table))) ||
    // is firefox >= v31?
    // https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
    (navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/) && parseInt(RegExp.$1, 10) >= 31);
}

/**
 * Map %j to `JSON.stringify()`, since no Web Inspectors do that by default.
 */

exports.formatters.j = function(v) {
  return JSON.stringify(v);
};


/**
 * Colorize log arguments if enabled.
 *
 * @api public
 */

function formatArgs() {
  var args = arguments;
  var useColors = this.useColors;

  args[0] = (useColors ? '%c' : '')
    + this.namespace
    + (useColors ? ' %c' : ' ')
    + args[0]
    + (useColors ? '%c ' : ' ')
    + '+' + exports.humanize(this.diff);

  if (!useColors) return args;

  var c = 'color: ' + this.color;
  args = [args[0], c, 'color: inherit'].concat(Array.prototype.slice.call(args, 1));

  // the final "%c" is somewhat tricky, because there could be other
  // arguments passed either before or after the %c, so we need to
  // figure out the correct index to insert the CSS into
  var index = 0;
  var lastC = 0;
  args[0].replace(/%[a-z%]/g, function(match) {
    if ('%%' === match) return;
    index++;
    if ('%c' === match) {
      // we only are interested in the *last* %c
      // (the user may have provided their own)
      lastC = index;
    }
  });

  args.splice(lastC, 0, c);
  return args;
}

/**
 * Invokes `console.log()` when available.
 * No-op when `console.log` is not a "function".
 *
 * @api public
 */

function log() {
  // this hackery is required for IE8/9, where
  // the `console.log` function doesn't have 'apply'
  return 'object' === typeof console
    && console.log
    && Function.prototype.apply.call(console.log, console, arguments);
}

/**
 * Save `namespaces`.
 *
 * @param {String} namespaces
 * @api private
 */

function save(namespaces) {
  try {
    if (null == namespaces) {
      exports.storage.removeItem('debug');
    } else {
      exports.storage.debug = namespaces;
    }
  } catch(e) {}
}

/**
 * Load `namespaces`.
 *
 * @return {String} returns the previously persisted debug modes
 * @api private
 */

function load() {
  var r;
  try {
    r = exports.storage.debug;
  } catch(e) {}
  return r;
}

/**
 * Enable namespaces listed in `localStorage.debug` initially.
 */

exports.enable(load());

/**
 * Localstorage attempts to return the localstorage.
 *
 * This is necessary because safari throws
 * when a user disables cookies/localstorage
 * and you attempt to access it.
 *
 * @return {LocalStorage}
 * @api private
 */

function localstorage(){
  try {
    return window.localStorage;
  } catch (e) {}
}

},{"./debug":18}],18:[function(_dereq_,module,exports){

/**
 * This is the common logic for both the Node.js and web browser
 * implementations of `debug()`.
 *
 * Expose `debug()` as the module.
 */

exports = module.exports = debug;
exports.coerce = coerce;
exports.disable = disable;
exports.enable = enable;
exports.enabled = enabled;
exports.humanize = _dereq_('ms');

/**
 * The currently active debug mode names, and names to skip.
 */

exports.names = [];
exports.skips = [];

/**
 * Map of special "%n" handling functions, for the debug "format" argument.
 *
 * Valid key names are a single, lowercased letter, i.e. "n".
 */

exports.formatters = {};

/**
 * Previously assigned color.
 */

var prevColor = 0;

/**
 * Previous log timestamp.
 */

var prevTime;

/**
 * Select a color.
 *
 * @return {Number}
 * @api private
 */

function selectColor() {
  return exports.colors[prevColor++ % exports.colors.length];
}

/**
 * Create a debugger with the given `namespace`.
 *
 * @param {String} namespace
 * @return {Function}
 * @api public
 */

function debug(namespace) {

  // define the `disabled` version
  function disabled() {
  }
  disabled.enabled = false;

  // define the `enabled` version
  function enabled() {

    var self = enabled;

    // set `diff` timestamp
    var curr = +new Date();
    var ms = curr - (prevTime || curr);
    self.diff = ms;
    self.prev = prevTime;
    self.curr = curr;
    prevTime = curr;

    // add the `color` if not set
    if (null == self.useColors) self.useColors = exports.useColors();
    if (null == self.color && self.useColors) self.color = selectColor();

    var args = Array.prototype.slice.call(arguments);

    args[0] = exports.coerce(args[0]);

    if ('string' !== typeof args[0]) {
      // anything else let's inspect with %o
      args = ['%o'].concat(args);
    }

    // apply any `formatters` transformations
    var index = 0;
    args[0] = args[0].replace(/%([a-z%])/g, function(match, format) {
      // if we encounter an escaped % then don't increase the array index
      if (match === '%%') return match;
      index++;
      var formatter = exports.formatters[format];
      if ('function' === typeof formatter) {
        var val = args[index];
        match = formatter.call(self, val);

        // now we need to remove `args[index]` since it's inlined in the `format`
        args.splice(index, 1);
        index--;
      }
      return match;
    });

    if ('function' === typeof exports.formatArgs) {
      args = exports.formatArgs.apply(self, args);
    }
    var logFn = enabled.log || exports.log || console.log.bind(console);
    logFn.apply(self, args);
  }
  enabled.enabled = true;

  var fn = exports.enabled(namespace) ? enabled : disabled;

  fn.namespace = namespace;

  return fn;
}

/**
 * Enables a debug mode by namespaces. This can include modes
 * separated by a colon and wildcards.
 *
 * @param {String} namespaces
 * @api public
 */

function enable(namespaces) {
  exports.save(namespaces);

  var split = (namespaces || '').split(/[\s,]+/);
  var len = split.length;

  for (var i = 0; i < len; i++) {
    if (!split[i]) continue; // ignore empty strings
    namespaces = split[i].replace(/\*/g, '.*?');
    if (namespaces[0] === '-') {
      exports.skips.push(new RegExp('^' + namespaces.substr(1) + '$'));
    } else {
      exports.names.push(new RegExp('^' + namespaces + '$'));
    }
  }
}

/**
 * Disable debug output.
 *
 * @api public
 */

function disable() {
  exports.enable('');
}

/**
 * Returns true if the given mode name is enabled, false otherwise.
 *
 * @param {String} name
 * @return {Boolean}
 * @api public
 */

function enabled(name) {
  var i, len;
  for (i = 0, len = exports.skips.length; i < len; i++) {
    if (exports.skips[i].test(name)) {
      return false;
    }
  }
  for (i = 0, len = exports.names.length; i < len; i++) {
    if (exports.names[i].test(name)) {
      return true;
    }
  }
  return false;
}

/**
 * Coerce `val`.
 *
 * @param {Mixed} val
 * @return {Mixed}
 * @api private
 */

function coerce(val) {
  if (val instanceof Error) return val.stack || val.message;
  return val;
}

},{"ms":25}],19:[function(_dereq_,module,exports){
(function (global){
/**
 * Module dependencies.
 */

var keys = _dereq_('./keys');
var hasBinary = _dereq_('has-binary');
var sliceBuffer = _dereq_('arraybuffer.slice');
var base64encoder = _dereq_('base64-arraybuffer');
var after = _dereq_('after');
var utf8 = _dereq_('utf8');

/**
 * Check if we are running an android browser. That requires us to use
 * ArrayBuffer with polling transports...
 *
 * http://ghinda.net/jpeg-blob-ajax-android/
 */

var isAndroid = navigator.userAgent.match(/Android/i);

/**
 * Check if we are running in PhantomJS.
 * Uploading a Blob with PhantomJS does not work correctly, as reported here:
 * https://github.com/ariya/phantomjs/issues/11395
 * @type boolean
 */
var isPhantomJS = /PhantomJS/i.test(navigator.userAgent);

/**
 * When true, avoids using Blobs to encode payloads.
 * @type boolean
 */
var dontSendBlobs = isAndroid || isPhantomJS;

/**
 * Current protocol version.
 */

exports.protocol = 3;

/**
 * Packet types.
 */

var packets = exports.packets = {
    open:     0    // non-ws
  , close:    1    // non-ws
  , ping:     2
  , pong:     3
  , message:  4
  , upgrade:  5
  , noop:     6
};

var packetslist = keys(packets);

/**
 * Premade error packet.
 */

var err = { type: 'error', data: 'parser error' };

/**
 * Create a blob api even for blob builder when vendor prefixes exist
 */

var Blob = _dereq_('blob');

/**
 * Encodes a packet.
 *
 *     <packet type id> [ <data> ]
 *
 * Example:
 *
 *     5hello world
 *     3
 *     4
 *
 * Binary is encoded in an identical principle
 *
 * @api private
 */

exports.encodePacket = function (packet, supportsBinary, utf8encode, callback) {
  if ('function' == typeof supportsBinary) {
    callback = supportsBinary;
    supportsBinary = false;
  }

  if ('function' == typeof utf8encode) {
    callback = utf8encode;
    utf8encode = null;
  }

  var data = (packet.data === undefined)
    ? undefined
    : packet.data.buffer || packet.data;

  if (global.ArrayBuffer && data instanceof ArrayBuffer) {
    return encodeArrayBuffer(packet, supportsBinary, callback);
  } else if (Blob && data instanceof global.Blob) {
    return encodeBlob(packet, supportsBinary, callback);
  }

  // might be an object with { base64: true, data: dataAsBase64String }
  if (data && data.base64) {
    return encodeBase64Object(packet, callback);
  }

  // Sending data as a utf-8 string
  var encoded = packets[packet.type];

  // data fragment is optional
  if (undefined !== packet.data) {
    encoded += utf8encode ? utf8.encode(String(packet.data)) : String(packet.data);
  }

  return callback('' + encoded);

};

function encodeBase64Object(packet, callback) {
  // packet data is an object { base64: true, data: dataAsBase64String }
  var message = 'b' + exports.packets[packet.type] + packet.data.data;
  return callback(message);
}

/**
 * Encode packet helpers for binary types
 */

function encodeArrayBuffer(packet, supportsBinary, callback) {
  if (!supportsBinary) {
    return exports.encodeBase64Packet(packet, callback);
  }

  var data = packet.data;
  var contentArray = new Uint8Array(data);
  var resultBuffer = new Uint8Array(1 + data.byteLength);

  resultBuffer[0] = packets[packet.type];
  for (var i = 0; i < contentArray.length; i++) {
    resultBuffer[i+1] = contentArray[i];
  }

  return callback(resultBuffer.buffer);
}

function encodeBlobAsArrayBuffer(packet, supportsBinary, callback) {
  if (!supportsBinary) {
    return exports.encodeBase64Packet(packet, callback);
  }

  var fr = new FileReader();
  fr.onload = function() {
    packet.data = fr.result;
    exports.encodePacket(packet, supportsBinary, true, callback);
  };
  return fr.readAsArrayBuffer(packet.data);
}

function encodeBlob(packet, supportsBinary, callback) {
  if (!supportsBinary) {
    return exports.encodeBase64Packet(packet, callback);
  }

  if (dontSendBlobs) {
    return encodeBlobAsArrayBuffer(packet, supportsBinary, callback);
  }

  var length = new Uint8Array(1);
  length[0] = packets[packet.type];
  var blob = new Blob([length.buffer, packet.data]);

  return callback(blob);
}

/**
 * Encodes a packet with binary data in a base64 string
 *
 * @param {Object} packet, has `type` and `data`
 * @return {String} base64 encoded message
 */

exports.encodeBase64Packet = function(packet, callback) {
  var message = 'b' + exports.packets[packet.type];
  if (Blob && packet.data instanceof global.Blob) {
    var fr = new FileReader();
    fr.onload = function() {
      var b64 = fr.result.split(',')[1];
      callback(message + b64);
    };
    return fr.readAsDataURL(packet.data);
  }

  var b64data;
  try {
    b64data = String.fromCharCode.apply(null, new Uint8Array(packet.data));
  } catch (e) {
    // iPhone Safari doesn't let you apply with typed arrays
    var typed = new Uint8Array(packet.data);
    var basic = new Array(typed.length);
    for (var i = 0; i < typed.length; i++) {
      basic[i] = typed[i];
    }
    b64data = String.fromCharCode.apply(null, basic);
  }
  message += global.btoa(b64data);
  return callback(message);
};

/**
 * Decodes a packet. Changes format to Blob if requested.
 *
 * @return {Object} with `type` and `data` (if any)
 * @api private
 */

exports.decodePacket = function (data, binaryType, utf8decode) {
  // String data
  if (typeof data == 'string' || data === undefined) {
    if (data.charAt(0) == 'b') {
      return exports.decodeBase64Packet(data.substr(1), binaryType);
    }

    if (utf8decode) {
      try {
        data = utf8.decode(data);
      } catch (e) {
        return err;
      }
    }
    var type = data.charAt(0);

    if (Number(type) != type || !packetslist[type]) {
      return err;
    }

    if (data.length > 1) {
      return { type: packetslist[type], data: data.substring(1) };
    } else {
      return { type: packetslist[type] };
    }
  }

  var asArray = new Uint8Array(data);
  var type = asArray[0];
  var rest = sliceBuffer(data, 1);
  if (Blob && binaryType === 'blob') {
    rest = new Blob([rest]);
  }
  return { type: packetslist[type], data: rest };
};

/**
 * Decodes a packet encoded in a base64 string
 *
 * @param {String} base64 encoded message
 * @return {Object} with `type` and `data` (if any)
 */

exports.decodeBase64Packet = function(msg, binaryType) {
  var type = packetslist[msg.charAt(0)];
  if (!global.ArrayBuffer) {
    return { type: type, data: { base64: true, data: msg.substr(1) } };
  }

  var data = base64encoder.decode(msg.substr(1));

  if (binaryType === 'blob' && Blob) {
    data = new Blob([data]);
  }

  return { type: type, data: data };
};

/**
 * Encodes multiple messages (payload).
 *
 *     <length>:data
 *
 * Example:
 *
 *     11:hello world2:hi
 *
 * If any contents are binary, they will be encoded as base64 strings. Base64
 * encoded strings are marked with a b before the length specifier
 *
 * @param {Array} packets
 * @api private
 */

exports.encodePayload = function (packets, supportsBinary, callback) {
  if (typeof supportsBinary == 'function') {
    callback = supportsBinary;
    supportsBinary = null;
  }

  var isBinary = hasBinary(packets);

  if (supportsBinary && isBinary) {
    if (Blob && !dontSendBlobs) {
      return exports.encodePayloadAsBlob(packets, callback);
    }

    return exports.encodePayloadAsArrayBuffer(packets, callback);
  }

  if (!packets.length) {
    return callback('0:');
  }

  function setLengthHeader(message) {
    return message.length + ':' + message;
  }

  function encodeOne(packet, doneCallback) {
    exports.encodePacket(packet, !isBinary ? false : supportsBinary, true, function(message) {
      doneCallback(null, setLengthHeader(message));
    });
  }

  map(packets, encodeOne, function(err, results) {
    return callback(results.join(''));
  });
};

/**
 * Async array map using after
 */

function map(ary, each, done) {
  var result = new Array(ary.length);
  var next = after(ary.length, done);

  var eachWithIndex = function(i, el, cb) {
    each(el, function(error, msg) {
      result[i] = msg;
      cb(error, result);
    });
  };

  for (var i = 0; i < ary.length; i++) {
    eachWithIndex(i, ary[i], next);
  }
}

/*
 * Decodes data when a payload is maybe expected. Possible binary contents are
 * decoded from their base64 representation
 *
 * @param {String} data, callback method
 * @api public
 */

exports.decodePayload = function (data, binaryType, callback) {
  if (typeof data != 'string') {
    return exports.decodePayloadAsBinary(data, binaryType, callback);
  }

  if (typeof binaryType === 'function') {
    callback = binaryType;
    binaryType = null;
  }

  var packet;
  if (data == '') {
    // parser error - ignoring payload
    return callback(err, 0, 1);
  }

  var length = ''
    , n, msg;

  for (var i = 0, l = data.length; i < l; i++) {
    var chr = data.charAt(i);

    if (':' != chr) {
      length += chr;
    } else {
      if ('' == length || (length != (n = Number(length)))) {
        // parser error - ignoring payload
        return callback(err, 0, 1);
      }

      msg = data.substr(i + 1, n);

      if (length != msg.length) {
        // parser error - ignoring payload
        return callback(err, 0, 1);
      }

      if (msg.length) {
        packet = exports.decodePacket(msg, binaryType, true);

        if (err.type == packet.type && err.data == packet.data) {
          // parser error in individual packet - ignoring payload
          return callback(err, 0, 1);
        }

        var ret = callback(packet, i + n, l);
        if (false === ret) return;
      }

      // advance cursor
      i += n;
      length = '';
    }
  }

  if (length != '') {
    // parser error - ignoring payload
    return callback(err, 0, 1);
  }

};

/**
 * Encodes multiple messages (payload) as binary.
 *
 * <1 = binary, 0 = string><number from 0-9><number from 0-9>[...]<number
 * 255><data>
 *
 * Example:
 * 1 3 255 1 2 3, if the binary contents are interpreted as 8 bit integers
 *
 * @param {Array} packets
 * @return {ArrayBuffer} encoded payload
 * @api private
 */

exports.encodePayloadAsArrayBuffer = function(packets, callback) {
  if (!packets.length) {
    return callback(new ArrayBuffer(0));
  }

  function encodeOne(packet, doneCallback) {
    exports.encodePacket(packet, true, true, function(data) {
      return doneCallback(null, data);
    });
  }

  map(packets, encodeOne, function(err, encodedPackets) {
    var totalLength = encodedPackets.reduce(function(acc, p) {
      var len;
      if (typeof p === 'string'){
        len = p.length;
      } else {
        len = p.byteLength;
      }
      return acc + len.toString().length + len + 2; // string/binary identifier + separator = 2
    }, 0);

    var resultArray = new Uint8Array(totalLength);

    var bufferIndex = 0;
    encodedPackets.forEach(function(p) {
      var isString = typeof p === 'string';
      var ab = p;
      if (isString) {
        var view = new Uint8Array(p.length);
        for (var i = 0; i < p.length; i++) {
          view[i] = p.charCodeAt(i);
        }
        ab = view.buffer;
      }

      if (isString) { // not true binary
        resultArray[bufferIndex++] = 0;
      } else { // true binary
        resultArray[bufferIndex++] = 1;
      }

      var lenStr = ab.byteLength.toString();
      for (var i = 0; i < lenStr.length; i++) {
        resultArray[bufferIndex++] = parseInt(lenStr[i]);
      }
      resultArray[bufferIndex++] = 255;

      var view = new Uint8Array(ab);
      for (var i = 0; i < view.length; i++) {
        resultArray[bufferIndex++] = view[i];
      }
    });

    return callback(resultArray.buffer);
  });
};

/**
 * Encode as Blob
 */

exports.encodePayloadAsBlob = function(packets, callback) {
  function encodeOne(packet, doneCallback) {
    exports.encodePacket(packet, true, true, function(encoded) {
      var binaryIdentifier = new Uint8Array(1);
      binaryIdentifier[0] = 1;
      if (typeof encoded === 'string') {
        var view = new Uint8Array(encoded.length);
        for (var i = 0; i < encoded.length; i++) {
          view[i] = encoded.charCodeAt(i);
        }
        encoded = view.buffer;
        binaryIdentifier[0] = 0;
      }

      var len = (encoded instanceof ArrayBuffer)
        ? encoded.byteLength
        : encoded.size;

      var lenStr = len.toString();
      var lengthAry = new Uint8Array(lenStr.length + 1);
      for (var i = 0; i < lenStr.length; i++) {
        lengthAry[i] = parseInt(lenStr[i]);
      }
      lengthAry[lenStr.length] = 255;

      if (Blob) {
        var blob = new Blob([binaryIdentifier.buffer, lengthAry.buffer, encoded]);
        doneCallback(null, blob);
      }
    });
  }

  map(packets, encodeOne, function(err, results) {
    return callback(new Blob(results));
  });
};

/*
 * Decodes data when a payload is maybe expected. Strings are decoded by
 * interpreting each byte as a key code for entries marked to start with 0. See
 * description of encodePayloadAsBinary
 *
 * @param {ArrayBuffer} data, callback method
 * @api public
 */

exports.decodePayloadAsBinary = function (data, binaryType, callback) {
  if (typeof binaryType === 'function') {
    callback = binaryType;
    binaryType = null;
  }

  var bufferTail = data;
  var buffers = [];

  var numberTooLong = false;
  while (bufferTail.byteLength > 0) {
    var tailArray = new Uint8Array(bufferTail);
    var isString = tailArray[0] === 0;
    var msgLength = '';

    for (var i = 1; ; i++) {
      if (tailArray[i] == 255) break;

      if (msgLength.length > 310) {
        numberTooLong = true;
        break;
      }

      msgLength += tailArray[i];
    }

    if(numberTooLong) return callback(err, 0, 1);

    bufferTail = sliceBuffer(bufferTail, 2 + msgLength.length);
    msgLength = parseInt(msgLength);

    var msg = sliceBuffer(bufferTail, 0, msgLength);
    if (isString) {
      try {
        msg = String.fromCharCode.apply(null, new Uint8Array(msg));
      } catch (e) {
        // iPhone Safari doesn't let you apply to typed arrays
        var typed = new Uint8Array(msg);
        msg = '';
        for (var i = 0; i < typed.length; i++) {
          msg += String.fromCharCode(typed[i]);
        }
      }
    }

    buffers.push(msg);
    bufferTail = sliceBuffer(bufferTail, msgLength);
  }

  var total = buffers.length;
  buffers.forEach(function(buffer, i) {
    callback(exports.decodePacket(buffer, binaryType, true), i, total);
  });
};

}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : {})
},{"./keys":20,"after":11,"arraybuffer.slice":12,"base64-arraybuffer":13,"blob":14,"has-binary":21,"utf8":29}],20:[function(_dereq_,module,exports){

/**
 * Gets the keys for an object.
 *
 * @return {Array} keys
 * @api private
 */

module.exports = Object.keys || function keys (obj){
  var arr = [];
  var has = Object.prototype.hasOwnProperty;

  for (var i in obj) {
    if (has.call(obj, i)) {
      arr.push(i);
    }
  }
  return arr;
};

},{}],21:[function(_dereq_,module,exports){
(function (global){

/*
 * Module requirements.
 */

var isArray = _dereq_('isarray');

/**
 * Module exports.
 */

module.exports = hasBinary;

/**
 * Checks for binary data.
 *
 * Right now only Buffer and ArrayBuffer are supported..
 *
 * @param {Object} anything
 * @api public
 */

function hasBinary(data) {

  function _hasBinary(obj) {
    if (!obj) return false;

    if ( (global.Buffer && global.Buffer.isBuffer(obj)) ||
         (global.ArrayBuffer && obj instanceof ArrayBuffer) ||
         (global.Blob && obj instanceof Blob) ||
         (global.File && obj instanceof File)
        ) {
      return true;
    }

    if (isArray(obj)) {
      for (var i = 0; i < obj.length; i++) {
          if (_hasBinary(obj[i])) {
              return true;
          }
      }
    } else if (obj && 'object' == typeof obj) {
      if (obj.toJSON) {
        obj = obj.toJSON();
      }

      for (var key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key) && _hasBinary(obj[key])) {
          return true;
        }
      }
    }

    return false;
  }

  return _hasBinary(data);
}

}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : {})
},{"isarray":24}],22:[function(_dereq_,module,exports){

/**
 * Module exports.
 *
 * Logic borrowed from Modernizr:
 *
 *   - https://github.com/Modernizr/Modernizr/blob/master/feature-detects/cors.js
 */

try {
  module.exports = typeof XMLHttpRequest !== 'undefined' &&
    'withCredentials' in new XMLHttpRequest();
} catch (err) {
  // if XMLHttp support is disabled in IE then it will throw
  // when trying to create
  module.exports = false;
}

},{}],23:[function(_dereq_,module,exports){

var indexOf = [].indexOf;

module.exports = function(arr, obj){
  if (indexOf) return arr.indexOf(obj);
  for (var i = 0; i < arr.length; ++i) {
    if (arr[i] === obj) return i;
  }
  return -1;
};
},{}],24:[function(_dereq_,module,exports){
module.exports = Array.isArray || function (arr) {
  return Object.prototype.toString.call(arr) == '[object Array]';
};

},{}],25:[function(_dereq_,module,exports){
/**
 * Helpers.
 */

var s = 1000;
var m = s * 60;
var h = m * 60;
var d = h * 24;
var y = d * 365.25;

/**
 * Parse or format the given `val`.
 *
 * Options:
 *
 *  - `long` verbose formatting [false]
 *
 * @param {String|Number} val
 * @param {Object} options
 * @return {String|Number}
 * @api public
 */

module.exports = function(val, options){
  options = options || {};
  if ('string' == typeof val) return parse(val);
  return options.long
    ? long(val)
    : short(val);
};

/**
 * Parse the given `str` and return milliseconds.
 *
 * @param {String} str
 * @return {Number}
 * @api private
 */

function parse(str) {
  str = '' + str;
  if (str.length > 10000) return;
  var match = /^((?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|years?|yrs?|y)?$/i.exec(str);
  if (!match) return;
  var n = parseFloat(match[1]);
  var type = (match[2] || 'ms').toLowerCase();
  switch (type) {
    case 'years':
    case 'year':
    case 'yrs':
    case 'yr':
    case 'y':
      return n * y;
    case 'days':
    case 'day':
    case 'd':
      return n * d;
    case 'hours':
    case 'hour':
    case 'hrs':
    case 'hr':
    case 'h':
      return n * h;
    case 'minutes':
    case 'minute':
    case 'mins':
    case 'min':
    case 'm':
      return n * m;
    case 'seconds':
    case 'second':
    case 'secs':
    case 'sec':
    case 's':
      return n * s;
    case 'milliseconds':
    case 'millisecond':
    case 'msecs':
    case 'msec':
    case 'ms':
      return n;
  }
}

/**
 * Short format for `ms`.
 *
 * @param {Number} ms
 * @return {String}
 * @api private
 */

function short(ms) {
  if (ms >= d) return Math.round(ms / d) + 'd';
  if (ms >= h) return Math.round(ms / h) + 'h';
  if (ms >= m) return Math.round(ms / m) + 'm';
  if (ms >= s) return Math.round(ms / s) + 's';
  return ms + 'ms';
}

/**
 * Long format for `ms`.
 *
 * @param {Number} ms
 * @return {String}
 * @api private
 */

function long(ms) {
  return plural(ms, d, 'day')
    || plural(ms, h, 'hour')
    || plural(ms, m, 'minute')
    || plural(ms, s, 'second')
    || ms + ' ms';
}

/**
 * Pluralization helper.
 */

function plural(ms, n, name) {
  if (ms < n) return;
  if (ms < n * 1.5) return Math.floor(ms / n) + ' ' + name;
  return Math.ceil(ms / n) + ' ' + name + 's';
}

},{}],26:[function(_dereq_,module,exports){
(function (global){
/**
 * JSON parse.
 *
 * @see Based on jQuery#parseJSON (MIT) and JSON2
 * @api private
 */

var rvalidchars = /^[\],:{}\s]*$/;
var rvalidescape = /\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g;
var rvalidtokens = /"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g;
var rvalidbraces = /(?:^|:|,)(?:\s*\[)+/g;
var rtrimLeft = /^\s+/;
var rtrimRight = /\s+$/;

module.exports = function parsejson(data) {
  if ('string' != typeof data || !data) {
    return null;
  }

  data = data.replace(rtrimLeft, '').replace(rtrimRight, '');

  // Attempt to parse using the native JSON parser first
  if (global.JSON && JSON.parse) {
    return JSON.parse(data);
  }

  if (rvalidchars.test(data.replace(rvalidescape, '@')
      .replace(rvalidtokens, ']')
      .replace(rvalidbraces, ''))) {
    return (new Function('return ' + data))();
  }
};
}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : {})
},{}],27:[function(_dereq_,module,exports){
/**
 * Compiles a querystring
 * Returns string representation of the object
 *
 * @param {Object}
 * @api private
 */

exports.encode = function (obj) {
  var str = '';

  for (var i in obj) {
    if (obj.hasOwnProperty(i)) {
      if (str.length) str += '&';
      str += encodeURIComponent(i) + '=' + encodeURIComponent(obj[i]);
    }
  }

  return str;
};

/**
 * Parses a simple querystring into an object
 *
 * @param {String} qs
 * @api private
 */

exports.decode = function(qs){
  var qry = {};
  var pairs = qs.split('&');
  for (var i = 0, l = pairs.length; i < l; i++) {
    var pair = pairs[i].split('=');
    qry[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
  }
  return qry;
};

},{}],28:[function(_dereq_,module,exports){
/**
 * Parses an URI
 *
 * @author Steven Levithan <stevenlevithan.com> (MIT license)
 * @api private
 */

var re = /^(?:(?![^:@]+:[^:@\/]*@)(http|https|ws|wss):\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?((?:[a-f0-9]{0,4}:){2,7}[a-f0-9]{0,4}|[^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/;

var parts = [
    'source', 'protocol', 'authority', 'userInfo', 'user', 'password', 'host', 'port', 'relative', 'path', 'directory', 'file', 'query', 'anchor'
];

module.exports = function parseuri(str) {
    var src = str,
        b = str.indexOf('['),
        e = str.indexOf(']');

    if (b != -1 && e != -1) {
        str = str.substring(0, b) + str.substring(b, e).replace(/:/g, ';') + str.substring(e, str.length);
    }

    var m = re.exec(str || ''),
        uri = {},
        i = 14;

    while (i--) {
        uri[parts[i]] = m[i] || '';
    }

    if (b != -1 && e != -1) {
        uri.source = src;
        uri.host = uri.host.substring(1, uri.host.length - 1).replace(/;/g, ':');
        uri.authority = uri.authority.replace('[', '').replace(']', '').replace(/;/g, ':');
        uri.ipv6uri = true;
    }

    return uri;
};

},{}],29:[function(_dereq_,module,exports){
(function (global){
/*! https://mths.be/utf8js v2.0.0 by @mathias */
;(function(root) {

	// Detect free variables `exports`
	var freeExports = typeof exports == 'object' && exports;

	// Detect free variable `module`
	var freeModule = typeof module == 'object' && module &&
		module.exports == freeExports && module;

	// Detect free variable `global`, from Node.js or Browserified code,
	// and use it as `root`
	var freeGlobal = typeof global == 'object' && global;
	if (freeGlobal.global === freeGlobal || freeGlobal.window === freeGlobal) {
		root = freeGlobal;
	}

	/*--------------------------------------------------------------------------*/

	var stringFromCharCode = String.fromCharCode;

	// Taken from https://mths.be/punycode
	function ucs2decode(string) {
		var output = [];
		var counter = 0;
		var length = string.length;
		var value;
		var extra;
		while (counter < length) {
			value = string.charCodeAt(counter++);
			if (value >= 0xD800 && value <= 0xDBFF && counter < length) {
				// high surrogate, and there is a next character
				extra = string.charCodeAt(counter++);
				if ((extra & 0xFC00) == 0xDC00) { // low surrogate
					output.push(((value & 0x3FF) << 10) + (extra & 0x3FF) + 0x10000);
				} else {
					// unmatched surrogate; only append this code unit, in case the next
					// code unit is the high surrogate of a surrogate pair
					output.push(value);
					counter--;
				}
			} else {
				output.push(value);
			}
		}
		return output;
	}

	// Taken from https://mths.be/punycode
	function ucs2encode(array) {
		var length = array.length;
		var index = -1;
		var value;
		var output = '';
		while (++index < length) {
			value = array[index];
			if (value > 0xFFFF) {
				value -= 0x10000;
				output += stringFromCharCode(value >>> 10 & 0x3FF | 0xD800);
				value = 0xDC00 | value & 0x3FF;
			}
			output += stringFromCharCode(value);
		}
		return output;
	}

	function checkScalarValue(codePoint) {
		if (codePoint >= 0xD800 && codePoint <= 0xDFFF) {
			throw Error(
				'Lone surrogate U+' + codePoint.toString(16).toUpperCase() +
				' is not a scalar value'
			);
		}
	}
	/*--------------------------------------------------------------------------*/

	function createByte(codePoint, shift) {
		return stringFromCharCode(((codePoint >> shift) & 0x3F) | 0x80);
	}

	function encodeCodePoint(codePoint) {
		if ((codePoint & 0xFFFFFF80) == 0) { // 1-byte sequence
			return stringFromCharCode(codePoint);
		}
		var symbol = '';
		if ((codePoint & 0xFFFFF800) == 0) { // 2-byte sequence
			symbol = stringFromCharCode(((codePoint >> 6) & 0x1F) | 0xC0);
		}
		else if ((codePoint & 0xFFFF0000) == 0) { // 3-byte sequence
			checkScalarValue(codePoint);
			symbol = stringFromCharCode(((codePoint >> 12) & 0x0F) | 0xE0);
			symbol += createByte(codePoint, 6);
		}
		else if ((codePoint & 0xFFE00000) == 0) { // 4-byte sequence
			symbol = stringFromCharCode(((codePoint >> 18) & 0x07) | 0xF0);
			symbol += createByte(codePoint, 12);
			symbol += createByte(codePoint, 6);
		}
		symbol += stringFromCharCode((codePoint & 0x3F) | 0x80);
		return symbol;
	}

	function utf8encode(string) {
		var codePoints = ucs2decode(string);
		var length = codePoints.length;
		var index = -1;
		var codePoint;
		var byteString = '';
		while (++index < length) {
			codePoint = codePoints[index];
			byteString += encodeCodePoint(codePoint);
		}
		return byteString;
	}

	/*--------------------------------------------------------------------------*/

	function readContinuationByte() {
		if (byteIndex >= byteCount) {
			throw Error('Invalid byte index');
		}

		var continuationByte = byteArray[byteIndex] & 0xFF;
		byteIndex++;

		if ((continuationByte & 0xC0) == 0x80) {
			return continuationByte & 0x3F;
		}

		// If we end up here, it’s not a continuation byte
		throw Error('Invalid continuation byte');
	}

	function decodeSymbol() {
		var byte1;
		var byte2;
		var byte3;
		var byte4;
		var codePoint;

		if (byteIndex > byteCount) {
			throw Error('Invalid byte index');
		}

		if (byteIndex == byteCount) {
			return false;
		}

		// Read first byte
		byte1 = byteArray[byteIndex] & 0xFF;
		byteIndex++;

		// 1-byte sequence (no continuation bytes)
		if ((byte1 & 0x80) == 0) {
			return byte1;
		}

		// 2-byte sequence
		if ((byte1 & 0xE0) == 0xC0) {
			var byte2 = readContinuationByte();
			codePoint = ((byte1 & 0x1F) << 6) | byte2;
			if (codePoint >= 0x80) {
				return codePoint;
			} else {
				throw Error('Invalid continuation byte');
			}
		}

		// 3-byte sequence (may include unpaired surrogates)
		if ((byte1 & 0xF0) == 0xE0) {
			byte2 = readContinuationByte();
			byte3 = readContinuationByte();
			codePoint = ((byte1 & 0x0F) << 12) | (byte2 << 6) | byte3;
			if (codePoint >= 0x0800) {
				checkScalarValue(codePoint);
				return codePoint;
			} else {
				throw Error('Invalid continuation byte');
			}
		}

		// 4-byte sequence
		if ((byte1 & 0xF8) == 0xF0) {
			byte2 = readContinuationByte();
			byte3 = readContinuationByte();
			byte4 = readContinuationByte();
			codePoint = ((byte1 & 0x0F) << 0x12) | (byte2 << 0x0C) |
				(byte3 << 0x06) | byte4;
			if (codePoint >= 0x010000 && codePoint <= 0x10FFFF) {
				return codePoint;
			}
		}

		throw Error('Invalid UTF-8 detected');
	}

	var byteArray;
	var byteCount;
	var byteIndex;
	function utf8decode(byteString) {
		byteArray = ucs2decode(byteString);
		byteCount = byteArray.length;
		byteIndex = 0;
		var codePoints = [];
		var tmp;
		while ((tmp = decodeSymbol()) !== false) {
			codePoints.push(tmp);
		}
		return ucs2encode(codePoints);
	}

	/*--------------------------------------------------------------------------*/

	var utf8 = {
		'version': '2.0.0',
		'encode': utf8encode,
		'decode': utf8decode
	};

	// Some AMD build optimizers, like r.js, check for specific condition patterns
	// like the following:
	if (
		typeof define == 'function' &&
		typeof define.amd == 'object' &&
		define.amd
	) {
		define(function() {
			return utf8;
		});
	}	else if (freeExports && !freeExports.nodeType) {
		if (freeModule) { // in Node.js or RingoJS v0.8.0+
			freeModule.exports = utf8;
		} else { // in Narwhal or RingoJS v0.7.0-
			var object = {};
			var hasOwnProperty = object.hasOwnProperty;
			for (var key in utf8) {
				hasOwnProperty.call(utf8, key) && (freeExports[key] = utf8[key]);
			}
		}
	} else { // in Rhino or a web browser
		root.utf8 = utf8;
	}

}(this));

}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : {})
},{}],30:[function(_dereq_,module,exports){
'use strict';

var alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_'.split('')
  , length = 64
  , map = {}
  , seed = 0
  , i = 0
  , prev;

/**
 * Return a string representing the specified number.
 *
 * @param {Number} num The number to convert.
 * @returns {String} The string representation of the number.
 * @api public
 */
function encode(num) {
  var encoded = '';

  do {
    encoded = alphabet[num % length] + encoded;
    num = Math.floor(num / length);
  } while (num > 0);

  return encoded;
}

/**
 * Return the integer value specified by the given string.
 *
 * @param {String} str The string to convert.
 * @returns {Number} The integer value represented by the string.
 * @api public
 */
function decode(str) {
  var decoded = 0;

  for (i = 0; i < str.length; i++) {
    decoded = decoded * length + map[str.charAt(i)];
  }

  return decoded;
}

/**
 * Yeast: A tiny growing id generator.
 *
 * @returns {String} A unique id.
 * @api public
 */
function yeast() {
  var now = encode(+new Date());

  if (now !== prev) return seed = 0, prev = now;
  return now +'.'+ encode(seed++);
}

//
// Map each character to its index.
//
for (; i < length; i++) map[alphabet[i]] = i;

//
// Expose the `yeast`, `encode` and `decode` functions.
//
yeast.encode = encode;
yeast.decode = decode;
module.exports = yeast;

},{}],31:[function(_dereq_,module,exports){

/**
 * Module dependencies.
 */

var url = _dereq_('./url');
var parser = _dereq_('socket.io-parser');
var Manager = _dereq_('./manager');
var debug = _dereq_('debug')('socket.io-client');

/**
 * Module exports.
 */

module.exports = exports = lookup;

/**
 * Managers cache.
 */

var cache = exports.managers = {};

/**
 * Looks up an existing `Manager` for multiplexing.
 * If the user summons:
 *
 *   `io('http://localhost/a');`
 *   `io('http://localhost/b');`
 *
 * We reuse the existing instance based on same scheme/port/host,
 * and we initialize sockets for each namespace.
 *
 * @api public
 */

function lookup(uri, opts) {
  if (typeof uri == 'object') {
    opts = uri;
    uri = undefined;
  }

  opts = opts || {};

  var parsed = url(uri);
  var source = parsed.source;
  var id = parsed.id;
  var path = parsed.path;
  var sameNamespace = cache[id] && path in cache[id].nsps;
  var newConnection = opts.forceNew || opts['force new connection'] ||
                      false === opts.multiplex || sameNamespace;

  var io;

  if (newConnection) {
    debug('ignoring socket cache for %s', source);
    io = Manager(source, opts);
  } else {
    if (!cache[id]) {
      debug('new io instance for %s', source);
      cache[id] = Manager(source, opts);
    }
    io = cache[id];
  }

  return io.socket(parsed.path);
}

/**
 * Protocol version.
 *
 * @api public
 */

exports.protocol = parser.protocol;

/**
 * `connect`.
 *
 * @param {String} uri
 * @api public
 */

exports.connect = lookup;

/**
 * Expose constructors for standalone build.
 *
 * @api public
 */

exports.Manager = _dereq_('./manager');
exports.Socket = _dereq_('./socket');

},{"./manager":32,"./socket":34,"./url":35,"debug":39,"socket.io-parser":47}],32:[function(_dereq_,module,exports){

/**
 * Module dependencies.
 */

var eio = _dereq_('engine.io-client');
var Socket = _dereq_('./socket');
var Emitter = _dereq_('component-emitter');
var parser = _dereq_('socket.io-parser');
var on = _dereq_('./on');
var bind = _dereq_('component-bind');
var debug = _dereq_('debug')('socket.io-client:manager');
var indexOf = _dereq_('indexof');
var Backoff = _dereq_('backo2');

/**
 * IE6+ hasOwnProperty
 */

var has = Object.prototype.hasOwnProperty;

/**
 * Module exports
 */

module.exports = Manager;

/**
 * `Manager` constructor.
 *
 * @param {String} engine instance or engine uri/opts
 * @param {Object} options
 * @api public
 */

function Manager(uri, opts){
  if (!(this instanceof Manager)) return new Manager(uri, opts);
  if (uri && ('object' == typeof uri)) {
    opts = uri;
    uri = undefined;
  }
  opts = opts || {};

  opts.path = opts.path || '/socket.io';
  this.nsps = {};
  this.subs = [];
  this.opts = opts;
  this.reconnection(opts.reconnection !== false);
  this.reconnectionAttempts(opts.reconnectionAttempts || Infinity);
  this.reconnectionDelay(opts.reconnectionDelay || 1000);
  this.reconnectionDelayMax(opts.reconnectionDelayMax || 5000);
  this.randomizationFactor(opts.randomizationFactor || 0.5);
  this.backoff = new Backoff({
    min: this.reconnectionDelay(),
    max: this.reconnectionDelayMax(),
    jitter: this.randomizationFactor()
  });
  this.timeout(null == opts.timeout ? 20000 : opts.timeout);
  this.readyState = 'closed';
  this.uri = uri;
  this.connecting = [];
  this.lastPing = null;
  this.encoding = false;
  this.packetBuffer = [];
  this.encoder = new parser.Encoder();
  this.decoder = new parser.Decoder();
  this.autoConnect = opts.autoConnect !== false;
  if (this.autoConnect) this.open();
}

/**
 * Propagate given event to sockets and emit on `this`
 *
 * @api private
 */

Manager.prototype.emitAll = function() {
  this.emit.apply(this, arguments);
  for (var nsp in this.nsps) {
    if (has.call(this.nsps, nsp)) {
      this.nsps[nsp].emit.apply(this.nsps[nsp], arguments);
    }
  }
};

/**
 * Update `socket.id` of all sockets
 *
 * @api private
 */

Manager.prototype.updateSocketIds = function(){
  for (var nsp in this.nsps) {
    if (has.call(this.nsps, nsp)) {
      this.nsps[nsp].id = this.engine.id;
    }
  }
};

/**
 * Mix in `Emitter`.
 */

Emitter(Manager.prototype);

/**
 * Sets the `reconnection` config.
 *
 * @param {Boolean} true/false if it should automatically reconnect
 * @return {Manager} self or value
 * @api public
 */

Manager.prototype.reconnection = function(v){
  if (!arguments.length) return this._reconnection;
  this._reconnection = !!v;
  return this;
};

/**
 * Sets the reconnection attempts config.
 *
 * @param {Number} max reconnection attempts before giving up
 * @return {Manager} self or value
 * @api public
 */

Manager.prototype.reconnectionAttempts = function(v){
  if (!arguments.length) return this._reconnectionAttempts;
  this._reconnectionAttempts = v;
  return this;
};

/**
 * Sets the delay between reconnections.
 *
 * @param {Number} delay
 * @return {Manager} self or value
 * @api public
 */

Manager.prototype.reconnectionDelay = function(v){
  if (!arguments.length) return this._reconnectionDelay;
  this._reconnectionDelay = v;
  this.backoff && this.backoff.setMin(v);
  return this;
};

Manager.prototype.randomizationFactor = function(v){
  if (!arguments.length) return this._randomizationFactor;
  this._randomizationFactor = v;
  this.backoff && this.backoff.setJitter(v);
  return this;
};

/**
 * Sets the maximum delay between reconnections.
 *
 * @param {Number} delay
 * @return {Manager} self or value
 * @api public
 */

Manager.prototype.reconnectionDelayMax = function(v){
  if (!arguments.length) return this._reconnectionDelayMax;
  this._reconnectionDelayMax = v;
  this.backoff && this.backoff.setMax(v);
  return this;
};

/**
 * Sets the connection timeout. `false` to disable
 *
 * @return {Manager} self or value
 * @api public
 */

Manager.prototype.timeout = function(v){
  if (!arguments.length) return this._timeout;
  this._timeout = v;
  return this;
};

/**
 * Starts trying to reconnect if reconnection is enabled and we have not
 * started reconnecting yet
 *
 * @api private
 */

Manager.prototype.maybeReconnectOnOpen = function() {
  // Only try to reconnect if it's the first time we're connecting
  if (!this.reconnecting && this._reconnection && this.backoff.attempts === 0) {
    // keeps reconnection from firing twice for the same reconnection loop
    this.reconnect();
  }
};


/**
 * Sets the current transport `socket`.
 *
 * @param {Function} optional, callback
 * @return {Manager} self
 * @api public
 */

Manager.prototype.open =
Manager.prototype.connect = function(fn){
  debug('readyState %s', this.readyState);
  if (~this.readyState.indexOf('open')) return this;

  debug('opening %s', this.uri);
  this.engine = eio(this.uri, this.opts);
  var socket = this.engine;
  var self = this;
  this.readyState = 'opening';
  this.skipReconnect = false;

  // emit `open`
  var openSub = on(socket, 'open', function() {
    self.onopen();
    fn && fn();
  });

  // emit `connect_error`
  var errorSub = on(socket, 'error', function(data){
    debug('connect_error');
    self.cleanup();
    self.readyState = 'closed';
    self.emitAll('connect_error', data);
    if (fn) {
      var err = new Error('Connection error');
      err.data = data;
      fn(err);
    } else {
      // Only do this if there is no fn to handle the error
      self.maybeReconnectOnOpen();
    }
  });

  // emit `connect_timeout`
  if (false !== this._timeout) {
    var timeout = this._timeout;
    debug('connect attempt will timeout after %d', timeout);

    // set timer
    var timer = setTimeout(function(){
      debug('connect attempt timed out after %d', timeout);
      openSub.destroy();
      socket.close();
      socket.emit('error', 'timeout');
      self.emitAll('connect_timeout', timeout);
    }, timeout);

    this.subs.push({
      destroy: function(){
        clearTimeout(timer);
      }
    });
  }

  this.subs.push(openSub);
  this.subs.push(errorSub);

  return this;
};

/**
 * Called upon transport open.
 *
 * @api private
 */

Manager.prototype.onopen = function(){
  debug('open');

  // clear old subs
  this.cleanup();

  // mark as open
  this.readyState = 'open';
  this.emit('open');

  // add new subs
  var socket = this.engine;
  this.subs.push(on(socket, 'data', bind(this, 'ondata')));
  this.subs.push(on(socket, 'ping', bind(this, 'onping')));
  this.subs.push(on(socket, 'pong', bind(this, 'onpong')));
  this.subs.push(on(socket, 'error', bind(this, 'onerror')));
  this.subs.push(on(socket, 'close', bind(this, 'onclose')));
  this.subs.push(on(this.decoder, 'decoded', bind(this, 'ondecoded')));
};

/**
 * Called upon a ping.
 *
 * @api private
 */

Manager.prototype.onping = function(){
  this.lastPing = new Date;
  this.emitAll('ping');
};

/**
 * Called upon a packet.
 *
 * @api private
 */

Manager.prototype.onpong = function(){
  this.emitAll('pong', new Date - this.lastPing);
};

/**
 * Called with data.
 *
 * @api private
 */

Manager.prototype.ondata = function(data){
  this.decoder.add(data);
};

/**
 * Called when parser fully decodes a packet.
 *
 * @api private
 */

Manager.prototype.ondecoded = function(packet) {
  this.emit('packet', packet);
};

/**
 * Called upon socket error.
 *
 * @api private
 */

Manager.prototype.onerror = function(err){
  debug('error', err);
  this.emitAll('error', err);
};

/**
 * Creates a new socket for the given `nsp`.
 *
 * @return {Socket}
 * @api public
 */

Manager.prototype.socket = function(nsp){
  var socket = this.nsps[nsp];
  if (!socket) {
    socket = new Socket(this, nsp);
    this.nsps[nsp] = socket;
    var self = this;
    socket.on('connecting', onConnecting);
    socket.on('connect', function(){
      socket.id = self.engine.id;
    });

    if (this.autoConnect) {
      // manually call here since connecting evnet is fired before listening
      onConnecting();
    }
  }

  function onConnecting() {
    if (!~indexOf(self.connecting, socket)) {
      self.connecting.push(socket);
    }
  }

  return socket;
};

/**
 * Called upon a socket close.
 *
 * @param {Socket} socket
 */

Manager.prototype.destroy = function(socket){
  var index = indexOf(this.connecting, socket);
  if (~index) this.connecting.splice(index, 1);
  if (this.connecting.length) return;

  this.close();
};

/**
 * Writes a packet.
 *
 * @param {Object} packet
 * @api private
 */

Manager.prototype.packet = function(packet){
  debug('writing packet %j', packet);
  var self = this;

  if (!self.encoding) {
    // encode, then write to engine with result
    self.encoding = true;
    this.encoder.encode(packet, function(encodedPackets) {
      for (var i = 0; i < encodedPackets.length; i++) {
        self.engine.write(encodedPackets[i], packet.options);
      }
      self.encoding = false;
      self.processPacketQueue();
    });
  } else { // add packet to the queue
    self.packetBuffer.push(packet);
  }
};

/**
 * If packet buffer is non-empty, begins encoding the
 * next packet in line.
 *
 * @api private
 */

Manager.prototype.processPacketQueue = function() {
  if (this.packetBuffer.length > 0 && !this.encoding) {
    var pack = this.packetBuffer.shift();
    this.packet(pack);
  }
};

/**
 * Clean up transport subscriptions and packet buffer.
 *
 * @api private
 */

Manager.prototype.cleanup = function(){
  debug('cleanup');

  var sub;
  while (sub = this.subs.shift()) sub.destroy();

  this.packetBuffer = [];
  this.encoding = false;
  this.lastPing = null;

  this.decoder.destroy();
};

/**
 * Close the current socket.
 *
 * @api private
 */

Manager.prototype.close =
Manager.prototype.disconnect = function(){
  debug('disconnect');
  this.skipReconnect = true;
  this.reconnecting = false;
  if ('opening' == this.readyState) {
    // `onclose` will not fire because
    // an open event never happened
    this.cleanup();
  }
  this.backoff.reset();
  this.readyState = 'closed';
  if (this.engine) this.engine.close();
};

/**
 * Called upon engine close.
 *
 * @api private
 */

Manager.prototype.onclose = function(reason){
  debug('onclose');

  this.cleanup();
  this.backoff.reset();
  this.readyState = 'closed';
  this.emit('close', reason);

  if (this._reconnection && !this.skipReconnect) {
    this.reconnect();
  }
};

/**
 * Attempt a reconnection.
 *
 * @api private
 */

Manager.prototype.reconnect = function(){
  if (this.reconnecting || this.skipReconnect) return this;

  var self = this;

  if (this.backoff.attempts >= this._reconnectionAttempts) {
    debug('reconnect failed');
    this.backoff.reset();
    this.emitAll('reconnect_failed');
    this.reconnecting = false;
  } else {
    var delay = this.backoff.duration();
    debug('will wait %dms before reconnect attempt', delay);

    this.reconnecting = true;
    var timer = setTimeout(function(){
      if (self.skipReconnect) return;

      debug('attempting reconnect');
      self.emitAll('reconnect_attempt', self.backoff.attempts);
      self.emitAll('reconnecting', self.backoff.attempts);

      // check again for the case socket closed in above events
      if (self.skipReconnect) return;

      self.open(function(err){
        if (err) {
          debug('reconnect attempt error');
          self.reconnecting = false;
          self.reconnect();
          self.emitAll('reconnect_error', err.data);
        } else {
          debug('reconnect success');
          self.onreconnect();
        }
      });
    }, delay);

    this.subs.push({
      destroy: function(){
        clearTimeout(timer);
      }
    });
  }
};

/**
 * Called upon successful reconnect.
 *
 * @api private
 */

Manager.prototype.onreconnect = function(){
  var attempt = this.backoff.attempts;
  this.reconnecting = false;
  this.backoff.reset();
  this.updateSocketIds();
  this.emitAll('reconnect', attempt);
};

},{"./on":33,"./socket":34,"backo2":36,"component-bind":37,"component-emitter":38,"debug":39,"engine.io-client":1,"indexof":42,"socket.io-parser":47}],33:[function(_dereq_,module,exports){

/**
 * Module exports.
 */

module.exports = on;

/**
 * Helper for subscriptions.
 *
 * @param {Object|EventEmitter} obj with `Emitter` mixin or `EventEmitter`
 * @param {String} event name
 * @param {Function} callback
 * @api public
 */

function on(obj, ev, fn) {
  obj.on(ev, fn);
  return {
    destroy: function(){
      obj.removeListener(ev, fn);
    }
  };
}

},{}],34:[function(_dereq_,module,exports){

/**
 * Module dependencies.
 */

var parser = _dereq_('socket.io-parser');
var Emitter = _dereq_('component-emitter');
var toArray = _dereq_('to-array');
var on = _dereq_('./on');
var bind = _dereq_('component-bind');
var debug = _dereq_('debug')('socket.io-client:socket');
var hasBin = _dereq_('has-binary');

/**
 * Module exports.
 */

module.exports = exports = Socket;

/**
 * Internal events (blacklisted).
 * These events can't be emitted by the user.
 *
 * @api private
 */

var events = {
  connect: 1,
  connect_error: 1,
  connect_timeout: 1,
  connecting: 1,
  disconnect: 1,
  error: 1,
  reconnect: 1,
  reconnect_attempt: 1,
  reconnect_failed: 1,
  reconnect_error: 1,
  reconnecting: 1,
  ping: 1,
  pong: 1
};

/**
 * Shortcut to `Emitter#emit`.
 */

var emit = Emitter.prototype.emit;

/**
 * `Socket` constructor.
 *
 * @api public
 */

function Socket(io, nsp){
  this.io = io;
  this.nsp = nsp;
  this.json = this; // compat
  this.ids = 0;
  this.acks = {};
  this.receiveBuffer = [];
  this.sendBuffer = [];
  this.connected = false;
  this.disconnected = true;
  if (this.io.autoConnect) this.open();
}

/**
 * Mix in `Emitter`.
 */

Emitter(Socket.prototype);

/**
 * Subscribe to open, close and packet events
 *
 * @api private
 */

Socket.prototype.subEvents = function() {
  if (this.subs) return;

  var io = this.io;
  this.subs = [
    on(io, 'open', bind(this, 'onopen')),
    on(io, 'packet', bind(this, 'onpacket')),
    on(io, 'close', bind(this, 'onclose'))
  ];
};

/**
 * "Opens" the socket.
 *
 * @api public
 */

Socket.prototype.open =
Socket.prototype.connect = function(){
  if (this.connected) return this;

  this.subEvents();
  this.io.open(); // ensure open
  if ('open' == this.io.readyState) this.onopen();
  this.emit('connecting');
  return this;
};

/**
 * Sends a `message` event.
 *
 * @return {Socket} self
 * @api public
 */

Socket.prototype.send = function(){
  var args = toArray(arguments);
  args.unshift('message');
  this.emit.apply(this, args);
  return this;
};

/**
 * Override `emit`.
 * If the event is in `events`, it's emitted normally.
 *
 * @param {String} event name
 * @return {Socket} self
 * @api public
 */

Socket.prototype.emit = function(ev){
  if (events.hasOwnProperty(ev)) {
    emit.apply(this, arguments);
    return this;
  }

  var args = toArray(arguments);
  var parserType = parser.EVENT; // default
  if (hasBin(args)) { parserType = parser.BINARY_EVENT; } // binary
  var packet = { type: parserType, data: args };

  packet.options = {};
  packet.options.compress = !this.flags || false !== this.flags.compress;

  // event ack callback
  if ('function' == typeof args[args.length - 1]) {
    debug('emitting packet with ack id %d', this.ids);
    this.acks[this.ids] = args.pop();
    packet.id = this.ids++;
  }

  if (this.connected) {
    this.packet(packet);
  } else {
    this.sendBuffer.push(packet);
  }

  delete this.flags;

  return this;
};

/**
 * Sends a packet.
 *
 * @param {Object} packet
 * @api private
 */

Socket.prototype.packet = function(packet){
  packet.nsp = this.nsp;
  this.io.packet(packet);
};

/**
 * Called upon engine `open`.
 *
 * @api private
 */

Socket.prototype.onopen = function(){
  debug('transport is open - connecting');

  // write connect packet if necessary
  if ('/' != this.nsp) {
    this.packet({ type: parser.CONNECT });
  }
};

/**
 * Called upon engine `close`.
 *
 * @param {String} reason
 * @api private
 */

Socket.prototype.onclose = function(reason){
  debug('close (%s)', reason);
  this.connected = false;
  this.disconnected = true;
  delete this.id;
  this.emit('disconnect', reason);
};

/**
 * Called with socket packet.
 *
 * @param {Object} packet
 * @api private
 */

Socket.prototype.onpacket = function(packet){
  if (packet.nsp != this.nsp) return;

  switch (packet.type) {
    case parser.CONNECT:
      this.onconnect();
      break;

    case parser.EVENT:
      this.onevent(packet);
      break;

    case parser.BINARY_EVENT:
      this.onevent(packet);
      break;

    case parser.ACK:
      this.onack(packet);
      break;

    case parser.BINARY_ACK:
      this.onack(packet);
      break;

    case parser.DISCONNECT:
      this.ondisconnect();
      break;

    case parser.ERROR:
      this.emit('error', packet.data);
      break;
  }
};

/**
 * Called upon a server event.
 *
 * @param {Object} packet
 * @api private
 */

Socket.prototype.onevent = function(packet){
  var args = packet.data || [];
  debug('emitting event %j', args);

  if (null != packet.id) {
    debug('attaching ack callback to event');
    args.push(this.ack(packet.id));
  }

  if (this.connected) {
    emit.apply(this, args);
  } else {
    this.receiveBuffer.push(args);
  }
};

/**
 * Produces an ack callback to emit with an event.
 *
 * @api private
 */

Socket.prototype.ack = function(id){
  var self = this;
  var sent = false;
  return function(){
    // prevent double callbacks
    if (sent) return;
    sent = true;
    var args = toArray(arguments);
    debug('sending ack %j', args);

    var type = hasBin(args) ? parser.BINARY_ACK : parser.ACK;
    self.packet({
      type: type,
      id: id,
      data: args
    });
  };
};

/**
 * Called upon a server acknowlegement.
 *
 * @param {Object} packet
 * @api private
 */

Socket.prototype.onack = function(packet){
  var ack = this.acks[packet.id];
  if ('function' == typeof ack) {
    debug('calling ack %s with %j', packet.id, packet.data);
    ack.apply(this, packet.data);
    delete this.acks[packet.id];
  } else {
    debug('bad ack %s', packet.id);
  }
};

/**
 * Called upon server connect.
 *
 * @api private
 */

Socket.prototype.onconnect = function(){
  this.connected = true;
  this.disconnected = false;
  this.emit('connect');
  this.emitBuffered();
};

/**
 * Emit buffered events (received and emitted).
 *
 * @api private
 */

Socket.prototype.emitBuffered = function(){
  var i;
  for (i = 0; i < this.receiveBuffer.length; i++) {
    emit.apply(this, this.receiveBuffer[i]);
  }
  this.receiveBuffer = [];

  for (i = 0; i < this.sendBuffer.length; i++) {
    this.packet(this.sendBuffer[i]);
  }
  this.sendBuffer = [];
};

/**
 * Called upon server disconnect.
 *
 * @api private
 */

Socket.prototype.ondisconnect = function(){
  debug('server disconnect (%s)', this.nsp);
  this.destroy();
  this.onclose('io server disconnect');
};

/**
 * Called upon forced client/server side disconnections,
 * this method ensures the manager stops tracking us and
 * that reconnections don't get triggered for this.
 *
 * @api private.
 */

Socket.prototype.destroy = function(){
  if (this.subs) {
    // clean subscriptions to avoid reconnections
    for (var i = 0; i < this.subs.length; i++) {
      this.subs[i].destroy();
    }
    this.subs = null;
  }

  this.io.destroy(this);
};

/**
 * Disconnects the socket manually.
 *
 * @return {Socket} self
 * @api public
 */

Socket.prototype.close =
Socket.prototype.disconnect = function(){
  if (this.connected) {
    debug('performing disconnect (%s)', this.nsp);
    this.packet({ type: parser.DISCONNECT });
  }

  // remove socket from pool
  this.destroy();

  if (this.connected) {
    // fire events
    this.onclose('io client disconnect');
  }
  return this;
};

/**
 * Sets the compress flag.
 *
 * @param {Boolean} if `true`, compresses the sending data
 * @return {Socket} self
 * @api public
 */

Socket.prototype.compress = function(compress){
  this.flags = this.flags || {};
  this.flags.compress = compress;
  return this;
};

},{"./on":33,"component-bind":37,"component-emitter":38,"debug":39,"has-binary":41,"socket.io-parser":47,"to-array":51}],35:[function(_dereq_,module,exports){
(function (global){

/**
 * Module dependencies.
 */

var parseuri = _dereq_('parseuri');
var debug = _dereq_('debug')('socket.io-client:url');

/**
 * Module exports.
 */

module.exports = url;

/**
 * URL parser.
 *
 * @param {String} url
 * @param {Object} An object meant to mimic window.location.
 *                 Defaults to window.location.
 * @api public
 */

function url(uri, loc){
  var obj = uri;

  // default to window.location
  var loc = loc || global.location;
  if (null == uri) uri = loc.protocol + '//' + loc.host;

  // relative path support
  if ('string' == typeof uri) {
    if ('/' == uri.charAt(0)) {
      if ('/' == uri.charAt(1)) {
        uri = loc.protocol + uri;
      } else {
        uri = loc.host + uri;
      }
    }

    if (!/^(https?|wss?):\/\//.test(uri)) {
      debug('protocol-less url %s', uri);
      if ('undefined' != typeof loc) {
        uri = loc.protocol + '//' + uri;
      } else {
        uri = 'https://' + uri;
      }
    }

    // parse
    debug('parse %s', uri);
    obj = parseuri(uri);
  }

  // make sure we treat `localhost:80` and `localhost` equally
  if (!obj.port) {
    if (/^(http|ws)$/.test(obj.protocol)) {
      obj.port = '80';
    }
    else if (/^(http|ws)s$/.test(obj.protocol)) {
      obj.port = '443';
    }
  }

  obj.path = obj.path || '/';

  var ipv6 = obj.host.indexOf(':') !== -1;
  var host = ipv6 ? '[' + obj.host + ']' : obj.host;

  // define unique id
  obj.id = obj.protocol + '://' + host + ':' + obj.port;
  // define href
  obj.href = obj.protocol + '://' + host + (loc && loc.port == obj.port ? '' : (':' + obj.port));

  return obj;
}

}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : {})
},{"debug":39,"parseuri":45}],36:[function(_dereq_,module,exports){

/**
 * Expose `Backoff`.
 */

module.exports = Backoff;

/**
 * Initialize backoff timer with `opts`.
 *
 * - `min` initial timeout in milliseconds [100]
 * - `max` max timeout [10000]
 * - `jitter` [0]
 * - `factor` [2]
 *
 * @param {Object} opts
 * @api public
 */

function Backoff(opts) {
  opts = opts || {};
  this.ms = opts.min || 100;
  this.max = opts.max || 10000;
  this.factor = opts.factor || 2;
  this.jitter = opts.jitter > 0 && opts.jitter <= 1 ? opts.jitter : 0;
  this.attempts = 0;
}

/**
 * Return the backoff duration.
 *
 * @return {Number}
 * @api public
 */

Backoff.prototype.duration = function(){
  var ms = this.ms * Math.pow(this.factor, this.attempts++);
  if (this.jitter) {
    var rand =  Math.random();
    var deviation = Math.floor(rand * this.jitter * ms);
    ms = (Math.floor(rand * 10) & 1) == 0  ? ms - deviation : ms + deviation;
  }
  return Math.min(ms, this.max) | 0;
};

/**
 * Reset the number of attempts.
 *
 * @api public
 */

Backoff.prototype.reset = function(){
  this.attempts = 0;
};

/**
 * Set the minimum duration
 *
 * @api public
 */

Backoff.prototype.setMin = function(min){
  this.ms = min;
};

/**
 * Set the maximum duration
 *
 * @api public
 */

Backoff.prototype.setMax = function(max){
  this.max = max;
};

/**
 * Set the jitter
 *
 * @api public
 */

Backoff.prototype.setJitter = function(jitter){
  this.jitter = jitter;
};


},{}],37:[function(_dereq_,module,exports){
/**
 * Slice reference.
 */

var slice = [].slice;

/**
 * Bind `obj` to `fn`.
 *
 * @param {Object} obj
 * @param {Function|String} fn or string
 * @return {Function}
 * @api public
 */

module.exports = function(obj, fn){
  if ('string' == typeof fn) fn = obj[fn];
  if ('function' != typeof fn) throw new Error('bind() requires a function');
  var args = slice.call(arguments, 2);
  return function(){
    return fn.apply(obj, args.concat(slice.call(arguments)));
  }
};

},{}],38:[function(_dereq_,module,exports){

/**
 * Expose `Emitter`.
 */

module.exports = Emitter;

/**
 * Initialize a new `Emitter`.
 *
 * @api public
 */

function Emitter(obj) {
  if (obj) return mixin(obj);
};

/**
 * Mixin the emitter properties.
 *
 * @param {Object} obj
 * @return {Object}
 * @api private
 */

function mixin(obj) {
  for (var key in Emitter.prototype) {
    obj[key] = Emitter.prototype[key];
  }
  return obj;
}

/**
 * Listen on the given `event` with `fn`.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.on =
Emitter.prototype.addEventListener = function(event, fn){
  this._callbacks = this._callbacks || {};
  (this._callbacks['$' + event] = this._callbacks['$' + event] || [])
    .push(fn);
  return this;
};

/**
 * Adds an `event` listener that will be invoked a single
 * time then automatically removed.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.once = function(event, fn){
  function on() {
    this.off(event, on);
    fn.apply(this, arguments);
  }

  on.fn = fn;
  this.on(event, on);
  return this;
};

/**
 * Remove the given callback for `event` or all
 * registered callbacks.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.off =
Emitter.prototype.removeListener =
Emitter.prototype.removeAllListeners =
Emitter.prototype.removeEventListener = function(event, fn){
  this._callbacks = this._callbacks || {};

  // all
  if (0 == arguments.length) {
    this._callbacks = {};
    return this;
  }

  // specific event
  var callbacks = this._callbacks['$' + event];
  if (!callbacks) return this;

  // remove all handlers
  if (1 == arguments.length) {
    delete this._callbacks['$' + event];
    return this;
  }

  // remove specific handler
  var cb;
  for (var i = 0; i < callbacks.length; i++) {
    cb = callbacks[i];
    if (cb === fn || cb.fn === fn) {
      callbacks.splice(i, 1);
      break;
    }
  }
  return this;
};

/**
 * Emit `event` with the given args.
 *
 * @param {String} event
 * @param {Mixed} ...
 * @return {Emitter}
 */

Emitter.prototype.emit = function(event){
  this._callbacks = this._callbacks || {};
  var args = [].slice.call(arguments, 1)
    , callbacks = this._callbacks['$' + event];

  if (callbacks) {
    callbacks = callbacks.slice(0);
    for (var i = 0, len = callbacks.length; i < len; ++i) {
      callbacks[i].apply(this, args);
    }
  }

  return this;
};

/**
 * Return array of callbacks for `event`.
 *
 * @param {String} event
 * @return {Array}
 * @api public
 */

Emitter.prototype.listeners = function(event){
  this._callbacks = this._callbacks || {};
  return this._callbacks['$' + event] || [];
};

/**
 * Check if this emitter has `event` handlers.
 *
 * @param {String} event
 * @return {Boolean}
 * @api public
 */

Emitter.prototype.hasListeners = function(event){
  return !! this.listeners(event).length;
};

},{}],39:[function(_dereq_,module,exports){
arguments[4][17][0].apply(exports,arguments)
},{"./debug":40,"dup":17}],40:[function(_dereq_,module,exports){
arguments[4][18][0].apply(exports,arguments)
},{"dup":18,"ms":44}],41:[function(_dereq_,module,exports){
(function (global){

/*
 * Module requirements.
 */

var isArray = _dereq_('isarray');

/**
 * Module exports.
 */

module.exports = hasBinary;

/**
 * Checks for binary data.
 *
 * Right now only Buffer and ArrayBuffer are supported..
 *
 * @param {Object} anything
 * @api public
 */

function hasBinary(data) {

  function _hasBinary(obj) {
    if (!obj) return false;

    if ( (global.Buffer && global.Buffer.isBuffer && global.Buffer.isBuffer(obj)) ||
         (global.ArrayBuffer && obj instanceof ArrayBuffer) ||
         (global.Blob && obj instanceof Blob) ||
         (global.File && obj instanceof File)
        ) {
      return true;
    }

    if (isArray(obj)) {
      for (var i = 0; i < obj.length; i++) {
          if (_hasBinary(obj[i])) {
              return true;
          }
      }
    } else if (obj && 'object' == typeof obj) {
      // see: https://github.com/Automattic/has-binary/pull/4
      if (obj.toJSON && 'function' == typeof obj.toJSON) {
        obj = obj.toJSON();
      }

      for (var key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key) && _hasBinary(obj[key])) {
          return true;
        }
      }
    }

    return false;
  }

  return _hasBinary(data);
}

}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : {})
},{"isarray":43}],42:[function(_dereq_,module,exports){
arguments[4][23][0].apply(exports,arguments)
},{"dup":23}],43:[function(_dereq_,module,exports){
arguments[4][24][0].apply(exports,arguments)
},{"dup":24}],44:[function(_dereq_,module,exports){
arguments[4][25][0].apply(exports,arguments)
},{"dup":25}],45:[function(_dereq_,module,exports){
arguments[4][28][0].apply(exports,arguments)
},{"dup":28}],46:[function(_dereq_,module,exports){
(function (global){
/*global Blob,File*/

/**
 * Module requirements
 */

var isArray = _dereq_('isarray');
var isBuf = _dereq_('./is-buffer');

/**
 * Replaces every Buffer | ArrayBuffer in packet with a numbered placeholder.
 * Anything with blobs or files should be fed through removeBlobs before coming
 * here.
 *
 * @param {Object} packet - socket.io event packet
 * @return {Object} with deconstructed packet and list of buffers
 * @api public
 */

exports.deconstructPacket = function(packet){
  var buffers = [];
  var packetData = packet.data;

  function _deconstructPacket(data) {
    if (!data) return data;

    if (isBuf(data)) {
      var placeholder = { _placeholder: true, num: buffers.length };
      buffers.push(data);
      return placeholder;
    } else if (isArray(data)) {
      var newData = new Array(data.length);
      for (var i = 0; i < data.length; i++) {
        newData[i] = _deconstructPacket(data[i]);
      }
      return newData;
    } else if ('object' == typeof data && !(data instanceof Date)) {
      var newData = {};
      for (var key in data) {
        newData[key] = _deconstructPacket(data[key]);
      }
      return newData;
    }
    return data;
  }

  var pack = packet;
  pack.data = _deconstructPacket(packetData);
  pack.attachments = buffers.length; // number of binary 'attachments'
  return {packet: pack, buffers: buffers};
};

/**
 * Reconstructs a binary packet from its placeholder packet and buffers
 *
 * @param {Object} packet - event packet with placeholders
 * @param {Array} buffers - binary buffers to put in placeholder positions
 * @return {Object} reconstructed packet
 * @api public
 */

exports.reconstructPacket = function(packet, buffers) {
  var curPlaceHolder = 0;

  function _reconstructPacket(data) {
    if (data && data._placeholder) {
      var buf = buffers[data.num]; // appropriate buffer (should be natural order anyway)
      return buf;
    } else if (isArray(data)) {
      for (var i = 0; i < data.length; i++) {
        data[i] = _reconstructPacket(data[i]);
      }
      return data;
    } else if (data && 'object' == typeof data) {
      for (var key in data) {
        data[key] = _reconstructPacket(data[key]);
      }
      return data;
    }
    return data;
  }

  packet.data = _reconstructPacket(packet.data);
  packet.attachments = undefined; // no longer useful
  return packet;
};

/**
 * Asynchronously removes Blobs or Files from data via
 * FileReader's readAsArrayBuffer method. Used before encoding
 * data as msgpack. Calls callback with the blobless data.
 *
 * @param {Object} data
 * @param {Function} callback
 * @api private
 */

exports.removeBlobs = function(data, callback) {
  function _removeBlobs(obj, curKey, containingObject) {
    if (!obj) return obj;

    // convert any blob
    if ((global.Blob && obj instanceof Blob) ||
        (global.File && obj instanceof File)) {
      pendingBlobs++;

      // async filereader
      var fileReader = new FileReader();
      fileReader.onload = function() { // this.result == arraybuffer
        if (containingObject) {
          containingObject[curKey] = this.result;
        }
        else {
          bloblessData = this.result;
        }

        // if nothing pending its callback time
        if(! --pendingBlobs) {
          callback(bloblessData);
        }
      };

      fileReader.readAsArrayBuffer(obj); // blob -> arraybuffer
    } else if (isArray(obj)) { // handle array
      for (var i = 0; i < obj.length; i++) {
        _removeBlobs(obj[i], i, obj);
      }
    } else if (obj && 'object' == typeof obj && !isBuf(obj)) { // and object
      for (var key in obj) {
        _removeBlobs(obj[key], key, obj);
      }
    }
  }

  var pendingBlobs = 0;
  var bloblessData = data;
  _removeBlobs(bloblessData);
  if (!pendingBlobs) {
    callback(bloblessData);
  }
};

}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : {})
},{"./is-buffer":48,"isarray":43}],47:[function(_dereq_,module,exports){

/**
 * Module dependencies.
 */

var debug = _dereq_('debug')('socket.io-parser');
var json = _dereq_('json3');
var isArray = _dereq_('isarray');
var Emitter = _dereq_('component-emitter');
var binary = _dereq_('./binary');
var isBuf = _dereq_('./is-buffer');

/**
 * Protocol version.
 *
 * @api public
 */

exports.protocol = 4;

/**
 * Packet types.
 *
 * @api public
 */

exports.types = [
  'CONNECT',
  'DISCONNECT',
  'EVENT',
  'BINARY_EVENT',
  'ACK',
  'BINARY_ACK',
  'ERROR'
];

/**
 * Packet type `connect`.
 *
 * @api public
 */

exports.CONNECT = 0;

/**
 * Packet type `disconnect`.
 *
 * @api public
 */

exports.DISCONNECT = 1;

/**
 * Packet type `event`.
 *
 * @api public
 */

exports.EVENT = 2;

/**
 * Packet type `ack`.
 *
 * @api public
 */

exports.ACK = 3;

/**
 * Packet type `error`.
 *
 * @api public
 */

exports.ERROR = 4;

/**
 * Packet type 'binary event'
 *
 * @api public
 */

exports.BINARY_EVENT = 5;

/**
 * Packet type `binary ack`. For acks with binary arguments.
 *
 * @api public
 */

exports.BINARY_ACK = 6;

/**
 * Encoder constructor.
 *
 * @api public
 */

exports.Encoder = Encoder;

/**
 * Decoder constructor.
 *
 * @api public
 */

exports.Decoder = Decoder;

/**
 * A socket.io Encoder instance
 *
 * @api public
 */

function Encoder() {}

/**
 * Encode a packet as a single string if non-binary, or as a
 * buffer sequence, depending on packet type.
 *
 * @param {Object} obj - packet object
 * @param {Function} callback - function to handle encodings (likely engine.write)
 * @return Calls callback with Array of encodings
 * @api public
 */

Encoder.prototype.encode = function(obj, callback){
  debug('encoding packet %j', obj);

  if (exports.BINARY_EVENT == obj.type || exports.BINARY_ACK == obj.type) {
    encodeAsBinary(obj, callback);
  }
  else {
    var encoding = encodeAsString(obj);
    callback([encoding]);
  }
};

/**
 * Encode packet as string.
 *
 * @param {Object} packet
 * @return {String} encoded
 * @api private
 */

function encodeAsString(obj) {
  var str = '';
  var nsp = false;

  // first is type
  str += obj.type;

  // attachments if we have them
  if (exports.BINARY_EVENT == obj.type || exports.BINARY_ACK == obj.type) {
    str += obj.attachments;
    str += '-';
  }

  // if we have a namespace other than `/`
  // we append it followed by a comma `,`
  if (obj.nsp && '/' != obj.nsp) {
    nsp = true;
    str += obj.nsp;
  }

  // immediately followed by the id
  if (null != obj.id) {
    if (nsp) {
      str += ',';
      nsp = false;
    }
    str += obj.id;
  }

  // json data
  if (null != obj.data) {
    if (nsp) str += ',';
    str += json.stringify(obj.data);
  }

  debug('encoded %j as %s', obj, str);
  return str;
}

/**
 * Encode packet as 'buffer sequence' by removing blobs, and
 * deconstructing packet into object with placeholders and
 * a list of buffers.
 *
 * @param {Object} packet
 * @return {Buffer} encoded
 * @api private
 */

function encodeAsBinary(obj, callback) {

  function writeEncoding(bloblessData) {
    var deconstruction = binary.deconstructPacket(bloblessData);
    var pack = encodeAsString(deconstruction.packet);
    var buffers = deconstruction.buffers;

    buffers.unshift(pack); // add packet info to beginning of data list
    callback(buffers); // write all the buffers
  }

  binary.removeBlobs(obj, writeEncoding);
}

/**
 * A socket.io Decoder instance
 *
 * @return {Object} decoder
 * @api public
 */

function Decoder() {
  this.reconstructor = null;
}

/**
 * Mix in `Emitter` with Decoder.
 */

Emitter(Decoder.prototype);

/**
 * Decodes an ecoded packet string into packet JSON.
 *
 * @param {String} obj - encoded packet
 * @return {Object} packet
 * @api public
 */

Decoder.prototype.add = function(obj) {
  var packet;
  if ('string' == typeof obj) {
    packet = decodeString(obj);
    if (exports.BINARY_EVENT == packet.type || exports.BINARY_ACK == packet.type) { // binary packet's json
      this.reconstructor = new BinaryReconstructor(packet);

      // no attachments, labeled binary but no binary data to follow
      if (this.reconstructor.reconPack.attachments === 0) {
        this.emit('decoded', packet);
      }
    } else { // non-binary full packet
      this.emit('decoded', packet);
    }
  }
  else if (isBuf(obj) || obj.base64) { // raw binary data
    if (!this.reconstructor) {
      throw new Error('got binary data when not reconstructing a packet');
    } else {
      packet = this.reconstructor.takeBinaryData(obj);
      if (packet) { // received final buffer
        this.reconstructor = null;
        this.emit('decoded', packet);
      }
    }
  }
  else {
    throw new Error('Unknown type: ' + obj);
  }
};

/**
 * Decode a packet String (JSON data)
 *
 * @param {String} str
 * @return {Object} packet
 * @api private
 */

function decodeString(str) {
  var p = {};
  var i = 0;

  // look up type
  p.type = Number(str.charAt(0));
  if (null == exports.types[p.type]) return error();

  // look up attachments if type binary
  if (exports.BINARY_EVENT == p.type || exports.BINARY_ACK == p.type) {
    var buf = '';
    while (str.charAt(++i) != '-') {
      buf += str.charAt(i);
      if (i == str.length) break;
    }
    if (buf != Number(buf) || str.charAt(i) != '-') {
      throw new Error('Illegal attachments');
    }
    p.attachments = Number(buf);
  }

  // look up namespace (if any)
  if ('/' == str.charAt(i + 1)) {
    p.nsp = '';
    while (++i) {
      var c = str.charAt(i);
      if (',' == c) break;
      p.nsp += c;
      if (i == str.length) break;
    }
  } else {
    p.nsp = '/';
  }

  // look up id
  var next = str.charAt(i + 1);
  if ('' !== next && Number(next) == next) {
    p.id = '';
    while (++i) {
      var c = str.charAt(i);
      if (null == c || Number(c) != c) {
        --i;
        break;
      }
      p.id += str.charAt(i);
      if (i == str.length) break;
    }
    p.id = Number(p.id);
  }

  // look up json data
  if (str.charAt(++i)) {
    try {
      p.data = json.parse(str.substr(i));
    } catch(e){
      return error();
    }
  }

  debug('decoded %s as %j', str, p);
  return p;
}

/**
 * Deallocates a parser's resources
 *
 * @api public
 */

Decoder.prototype.destroy = function() {
  if (this.reconstructor) {
    this.reconstructor.finishedReconstruction();
  }
};

/**
 * A manager of a binary event's 'buffer sequence'. Should
 * be constructed whenever a packet of type BINARY_EVENT is
 * decoded.
 *
 * @param {Object} packet
 * @return {BinaryReconstructor} initialized reconstructor
 * @api private
 */

function BinaryReconstructor(packet) {
  this.reconPack = packet;
  this.buffers = [];
}

/**
 * Method to be called when binary data received from connection
 * after a BINARY_EVENT packet.
 *
 * @param {Buffer | ArrayBuffer} binData - the raw binary data received
 * @return {null | Object} returns null if more binary data is expected or
 *   a reconstructed packet object if all buffers have been received.
 * @api private
 */

BinaryReconstructor.prototype.takeBinaryData = function(binData) {
  this.buffers.push(binData);
  if (this.buffers.length == this.reconPack.attachments) { // done with buffer list
    var packet = binary.reconstructPacket(this.reconPack, this.buffers);
    this.finishedReconstruction();
    return packet;
  }
  return null;
};

/**
 * Cleans up binary packet reconstruction variables.
 *
 * @api private
 */

BinaryReconstructor.prototype.finishedReconstruction = function() {
  this.reconPack = null;
  this.buffers = [];
};

function error(data){
  return {
    type: exports.ERROR,
    data: 'parser error'
  };
}

},{"./binary":46,"./is-buffer":48,"component-emitter":49,"debug":39,"isarray":43,"json3":50}],48:[function(_dereq_,module,exports){
(function (global){

module.exports = isBuf;

/**
 * Returns true if obj is a buffer or an arraybuffer.
 *
 * @api private
 */

function isBuf(obj) {
  return (global.Buffer && global.Buffer.isBuffer(obj)) ||
         (global.ArrayBuffer && obj instanceof ArrayBuffer);
}

}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : {})
},{}],49:[function(_dereq_,module,exports){
arguments[4][15][0].apply(exports,arguments)
},{"dup":15}],50:[function(_dereq_,module,exports){
(function (global){
/*! JSON v3.3.2 | http://bestiejs.github.io/json3 | Copyright 2012-2014, Kit Cambridge | http://kit.mit-license.org */
;(function () {
  // Detect the `define` function exposed by asynchronous module loaders. The
  // strict `define` check is necessary for compatibility with `r.js`.
  var isLoader = typeof define === "function" && define.amd;

  // A set of types used to distinguish objects from primitives.
  var objectTypes = {
    "function": true,
    "object": true
  };

  // Detect the `exports` object exposed by CommonJS implementations.
  var freeExports = objectTypes[typeof exports] && exports && !exports.nodeType && exports;

  // Use the `global` object exposed by Node (including Browserify via
  // `insert-module-globals`), Narwhal, and Ringo as the default context,
  // and the `window` object in browsers. Rhino exports a `global` function
  // instead.
  var root = objectTypes[typeof window] && window || this,
      freeGlobal = freeExports && objectTypes[typeof module] && module && !module.nodeType && typeof global == "object" && global;

  if (freeGlobal && (freeGlobal["global"] === freeGlobal || freeGlobal["window"] === freeGlobal || freeGlobal["self"] === freeGlobal)) {
    root = freeGlobal;
  }

  // Public: Initializes JSON 3 using the given `context` object, attaching the
  // `stringify` and `parse` functions to the specified `exports` object.
  function runInContext(context, exports) {
    context || (context = root["Object"]());
    exports || (exports = root["Object"]());

    // Native constructor aliases.
    var Number = context["Number"] || root["Number"],
        String = context["String"] || root["String"],
        Object = context["Object"] || root["Object"],
        Date = context["Date"] || root["Date"],
        SyntaxError = context["SyntaxError"] || root["SyntaxError"],
        TypeError = context["TypeError"] || root["TypeError"],
        Math = context["Math"] || root["Math"],
        nativeJSON = context["JSON"] || root["JSON"];

    // Delegate to the native `stringify` and `parse` implementations.
    if (typeof nativeJSON == "object" && nativeJSON) {
      exports.stringify = nativeJSON.stringify;
      exports.parse = nativeJSON.parse;
    }

    // Convenience aliases.
    var objectProto = Object.prototype,
        getClass = objectProto.toString,
        isProperty, forEach, undef;

    // Test the `Date#getUTC*` methods. Based on work by @Yaffle.
    var isExtended = new Date(-3509827334573292);
    try {
      // The `getUTCFullYear`, `Month`, and `Date` methods return nonsensical
      // results for certain dates in Opera >= 10.53.
      isExtended = isExtended.getUTCFullYear() == -109252 && isExtended.getUTCMonth() === 0 && isExtended.getUTCDate() === 1 &&
        // Safari < 2.0.2 stores the internal millisecond time value correctly,
        // but clips the values returned by the date methods to the range of
        // signed 32-bit integers ([-2 ** 31, 2 ** 31 - 1]).
        isExtended.getUTCHours() == 10 && isExtended.getUTCMinutes() == 37 && isExtended.getUTCSeconds() == 6 && isExtended.getUTCMilliseconds() == 708;
    } catch (exception) {}

    // Internal: Determines whether the native `JSON.stringify` and `parse`
    // implementations are spec-compliant. Based on work by Ken Snyder.
    function has(name) {
      if (has[name] !== undef) {
        // Return cached feature test result.
        return has[name];
      }
      var isSupported;
      if (name == "bug-string-char-index") {
        // IE <= 7 doesn't support accessing string characters using square
        // bracket notation. IE 8 only supports this for primitives.
        isSupported = "a"[0] != "a";
      } else if (name == "json") {
        // Indicates whether both `JSON.stringify` and `JSON.parse` are
        // supported.
        isSupported = has("json-stringify") && has("json-parse");
      } else {
        var value, serialized = '{"a":[1,true,false,null,"\\u0000\\b\\n\\f\\r\\t"]}';
        // Test `JSON.stringify`.
        if (name == "json-stringify") {
          var stringify = exports.stringify, stringifySupported = typeof stringify == "function" && isExtended;
          if (stringifySupported) {
            // A test function object with a custom `toJSON` method.
            (value = function () {
              return 1;
            }).toJSON = value;
            try {
              stringifySupported =
                // Firefox 3.1b1 and b2 serialize string, number, and boolean
                // primitives as object literals.
                stringify(0) === "0" &&
                // FF 3.1b1, b2, and JSON 2 serialize wrapped primitives as object
                // literals.
                stringify(new Number()) === "0" &&
                stringify(new String()) == '""' &&
                // FF 3.1b1, 2 throw an error if the value is `null`, `undefined`, or
                // does not define a canonical JSON representation (this applies to
                // objects with `toJSON` properties as well, *unless* they are nested
                // within an object or array).
                stringify(getClass) === undef &&
                // IE 8 serializes `undefined` as `"undefined"`. Safari <= 5.1.7 and
                // FF 3.1b3 pass this test.
                stringify(undef) === undef &&
                // Safari <= 5.1.7 and FF 3.1b3 throw `Error`s and `TypeError`s,
                // respectively, if the value is omitted entirely.
                stringify() === undef &&
                // FF 3.1b1, 2 throw an error if the given value is not a number,
                // string, array, object, Boolean, or `null` literal. This applies to
                // objects with custom `toJSON` methods as well, unless they are nested
                // inside object or array literals. YUI 3.0.0b1 ignores custom `toJSON`
                // methods entirely.
                stringify(value) === "1" &&
                stringify([value]) == "[1]" &&
                // Prototype <= 1.6.1 serializes `[undefined]` as `"[]"` instead of
                // `"[null]"`.
                stringify([undef]) == "[null]" &&
                // YUI 3.0.0b1 fails to serialize `null` literals.
                stringify(null) == "null" &&
                // FF 3.1b1, 2 halts serialization if an array contains a function:
                // `[1, true, getClass, 1]` serializes as "[1,true,],". FF 3.1b3
                // elides non-JSON values from objects and arrays, unless they
                // define custom `toJSON` methods.
                stringify([undef, getClass, null]) == "[null,null,null]" &&
                // Simple serialization test. FF 3.1b1 uses Unicode escape sequences
                // where character escape codes are expected (e.g., `\b` => `\u0008`).
                stringify({ "a": [value, true, false, null, "\x00\b\n\f\r\t"] }) == serialized &&
                // FF 3.1b1 and b2 ignore the `filter` and `width` arguments.
                stringify(null, value) === "1" &&
                stringify([1, 2], null, 1) == "[\n 1,\n 2\n]" &&
                // JSON 2, Prototype <= 1.7, and older WebKit builds incorrectly
                // serialize extended years.
                stringify(new Date(-8.64e15)) == '"-271821-04-20T00:00:00.000Z"' &&
                // The milliseconds are optional in ES 5, but required in 5.1.
                stringify(new Date(8.64e15)) == '"+275760-09-13T00:00:00.000Z"' &&
                // Firefox <= 11.0 incorrectly serializes years prior to 0 as negative
                // four-digit years instead of six-digit years. Credits: @Yaffle.
                stringify(new Date(-621987552e5)) == '"-000001-01-01T00:00:00.000Z"' &&
                // Safari <= 5.1.5 and Opera >= 10.53 incorrectly serialize millisecond
                // values less than 1000. Credits: @Yaffle.
                stringify(new Date(-1)) == '"1969-12-31T23:59:59.999Z"';
            } catch (exception) {
              stringifySupported = false;
            }
          }
          isSupported = stringifySupported;
        }
        // Test `JSON.parse`.
        if (name == "json-parse") {
          var parse = exports.parse;
          if (typeof parse == "function") {
            try {
              // FF 3.1b1, b2 will throw an exception if a bare literal is provided.
              // Conforming implementations should also coerce the initial argument to
              // a string prior to parsing.
              if (parse("0") === 0 && !parse(false)) {
                // Simple parsing test.
                value = parse(serialized);
                var parseSupported = value["a"].length == 5 && value["a"][0] === 1;
                if (parseSupported) {
                  try {
                    // Safari <= 5.1.2 and FF 3.1b1 allow unescaped tabs in strings.
                    parseSupported = !parse('"\t"');
                  } catch (exception) {}
                  if (parseSupported) {
                    try {
                      // FF 4.0 and 4.0.1 allow leading `+` signs and leading
                      // decimal points. FF 4.0, 4.0.1, and IE 9-10 also allow
                      // certain octal literals.
                      parseSupported = parse("01") !== 1;
                    } catch (exception) {}
                  }
                  if (parseSupported) {
                    try {
                      // FF 4.0, 4.0.1, and Rhino 1.7R3-R4 allow trailing decimal
                      // points. These environments, along with FF 3.1b1 and 2,
                      // also allow trailing commas in JSON objects and arrays.
                      parseSupported = parse("1.") !== 1;
                    } catch (exception) {}
                  }
                }
              }
            } catch (exception) {
              parseSupported = false;
            }
          }
          isSupported = parseSupported;
        }
      }
      return has[name] = !!isSupported;
    }

    if (!has("json")) {
      // Common `[[Class]]` name aliases.
      var functionClass = "[object Function]",
          dateClass = "[object Date]",
          numberClass = "[object Number]",
          stringClass = "[object String]",
          arrayClass = "[object Array]",
          booleanClass = "[object Boolean]";

      // Detect incomplete support for accessing string characters by index.
      var charIndexBuggy = has("bug-string-char-index");

      // Define additional utility methods if the `Date` methods are buggy.
      if (!isExtended) {
        var floor = Math.floor;
        // A mapping between the months of the year and the number of days between
        // January 1st and the first of the respective month.
        var Months = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
        // Internal: Calculates the number of days between the Unix epoch and the
        // first day of the given month.
        var getDay = function (year, month) {
          return Months[month] + 365 * (year - 1970) + floor((year - 1969 + (month = +(month > 1))) / 4) - floor((year - 1901 + month) / 100) + floor((year - 1601 + month) / 400);
        };
      }

      // Internal: Determines if a property is a direct property of the given
      // object. Delegates to the native `Object#hasOwnProperty` method.
      if (!(isProperty = objectProto.hasOwnProperty)) {
        isProperty = function (property) {
          var members = {}, constructor;
          if ((members.__proto__ = null, members.__proto__ = {
            // The *proto* property cannot be set multiple times in recent
            // versions of Firefox and SeaMonkey.
            "toString": 1
          }, members).toString != getClass) {
            // Safari <= 2.0.3 doesn't implement `Object#hasOwnProperty`, but
            // supports the mutable *proto* property.
            isProperty = function (property) {
              // Capture and break the object's prototype chain (see section 8.6.2
              // of the ES 5.1 spec). The parenthesized expression prevents an
              // unsafe transformation by the Closure Compiler.
              var original = this.__proto__, result = property in (this.__proto__ = null, this);
              // Restore the original prototype chain.
              this.__proto__ = original;
              return result;
            };
          } else {
            // Capture a reference to the top-level `Object` constructor.
            constructor = members.constructor;
            // Use the `constructor` property to simulate `Object#hasOwnProperty` in
            // other environments.
            isProperty = function (property) {
              var parent = (this.constructor || constructor).prototype;
              return property in this && !(property in parent && this[property] === parent[property]);
            };
          }
          members = null;
          return isProperty.call(this, property);
        };
      }

      // Internal: Normalizes the `for...in` iteration algorithm across
      // environments. Each enumerated key is yielded to a `callback` function.
      forEach = function (object, callback) {
        var size = 0, Properties, members, property;

        // Tests for bugs in the current environment's `for...in` algorithm. The
        // `valueOf` property inherits the non-enumerable flag from
        // `Object.prototype` in older versions of IE, Netscape, and Mozilla.
        (Properties = function () {
          this.valueOf = 0;
        }).prototype.valueOf = 0;

        // Iterate over a new instance of the `Properties` class.
        members = new Properties();
        for (property in members) {
          // Ignore all properties inherited from `Object.prototype`.
          if (isProperty.call(members, property)) {
            size++;
          }
        }
        Properties = members = null;

        // Normalize the iteration algorithm.
        if (!size) {
          // A list of non-enumerable properties inherited from `Object.prototype`.
          members = ["valueOf", "toString", "toLocaleString", "propertyIsEnumerable", "isPrototypeOf", "hasOwnProperty", "constructor"];
          // IE <= 8, Mozilla 1.0, and Netscape 6.2 ignore shadowed non-enumerable
          // properties.
          forEach = function (object, callback) {
            var isFunction = getClass.call(object) == functionClass, property, length;
            var hasProperty = !isFunction && typeof object.constructor != "function" && objectTypes[typeof object.hasOwnProperty] && object.hasOwnProperty || isProperty;
            for (property in object) {
              // Gecko <= 1.0 enumerates the `prototype` property of functions under
              // certain conditions; IE does not.
              if (!(isFunction && property == "prototype") && hasProperty.call(object, property)) {
                callback(property);
              }
            }
            // Manually invoke the callback for each non-enumerable property.
            for (length = members.length; property = members[--length]; hasProperty.call(object, property) && callback(property));
          };
        } else if (size == 2) {
          // Safari <= 2.0.4 enumerates shadowed properties twice.
          forEach = function (object, callback) {
            // Create a set of iterated properties.
            var members = {}, isFunction = getClass.call(object) == functionClass, property;
            for (property in object) {
              // Store each property name to prevent double enumeration. The
              // `prototype` property of functions is not enumerated due to cross-
              // environment inconsistencies.
              if (!(isFunction && property == "prototype") && !isProperty.call(members, property) && (members[property] = 1) && isProperty.call(object, property)) {
                callback(property);
              }
            }
          };
        } else {
          // No bugs detected; use the standard `for...in` algorithm.
          forEach = function (object, callback) {
            var isFunction = getClass.call(object) == functionClass, property, isConstructor;
            for (property in object) {
              if (!(isFunction && property == "prototype") && isProperty.call(object, property) && !(isConstructor = property === "constructor")) {
                callback(property);
              }
            }
            // Manually invoke the callback for the `constructor` property due to
            // cross-environment inconsistencies.
            if (isConstructor || isProperty.call(object, (property = "constructor"))) {
              callback(property);
            }
          };
        }
        return forEach(object, callback);
      };

      // Public: Serializes a JavaScript `value` as a JSON string. The optional
      // `filter` argument may specify either a function that alters how object and
      // array members are serialized, or an array of strings and numbers that
      // indicates which properties should be serialized. The optional `width`
      // argument may be either a string or number that specifies the indentation
      // level of the output.
      if (!has("json-stringify")) {
        // Internal: A map of control characters and their escaped equivalents.
        var Escapes = {
          92: "\\\\",
          34: '\\"',
          8: "\\b",
          12: "\\f",
          10: "\\n",
          13: "\\r",
          9: "\\t"
        };

        // Internal: Converts `value` into a zero-padded string such that its
        // length is at least equal to `width`. The `width` must be <= 6.
        var leadingZeroes = "000000";
        var toPaddedString = function (width, value) {
          // The `|| 0` expression is necessary to work around a bug in
          // Opera <= 7.54u2 where `0 == -0`, but `String(-0) !== "0"`.
          return (leadingZeroes + (value || 0)).slice(-width);
        };

        // Internal: Double-quotes a string `value`, replacing all ASCII control
        // characters (characters with code unit values between 0 and 31) with
        // their escaped equivalents. This is an implementation of the
        // `Quote(value)` operation defined in ES 5.1 section 15.12.3.
        var unicodePrefix = "\\u00";
        var quote = function (value) {
          var result = '"', index = 0, length = value.length, useCharIndex = !charIndexBuggy || length > 10;
          var symbols = useCharIndex && (charIndexBuggy ? value.split("") : value);
          for (; index < length; index++) {
            var charCode = value.charCodeAt(index);
            // If the character is a control character, append its Unicode or
            // shorthand escape sequence; otherwise, append the character as-is.
            switch (charCode) {
              case 8: case 9: case 10: case 12: case 13: case 34: case 92:
                result += Escapes[charCode];
                break;
              default:
                if (charCode < 32) {
                  result += unicodePrefix + toPaddedString(2, charCode.toString(16));
                  break;
                }
                result += useCharIndex ? symbols[index] : value.charAt(index);
            }
          }
          return result + '"';
        };

        // Internal: Recursively serializes an object. Implements the
        // `Str(key, holder)`, `JO(value)`, and `JA(value)` operations.
        var serialize = function (property, object, callback, properties, whitespace, indentation, stack) {
          var value, className, year, month, date, time, hours, minutes, seconds, milliseconds, results, element, index, length, prefix, result;
          try {
            // Necessary for host object support.
            value = object[property];
          } catch (exception) {}
          if (typeof value == "object" && value) {
            className = getClass.call(value);
            if (className == dateClass && !isProperty.call(value, "toJSON")) {
              if (value > -1 / 0 && value < 1 / 0) {
                // Dates are serialized according to the `Date#toJSON` method
                // specified in ES 5.1 section 15.9.5.44. See section 15.9.1.15
                // for the ISO 8601 date time string format.
                if (getDay) {
                  // Manually compute the year, month, date, hours, minutes,
                  // seconds, and milliseconds if the `getUTC*` methods are
                  // buggy. Adapted from @Yaffle's `date-shim` project.
                  date = floor(value / 864e5);
                  for (year = floor(date / 365.2425) + 1970 - 1; getDay(year + 1, 0) <= date; year++);
                  for (month = floor((date - getDay(year, 0)) / 30.42); getDay(year, month + 1) <= date; month++);
                  date = 1 + date - getDay(year, month);
                  // The `time` value specifies the time within the day (see ES
                  // 5.1 section 15.9.1.2). The formula `(A % B + B) % B` is used
                  // to compute `A modulo B`, as the `%` operator does not
                  // correspond to the `modulo` operation for negative numbers.
                  time = (value % 864e5 + 864e5) % 864e5;
                  // The hours, minutes, seconds, and milliseconds are obtained by
                  // decomposing the time within the day. See section 15.9.1.10.
                  hours = floor(time / 36e5) % 24;
                  minutes = floor(time / 6e4) % 60;
                  seconds = floor(time / 1e3) % 60;
                  milliseconds = time % 1e3;
                } else {
                  year = value.getUTCFullYear();
                  month = value.getUTCMonth();
                  date = value.getUTCDate();
                  hours = value.getUTCHours();
                  minutes = value.getUTCMinutes();
                  seconds = value.getUTCSeconds();
                  milliseconds = value.getUTCMilliseconds();
                }
                // Serialize extended years correctly.
                value = (year <= 0 || year >= 1e4 ? (year < 0 ? "-" : "+") + toPaddedString(6, year < 0 ? -year : year) : toPaddedString(4, year)) +
                  "-" + toPaddedString(2, month + 1) + "-" + toPaddedString(2, date) +
                  // Months, dates, hours, minutes, and seconds should have two
                  // digits; milliseconds should have three.
                  "T" + toPaddedString(2, hours) + ":" + toPaddedString(2, minutes) + ":" + toPaddedString(2, seconds) +
                  // Milliseconds are optional in ES 5.0, but required in 5.1.
                  "." + toPaddedString(3, milliseconds) + "Z";
              } else {
                value = null;
              }
            } else if (typeof value.toJSON == "function" && ((className != numberClass && className != stringClass && className != arrayClass) || isProperty.call(value, "toJSON"))) {
              // Prototype <= 1.6.1 adds non-standard `toJSON` methods to the
              // `Number`, `String`, `Date`, and `Array` prototypes. JSON 3
              // ignores all `toJSON` methods on these objects unless they are
              // defined directly on an instance.
              value = value.toJSON(property);
            }
          }
          if (callback) {
            // If a replacement function was provided, call it to obtain the value
            // for serialization.
            value = callback.call(object, property, value);
          }
          if (value === null) {
            return "null";
          }
          className = getClass.call(value);
          if (className == booleanClass) {
            // Booleans are represented literally.
            return "" + value;
          } else if (className == numberClass) {
            // JSON numbers must be finite. `Infinity` and `NaN` are serialized as
            // `"null"`.
            return value > -1 / 0 && value < 1 / 0 ? "" + value : "null";
          } else if (className == stringClass) {
            // Strings are double-quoted and escaped.
            return quote("" + value);
          }
          // Recursively serialize objects and arrays.
          if (typeof value == "object") {
            // Check for cyclic structures. This is a linear search; performance
            // is inversely proportional to the number of unique nested objects.
            for (length = stack.length; length--;) {
              if (stack[length] === value) {
                // Cyclic structures cannot be serialized by `JSON.stringify`.
                throw TypeError();
              }
            }
            // Add the object to the stack of traversed objects.
            stack.push(value);
            results = [];
            // Save the current indentation level and indent one additional level.
            prefix = indentation;
            indentation += whitespace;
            if (className == arrayClass) {
              // Recursively serialize array elements.
              for (index = 0, length = value.length; index < length; index++) {
                element = serialize(index, value, callback, properties, whitespace, indentation, stack);
                results.push(element === undef ? "null" : element);
              }
              result = results.length ? (whitespace ? "[\n" + indentation + results.join(",\n" + indentation) + "\n" + prefix + "]" : ("[" + results.join(",") + "]")) : "[]";
            } else {
              // Recursively serialize object members. Members are selected from
              // either a user-specified list of property names, or the object
              // itself.
              forEach(properties || value, function (property) {
                var element = serialize(property, value, callback, properties, whitespace, indentation, stack);
                if (element !== undef) {
                  // According to ES 5.1 section 15.12.3: "If `gap` {whitespace}
                  // is not the empty string, let `member` {quote(property) + ":"}
                  // be the concatenation of `member` and the `space` character."
                  // The "`space` character" refers to the literal space
                  // character, not the `space` {width} argument provided to
                  // `JSON.stringify`.
                  results.push(quote(property) + ":" + (whitespace ? " " : "") + element);
                }
              });
              result = results.length ? (whitespace ? "{\n" + indentation + results.join(",\n" + indentation) + "\n" + prefix + "}" : ("{" + results.join(",") + "}")) : "{}";
            }
            // Remove the object from the traversed object stack.
            stack.pop();
            return result;
          }
        };

        // Public: `JSON.stringify`. See ES 5.1 section 15.12.3.
        exports.stringify = function (source, filter, width) {
          var whitespace, callback, properties, className;
          if (objectTypes[typeof filter] && filter) {
            if ((className = getClass.call(filter)) == functionClass) {
              callback = filter;
            } else if (className == arrayClass) {
              // Convert the property names array into a makeshift set.
              properties = {};
              for (var index = 0, length = filter.length, value; index < length; value = filter[index++], ((className = getClass.call(value)), className == stringClass || className == numberClass) && (properties[value] = 1));
            }
          }
          if (width) {
            if ((className = getClass.call(width)) == numberClass) {
              // Convert the `width` to an integer and create a string containing
              // `width` number of space characters.
              if ((width -= width % 1) > 0) {
                for (whitespace = "", width > 10 && (width = 10); whitespace.length < width; whitespace += " ");
              }
            } else if (className == stringClass) {
              whitespace = width.length <= 10 ? width : width.slice(0, 10);
            }
          }
          // Opera <= 7.54u2 discards the values associated with empty string keys
          // (`""`) only if they are used directly within an object member list
          // (e.g., `!("" in { "": 1})`).
          return serialize("", (value = {}, value[""] = source, value), callback, properties, whitespace, "", []);
        };
      }

      // Public: Parses a JSON source string.
      if (!has("json-parse")) {
        var fromCharCode = String.fromCharCode;

        // Internal: A map of escaped control characters and their unescaped
        // equivalents.
        var Unescapes = {
          92: "\\",
          34: '"',
          47: "/",
          98: "\b",
          116: "\t",
          110: "\n",
          102: "\f",
          114: "\r"
        };

        // Internal: Stores the parser state.
        var Index, Source;

        // Internal: Resets the parser state and throws a `SyntaxError`.
        var abort = function () {
          Index = Source = null;
          throw SyntaxError();
        };

        // Internal: Returns the next token, or `"$"` if the parser has reached
        // the end of the source string. A token may be a string, number, `null`
        // literal, or Boolean literal.
        var lex = function () {
          var source = Source, length = source.length, value, begin, position, isSigned, charCode;
          while (Index < length) {
            charCode = source.charCodeAt(Index);
            switch (charCode) {
              case 9: case 10: case 13: case 32:
                // Skip whitespace tokens, including tabs, carriage returns, line
                // feeds, and space characters.
                Index++;
                break;
              case 123: case 125: case 91: case 93: case 58: case 44:
                // Parse a punctuator token (`{`, `}`, `[`, `]`, `:`, or `,`) at
                // the current position.
                value = charIndexBuggy ? source.charAt(Index) : source[Index];
                Index++;
                return value;
              case 34:
                // `"` delimits a JSON string; advance to the next character and
                // begin parsing the string. String tokens are prefixed with the
                // sentinel `@` character to distinguish them from punctuators and
                // end-of-string tokens.
                for (value = "@", Index++; Index < length;) {
                  charCode = source.charCodeAt(Index);
                  if (charCode < 32) {
                    // Unescaped ASCII control characters (those with a code unit
                    // less than the space character) are not permitted.
                    abort();
                  } else if (charCode == 92) {
                    // A reverse solidus (`\`) marks the beginning of an escaped
                    // control character (including `"`, `\`, and `/`) or Unicode
                    // escape sequence.
                    charCode = source.charCodeAt(++Index);
                    switch (charCode) {
                      case 92: case 34: case 47: case 98: case 116: case 110: case 102: case 114:
                        // Revive escaped control characters.
                        value += Unescapes[charCode];
                        Index++;
                        break;
                      case 117:
                        // `\u` marks the beginning of a Unicode escape sequence.
                        // Advance to the first character and validate the
                        // four-digit code point.
                        begin = ++Index;
                        for (position = Index + 4; Index < position; Index++) {
                          charCode = source.charCodeAt(Index);
                          // A valid sequence comprises four hexdigits (case-
                          // insensitive) that form a single hexadecimal value.
                          if (!(charCode >= 48 && charCode <= 57 || charCode >= 97 && charCode <= 102 || charCode >= 65 && charCode <= 70)) {
                            // Invalid Unicode escape sequence.
                            abort();
                          }
                        }
                        // Revive the escaped character.
                        value += fromCharCode("0x" + source.slice(begin, Index));
                        break;
                      default:
                        // Invalid escape sequence.
                        abort();
                    }
                  } else {
                    if (charCode == 34) {
                      // An unescaped double-quote character marks the end of the
                      // string.
                      break;
                    }
                    charCode = source.charCodeAt(Index);
                    begin = Index;
                    // Optimize for the common case where a string is valid.
                    while (charCode >= 32 && charCode != 92 && charCode != 34) {
                      charCode = source.charCodeAt(++Index);
                    }
                    // Append the string as-is.
                    value += source.slice(begin, Index);
                  }
                }
                if (source.charCodeAt(Index) == 34) {
                  // Advance to the next character and return the revived string.
                  Index++;
                  return value;
                }
                // Unterminated string.
                abort();
              default:
                // Parse numbers and literals.
                begin = Index;
                // Advance past the negative sign, if one is specified.
                if (charCode == 45) {
                  isSigned = true;
                  charCode = source.charCodeAt(++Index);
                }
                // Parse an integer or floating-point value.
                if (charCode >= 48 && charCode <= 57) {
                  // Leading zeroes are interpreted as octal literals.
                  if (charCode == 48 && ((charCode = source.charCodeAt(Index + 1)), charCode >= 48 && charCode <= 57)) {
                    // Illegal octal literal.
                    abort();
                  }
                  isSigned = false;
                  // Parse the integer component.
                  for (; Index < length && ((charCode = source.charCodeAt(Index)), charCode >= 48 && charCode <= 57); Index++);
                  // Floats cannot contain a leading decimal point; however, this
                  // case is already accounted for by the parser.
                  if (source.charCodeAt(Index) == 46) {
                    position = ++Index;
                    // Parse the decimal component.
                    for (; position < length && ((charCode = source.charCodeAt(position)), charCode >= 48 && charCode <= 57); position++);
                    if (position == Index) {
                      // Illegal trailing decimal.
                      abort();
                    }
                    Index = position;
                  }
                  // Parse exponents. The `e` denoting the exponent is
                  // case-insensitive.
                  charCode = source.charCodeAt(Index);
                  if (charCode == 101 || charCode == 69) {
                    charCode = source.charCodeAt(++Index);
                    // Skip past the sign following the exponent, if one is
                    // specified.
                    if (charCode == 43 || charCode == 45) {
                      Index++;
                    }
                    // Parse the exponential component.
                    for (position = Index; position < length && ((charCode = source.charCodeAt(position)), charCode >= 48 && charCode <= 57); position++);
                    if (position == Index) {
                      // Illegal empty exponent.
                      abort();
                    }
                    Index = position;
                  }
                  // Coerce the parsed value to a JavaScript number.
                  return +source.slice(begin, Index);
                }
                // A negative sign may only precede numbers.
                if (isSigned) {
                  abort();
                }
                // `true`, `false`, and `null` literals.
                if (source.slice(Index, Index + 4) == "true") {
                  Index += 4;
                  return true;
                } else if (source.slice(Index, Index + 5) == "false") {
                  Index += 5;
                  return false;
                } else if (source.slice(Index, Index + 4) == "null") {
                  Index += 4;
                  return null;
                }
                // Unrecognized token.
                abort();
            }
          }
          // Return the sentinel `$` character if the parser has reached the end
          // of the source string.
          return "$";
        };

        // Internal: Parses a JSON `value` token.
        var get = function (value) {
          var results, hasMembers;
          if (value == "$") {
            // Unexpected end of input.
            abort();
          }
          if (typeof value == "string") {
            if ((charIndexBuggy ? value.charAt(0) : value[0]) == "@") {
              // Remove the sentinel `@` character.
              return value.slice(1);
            }
            // Parse object and array literals.
            if (value == "[") {
              // Parses a JSON array, returning a new JavaScript array.
              results = [];
              for (;; hasMembers || (hasMembers = true)) {
                value = lex();
                // A closing square bracket marks the end of the array literal.
                if (value == "]") {
                  break;
                }
                // If the array literal contains elements, the current token
                // should be a comma separating the previous element from the
                // next.
                if (hasMembers) {
                  if (value == ",") {
                    value = lex();
                    if (value == "]") {
                      // Unexpected trailing `,` in array literal.
                      abort();
                    }
                  } else {
                    // A `,` must separate each array element.
                    abort();
                  }
                }
                // Elisions and leading commas are not permitted.
                if (value == ",") {
                  abort();
                }
                results.push(get(value));
              }
              return results;
            } else if (value == "{") {
              // Parses a JSON object, returning a new JavaScript object.
              results = {};
              for (;; hasMembers || (hasMembers = true)) {
                value = lex();
                // A closing curly brace marks the end of the object literal.
                if (value == "}") {
                  break;
                }
                // If the object literal contains members, the current token
                // should be a comma separator.
                if (hasMembers) {
                  if (value == ",") {
                    value = lex();
                    if (value == "}") {
                      // Unexpected trailing `,` in object literal.
                      abort();
                    }
                  } else {
                    // A `,` must separate each object member.
                    abort();
                  }
                }
                // Leading commas are not permitted, object property names must be
                // double-quoted strings, and a `:` must separate each property
                // name and value.
                if (value == "," || typeof value != "string" || (charIndexBuggy ? value.charAt(0) : value[0]) != "@" || lex() != ":") {
                  abort();
                }
                results[value.slice(1)] = get(lex());
              }
              return results;
            }
            // Unexpected token encountered.
            abort();
          }
          return value;
        };

        // Internal: Updates a traversed object member.
        var update = function (source, property, callback) {
          var element = walk(source, property, callback);
          if (element === undef) {
            delete source[property];
          } else {
            source[property] = element;
          }
        };

        // Internal: Recursively traverses a parsed JSON object, invoking the
        // `callback` function for each value. This is an implementation of the
        // `Walk(holder, name)` operation defined in ES 5.1 section 15.12.2.
        var walk = function (source, property, callback) {
          var value = source[property], length;
          if (typeof value == "object" && value) {
            // `forEach` can't be used to traverse an array in Opera <= 8.54
            // because its `Object#hasOwnProperty` implementation returns `false`
            // for array indices (e.g., `![1, 2, 3].hasOwnProperty("0")`).
            if (getClass.call(value) == arrayClass) {
              for (length = value.length; length--;) {
                update(value, length, callback);
              }
            } else {
              forEach(value, function (property) {
                update(value, property, callback);
              });
            }
          }
          return callback.call(source, property, value);
        };

        // Public: `JSON.parse`. See ES 5.1 section 15.12.2.
        exports.parse = function (source, callback) {
          var result, value;
          Index = 0;
          Source = "" + source;
          result = get(lex());
          // If a JSON string contains multiple tokens, it is invalid.
          if (lex() != "$") {
            abort();
          }
          // Reset the parser state.
          Index = Source = null;
          return callback && getClass.call(callback) == functionClass ? walk((value = {}, value[""] = result, value), "", callback) : result;
        };
      }
    }

    exports["runInContext"] = runInContext;
    return exports;
  }

  if (freeExports && !isLoader) {
    // Export for CommonJS environments.
    runInContext(root, freeExports);
  } else {
    // Export for web browsers and JavaScript engines.
    var nativeJSON = root.JSON,
        previousJSON = root["JSON3"],
        isRestored = false;

    var JSON3 = runInContext(root, (root["JSON3"] = {
      // Public: Restores the original value of the global `JSON` object and
      // returns a reference to the `JSON3` object.
      "noConflict": function () {
        if (!isRestored) {
          isRestored = true;
          root.JSON = nativeJSON;
          root["JSON3"] = previousJSON;
          nativeJSON = previousJSON = null;
        }
        return JSON3;
      }
    }));

    root.JSON = {
      "parse": JSON3.parse,
      "stringify": JSON3.stringify
    };
  }

  // Export for asynchronous module loaders.
  if (isLoader) {
    define(function () {
      return JSON3;
    });
  }
}).call(this);

}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : {})
},{}],51:[function(_dereq_,module,exports){
module.exports = toArray

function toArray(list, index) {
    var array = []

    index = index || 0

    for (var i = index || 0; i < list.length; i++) {
        array[i - index] = list[i]
    }

    return array
}

},{}]},{},[31])(31)
});

/*! adapterjs - v0.13.3 - 2016-04-13 */

// Adapter's interface.
var AdapterJS = AdapterJS || {};

// Browserify compatibility
if(typeof exports !== 'undefined') {
  module.exports = AdapterJS;
}

AdapterJS.options = AdapterJS.options || {};

// uncomment to get virtual webcams
// AdapterJS.options.getAllCams = true;

// uncomment to prevent the install prompt when the plugin in not yet installed
// AdapterJS.options.hidePluginInstallPrompt = true;

// AdapterJS version
AdapterJS.VERSION = '0.13.3';

// This function will be called when the WebRTC API is ready to be used
// Whether it is the native implementation (Chrome, Firefox, Opera) or
// the plugin
// You may Override this function to synchronise the start of your application
// with the WebRTC API being ready.
// If you decide not to override use this synchronisation, it may result in
// an extensive CPU usage on the plugin start (once per tab loaded)
// Params:
//    - isUsingPlugin: true is the WebRTC plugin is being used, false otherwise
//
AdapterJS.onwebrtcready = AdapterJS.onwebrtcready || function(isUsingPlugin) {
  // The WebRTC API is ready.
  // Override me and do whatever you want here
};

// New interface to store multiple callbacks, private
AdapterJS._onwebrtcreadies = [];

// Sets a callback function to be called when the WebRTC interface is ready.
// The first argument is the function to callback.\
// Throws an error if the first argument is not a function
AdapterJS.webRTCReady = function (callback) {
  if (typeof callback !== 'function') {
    throw new Error('Callback provided is not a function');
  }

  if (true === AdapterJS.onwebrtcreadyDone) {
    // All WebRTC interfaces are ready, just call the callback
    callback(null !== AdapterJS.WebRTCPlugin.plugin);
  } else {
    // will be triggered automatically when your browser/plugin is ready.
    AdapterJS._onwebrtcreadies.push(callback);
  }
};

// Plugin namespace
AdapterJS.WebRTCPlugin = AdapterJS.WebRTCPlugin || {};

// The object to store plugin information
/* jshint ignore:start */
AdapterJS.WebRTCPlugin.pluginInfo = {
  prefix : 'Tem',
  plugName : 'TemWebRTCPlugin',
  pluginId : 'plugin0',
  type : 'application/x-temwebrtcplugin',
  onload : '__TemWebRTCReady0',
  portalLink : 'http://skylink.io/plugin/',
  downloadLink : null, //set below
  companyName: 'Temasys'
};
if(!!navigator.platform.match(/^Mac/i)) {
  AdapterJS.WebRTCPlugin.pluginInfo.downloadLink = 'http://bit.ly/1n77hco';
}
else if(!!navigator.platform.match(/^Win/i)) {
  AdapterJS.WebRTCPlugin.pluginInfo.downloadLink = 'http://bit.ly/1kkS4FN';
}
/* jshint ignore:end */

AdapterJS.WebRTCPlugin.TAGS = {
  NONE  : 'none',
  AUDIO : 'audio',
  VIDEO : 'video'
};

// Unique identifier of each opened page
AdapterJS.WebRTCPlugin.pageId = Math.random().toString(36).slice(2);

// Use this whenever you want to call the plugin.
AdapterJS.WebRTCPlugin.plugin = null;

// Set log level for the plugin once it is ready.
// The different values are
// This is an asynchronous function that will run when the plugin is ready
AdapterJS.WebRTCPlugin.setLogLevel = null;

// Defines webrtc's JS interface according to the plugin's implementation.
// Define plugin Browsers as WebRTC Interface.
AdapterJS.WebRTCPlugin.defineWebRTCInterface = null;

// This function detects whether or not a plugin is installed.
// Checks if Not IE (firefox, for example), else if it's IE,
// we're running IE and do something. If not it is not supported.
AdapterJS.WebRTCPlugin.isPluginInstalled = null;

 // Lets adapter.js wait until the the document is ready before injecting the plugin
AdapterJS.WebRTCPlugin.pluginInjectionInterval = null;

// Inject the HTML DOM object element into the page.
AdapterJS.WebRTCPlugin.injectPlugin = null;

// States of readiness that the plugin goes through when
// being injected and stated
AdapterJS.WebRTCPlugin.PLUGIN_STATES = {
  NONE : 0,           // no plugin use
  INITIALIZING : 1,   // Detected need for plugin
  INJECTING : 2,      // Injecting plugin
  INJECTED: 3,        // Plugin element injected but not usable yet
  READY: 4            // Plugin ready to be used
};

// Current state of the plugin. You cannot use the plugin before this is
// equal to AdapterJS.WebRTCPlugin.PLUGIN_STATES.READY
AdapterJS.WebRTCPlugin.pluginState = AdapterJS.WebRTCPlugin.PLUGIN_STATES.NONE;

// True is AdapterJS.onwebrtcready was already called, false otherwise
// Used to make sure AdapterJS.onwebrtcready is only called once
AdapterJS.onwebrtcreadyDone = false;

// Log levels for the plugin.
// To be set by calling AdapterJS.WebRTCPlugin.setLogLevel
/*
Log outputs are prefixed in some cases.
  INFO: Information reported by the plugin.
  ERROR: Errors originating from within the plugin.
  WEBRTC: Error originating from within the libWebRTC library
*/
// From the least verbose to the most verbose
AdapterJS.WebRTCPlugin.PLUGIN_LOG_LEVELS = {
  NONE : 'NONE',
  ERROR : 'ERROR',
  WARNING : 'WARNING',
  INFO: 'INFO',
  VERBOSE: 'VERBOSE',
  SENSITIVE: 'SENSITIVE'
};

// Does a waiting check before proceeding to load the plugin.
AdapterJS.WebRTCPlugin.WaitForPluginReady = null;

// This methid will use an interval to wait for the plugin to be ready.
AdapterJS.WebRTCPlugin.callWhenPluginReady = null;

// !!!! WARNING: DO NOT OVERRIDE THIS FUNCTION. !!!
// This function will be called when plugin is ready. It sends necessary
// details to the plugin.
// The function will wait for the document to be ready and the set the
// plugin state to AdapterJS.WebRTCPlugin.PLUGIN_STATES.READY,
// indicating that it can start being requested.
// This function is not in the IE/Safari condition brackets so that
// TemPluginLoaded function might be called on Chrome/Firefox.
// This function is the only private function that is not encapsulated to
// allow the plugin method to be called.
__TemWebRTCReady0 = function () {
  if (document.readyState === 'complete') {
    AdapterJS.WebRTCPlugin.pluginState = AdapterJS.WebRTCPlugin.PLUGIN_STATES.READY;
    AdapterJS.maybeThroughWebRTCReady();
  } else {
    var timer = setInterval(function () {
      if (document.readyState === 'complete') {
        // TODO: update comments, we wait for the document to be ready
        clearInterval(timer);
        AdapterJS.WebRTCPlugin.pluginState = AdapterJS.WebRTCPlugin.PLUGIN_STATES.READY;
        AdapterJS.maybeThroughWebRTCReady();
      }
    }, 100);
  }
};

AdapterJS.maybeThroughWebRTCReady = function() {
  if (!AdapterJS.onwebrtcreadyDone) {
    AdapterJS.onwebrtcreadyDone = true;

    // If new interface for multiple callbacks used
    if (AdapterJS._onwebrtcreadies.length) {
      AdapterJS._onwebrtcreadies.forEach(function (callback) {
        if (typeof(callback) === 'function') {
          callback(AdapterJS.WebRTCPlugin.plugin !== null);
        }
      });
    // Else if no callbacks on new interface assuming user used old(deprecated) way to set callback through AdapterJS.onwebrtcready = ...
    } else if (typeof(AdapterJS.onwebrtcready) === 'function') {
      AdapterJS.onwebrtcready(AdapterJS.WebRTCPlugin.plugin !== null);
    }
  }
};

// Text namespace
AdapterJS.TEXT = {
  PLUGIN: {
    REQUIRE_INSTALLATION: 'This website requires you to install a WebRTC-enabling plugin ' +
      'to work on this browser.',
    NOT_SUPPORTED: 'Your browser does not support WebRTC.',
    BUTTON: 'Install Now'
  },
  REFRESH: {
    REQUIRE_REFRESH: 'Please refresh page',
    BUTTON: 'Refresh Page'
  }
};

// The result of ice connection states.
// - starting: Ice connection is starting.
// - checking: Ice connection is checking.
// - connected Ice connection is connected.
// - completed Ice connection is connected.
// - done Ice connection has been completed.
// - disconnected Ice connection has been disconnected.
// - failed Ice connection has failed.
// - closed Ice connection is closed.
AdapterJS._iceConnectionStates = {
  starting : 'starting',
  checking : 'checking',
  connected : 'connected',
  completed : 'connected',
  done : 'completed',
  disconnected : 'disconnected',
  failed : 'failed',
  closed : 'closed'
};

//The IceConnection states that has been fired for each peer.
AdapterJS._iceConnectionFiredStates = [];


// Check if WebRTC Interface is defined.
AdapterJS.isDefined = null;

// This function helps to retrieve the webrtc detected browser information.
// This sets:
// - webrtcDetectedBrowser: The browser agent name.
// - webrtcDetectedVersion: The browser version.
// - webrtcMinimumVersion: The minimum browser version still supported by AJS.
// - webrtcDetectedType: The types of webRTC support.
//   - 'moz': Mozilla implementation of webRTC.
//   - 'webkit': WebKit implementation of webRTC.
//   - 'plugin': Using the plugin implementation.
AdapterJS.parseWebrtcDetectedBrowser = function () {
  var hasMatch = null;
  if ((!!window.opr && !!opr.addons) || 
    !!window.opera || 
    navigator.userAgent.indexOf(' OPR/') >= 0) {
    // Opera 8.0+
    webrtcDetectedBrowser = 'opera';
    webrtcDetectedType    = 'webkit';
    webrtcMinimumVersion  = 26;
    hasMatch = /OPR\/(\d+)/i.exec(navigator.userAgent) || [];
    webrtcDetectedVersion = parseInt(hasMatch[1], 10);
  } else if (typeof InstallTrigger !== 'undefined') {
    // Firefox 1.0+
    // Bowser and Version set in Google's adapter
    webrtcDetectedType    = 'moz';
  } else if (Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0) {
    // Safari
    webrtcDetectedBrowser = 'safari';
    webrtcDetectedType    = 'plugin';
    webrtcMinimumVersion  = 7;
    hasMatch = /version\/(\d+)/i.exec(navigator.userAgent) || [];
    webrtcDetectedVersion = parseInt(hasMatch[1], 10);
  } else if (/*@cc_on!@*/false || !!document.documentMode) {
    // Internet Explorer 6-11
    webrtcDetectedBrowser = 'IE';
    webrtcDetectedType    = 'plugin';
    webrtcMinimumVersion  = 9;
    hasMatch = /\brv[ :]+(\d+)/g.exec(navigator.userAgent) || [];
    webrtcDetectedVersion = parseInt(hasMatch[1] || '0', 10);
    if (!webrtcDetectedVersion) {
      hasMatch = /\bMSIE[ :]+(\d+)/g.exec(navigator.userAgent) || [];
      webrtcDetectedVersion = parseInt(hasMatch[1] || '0', 10);      
    }
  } else if (!!window.StyleMedia) {
    // Edge 20+
    // Bowser and Version set in Google's adapter
    webrtcDetectedType    = '';
  } else if (!!window.chrome && !!window.chrome.webstore) {
    // Chrome 1+
    // Bowser and Version set in Google's adapter
    webrtcDetectedType    = 'webkit';
  } else if ((webrtcDetectedBrowser === 'chrome'|| webrtcDetectedBrowser === 'opera') && 
    !!window.CSS) {
    // Blink engine detection
    webrtcDetectedBrowser = 'blink';
    // TODO: detected WebRTC version
  }

  window.webrtcDetectedBrowser = webrtcDetectedBrowser;
  window.webrtcDetectedVersion = webrtcDetectedVersion;
  window.webrtcMinimumVersion  = webrtcMinimumVersion;
};

AdapterJS.addEvent = function(elem, evnt, func) {
  if (elem.addEventListener) { // W3C DOM
    elem.addEventListener(evnt, func, false);
  } else if (elem.attachEvent) {// OLD IE DOM
    elem.attachEvent('on'+evnt, func);
  } else { // No much to do
    elem[evnt] = func;
  }
};

AdapterJS.renderNotificationBar = function (text, buttonText, buttonLink, openNewTab, displayRefreshBar) {
  // only inject once the page is ready
  if (document.readyState !== 'complete') {
    return;
  }

  var w = window;
  var i = document.createElement('iframe');
  i.name = 'adapterjs-alert';
  i.style.position = 'fixed';
  i.style.top = '-41px';
  i.style.left = 0;
  i.style.right = 0;
  i.style.width = '100%';
  i.style.height = '40px';
  i.style.backgroundColor = '#ffffe1';
  i.style.border = 'none';
  i.style.borderBottom = '1px solid #888888';
  i.style.zIndex = '9999999';
  if(typeof i.style.webkitTransition === 'string') {
    i.style.webkitTransition = 'all .5s ease-out';
  } else if(typeof i.style.transition === 'string') {
    i.style.transition = 'all .5s ease-out';
  }
  document.body.appendChild(i);
  var c = (i.contentWindow) ? i.contentWindow :
    (i.contentDocument.document) ? i.contentDocument.document : i.contentDocument;
  c.document.open();
  c.document.write('<span style="display: inline-block; font-family: Helvetica, Arial,' +
    'sans-serif; font-size: .9rem; padding: 4px; vertical-align: ' +
    'middle; cursor: default;">' + text + '</span>');
  if(buttonText && buttonLink) {
    c.document.write('<button id="okay">' + buttonText + '</button><button id="cancel">Cancel</button>');
    c.document.close();

    // On click on okay
    AdapterJS.addEvent(c.document.getElementById('okay'), 'click', function(e) {
      if (!!displayRefreshBar) {
        AdapterJS.renderNotificationBar(AdapterJS.TEXT.EXTENSION ?
          AdapterJS.TEXT.EXTENSION.REQUIRE_REFRESH : AdapterJS.TEXT.REFRESH.REQUIRE_REFRESH,
          AdapterJS.TEXT.REFRESH.BUTTON, 'javascript:location.reload()'); // jshint ignore:line
      }
      window.open(buttonLink, !!openNewTab ? '_blank' : '_top');

      e.preventDefault();
      try {
        e.cancelBubble = true;
      } catch(error) { }

      var pluginInstallInterval = setInterval(function(){
        if(! isIE) {
          navigator.plugins.refresh(false);
        }
        AdapterJS.WebRTCPlugin.isPluginInstalled(
          AdapterJS.WebRTCPlugin.pluginInfo.prefix,
          AdapterJS.WebRTCPlugin.pluginInfo.plugName,
          function() { // plugin now installed
            clearInterval(pluginInstallInterval);
            AdapterJS.WebRTCPlugin.defineWebRTCInterface();
          },
          function() {
            // still no plugin detected, nothing to do
          });
      } , 500);
    });

    // On click on Cancel
    AdapterJS.addEvent(c.document.getElementById('cancel'), 'click', function(e) {
      w.document.body.removeChild(i);
    });
  } else {
    c.document.close();
  }
  setTimeout(function() {
    if(typeof i.style.webkitTransform === 'string') {
      i.style.webkitTransform = 'translateY(40px)';
    } else if(typeof i.style.transform === 'string') {
      i.style.transform = 'translateY(40px)';
    } else {
      i.style.top = '0px';
    }
  }, 300);
};

// -----------------------------------------------------------
// Detected webrtc implementation. Types are:
// - 'moz': Mozilla implementation of webRTC.
// - 'webkit': WebKit implementation of webRTC.
// - 'plugin': Using the plugin implementation.
webrtcDetectedType = null;

// Set the settings for creating DataChannels, MediaStream for
// Cross-browser compability.
// - This is only for SCTP based support browsers.
// the 'urls' attribute.
checkMediaDataChannelSettings =
  function (peerBrowserAgent, peerBrowserVersion, callback, constraints) {
  if (typeof callback !== 'function') {
    return;
  }
  var beOfferer = true;
  var isLocalFirefox = webrtcDetectedBrowser === 'firefox';
  // Nightly version does not require MozDontOfferDataChannel for interop
  var isLocalFirefoxInterop = webrtcDetectedType === 'moz' && webrtcDetectedVersion > 30;
  var isPeerFirefox = peerBrowserAgent === 'firefox';
  var isPeerFirefoxInterop = peerBrowserAgent === 'firefox' &&
    ((peerBrowserVersion) ? (peerBrowserVersion > 30) : false);

  // Resends an updated version of constraints for MozDataChannel to work
  // If other userAgent is firefox and user is firefox, remove MozDataChannel
  if ((isLocalFirefox && isPeerFirefox) || (isLocalFirefoxInterop)) {
    try {
      delete constraints.mandatory.MozDontOfferDataChannel;
    } catch (error) {
      console.error('Failed deleting MozDontOfferDataChannel');
      console.error(error);
    }
  } else if ((isLocalFirefox && !isPeerFirefox)) {
    constraints.mandatory.MozDontOfferDataChannel = true;
  }
  if (!isLocalFirefox) {
    // temporary measure to remove Moz* constraints in non Firefox browsers
    for (var prop in constraints.mandatory) {
      if (constraints.mandatory.hasOwnProperty(prop)) {
        if (prop.indexOf('Moz') !== -1) {
          delete constraints.mandatory[prop];
        }
      }
    }
  }
  // Firefox (not interopable) cannot offer DataChannel as it will cause problems to the
  // interopability of the media stream
  if (isLocalFirefox && !isPeerFirefox && !isLocalFirefoxInterop) {
    beOfferer = false;
  }
  callback(beOfferer, constraints);
};

// Handles the differences for all browsers ice connection state output.
// - Tested outcomes are:
//   - Chrome (offerer)  : 'checking' > 'completed' > 'completed'
//   - Chrome (answerer) : 'checking' > 'connected'
//   - Firefox (offerer) : 'checking' > 'connected'
//   - Firefox (answerer): 'checking' > 'connected'
checkIceConnectionState = function (peerId, iceConnectionState, callback) {
  if (typeof callback !== 'function') {
    console.warn('No callback specified in checkIceConnectionState. Aborted.');
    return;
  }
  peerId = (peerId) ? peerId : 'peer';

  if (!AdapterJS._iceConnectionFiredStates[peerId] ||
    iceConnectionState === AdapterJS._iceConnectionStates.disconnected ||
    iceConnectionState === AdapterJS._iceConnectionStates.failed ||
    iceConnectionState === AdapterJS._iceConnectionStates.closed) {
    AdapterJS._iceConnectionFiredStates[peerId] = [];
  }
  iceConnectionState = AdapterJS._iceConnectionStates[iceConnectionState];
  if (AdapterJS._iceConnectionFiredStates[peerId].indexOf(iceConnectionState) < 0) {
    AdapterJS._iceConnectionFiredStates[peerId].push(iceConnectionState);
    if (iceConnectionState === AdapterJS._iceConnectionStates.connected) {
      setTimeout(function () {
        AdapterJS._iceConnectionFiredStates[peerId]
          .push(AdapterJS._iceConnectionStates.done);
        callback(AdapterJS._iceConnectionStates.done);
      }, 1000);
    }
    callback(iceConnectionState);
  }
  return;
};

// Firefox:
// - Creates iceServer from the url for Firefox.
// - Create iceServer with stun url.
// - Create iceServer with turn url.
//   - Ignore the transport parameter from TURN url for FF version <=27.
//   - Return null for createIceServer if transport=tcp.
// - FF 27 and above supports transport parameters in TURN url,
// - So passing in the full url to create iceServer.
// Chrome:
// - Creates iceServer from the url for Chrome M33 and earlier.
//   - Create iceServer with stun url.
//   - Chrome M28 & above uses below TURN format.
// Plugin:
// - Creates Ice Server for Plugin Browsers
//   - If Stun - Create iceServer with stun url.
//   - Else - Create iceServer with turn url
//   - This is a WebRTC Function
createIceServer = null;

// Firefox:
// - Creates IceServers for Firefox
//   - Use .url for FireFox.
//   - Multiple Urls support
// Chrome:
// - Creates iceServers from the urls for Chrome M34 and above.
//   - .urls is supported since Chrome M34.
//   - Multiple Urls support
// Plugin:
// - Creates Ice Servers for Plugin Browsers
//   - Multiple Urls support
//   - This is a WebRTC Function
createIceServers = null;
//------------------------------------------------------------

//The RTCPeerConnection object.
RTCPeerConnection = null;

// Creates RTCSessionDescription object for Plugin Browsers
RTCSessionDescription = (typeof RTCSessionDescription === 'function') ?
  RTCSessionDescription : null;

// Creates RTCIceCandidate object for Plugin Browsers
RTCIceCandidate = (typeof RTCIceCandidate === 'function') ?
  RTCIceCandidate : null;

// Get UserMedia (only difference is the prefix).
// Code from Adam Barth.
getUserMedia = null;

// Attach a media stream to an element.
attachMediaStream = null;

// Re-attach a media stream to an element.
reattachMediaStream = null;


// Detected browser agent name. Types are:
// - 'firefox': Firefox browser.
// - 'chrome': Chrome browser.
// - 'opera': Opera browser.
// - 'safari': Safari browser.
// - 'IE' - Internet Explorer browser.
webrtcDetectedBrowser = null;

// Detected browser version.
webrtcDetectedVersion = null;

// The minimum browser version still supported by AJS.
webrtcMinimumVersion  = null;

// Check for browser types and react accordingly
if ( navigator.mozGetUserMedia || 
  navigator.webkitGetUserMedia || 
  (navigator.mediaDevices && 
    navigator.userAgent.match(/Edge\/(\d+).(\d+)$/)) ) { 

  ///////////////////////////////////////////////////////////////////
  // INJECTION OF GOOGLE'S ADAPTER.JS CONTENT

/* jshint ignore:start */
  /*
   *  Copyright (c) 2016 The WebRTC project authors. All Rights Reserved.
   *
   *  Use of this source code is governed by a BSD-style license
   *  that can be found in the LICENSE file in the root of the source
   *  tree.
   */
  
  /* More information about these options at jshint.com/docs/options */
  /* jshint browser: true, camelcase: true, curly: true, devel: true,
     eqeqeq: true, forin: false, globalstrict: true, node: true,
     quotmark: single, undef: true, unused: strict */
  /* global mozRTCIceCandidate, mozRTCPeerConnection, Promise,
  mozRTCSessionDescription, webkitRTCPeerConnection, MediaStreamTrack,
  MediaStream, RTCIceGatherer, RTCIceTransport, RTCDtlsTransport,
  RTCRtpSender, RTCRtpReceiver*/
  /* exported trace,requestUserMedia */
  
  'use strict';
  
  var getUserMedia = null;
  var attachMediaStream = null;
  var reattachMediaStream = null;
  var webrtcDetectedBrowser = null;
  var webrtcDetectedVersion = null;
  var webrtcMinimumVersion = null;
  var webrtcUtils = {
    log: function() {
      // suppress console.log output when being included as a module.
      if (typeof module !== 'undefined' ||
          typeof require === 'function' && typeof define === 'function') {
        return;
      }
      console.log.apply(console, arguments);
    },
    extractVersion: function(uastring, expr, pos) {
      var match = uastring.match(expr);
      return match && match.length >= pos && parseInt(match[pos], 10);
    }
  };
  
  function trace(text) {
    // This function is used for logging.
    if (text[text.length - 1] === '\n') {
      text = text.substring(0, text.length - 1);
    }
    if (window.performance) {
      var now = (window.performance.now() / 1000).toFixed(3);
      webrtcUtils.log(now + ': ' + text);
    } else {
      webrtcUtils.log(text);
    }
  }
  
  if (typeof window === 'object') {
    if (window.HTMLMediaElement &&
      !('srcObject' in window.HTMLMediaElement.prototype)) {
      // Shim the srcObject property, once, when HTMLMediaElement is found.
      Object.defineProperty(window.HTMLMediaElement.prototype, 'srcObject', {
        get: function() {
          // If prefixed srcObject property exists, return it.
          // Otherwise use the shimmed property, _srcObject
          return 'mozSrcObject' in this ? this.mozSrcObject : this._srcObject;
        },
        set: function(stream) {
          if ('mozSrcObject' in this) {
            this.mozSrcObject = stream;
          } else {
            // Use _srcObject as a private property for this shim
            this._srcObject = stream;
            // TODO: revokeObjectUrl(this.src) when !stream to release resources?
            this.src = URL.createObjectURL(stream);
          }
        }
      });
    }
    // Proxy existing globals
    getUserMedia = window.navigator && window.navigator.getUserMedia;
  }
  
  // Attach a media stream to an element.
  attachMediaStream = function(element, stream) {
    element.srcObject = stream;
  };
  
  reattachMediaStream = function(to, from) {
    to.srcObject = from.srcObject;
  };
  
  if (typeof window === 'undefined' || !window.navigator) {
    webrtcUtils.log('This does not appear to be a browser');
    webrtcDetectedBrowser = 'not a browser';
  } else if (navigator.mozGetUserMedia) {
    webrtcUtils.log('This appears to be Firefox');
  
    webrtcDetectedBrowser = 'firefox';
  
    // the detected firefox version.
    webrtcDetectedVersion = webrtcUtils.extractVersion(navigator.userAgent,
        /Firefox\/([0-9]+)\./, 1);
  
    // the minimum firefox version still supported by adapter.
    webrtcMinimumVersion = 31;
  
    // Shim for RTCPeerConnection on older versions.
    if (!window.RTCPeerConnection) {
      window.RTCPeerConnection = function(pcConfig, pcConstraints) {
        if (webrtcDetectedVersion < 38) {
          // .urls is not supported in FF < 38.
          // create RTCIceServers with a single url.
          if (pcConfig && pcConfig.iceServers) {
            var newIceServers = [];
            for (var i = 0; i < pcConfig.iceServers.length; i++) {
              var server = pcConfig.iceServers[i];
              if (server.hasOwnProperty('urls')) {
                for (var j = 0; j < server.urls.length; j++) {
                  var newServer = {
                    url: server.urls[j]
                  };
                  if (server.urls[j].indexOf('turn') === 0) {
                    newServer.username = server.username;
                    newServer.credential = server.credential;
                  }
                  newIceServers.push(newServer);
                }
              } else {
                newIceServers.push(pcConfig.iceServers[i]);
              }
            }
            pcConfig.iceServers = newIceServers;
          }
        }
        return new mozRTCPeerConnection(pcConfig, pcConstraints); // jscs:ignore requireCapitalizedConstructors
      };
  
      // wrap static methods. Currently just generateCertificate.
      if (mozRTCPeerConnection.generateCertificate) {
        Object.defineProperty(window.RTCPeerConnection, 'generateCertificate', {
          get: function() {
            if (arguments.length) {
              return mozRTCPeerConnection.generateCertificate.apply(null,
                  arguments);
            } else {
              return mozRTCPeerConnection.generateCertificate;
            }
          }
        });
      }
  
      window.RTCSessionDescription = mozRTCSessionDescription;
      window.RTCIceCandidate = mozRTCIceCandidate;
    }
  
    // getUserMedia constraints shim.
    getUserMedia = function(constraints, onSuccess, onError) {
      var constraintsToFF37 = function(c) {
        if (typeof c !== 'object' || c.require) {
          return c;
        }
        var require = [];
        Object.keys(c).forEach(function(key) {
          if (key === 'require' || key === 'advanced' || key === 'mediaSource') {
            return;
          }
          var r = c[key] = (typeof c[key] === 'object') ?
              c[key] : {ideal: c[key]};
          if (r.min !== undefined ||
              r.max !== undefined || r.exact !== undefined) {
            require.push(key);
          }
          if (r.exact !== undefined) {
            if (typeof r.exact === 'number') {
              r.min = r.max = r.exact;
            } else {
              c[key] = r.exact;
            }
            delete r.exact;
          }
          if (r.ideal !== undefined) {
            c.advanced = c.advanced || [];
            var oc = {};
            if (typeof r.ideal === 'number') {
              oc[key] = {min: r.ideal, max: r.ideal};
            } else {
              oc[key] = r.ideal;
            }
            c.advanced.push(oc);
            delete r.ideal;
            if (!Object.keys(r).length) {
              delete c[key];
            }
          }
        });
        if (require.length) {
          c.require = require;
        }
        return c;
      };
      if (webrtcDetectedVersion < 38) {
        webrtcUtils.log('spec: ' + JSON.stringify(constraints));
        if (constraints.audio) {
          constraints.audio = constraintsToFF37(constraints.audio);
        }
        if (constraints.video) {
          constraints.video = constraintsToFF37(constraints.video);
        }
        webrtcUtils.log('ff37: ' + JSON.stringify(constraints));
      }
      return navigator.mozGetUserMedia(constraints, onSuccess, onError);
    };
  
    navigator.getUserMedia = getUserMedia;
  
    // Shim for mediaDevices on older versions.
    if (!navigator.mediaDevices) {
      navigator.mediaDevices = {getUserMedia: requestUserMedia,
        addEventListener: function() { },
        removeEventListener: function() { }
      };
    }
    navigator.mediaDevices.enumerateDevices =
        navigator.mediaDevices.enumerateDevices || function() {
      return new Promise(function(resolve) {
        var infos = [
          {kind: 'audioinput', deviceId: 'default', label: '', groupId: ''},
          {kind: 'videoinput', deviceId: 'default', label: '', groupId: ''}
        ];
        resolve(infos);
      });
    };
  
    if (webrtcDetectedVersion < 41) {
      // Work around http://bugzil.la/1169665
      var orgEnumerateDevices =
          navigator.mediaDevices.enumerateDevices.bind(navigator.mediaDevices);
      navigator.mediaDevices.enumerateDevices = function() {
        return orgEnumerateDevices().then(undefined, function(e) {
          if (e.name === 'NotFoundError') {
            return [];
          }
          throw e;
        });
      };
    }
  } else if (navigator.webkitGetUserMedia && window.webkitRTCPeerConnection) {
    webrtcUtils.log('This appears to be Chrome');
  
    webrtcDetectedBrowser = 'chrome';
  
    // the detected chrome version.
    webrtcDetectedVersion = webrtcUtils.extractVersion(navigator.userAgent,
        /Chrom(e|ium)\/([0-9]+)\./, 2);
  
    // the minimum chrome version still supported by adapter.
    webrtcMinimumVersion = 38;
  
    // The RTCPeerConnection object.
    window.RTCPeerConnection = function(pcConfig, pcConstraints) {
      // Translate iceTransportPolicy to iceTransports,
      // see https://code.google.com/p/webrtc/issues/detail?id=4869
      if (pcConfig && pcConfig.iceTransportPolicy) {
        pcConfig.iceTransports = pcConfig.iceTransportPolicy;
      }
  
      var pc = new webkitRTCPeerConnection(pcConfig, pcConstraints); // jscs:ignore requireCapitalizedConstructors
      var origGetStats = pc.getStats.bind(pc);
      pc.getStats = function(selector, successCallback, errorCallback) { // jshint ignore: line
        var self = this;
        var args = arguments;
  
        // If selector is a function then we are in the old style stats so just
        // pass back the original getStats format to avoid breaking old users.
        if (arguments.length > 0 && typeof selector === 'function') {
          return origGetStats(selector, successCallback);
        }
  
        var fixChromeStats = function(response) {
          var standardReport = {};
          var reports = response.result();
          reports.forEach(function(report) {
            var standardStats = {
              id: report.id,
              timestamp: report.timestamp,
              type: report.type
            };
            report.names().forEach(function(name) {
              standardStats[name] = report.stat(name);
            });
            standardReport[standardStats.id] = standardStats;
          });
  
          return standardReport;
        };
  
        if (arguments.length >= 2) {
          var successCallbackWrapper = function(response) {
            args[1](fixChromeStats(response));
          };
  
          return origGetStats.apply(this, [successCallbackWrapper, arguments[0]]);
        }
  
        // promise-support
        return new Promise(function(resolve, reject) {
          if (args.length === 1 && selector === null) {
            origGetStats.apply(self, [
                function(response) {
                  resolve.apply(null, [fixChromeStats(response)]);
                }, reject]);
          } else {
            origGetStats.apply(self, [resolve, reject]);
          }
        });
      };
  
      return pc;
    };
  
    // wrap static methods. Currently just generateCertificate.
    if (webkitRTCPeerConnection.generateCertificate) {
      Object.defineProperty(window.RTCPeerConnection, 'generateCertificate', {
        get: function() {
          if (arguments.length) {
            return webkitRTCPeerConnection.generateCertificate.apply(null,
                arguments);
          } else {
            return webkitRTCPeerConnection.generateCertificate;
          }
        }
      });
    }
  
    // add promise support
    ['createOffer', 'createAnswer'].forEach(function(method) {
      var nativeMethod = webkitRTCPeerConnection.prototype[method];
      webkitRTCPeerConnection.prototype[method] = function() {
        var self = this;
        if (arguments.length < 1 || (arguments.length === 1 &&
            typeof(arguments[0]) === 'object')) {
          var opts = arguments.length === 1 ? arguments[0] : undefined;
          return new Promise(function(resolve, reject) {
            nativeMethod.apply(self, [resolve, reject, opts]);
          });
        } else {
          return nativeMethod.apply(this, arguments);
        }
      };
    });
  
    ['setLocalDescription', 'setRemoteDescription',
        'addIceCandidate'].forEach(function(method) {
      var nativeMethod = webkitRTCPeerConnection.prototype[method];
      webkitRTCPeerConnection.prototype[method] = function() {
        var args = arguments;
        var self = this;
        return new Promise(function(resolve, reject) {
          nativeMethod.apply(self, [args[0],
              function() {
                resolve();
                if (args.length >= 2) {
                  args[1].apply(null, []);
                }
              },
              function(err) {
                reject(err);
                if (args.length >= 3) {
                  args[2].apply(null, [err]);
                }
              }]
            );
        });
      };
    });
  
    // getUserMedia constraints shim.
    var constraintsToChrome = function(c) {
      if (typeof c !== 'object' || c.mandatory || c.optional) {
        return c;
      }
      var cc = {};
      Object.keys(c).forEach(function(key) {
        if (key === 'require' || key === 'advanced' || key === 'mediaSource') {
          return;
        }
        var r = (typeof c[key] === 'object') ? c[key] : {ideal: c[key]};
        if (r.exact !== undefined && typeof r.exact === 'number') {
          r.min = r.max = r.exact;
        }
        var oldname = function(prefix, name) {
          if (prefix) {
            return prefix + name.charAt(0).toUpperCase() + name.slice(1);
          }
          return (name === 'deviceId') ? 'sourceId' : name;
        };
        if (r.ideal !== undefined) {
          cc.optional = cc.optional || [];
          var oc = {};
          if (typeof r.ideal === 'number') {
            oc[oldname('min', key)] = r.ideal;
            cc.optional.push(oc);
            oc = {};
            oc[oldname('max', key)] = r.ideal;
            cc.optional.push(oc);
          } else {
            oc[oldname('', key)] = r.ideal;
            cc.optional.push(oc);
          }
        }
        if (r.exact !== undefined && typeof r.exact !== 'number') {
          cc.mandatory = cc.mandatory || {};
          cc.mandatory[oldname('', key)] = r.exact;
        } else {
          ['min', 'max'].forEach(function(mix) {
            if (r[mix] !== undefined) {
              cc.mandatory = cc.mandatory || {};
              cc.mandatory[oldname(mix, key)] = r[mix];
            }
          });
        }
      });
      if (c.advanced) {
        cc.optional = (cc.optional || []).concat(c.advanced);
      }
      return cc;
    };
  
    getUserMedia = function(constraints, onSuccess, onError) {
      if (constraints.audio) {
        constraints.audio = constraintsToChrome(constraints.audio);
      }
      if (constraints.video) {
        constraints.video = constraintsToChrome(constraints.video);
      }
      webrtcUtils.log('chrome: ' + JSON.stringify(constraints));
      return navigator.webkitGetUserMedia(constraints, onSuccess, onError);
    };
    navigator.getUserMedia = getUserMedia;
  
    if (!navigator.mediaDevices) {
      navigator.mediaDevices = {getUserMedia: requestUserMedia,
                                enumerateDevices: function() {
        return new Promise(function(resolve) {
          var kinds = {audio: 'audioinput', video: 'videoinput'};
          return MediaStreamTrack.getSources(function(devices) {
            resolve(devices.map(function(device) {
              return {label: device.label,
                      kind: kinds[device.kind],
                      deviceId: device.id,
                      groupId: ''};
            }));
          });
        });
      }};
    }
  
    // A shim for getUserMedia method on the mediaDevices object.
    // TODO(KaptenJansson) remove once implemented in Chrome stable.
    if (!navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia = function(constraints) {
        return requestUserMedia(constraints);
      };
    } else {
      // Even though Chrome 45 has navigator.mediaDevices and a getUserMedia
      // function which returns a Promise, it does not accept spec-style
      // constraints.
      var origGetUserMedia = navigator.mediaDevices.getUserMedia.
          bind(navigator.mediaDevices);
      navigator.mediaDevices.getUserMedia = function(c) {
        webrtcUtils.log('spec:   ' + JSON.stringify(c)); // whitespace for alignment
        c.audio = constraintsToChrome(c.audio);
        c.video = constraintsToChrome(c.video);
        webrtcUtils.log('chrome: ' + JSON.stringify(c));
        return origGetUserMedia(c);
      };
    }
  
    // Dummy devicechange event methods.
    // TODO(KaptenJansson) remove once implemented in Chrome stable.
    if (typeof navigator.mediaDevices.addEventListener === 'undefined') {
      navigator.mediaDevices.addEventListener = function() {
        webrtcUtils.log('Dummy mediaDevices.addEventListener called.');
      };
    }
    if (typeof navigator.mediaDevices.removeEventListener === 'undefined') {
      navigator.mediaDevices.removeEventListener = function() {
        webrtcUtils.log('Dummy mediaDevices.removeEventListener called.');
      };
    }
  
    // Attach a media stream to an element.
    attachMediaStream = function(element, stream) {
      if (webrtcDetectedVersion >= 43) {
        element.srcObject = stream;
      } else if (typeof element.src !== 'undefined') {
        element.src = URL.createObjectURL(stream);
      } else {
        webrtcUtils.log('Error attaching stream to element.');
      }
    };
    reattachMediaStream = function(to, from) {
      if (webrtcDetectedVersion >= 43) {
        to.srcObject = from.srcObject;
      } else {
        to.src = from.src;
      }
    };
  
  } else if (navigator.mediaDevices && navigator.userAgent.match(
      /Edge\/(\d+).(\d+)$/)) {
    webrtcUtils.log('This appears to be Edge');
    webrtcDetectedBrowser = 'edge';
  
    webrtcDetectedVersion = webrtcUtils.extractVersion(navigator.userAgent,
        /Edge\/(\d+).(\d+)$/, 2);
  
    // The minimum version still supported by adapter.
    // This is the build number for Edge.
    webrtcMinimumVersion = 10547;
  
    if (window.RTCIceGatherer) {
      // Generate an alphanumeric identifier for cname or mids.
      // TODO: use UUIDs instead? https://gist.github.com/jed/982883
      var generateIdentifier = function() {
        return Math.random().toString(36).substr(2, 10);
      };
  
      // The RTCP CNAME used by all peerconnections from the same JS.
      var localCName = generateIdentifier();
  
      // SDP helpers - to be moved into separate module.
      var SDPUtils = {};
  
      // Splits SDP into lines, dealing with both CRLF and LF.
      SDPUtils.splitLines = function(blob) {
        return blob.trim().split('\n').map(function(line) {
          return line.trim();
        });
      };
  
      // Splits SDP into sessionpart and mediasections. Ensures CRLF.
      SDPUtils.splitSections = function(blob) {
        var parts = blob.split('\r\nm=');
        return parts.map(function(part, index) {
          return (index > 0 ? 'm=' + part : part).trim() + '\r\n';
        });
      };
  
      // Returns lines that start with a certain prefix.
      SDPUtils.matchPrefix = function(blob, prefix) {
        return SDPUtils.splitLines(blob).filter(function(line) {
          return line.indexOf(prefix) === 0;
        });
      };
  
      // Parses an ICE candidate line. Sample input:
      // candidate:702786350 2 udp 41819902 8.8.8.8 60769 typ relay raddr 8.8.8.8 rport 55996"
      SDPUtils.parseCandidate = function(line) {
        var parts;
        // Parse both variants.
        if (line.indexOf('a=candidate:') === 0) {
          parts = line.substring(12).split(' ');
        } else {
          parts = line.substring(10).split(' ');
        }
  
        var candidate = {
          foundation: parts[0],
          component: parts[1],
          protocol: parts[2].toLowerCase(),
          priority: parseInt(parts[3], 10),
          ip: parts[4],
          port: parseInt(parts[5], 10),
          // skip parts[6] == 'typ'
          type: parts[7]
        };
  
        for (var i = 8; i < parts.length; i += 2) {
          switch (parts[i]) {
            case 'raddr':
              candidate.relatedAddress = parts[i + 1];
              break;
            case 'rport':
              candidate.relatedPort = parseInt(parts[i + 1], 10);
              break;
            case 'tcptype':
              candidate.tcpType = parts[i + 1];
              break;
            default: // Unknown extensions are silently ignored.
              break;
          }
        }
        return candidate;
      };
  
      // Translates a candidate object into SDP candidate attribute.
      SDPUtils.writeCandidate = function(candidate) {
        var sdp = [];
        sdp.push(candidate.foundation);
        sdp.push(candidate.component);
        sdp.push(candidate.protocol.toUpperCase());
        sdp.push(candidate.priority);
        sdp.push(candidate.ip);
        sdp.push(candidate.port);
  
        var type = candidate.type;
        sdp.push('typ');
        sdp.push(type);
        if (type !== 'host' && candidate.relatedAddress &&
            candidate.relatedPort) {
          sdp.push('raddr');
          sdp.push(candidate.relatedAddress); // was: relAddr
          sdp.push('rport');
          sdp.push(candidate.relatedPort); // was: relPort
        }
        if (candidate.tcpType && candidate.protocol.toLowerCase() === 'tcp') {
          sdp.push('tcptype');
          sdp.push(candidate.tcpType);
        }
        return 'candidate:' + sdp.join(' ');
      };
  
      // Parses an rtpmap line, returns RTCRtpCoddecParameters. Sample input:
      // a=rtpmap:111 opus/48000/2
      SDPUtils.parseRtpMap = function(line) {
        var parts = line.substr(9).split(' ');
        var parsed = {
          payloadType: parseInt(parts.shift(), 10) // was: id
        };
  
        parts = parts[0].split('/');
  
        parsed.name = parts[0];
        parsed.clockRate = parseInt(parts[1], 10); // was: clockrate
        parsed.numChannels = parts.length === 3 ? parseInt(parts[2], 10) : 1; // was: channels
        return parsed;
      };
  
      // Generate an a=rtpmap line from RTCRtpCodecCapability or RTCRtpCodecParameters.
      SDPUtils.writeRtpMap = function(codec) {
        var pt = codec.payloadType;
        if (codec.preferredPayloadType !== undefined) {
          pt = codec.preferredPayloadType;
        }
        return 'a=rtpmap:' + pt + ' ' + codec.name + '/' + codec.clockRate +
            (codec.numChannels !== 1 ? '/' + codec.numChannels : '') + '\r\n';
      };
  
      // Parses an ftmp line, returns dictionary. Sample input:
      // a=fmtp:96 vbr=on;cng=on
      // Also deals with vbr=on; cng=on
      SDPUtils.parseFmtp = function(line) {
        var parsed = {};
        var kv;
        var parts = line.substr(line.indexOf(' ') + 1).split(';');
        for (var j = 0; j < parts.length; j++) {
          kv = parts[j].trim().split('=');
          parsed[kv[0].trim()] = kv[1];
        }
        return parsed;
      };
  
      // Generates an a=ftmp line from RTCRtpCodecCapability or RTCRtpCodecParameters.
      SDPUtils.writeFtmp = function(codec) {
        var line = '';
        var pt = codec.payloadType;
        if (codec.preferredPayloadType !== undefined) {
          pt = codec.preferredPayloadType;
        }
        if (codec.parameters && codec.parameters.length) {
          var params = [];
          Object.keys(codec.parameters).forEach(function(param) {
            params.push(param + '=' + codec.parameters[param]);
          });
          line += 'a=fmtp:' + pt + ' ' + params.join(';') + '\r\n';
        }
        return line;
      };
  
      // Parses an rtcp-fb line, returns RTCPRtcpFeedback object. Sample input:
      // a=rtcp-fb:98 nack rpsi
      SDPUtils.parseRtcpFb = function(line) {
        var parts = line.substr(line.indexOf(' ') + 1).split(' ');
        return {
          type: parts.shift(),
          parameter: parts.join(' ')
        };
      };
      // Generate a=rtcp-fb lines from RTCRtpCodecCapability or RTCRtpCodecParameters.
      SDPUtils.writeRtcpFb = function(codec) {
        var lines = '';
        var pt = codec.payloadType;
        if (codec.preferredPayloadType !== undefined) {
          pt = codec.preferredPayloadType;
        }
        if (codec.rtcpFeedback && codec.rtcpFeedback.length) {
          // FIXME: special handling for trr-int?
          codec.rtcpFeedback.forEach(function(fb) {
            lines += 'a=rtcp-fb:' + pt + ' ' + fb.type + ' ' + fb.parameter +
                '\r\n';
          });
        }
        return lines;
      };
  
      // Parses an RFC 5576 ssrc media attribute. Sample input:
      // a=ssrc:3735928559 cname:something
      SDPUtils.parseSsrcMedia = function(line) {
        var sp = line.indexOf(' ');
        var parts = {
          ssrc: line.substr(7, sp - 7),
        };
        var colon = line.indexOf(':', sp);
        if (colon > -1) {
          parts.attribute = line.substr(sp + 1, colon - sp - 1);
          parts.value = line.substr(colon + 1);
        } else {
          parts.attribute = line.substr(sp + 1);
        }
        return parts;
      };
  
      // Extracts DTLS parameters from SDP media section or sessionpart.
      // FIXME: for consistency with other functions this should only
      //   get the fingerprint line as input. See also getIceParameters.
      SDPUtils.getDtlsParameters = function(mediaSection, sessionpart) {
        var lines = SDPUtils.splitLines(mediaSection);
        lines = lines.concat(SDPUtils.splitLines(sessionpart)); // Search in session part, too.
        var fpLine = lines.filter(function(line) {
          return line.indexOf('a=fingerprint:') === 0;
        })[0].substr(14);
        // Note: a=setup line is ignored since we use the 'auto' role.
        var dtlsParameters = {
          role: 'auto',
          fingerprints: [{
            algorithm: fpLine.split(' ')[0],
            value: fpLine.split(' ')[1]
          }]
        };
        return dtlsParameters;
      };
  
      // Serializes DTLS parameters to SDP.
      SDPUtils.writeDtlsParameters = function(params, setupType) {
        var sdp = 'a=setup:' + setupType + '\r\n';
        params.fingerprints.forEach(function(fp) {
          sdp += 'a=fingerprint:' + fp.algorithm + ' ' + fp.value + '\r\n';
        });
        return sdp;
      };
      // Parses ICE information from SDP media section or sessionpart.
      // FIXME: for consistency with other functions this should only
      //   get the ice-ufrag and ice-pwd lines as input.
      SDPUtils.getIceParameters = function(mediaSection, sessionpart) {
        var lines = SDPUtils.splitLines(mediaSection);
        lines = lines.concat(SDPUtils.splitLines(sessionpart)); // Search in session part, too.
        var iceParameters = {
          usernameFragment: lines.filter(function(line) {
            return line.indexOf('a=ice-ufrag:') === 0;
          })[0].substr(12),
          password: lines.filter(function(line) {
            return line.indexOf('a=ice-pwd:') === 0;
          })[0].substr(10)
        };
        return iceParameters;
      };
  
      // Serializes ICE parameters to SDP.
      SDPUtils.writeIceParameters = function(params) {
        return 'a=ice-ufrag:' + params.usernameFragment + '\r\n' +
            'a=ice-pwd:' + params.password + '\r\n';
      };
  
      // Parses the SDP media section and returns RTCRtpParameters.
      SDPUtils.parseRtpParameters = function(mediaSection) {
        var description = {
          codecs: [],
          headerExtensions: [],
          fecMechanisms: [],
          rtcp: []
        };
        var lines = SDPUtils.splitLines(mediaSection);
        var mline = lines[0].split(' ');
        for (var i = 3; i < mline.length; i++) { // find all codecs from mline[3..]
          var pt = mline[i];
          var rtpmapline = SDPUtils.matchPrefix(
              mediaSection, 'a=rtpmap:' + pt + ' ')[0];
          if (rtpmapline) {
            var codec = SDPUtils.parseRtpMap(rtpmapline);
            var fmtps = SDPUtils.matchPrefix(
                mediaSection, 'a=fmtp:' + pt + ' ');
            // Only the first a=fmtp:<pt> is considered.
            codec.parameters = fmtps.length ? SDPUtils.parseFmtp(fmtps[0]) : {};
            codec.rtcpFeedback = SDPUtils.matchPrefix(
                mediaSection, 'a=rtcp-fb:' + pt + ' ')
              .map(SDPUtils.parseRtcpFb);
            description.codecs.push(codec);
          }
        }
        // FIXME: parse headerExtensions, fecMechanisms and rtcp.
        return description;
      };
  
      // Generates parts of the SDP media section describing the capabilities / parameters.
      SDPUtils.writeRtpDescription = function(kind, caps) {
        var sdp = '';
  
        // Build the mline.
        sdp += 'm=' + kind + ' ';
        sdp += caps.codecs.length > 0 ? '9' : '0'; // reject if no codecs.
        sdp += ' UDP/TLS/RTP/SAVPF ';
        sdp += caps.codecs.map(function(codec) {
          if (codec.preferredPayloadType !== undefined) {
            return codec.preferredPayloadType;
          }
          return codec.payloadType;
        }).join(' ') + '\r\n';
  
        sdp += 'c=IN IP4 0.0.0.0\r\n';
        sdp += 'a=rtcp:9 IN IP4 0.0.0.0\r\n';
  
        // Add a=rtpmap lines for each codec. Also fmtp and rtcp-fb.
        caps.codecs.forEach(function(codec) {
          sdp += SDPUtils.writeRtpMap(codec);
          sdp += SDPUtils.writeFtmp(codec);
          sdp += SDPUtils.writeRtcpFb(codec);
        });
        // FIXME: add headerExtensions, fecMechanismş and rtcp.
        sdp += 'a=rtcp-mux\r\n';
        return sdp;
      };
  
      SDPUtils.writeSessionBoilerplate = function() {
        // FIXME: sess-id should be an NTP timestamp.
        return 'v=0\r\n' +
            'o=thisisadapterortc 8169639915646943137 2 IN IP4 127.0.0.1\r\n' +
            's=-\r\n' +
            't=0 0\r\n';
      };
  
      SDPUtils.writeMediaSection = function(transceiver, caps, type, stream) {
        var sdp = SDPUtils.writeRtpDescription(transceiver.kind, caps);
  
        // Map ICE parameters (ufrag, pwd) to SDP.
        sdp += SDPUtils.writeIceParameters(
            transceiver.iceGatherer.getLocalParameters());
  
        // Map DTLS parameters to SDP.
        sdp += SDPUtils.writeDtlsParameters(
            transceiver.dtlsTransport.getLocalParameters(),
            type === 'offer' ? 'actpass' : 'active');
  
        sdp += 'a=mid:' + transceiver.mid + '\r\n';
  
        if (transceiver.rtpSender && transceiver.rtpReceiver) {
          sdp += 'a=sendrecv\r\n';
        } else if (transceiver.rtpSender) {
          sdp += 'a=sendonly\r\n';
        } else if (transceiver.rtpReceiver) {
          sdp += 'a=recvonly\r\n';
        } else {
          sdp += 'a=inactive\r\n';
        }
  
        // FIXME: for RTX there might be multiple SSRCs. Not implemented in Edge yet.
        if (transceiver.rtpSender) {
          var msid = 'msid:' + stream.id + ' ' +
              transceiver.rtpSender.track.id + '\r\n';
          sdp += 'a=' + msid;
          sdp += 'a=ssrc:' + transceiver.sendSsrc + ' ' + msid;
        }
        // FIXME: this should be written by writeRtpDescription.
        sdp += 'a=ssrc:' + transceiver.sendSsrc + ' cname:' +
            localCName + '\r\n';
        return sdp;
      };
  
      // Gets the direction from the mediaSection or the sessionpart.
      SDPUtils.getDirection = function(mediaSection, sessionpart) {
        // Look for sendrecv, sendonly, recvonly, inactive, default to sendrecv.
        var lines = SDPUtils.splitLines(mediaSection);
        for (var i = 0; i < lines.length; i++) {
          switch (lines[i]) {
            case 'a=sendrecv':
            case 'a=sendonly':
            case 'a=recvonly':
            case 'a=inactive':
              return lines[i].substr(2);
          }
        }
        if (sessionpart) {
          return SDPUtils.getDirection(sessionpart);
        }
        return 'sendrecv';
      };
  
      // ORTC defines an RTCIceCandidate object but no constructor.
      // Not implemented in Edge.
      if (!window.RTCIceCandidate) {
        window.RTCIceCandidate = function(args) {
          return args;
        };
      }
      // ORTC does not have a session description object but
      // other browsers (i.e. Chrome) that will support both PC and ORTC
      // in the future might have this defined already.
      if (!window.RTCSessionDescription) {
        window.RTCSessionDescription = function(args) {
          return args;
        };
      }
  
      window.RTCPeerConnection = function(config) {
        var self = this;
  
        this.onicecandidate = null;
        this.onaddstream = null;
        this.onremovestream = null;
        this.onsignalingstatechange = null;
        this.oniceconnectionstatechange = null;
        this.onnegotiationneeded = null;
        this.ondatachannel = null;
  
        this.localStreams = [];
        this.remoteStreams = [];
        this.getLocalStreams = function() { return self.localStreams; };
        this.getRemoteStreams = function() { return self.remoteStreams; };
  
        this.localDescription = new RTCSessionDescription({
          type: '',
          sdp: ''
        });
        this.remoteDescription = new RTCSessionDescription({
          type: '',
          sdp: ''
        });
        this.signalingState = 'stable';
        this.iceConnectionState = 'new';
  
        this.iceOptions = {
          gatherPolicy: 'all',
          iceServers: []
        };
        if (config && config.iceTransportPolicy) {
          switch (config.iceTransportPolicy) {
            case 'all':
            case 'relay':
              this.iceOptions.gatherPolicy = config.iceTransportPolicy;
              break;
            case 'none':
              // FIXME: remove once implementation and spec have added this.
              throw new TypeError('iceTransportPolicy "none" not supported');
          }
        }
        if (config && config.iceServers) {
          // Edge does not like
          // 1) stun:
          // 2) turn: that does not have all of turn:host:port?transport=udp
          // 3) an array of urls
          config.iceServers.forEach(function(server) {
            if (server.urls) {
              var url;
              if (typeof(server.urls) === 'string') {
                url = server.urls;
              } else {
                url = server.urls[0];
              }
              if (url.indexOf('transport=udp') !== -1) {
                self.iceServers.push({
                  username: server.username,
                  credential: server.credential,
                  urls: url
                });
              }
            }
          });
        }
  
        // per-track iceGathers, iceTransports, dtlsTransports, rtpSenders, ...
        // everything that is needed to describe a SDP m-line.
        this.transceivers = [];
  
        // since the iceGatherer is currently created in createOffer but we
        // must not emit candidates until after setLocalDescription we buffer
        // them in this array.
        this._localIceCandidatesBuffer = [];
      };
  
      window.RTCPeerConnection.prototype._emitBufferedCandidates = function() {
        var self = this;
        // FIXME: need to apply ice candidates in a way which is async but in-order
        this._localIceCandidatesBuffer.forEach(function(event) {
          if (self.onicecandidate !== null) {
            self.onicecandidate(event);
          }
        });
        this._localIceCandidatesBuffer = [];
      };
  
      window.RTCPeerConnection.prototype.addStream = function(stream) {
        // Clone is necessary for local demos mostly, attaching directly
        // to two different senders does not work (build 10547).
        this.localStreams.push(stream.clone());
        this._maybeFireNegotiationNeeded();
      };
  
      window.RTCPeerConnection.prototype.removeStream = function(stream) {
        var idx = this.localStreams.indexOf(stream);
        if (idx > -1) {
          this.localStreams.splice(idx, 1);
          this._maybeFireNegotiationNeeded();
        }
      };
  
      // Determines the intersection of local and remote capabilities.
      window.RTCPeerConnection.prototype._getCommonCapabilities =
          function(localCapabilities, remoteCapabilities) {
        var commonCapabilities = {
          codecs: [],
          headerExtensions: [],
          fecMechanisms: []
        };
        localCapabilities.codecs.forEach(function(lCodec) {
          for (var i = 0; i < remoteCapabilities.codecs.length; i++) {
            var rCodec = remoteCapabilities.codecs[i];
            if (lCodec.name.toLowerCase() === rCodec.name.toLowerCase() &&
                lCodec.clockRate === rCodec.clockRate &&
                lCodec.numChannels === rCodec.numChannels) {
              // push rCodec so we reply with offerer payload type
              commonCapabilities.codecs.push(rCodec);
  
              // FIXME: also need to determine intersection between
              // .rtcpFeedback and .parameters
              break;
            }
          }
        });
  
        localCapabilities.headerExtensions.forEach(function(lHeaderExtension) {
          for (var i = 0; i < remoteCapabilities.headerExtensions.length; i++) {
            var rHeaderExtension = remoteCapabilities.headerExtensions[i];
            if (lHeaderExtension.uri === rHeaderExtension.uri) {
              commonCapabilities.headerExtensions.push(rHeaderExtension);
              break;
            }
          }
        });
  
        // FIXME: fecMechanisms
        return commonCapabilities;
      };
  
      // Create ICE gatherer, ICE transport and DTLS transport.
      window.RTCPeerConnection.prototype._createIceAndDtlsTransports =
          function(mid, sdpMLineIndex) {
        var self = this;
        var iceGatherer = new RTCIceGatherer(self.iceOptions);
        var iceTransport = new RTCIceTransport(iceGatherer);
        iceGatherer.onlocalcandidate = function(evt) {
          var event = {};
          event.candidate = {sdpMid: mid, sdpMLineIndex: sdpMLineIndex};
  
          var cand = evt.candidate;
          // Edge emits an empty object for RTCIceCandidateComplete‥
          if (!cand || Object.keys(cand).length === 0) {
            // polyfill since RTCIceGatherer.state is not implemented in Edge 10547 yet.
            if (iceGatherer.state === undefined) {
              iceGatherer.state = 'completed';
            }
  
            // Emit a candidate with type endOfCandidates to make the samples work.
            // Edge requires addIceCandidate with this empty candidate to start checking.
            // The real solution is to signal end-of-candidates to the other side when
            // getting the null candidate but some apps (like the samples) don't do that.
            event.candidate.candidate =
                'candidate:1 1 udp 1 0.0.0.0 9 typ endOfCandidates';
          } else {
            // RTCIceCandidate doesn't have a component, needs to be added
            cand.component = iceTransport.component === 'RTCP' ? 2 : 1;
            event.candidate.candidate = SDPUtils.writeCandidate(cand);
          }
  
          var complete = self.transceivers.every(function(transceiver) {
            return transceiver.iceGatherer &&
                transceiver.iceGatherer.state === 'completed';
          });
          // FIXME: update .localDescription with candidate and (potentially) end-of-candidates.
          //     To make this harder, the gatherer might emit candidates before localdescription
          //     is set. To make things worse, gather.getLocalCandidates still errors in
          //     Edge 10547 when no candidates have been gathered yet.
  
          if (self.onicecandidate !== null) {
            // Emit candidate if localDescription is set.
            // Also emits null candidate when all gatherers are complete.
            if (self.localDescription && self.localDescription.type === '') {
              self._localIceCandidatesBuffer.push(event);
              if (complete) {
                self._localIceCandidatesBuffer.push({});
              }
            } else {
              self.onicecandidate(event);
              if (complete) {
                self.onicecandidate({});
              }
            }
          }
        };
        iceTransport.onicestatechange = function() {
          self._updateConnectionState();
        };
  
        var dtlsTransport = new RTCDtlsTransport(iceTransport);
        dtlsTransport.ondtlsstatechange = function() {
          self._updateConnectionState();
        };
        dtlsTransport.onerror = function() {
          // onerror does not set state to failed by itself.
          dtlsTransport.state = 'failed';
          self._updateConnectionState();
        };
  
        return {
          iceGatherer: iceGatherer,
          iceTransport: iceTransport,
          dtlsTransport: dtlsTransport
        };
      };
  
      // Start the RTP Sender and Receiver for a transceiver.
      window.RTCPeerConnection.prototype._transceive = function(transceiver,
          send, recv) {
        var params = this._getCommonCapabilities(transceiver.localCapabilities,
            transceiver.remoteCapabilities);
        if (send && transceiver.rtpSender) {
          params.encodings = [{
            ssrc: transceiver.sendSsrc
          }];
          params.rtcp = {
            cname: localCName,
            ssrc: transceiver.recvSsrc
          };
          transceiver.rtpSender.send(params);
        }
        if (recv && transceiver.rtpReceiver) {
          params.encodings = [{
            ssrc: transceiver.recvSsrc
          }];
          params.rtcp = {
            cname: transceiver.cname,
            ssrc: transceiver.sendSsrc
          };
          transceiver.rtpReceiver.receive(params);
        }
      };
  
      window.RTCPeerConnection.prototype.setLocalDescription =
          function(description) {
        var self = this;
        if (description.type === 'offer') {
          if (!this._pendingOffer) {
          } else {
            this.transceivers = this._pendingOffer;
            delete this._pendingOffer;
          }
        } else if (description.type === 'answer') {
          var sections = SDPUtils.splitSections(self.remoteDescription.sdp);
          var sessionpart = sections.shift();
          sections.forEach(function(mediaSection, sdpMLineIndex) {
            var transceiver = self.transceivers[sdpMLineIndex];
            var iceGatherer = transceiver.iceGatherer;
            var iceTransport = transceiver.iceTransport;
            var dtlsTransport = transceiver.dtlsTransport;
            var localCapabilities = transceiver.localCapabilities;
            var remoteCapabilities = transceiver.remoteCapabilities;
            var rejected = mediaSection.split('\n', 1)[0]
                .split(' ', 2)[1] === '0';
  
            if (!rejected) {
              var remoteIceParameters = SDPUtils.getIceParameters(mediaSection,
                  sessionpart);
              iceTransport.start(iceGatherer, remoteIceParameters, 'controlled');
  
              var remoteDtlsParameters = SDPUtils.getDtlsParameters(mediaSection,
                sessionpart);
              dtlsTransport.start(remoteDtlsParameters);
  
              // Calculate intersection of capabilities.
              var params = self._getCommonCapabilities(localCapabilities,
                  remoteCapabilities);
  
              // Start the RTCRtpSender. The RTCRtpReceiver for this transceiver
              // has already been started in setRemoteDescription.
              self._transceive(transceiver,
                  params.codecs.length > 0,
                  false);
            }
          });
        }
  
        this.localDescription = description;
        switch (description.type) {
          case 'offer':
            this._updateSignalingState('have-local-offer');
            break;
          case 'answer':
            this._updateSignalingState('stable');
            break;
          default:
            throw new TypeError('unsupported type "' + description.type + '"');
        }
  
        // If a success callback was provided, emit ICE candidates after it has been
        // executed. Otherwise, emit callback after the Promise is resolved.
        var hasCallback = arguments.length > 1 &&
          typeof arguments[1] === 'function';
        if (hasCallback) {
          var cb = arguments[1];
          window.setTimeout(function() {
            cb();
            self._emitBufferedCandidates();
          }, 0);
        }
        var p = Promise.resolve();
        p.then(function() {
          if (!hasCallback) {
            window.setTimeout(self._emitBufferedCandidates.bind(self), 0);
          }
        });
        return p;
      };
  
      window.RTCPeerConnection.prototype.setRemoteDescription =
          function(description) {
        var self = this;
        var stream = new MediaStream();
        var sections = SDPUtils.splitSections(description.sdp);
        var sessionpart = sections.shift();
        sections.forEach(function(mediaSection, sdpMLineIndex) {
          var lines = SDPUtils.splitLines(mediaSection);
          var mline = lines[0].substr(2).split(' ');
          var kind = mline[0];
          var rejected = mline[1] === '0';
          var direction = SDPUtils.getDirection(mediaSection, sessionpart);
  
          var transceiver;
          var iceGatherer;
          var iceTransport;
          var dtlsTransport;
          var rtpSender;
          var rtpReceiver;
          var sendSsrc;
          var recvSsrc;
          var localCapabilities;
  
          // FIXME: ensure the mediaSection has rtcp-mux set.
          var remoteCapabilities = SDPUtils.parseRtpParameters(mediaSection);
          var remoteIceParameters;
          var remoteDtlsParameters;
          if (!rejected) {
            remoteIceParameters = SDPUtils.getIceParameters(mediaSection,
                sessionpart);
            remoteDtlsParameters = SDPUtils.getDtlsParameters(mediaSection,
                sessionpart);
          }
          var mid = SDPUtils.matchPrefix(mediaSection, 'a=mid:')[0].substr(6);
  
          var cname;
          // Gets the first SSRC. Note that with RTX there might be multiple SSRCs.
          var remoteSsrc = SDPUtils.matchPrefix(mediaSection, 'a=ssrc:')
              .map(function(line) {
                return SDPUtils.parseSsrcMedia(line);
              })
              .filter(function(obj) {
                return obj.attribute === 'cname';
              })[0];
          if (remoteSsrc) {
            recvSsrc = parseInt(remoteSsrc.ssrc, 10);
            cname = remoteSsrc.value;
          }
  
          if (description.type === 'offer') {
            var transports = self._createIceAndDtlsTransports(mid, sdpMLineIndex);
  
            localCapabilities = RTCRtpReceiver.getCapabilities(kind);
            sendSsrc = (2 * sdpMLineIndex + 2) * 1001;
  
            rtpReceiver = new RTCRtpReceiver(transports.dtlsTransport, kind);
  
            // FIXME: not correct when there are multiple streams but that is
            // not currently supported in this shim.
            stream.addTrack(rtpReceiver.track);
  
            // FIXME: look at direction.
            if (self.localStreams.length > 0 &&
                self.localStreams[0].getTracks().length >= sdpMLineIndex) {
              // FIXME: actually more complicated, needs to match types etc
              var localtrack = self.localStreams[0].getTracks()[sdpMLineIndex];
              rtpSender = new RTCRtpSender(localtrack, transports.dtlsTransport);
            }
  
            self.transceivers[sdpMLineIndex] = {
              iceGatherer: transports.iceGatherer,
              iceTransport: transports.iceTransport,
              dtlsTransport: transports.dtlsTransport,
              localCapabilities: localCapabilities,
              remoteCapabilities: remoteCapabilities,
              rtpSender: rtpSender,
              rtpReceiver: rtpReceiver,
              kind: kind,
              mid: mid,
              cname: cname,
              sendSsrc: sendSsrc,
              recvSsrc: recvSsrc
            };
            // Start the RTCRtpReceiver now. The RTPSender is started in setLocalDescription.
            self._transceive(self.transceivers[sdpMLineIndex],
                false,
                direction === 'sendrecv' || direction === 'sendonly');
          } else if (description.type === 'answer' && !rejected) {
            transceiver = self.transceivers[sdpMLineIndex];
            iceGatherer = transceiver.iceGatherer;
            iceTransport = transceiver.iceTransport;
            dtlsTransport = transceiver.dtlsTransport;
            rtpSender = transceiver.rtpSender;
            rtpReceiver = transceiver.rtpReceiver;
            sendSsrc = transceiver.sendSsrc;
            //recvSsrc = transceiver.recvSsrc;
            localCapabilities = transceiver.localCapabilities;
  
            self.transceivers[sdpMLineIndex].recvSsrc = recvSsrc;
            self.transceivers[sdpMLineIndex].remoteCapabilities =
                remoteCapabilities;
            self.transceivers[sdpMLineIndex].cname = cname;
  
            iceTransport.start(iceGatherer, remoteIceParameters, 'controlling');
            dtlsTransport.start(remoteDtlsParameters);
  
            self._transceive(transceiver,
                direction === 'sendrecv' || direction === 'recvonly',
                direction === 'sendrecv' || direction === 'sendonly');
  
            if (rtpReceiver &&
                (direction === 'sendrecv' || direction === 'sendonly')) {
              stream.addTrack(rtpReceiver.track);
            } else {
              // FIXME: actually the receiver should be created later.
              delete transceiver.rtpReceiver;
            }
          }
        });
  
        this.remoteDescription = description;
        switch (description.type) {
          case 'offer':
            this._updateSignalingState('have-remote-offer');
            break;
          case 'answer':
            this._updateSignalingState('stable');
            break;
          default:
            throw new TypeError('unsupported type "' + description.type + '"');
        }
        window.setTimeout(function() {
          if (self.onaddstream !== null && stream.getTracks().length) {
            self.remoteStreams.push(stream);
            window.setTimeout(function() {
              self.onaddstream({stream: stream});
            }, 0);
          }
        }, 0);
        if (arguments.length > 1 && typeof arguments[1] === 'function') {
          window.setTimeout(arguments[1], 0);
        }
        return Promise.resolve();
      };
  
      window.RTCPeerConnection.prototype.close = function() {
        this.transceivers.forEach(function(transceiver) {
          /* not yet
          if (transceiver.iceGatherer) {
            transceiver.iceGatherer.close();
          }
          */
          if (transceiver.iceTransport) {
            transceiver.iceTransport.stop();
          }
          if (transceiver.dtlsTransport) {
            transceiver.dtlsTransport.stop();
          }
          if (transceiver.rtpSender) {
            transceiver.rtpSender.stop();
          }
          if (transceiver.rtpReceiver) {
            transceiver.rtpReceiver.stop();
          }
        });
        // FIXME: clean up tracks, local streams, remote streams, etc
        this._updateSignalingState('closed');
      };
  
      // Update the signaling state.
      window.RTCPeerConnection.prototype._updateSignalingState =
          function(newState) {
        this.signalingState = newState;
        if (this.onsignalingstatechange !== null) {
          this.onsignalingstatechange();
        }
      };
  
      // Determine whether to fire the negotiationneeded event.
      window.RTCPeerConnection.prototype._maybeFireNegotiationNeeded =
          function() {
        // Fire away (for now).
        if (this.onnegotiationneeded !== null) {
          this.onnegotiationneeded();
        }
      };
  
      // Update the connection state.
      window.RTCPeerConnection.prototype._updateConnectionState =
          function() {
        var self = this;
        var newState;
        var states = {
          'new': 0,
          closed: 0,
          connecting: 0,
          checking: 0,
          connected: 0,
          completed: 0,
          failed: 0
        };
        this.transceivers.forEach(function(transceiver) {
          states[transceiver.iceTransport.state]++;
          states[transceiver.dtlsTransport.state]++;
        });
        // ICETransport.completed and connected are the same for this purpose.
        states.connected += states.completed;
  
        newState = 'new';
        if (states.failed > 0) {
          newState = 'failed';
        } else if (states.connecting > 0 || states.checking > 0) {
          newState = 'connecting';
        } else if (states.disconnected > 0) {
          newState = 'disconnected';
        } else if (states.new > 0) {
          newState = 'new';
        } else if (states.connecting > 0 || states.completed > 0) {
          newState = 'connected';
        }
  
        if (newState !== self.iceConnectionState) {
          self.iceConnectionState = newState;
          if (this.oniceconnectionstatechange !== null) {
            this.oniceconnectionstatechange();
          }
        }
      };
  
      window.RTCPeerConnection.prototype.createOffer = function() {
        var self = this;
        if (this._pendingOffer) {
          throw new Error('createOffer called while there is a pending offer.');
        }
        var offerOptions;
        if (arguments.length === 1 && typeof arguments[0] !== 'function') {
          offerOptions = arguments[0];
        } else if (arguments.length === 3) {
          offerOptions = arguments[2];
        }
  
        var tracks = [];
        var numAudioTracks = 0;
        var numVideoTracks = 0;
        // Default to sendrecv.
        if (this.localStreams.length) {
          numAudioTracks = this.localStreams[0].getAudioTracks().length;
          numVideoTracks = this.localStreams[0].getVideoTracks().length;
        }
        // Determine number of audio and video tracks we need to send/recv.
        if (offerOptions) {
          // Reject Chrome legacy constraints.
          if (offerOptions.mandatory || offerOptions.optional) {
            throw new TypeError(
                'Legacy mandatory/optional constraints not supported.');
          }
          if (offerOptions.offerToReceiveAudio !== undefined) {
            numAudioTracks = offerOptions.offerToReceiveAudio;
          }
          if (offerOptions.offerToReceiveVideo !== undefined) {
            numVideoTracks = offerOptions.offerToReceiveVideo;
          }
        }
        if (this.localStreams.length) {
          // Push local streams.
          this.localStreams[0].getTracks().forEach(function(track) {
            tracks.push({
              kind: track.kind,
              track: track,
              wantReceive: track.kind === 'audio' ?
                  numAudioTracks > 0 : numVideoTracks > 0
            });
            if (track.kind === 'audio') {
              numAudioTracks--;
            } else if (track.kind === 'video') {
              numVideoTracks--;
            }
          });
        }
        // Create M-lines for recvonly streams.
        while (numAudioTracks > 0 || numVideoTracks > 0) {
          if (numAudioTracks > 0) {
            tracks.push({
              kind: 'audio',
              wantReceive: true
            });
            numAudioTracks--;
          }
          if (numVideoTracks > 0) {
            tracks.push({
              kind: 'video',
              wantReceive: true
            });
            numVideoTracks--;
          }
        }
  
        var sdp = SDPUtils.writeSessionBoilerplate();
        var transceivers = [];
        tracks.forEach(function(mline, sdpMLineIndex) {
          // For each track, create an ice gatherer, ice transport, dtls transport,
          // potentially rtpsender and rtpreceiver.
          var track = mline.track;
          var kind = mline.kind;
          var mid = generateIdentifier();
  
          var transports = self._createIceAndDtlsTransports(mid, sdpMLineIndex);
  
          var localCapabilities = RTCRtpSender.getCapabilities(kind);
          var rtpSender;
          var rtpReceiver;
  
          // generate an ssrc now, to be used later in rtpSender.send
          var sendSsrc = (2 * sdpMLineIndex + 1) * 1001;
          if (track) {
            rtpSender = new RTCRtpSender(track, transports.dtlsTransport);
          }
  
          if (mline.wantReceive) {
            rtpReceiver = new RTCRtpReceiver(transports.dtlsTransport, kind);
          }
  
          transceivers[sdpMLineIndex] = {
            iceGatherer: transports.iceGatherer,
            iceTransport: transports.iceTransport,
            dtlsTransport: transports.dtlsTransport,
            localCapabilities: localCapabilities,
            remoteCapabilities: null,
            rtpSender: rtpSender,
            rtpReceiver: rtpReceiver,
            kind: kind,
            mid: mid,
            sendSsrc: sendSsrc,
            recvSsrc: null
          };
          var transceiver = transceivers[sdpMLineIndex];
          sdp += SDPUtils.writeMediaSection(transceiver,
              transceiver.localCapabilities, 'offer', self.localStreams[0]);
        });
  
        this._pendingOffer = transceivers;
        var desc = new RTCSessionDescription({
          type: 'offer',
          sdp: sdp
        });
        if (arguments.length && typeof arguments[0] === 'function') {
          window.setTimeout(arguments[0], 0, desc);
        }
        return Promise.resolve(desc);
      };
  
      window.RTCPeerConnection.prototype.createAnswer = function() {
        var self = this;
        var answerOptions;
        if (arguments.length === 1 && typeof arguments[0] !== 'function') {
          answerOptions = arguments[0];
        } else if (arguments.length === 3) {
          answerOptions = arguments[2];
        }
  
        var sdp = SDPUtils.writeSessionBoilerplate();
        this.transceivers.forEach(function(transceiver) {
          // Calculate intersection of capabilities.
          var commonCapabilities = self._getCommonCapabilities(
              transceiver.localCapabilities,
              transceiver.remoteCapabilities);
  
          sdp += SDPUtils.writeMediaSection(transceiver, commonCapabilities,
              'answer', self.localStreams[0]);
        });
  
        var desc = new RTCSessionDescription({
          type: 'answer',
          sdp: sdp
        });
        if (arguments.length && typeof arguments[0] === 'function') {
          window.setTimeout(arguments[0], 0, desc);
        }
        return Promise.resolve(desc);
      };
  
      window.RTCPeerConnection.prototype.addIceCandidate = function(candidate) {
        var mLineIndex = candidate.sdpMLineIndex;
        if (candidate.sdpMid) {
          for (var i = 0; i < this.transceivers.length; i++) {
            if (this.transceivers[i].mid === candidate.sdpMid) {
              mLineIndex = i;
              break;
            }
          }
        }
        var transceiver = this.transceivers[mLineIndex];
        if (transceiver) {
          var cand = Object.keys(candidate.candidate).length > 0 ?
              SDPUtils.parseCandidate(candidate.candidate) : {};
          // Ignore Chrome's invalid candidates since Edge does not like them.
          if (cand.protocol === 'tcp' && cand.port === 0) {
            return;
          }
          // Ignore RTCP candidates, we assume RTCP-MUX.
          if (cand.component !== '1') {
            return;
          }
          // A dirty hack to make samples work.
          if (cand.type === 'endOfCandidates') {
            cand = {};
          }
          transceiver.iceTransport.addRemoteCandidate(cand);
        }
        if (arguments.length > 1 && typeof arguments[1] === 'function') {
          window.setTimeout(arguments[1], 0);
        }
        return Promise.resolve();
      };
  
      window.RTCPeerConnection.prototype.getStats = function() {
        var promises = [];
        this.transceivers.forEach(function(transceiver) {
          ['rtpSender', 'rtpReceiver', 'iceGatherer', 'iceTransport',
              'dtlsTransport'].forEach(function(method) {
            if (transceiver[method]) {
              promises.push(transceiver[method].getStats());
            }
          });
        });
        var cb = arguments.length > 1 && typeof arguments[1] === 'function' &&
            arguments[1];
        return new Promise(function(resolve) {
          var results = {};
          Promise.all(promises).then(function(res) {
            res.forEach(function(result) {
              Object.keys(result).forEach(function(id) {
                results[id] = result[id];
              });
            });
            if (cb) {
              window.setTimeout(cb, 0, results);
            }
            resolve(results);
          });
        });
      };
    }
  } else {
    webrtcUtils.log('Browser does not appear to be WebRTC-capable');
  }
  
  // Returns the result of getUserMedia as a Promise.
  function requestUserMedia(constraints) {
    return new Promise(function(resolve, reject) {
      getUserMedia(constraints, resolve, reject);
    });
  }
  
  var webrtcTesting = {};
  try {
    Object.defineProperty(webrtcTesting, 'version', {
      set: function(version) {
        webrtcDetectedVersion = version;
      }
    });
  } catch (e) {}
  
  /* Orginal exports removed in favor of AdapterJS custom export.
  if (typeof module !== 'undefined') {
    var RTCPeerConnection;
    var RTCIceCandidate;
    var RTCSessionDescription;
    if (typeof window !== 'undefined') {
      RTCPeerConnection = window.RTCPeerConnection;
      RTCIceCandidate = window.RTCIceCandidate;
      RTCSessionDescription = window.RTCSessionDescription;
    }
    module.exports = {
      RTCPeerConnection: RTCPeerConnection,
      RTCIceCandidate: RTCIceCandidate,
      RTCSessionDescription: RTCSessionDescription,
      getUserMedia: getUserMedia,
      attachMediaStream: attachMediaStream,
      reattachMediaStream: reattachMediaStream,
      webrtcDetectedBrowser: webrtcDetectedBrowser,
      webrtcDetectedVersion: webrtcDetectedVersion,
      webrtcMinimumVersion: webrtcMinimumVersion,
      webrtcTesting: webrtcTesting,
      webrtcUtils: webrtcUtils
      //requestUserMedia: not exposed on purpose.
      //trace: not exposed on purpose.
    };
  } else if ((typeof require === 'function') && (typeof define === 'function')) {
    // Expose objects and functions when RequireJS is doing the loading.
    define([], function() {
      return {
        RTCPeerConnection: window.RTCPeerConnection,
        RTCIceCandidate: window.RTCIceCandidate,
        RTCSessionDescription: window.RTCSessionDescription,
        getUserMedia: getUserMedia,
        attachMediaStream: attachMediaStream,
        reattachMediaStream: reattachMediaStream,
        webrtcDetectedBrowser: webrtcDetectedBrowser,
        webrtcDetectedVersion: webrtcDetectedVersion,
        webrtcMinimumVersion: webrtcMinimumVersion,
        webrtcTesting: webrtcTesting,
        webrtcUtils: webrtcUtils
        //requestUserMedia: not exposed on purpose.
        //trace: not exposed on purpose.
      };
    });
  }
  */

/* jshint ignore:end */

  // END OF INJECTION OF GOOGLE'S ADAPTER.JS CONTENT
  ///////////////////////////////////////////////////////////////////

  AdapterJS.parseWebrtcDetectedBrowser();

  ///////////////////////////////////////////////////////////////////
  // EXTENSION FOR CHROME, FIREFOX AND EDGE
  // Includes legacy functions
  // -- createIceServer
  // -- createIceServers
  // -- MediaStreamTrack.getSources
  //
  // and additional shims
  // -- attachMediaStream
  // -- reattachMediaStream
  // -- requestUserMedia
  // -- a call to AdapterJS.maybeThroughWebRTCReady (notifies WebRTC is ready)

  // Add support for legacy functions createIceServer and createIceServers
  if ( navigator.mozGetUserMedia ) {
    // Shim for MediaStreamTrack.getSources.
    MediaStreamTrack.getSources = function(successCb) {
      setTimeout(function() {
        var infos = [
          { kind: 'audio', id: 'default', label:'', facing:'' },
          { kind: 'video', id: 'default', label:'', facing:'' }
        ];
        successCb(infos);
      }, 0);
    };

    createIceServer = function (url, username, password) {
      console.warn('createIceServer is deprecated. It should be replaced with an application level implementation.');
      // Note: Google's import of AJS will auto-reverse to 'url': '...' for FF < 38

      var iceServer = null;
      var urlParts = url.split(':');
      if (urlParts[0].indexOf('stun') === 0) {
        iceServer = { urls : [url] };
      } else if (urlParts[0].indexOf('turn') === 0) {
        if (webrtcDetectedVersion < 27) {
          var turnUrlParts = url.split('?');
          if (turnUrlParts.length === 1 ||
            turnUrlParts[1].indexOf('transport=udp') === 0) {
            iceServer = {
              urls : [turnUrlParts[0]],
              credential : password,
              username : username
            };
          }
        } else {
          iceServer = {
            urls : [url],
            credential : password,
            username : username
          };
        }
      }
      return iceServer;
    };

    createIceServers = function (urls, username, password) {
      console.warn('createIceServers is deprecated. It should be replaced with an application level implementation.');

      var iceServers = [];
      for (i = 0; i < urls.length; i++) {
        var iceServer = createIceServer(urls[i], username, password);
        if (iceServer !== null) {
          iceServers.push(iceServer);
        }
      }
      return iceServers;
    };
  } else if ( navigator.webkitGetUserMedia ) {
    createIceServer = function (url, username, password) {
      console.warn('createIceServer is deprecated. It should be replaced with an application level implementation.');

      var iceServer = null;
      var urlParts = url.split(':');
      if (urlParts[0].indexOf('stun') === 0) {
        iceServer = { 'url' : url };
      } else if (urlParts[0].indexOf('turn') === 0) {
        iceServer = {
          'url' : url,
          'credential' : password,
          'username' : username
        };
      }
      return iceServer;
    };

    createIceServers = function (urls, username, password) {
      console.warn('createIceServers is deprecated. It should be replaced with an application level implementation.');

      var iceServers = [];
      if (webrtcDetectedVersion >= 34) {
        iceServers = {
          'urls' : urls,
          'credential' : password,
          'username' : username
        };
      } else {
        for (i = 0; i < urls.length; i++) {
          var iceServer = createIceServer(urls[i], username, password);
          if (iceServer !== null) {
            iceServers.push(iceServer);
          }
        }
      }
      return iceServers;
    };
  }

  // adapter.js by Google currently doesn't suppport
  // attachMediaStream and reattachMediaStream for Egde
  if (navigator.mediaDevices && navigator.userAgent.match(
      /Edge\/(\d+).(\d+)$/)) {
    getUserMedia = window.getUserMedia = navigator.getUserMedia.bind(navigator);
    attachMediaStream = function(element, stream) {
      element.srcObject = stream;
      return element;
    };
    reattachMediaStream = function(to, from) {
      to.srcObject = from.srcObject;
      return to;
    };
  }

  // Need to override attachMediaStream and reattachMediaStream
  // to support the plugin's logic
  attachMediaStream_base = attachMediaStream;
  attachMediaStream = function (element, stream) {
    if ((webrtcDetectedBrowser === 'chrome' ||
         webrtcDetectedBrowser === 'opera') && 
        !stream) {
      // Chrome does not support "src = null"
      element.src = '';
    } else {
      attachMediaStream_base(element, stream);
    }
    return element;
  };
  reattachMediaStream_base = reattachMediaStream;
  reattachMediaStream = function (to, from) {
    reattachMediaStream_base(to, from);
    return to;
  };

  // Propagate attachMediaStream and gUM in window and AdapterJS
  window.attachMediaStream      = attachMediaStream;
  window.reattachMediaStream    = reattachMediaStream;
  window.getUserMedia           = getUserMedia;
  AdapterJS.attachMediaStream   = attachMediaStream;
  AdapterJS.reattachMediaStream = reattachMediaStream;
  AdapterJS.getUserMedia        = getUserMedia;

  // Removed Google defined promises when promise is not defined
  if (typeof Promise === 'undefined') {
    requestUserMedia = null;
  }

  AdapterJS.maybeThroughWebRTCReady();

  // END OF EXTENSION OF CHROME, FIREFOX AND EDGE
  ///////////////////////////////////////////////////////////////////

} else { // TRY TO USE PLUGIN

  ///////////////////////////////////////////////////////////////////
  // WEBRTC PLUGIN SHIM
  // Will automatically check if the plugin is available and inject it
  // into the DOM if it is.
  // When the plugin is not available, will prompt a banner to suggest installing it
  // Use AdapterJS.options.hidePluginInstallPrompt to prevent this banner from popping
  //
  // Shims the follwing:
  // -- getUserMedia
  // -- MediaStreamTrack
  // -- MediaStreamTrack.getSources
  // -- RTCPeerConnection
  // -- RTCSessionDescription
  // -- RTCIceCandidate
  // -- createIceServer
  // -- createIceServers
  // -- attachMediaStream
  // -- reattachMediaStream
  // -- webrtcDetectedBrowser
  // -- webrtcDetectedVersion

  // IE 9 is not offering an implementation of console.log until you open a console
  if (typeof console !== 'object' || typeof console.log !== 'function') {
    /* jshint -W020 */
    console = {} || console;
    // Implemented based on console specs from MDN
    // You may override these functions
    console.log = function (arg) {};
    console.info = function (arg) {};
    console.error = function (arg) {};
    console.dir = function (arg) {};
    console.exception = function (arg) {};
    console.trace = function (arg) {};
    console.warn = function (arg) {};
    console.count = function (arg) {};
    console.debug = function (arg) {};
    console.count = function (arg) {};
    console.time = function (arg) {};
    console.timeEnd = function (arg) {};
    console.group = function (arg) {};
    console.groupCollapsed = function (arg) {};
    console.groupEnd = function (arg) {};
    /* jshint +W020 */
  }
  AdapterJS.parseWebrtcDetectedBrowser();
  isIE = webrtcDetectedBrowser === 'IE';

  /* jshint -W035 */
  AdapterJS.WebRTCPlugin.WaitForPluginReady = function() {
    while (AdapterJS.WebRTCPlugin.pluginState !== AdapterJS.WebRTCPlugin.PLUGIN_STATES.READY) {
      /* empty because it needs to prevent the function from running. */
    }
  };
  /* jshint +W035 */

  AdapterJS.WebRTCPlugin.callWhenPluginReady = function (callback) {
    if (AdapterJS.WebRTCPlugin.pluginState === AdapterJS.WebRTCPlugin.PLUGIN_STATES.READY) {
      // Call immediately if possible
      // Once the plugin is set, the code will always take this path
      callback();
    } else {
      // otherwise start a 100ms interval
      var checkPluginReadyState = setInterval(function () {
        if (AdapterJS.WebRTCPlugin.pluginState === AdapterJS.WebRTCPlugin.PLUGIN_STATES.READY) {
          clearInterval(checkPluginReadyState);
          callback();
        }
      }, 100);
    }
  };

  AdapterJS.WebRTCPlugin.setLogLevel = function(logLevel) {
    AdapterJS.WebRTCPlugin.callWhenPluginReady(function() {
      AdapterJS.WebRTCPlugin.plugin.setLogLevel(logLevel);
    });
  };

  AdapterJS.WebRTCPlugin.injectPlugin = function () {
    // only inject once the page is ready
    if (document.readyState !== 'complete') {
      return;
    }

    // Prevent multiple injections
    if (AdapterJS.WebRTCPlugin.pluginState !== AdapterJS.WebRTCPlugin.PLUGIN_STATES.INITIALIZING) {
      return;
    }

    AdapterJS.WebRTCPlugin.pluginState = AdapterJS.WebRTCPlugin.PLUGIN_STATES.INJECTING;

    if (webrtcDetectedBrowser === 'IE' && webrtcDetectedVersion <= 10) {
      var frag = document.createDocumentFragment();
      AdapterJS.WebRTCPlugin.plugin = document.createElement('div');
      AdapterJS.WebRTCPlugin.plugin.innerHTML = '<object id="' +
        AdapterJS.WebRTCPlugin.pluginInfo.pluginId + '" type="' +
        AdapterJS.WebRTCPlugin.pluginInfo.type + '" ' + 'width="1" height="1">' +
        '<param name="pluginId" value="' +
        AdapterJS.WebRTCPlugin.pluginInfo.pluginId + '" /> ' +
        '<param name="windowless" value="false" /> ' +
        '<param name="pageId" value="' + AdapterJS.WebRTCPlugin.pageId + '" /> ' +
        '<param name="onload" value="' + AdapterJS.WebRTCPlugin.pluginInfo.onload + '" />' +
        '<param name="tag" value="' + AdapterJS.WebRTCPlugin.TAGS.NONE + '" />' +
        // uncomment to be able to use virtual cams
        (AdapterJS.options.getAllCams ? '<param name="forceGetAllCams" value="True" />':'') +

        '</object>';
      while (AdapterJS.WebRTCPlugin.plugin.firstChild) {
        frag.appendChild(AdapterJS.WebRTCPlugin.plugin.firstChild);
      }
      document.body.appendChild(frag);

      // Need to re-fetch the plugin
      AdapterJS.WebRTCPlugin.plugin =
        document.getElementById(AdapterJS.WebRTCPlugin.pluginInfo.pluginId);
    } else {
      // Load Plugin
      AdapterJS.WebRTCPlugin.plugin = document.createElement('object');
      AdapterJS.WebRTCPlugin.plugin.id =
        AdapterJS.WebRTCPlugin.pluginInfo.pluginId;
      // IE will only start the plugin if it's ACTUALLY visible
      if (isIE) {
        AdapterJS.WebRTCPlugin.plugin.width = '1px';
        AdapterJS.WebRTCPlugin.plugin.height = '1px';
      } else { // The size of the plugin on Safari should be 0x0px
              // so that the autorisation prompt is at the top
        AdapterJS.WebRTCPlugin.plugin.width = '0px';
        AdapterJS.WebRTCPlugin.plugin.height = '0px';
      }
      AdapterJS.WebRTCPlugin.plugin.type = AdapterJS.WebRTCPlugin.pluginInfo.type;
      AdapterJS.WebRTCPlugin.plugin.innerHTML = '<param name="onload" value="' +
        AdapterJS.WebRTCPlugin.pluginInfo.onload + '">' +
        '<param name="pluginId" value="' +
        AdapterJS.WebRTCPlugin.pluginInfo.pluginId + '">' +
        '<param name="windowless" value="false" /> ' +
        (AdapterJS.options.getAllCams ? '<param name="forceGetAllCams" value="True" />':'') +
        '<param name="pageId" value="' + AdapterJS.WebRTCPlugin.pageId + '">' +
        '<param name="tag" value="' + AdapterJS.WebRTCPlugin.TAGS.NONE + '" />';
      document.body.appendChild(AdapterJS.WebRTCPlugin.plugin);
    }


    AdapterJS.WebRTCPlugin.pluginState = AdapterJS.WebRTCPlugin.PLUGIN_STATES.INJECTED;
  };

  AdapterJS.WebRTCPlugin.isPluginInstalled =
    function (comName, plugName, installedCb, notInstalledCb) {
    if (!isIE) {
      var pluginArray = navigator.plugins;
      for (var i = 0; i < pluginArray.length; i++) {
        if (pluginArray[i].name.indexOf(plugName) >= 0) {
          installedCb();
          return;
        }
      }
      notInstalledCb();
    } else {
      try {
        var axo = new ActiveXObject(comName + '.' + plugName);
      } catch (e) {
        notInstalledCb();
        return;
      }
      installedCb();
    }
  };

  AdapterJS.WebRTCPlugin.defineWebRTCInterface = function () {
    if (AdapterJS.WebRTCPlugin.pluginState ===
        AdapterJS.WebRTCPlugin.PLUGIN_STATES.READY) {
      console.error('AdapterJS - WebRTC interface has already been defined');
      return;
    }

    AdapterJS.WebRTCPlugin.pluginState = AdapterJS.WebRTCPlugin.PLUGIN_STATES.INITIALIZING;

    AdapterJS.isDefined = function (variable) {
      return variable !== null && variable !== undefined;
    };

    createIceServer = function (url, username, password) {
      var iceServer = null;
      var urlParts = url.split(':');
      if (urlParts[0].indexOf('stun') === 0) {
        iceServer = {
          'url' : url,
          'hasCredentials' : false
        };
      } else if (urlParts[0].indexOf('turn') === 0) {
        iceServer = {
          'url' : url,
          'hasCredentials' : true,
          'credential' : password,
          'username' : username
        };
      }
      return iceServer;
    };

    createIceServers = function (urls, username, password) {
      var iceServers = [];
      for (var i = 0; i < urls.length; ++i) {
        iceServers.push(createIceServer(urls[i], username, password));
      }
      return iceServers;
    };

    RTCSessionDescription = function (info) {
      AdapterJS.WebRTCPlugin.WaitForPluginReady();
      return AdapterJS.WebRTCPlugin.plugin.
        ConstructSessionDescription(info.type, info.sdp);
    };

    RTCPeerConnection = function (servers, constraints) {
      // Validate server argumenr
      if (!(servers === undefined ||
            servers === null ||
            Array.isArray(servers.iceServers))) {
        throw new Error('Failed to construct \'RTCPeerConnection\': Malformed RTCConfiguration');
      }

      // Validate constraints argument
      if (typeof constraints !== 'undefined' && constraints !== null) {
        var invalidConstraits = false;
        invalidConstraits |= typeof constraints !== 'object';
        invalidConstraits |= constraints.hasOwnProperty('mandatory') && 
                              constraints.mandatory !== undefined && 
                              constraints.mandatory !== null && 
                              constraints.mandatory.constructor !== Object;
        invalidConstraits |= constraints.hasOwnProperty('optional') && 
                              constraints.optional !== undefined &&
                              constraints.optional !== null &&
                              !Array.isArray(constraints.optional);
        if (invalidConstraits) {
          throw new Error('Failed to construct \'RTCPeerConnection\': Malformed constraints object');
        }
      }

      // Call relevant PeerConnection constructor according to plugin version
      AdapterJS.WebRTCPlugin.WaitForPluginReady();

      // RTCPeerConnection prototype from the old spec
      var iceServers = null;
      if (servers && Array.isArray(servers.iceServers)) {
        iceServers = servers.iceServers;
        for (var i = 0; i < iceServers.length; i++) {
          // Legacy plugin versions compatibility
          if (iceServers[i].urls && !iceServers[i].url) {
            iceServers[i].url = iceServers[i].urls;
          }
          iceServers[i].hasCredentials = AdapterJS.
            isDefined(iceServers[i].username) &&
            AdapterJS.isDefined(iceServers[i].credential);
        }
      }

      if (AdapterJS.WebRTCPlugin.plugin.PEER_CONNECTION_VERSION &&
          AdapterJS.WebRTCPlugin.plugin.PEER_CONNECTION_VERSION > 1) {
        // RTCPeerConnection prototype from the new spec
        if (iceServers) {
          servers.iceServers = iceServers;
        }
        return AdapterJS.WebRTCPlugin.plugin.PeerConnection(servers);
      } else {
        var mandatory = (constraints && constraints.mandatory) ?
          constraints.mandatory : null;
        var optional = (constraints && constraints.optional) ?
          constraints.optional : null;
        return AdapterJS.WebRTCPlugin.plugin.
          PeerConnection(AdapterJS.WebRTCPlugin.pageId,
          iceServers, mandatory, optional);
      }
    };

    MediaStreamTrack = {};
    MediaStreamTrack.getSources = function (callback) {
      AdapterJS.WebRTCPlugin.callWhenPluginReady(function() {
        AdapterJS.WebRTCPlugin.plugin.GetSources(callback);
      });
    };

    getUserMedia = function (constraints, successCallback, failureCallback) {
      constraints.audio = constraints.audio || false;
      constraints.video = constraints.video || false;

      AdapterJS.WebRTCPlugin.callWhenPluginReady(function() {
        AdapterJS.WebRTCPlugin.plugin.
          getUserMedia(constraints, successCallback, failureCallback);
      });
    };
    window.navigator.getUserMedia = getUserMedia;

    // Defined mediaDevices when promises are available
    if ( !navigator.mediaDevices &&
      typeof Promise !== 'undefined') {
      requestUserMedia = function(constraints) {
        return new Promise(function(resolve, reject) {
          getUserMedia(constraints, resolve, reject);
        });
      };
      navigator.mediaDevices = {getUserMedia: requestUserMedia,
                                enumerateDevices: function() {
        return new Promise(function(resolve) {
          var kinds = {audio: 'audioinput', video: 'videoinput'};
          return MediaStreamTrack.getSources(function(devices) {
            resolve(devices.map(function(device) {
              return {label: device.label,
                      kind: kinds[device.kind],
                      id: device.id,
                      deviceId: device.id,
                      groupId: ''};
            }));
          });
        });
      }};
    }

    attachMediaStream = function (element, stream) {
      if (!element || !element.parentNode) {
        return;
      }

      var streamId;
      if (stream === null) {
        streamId = '';
      } else {
        if (typeof stream.enableSoundTracks !== 'undefined') {
          stream.enableSoundTracks(true);
        }
        streamId = stream.id;
      }

      var elementId = element.id.length === 0 ? Math.random().toString(36).slice(2) : element.id;
      var nodeName = element.nodeName.toLowerCase();
      if (nodeName !== 'object') { // not a plugin <object> tag yet
        var tag;
        switch(nodeName) {
          case 'audio':
            tag = AdapterJS.WebRTCPlugin.TAGS.AUDIO;
            break;
          case 'video':
            tag = AdapterJS.WebRTCPlugin.TAGS.VIDEO;
            break;
          default:
            tag = AdapterJS.WebRTCPlugin.TAGS.NONE;
          }

        var frag = document.createDocumentFragment();
        var temp = document.createElement('div');
        var classHTML = '';
        if (element.className) {
          classHTML = 'class="' + element.className + '" ';
        } else if (element.attributes && element.attributes['class']) {
          classHTML = 'class="' + element.attributes['class'].value + '" ';
        }

        temp.innerHTML = '<object id="' + elementId + '" ' + classHTML +
          'type="' + AdapterJS.WebRTCPlugin.pluginInfo.type + '">' +
          '<param name="pluginId" value="' + elementId + '" /> ' +
          '<param name="pageId" value="' + AdapterJS.WebRTCPlugin.pageId + '" /> ' +
          '<param name="windowless" value="true" /> ' +
          '<param name="streamId" value="' + streamId + '" /> ' +
          '<param name="tag" value="' + tag + '" /> ' +
          '</object>';
        while (temp.firstChild) {
          frag.appendChild(temp.firstChild);
        }

        var height = '';
        var width = '';
        if (element.clientWidth || element.clientHeight) {
          width = element.clientWidth;
          height = element.clientHeight;
        }
        else if (element.width || element.height) {
          width = element.width;
          height = element.height;
        }

        element.parentNode.insertBefore(frag, element);
        frag = document.getElementById(elementId);
        frag.width = width;
        frag.height = height;
        element.parentNode.removeChild(element);
      } else { // already an <object> tag, just change the stream id
        var children = element.children;
        for (var i = 0; i !== children.length; ++i) {
          if (children[i].name === 'streamId') {
            children[i].value = streamId;
            break;
          }
        }
        element.setStreamId(streamId);
      }
      var newElement = document.getElementById(elementId);
      AdapterJS.forwardEventHandlers(newElement, element, Object.getPrototypeOf(element));

      return newElement;
    };

    reattachMediaStream = function (to, from) {
      var stream = null;
      var children = from.children;
      for (var i = 0; i !== children.length; ++i) {
        if (children[i].name === 'streamId') {
          AdapterJS.WebRTCPlugin.WaitForPluginReady();
          stream = AdapterJS.WebRTCPlugin.plugin
            .getStreamWithId(AdapterJS.WebRTCPlugin.pageId, children[i].value);
          break;
        }
      }
      if (stream !== null) {
        return attachMediaStream(to, stream);
      } else {
        console.log('Could not find the stream associated with this element');
      }
    };

    // Propagate attachMediaStream and gUM in window and AdapterJS
    window.attachMediaStream      = attachMediaStream;
    window.reattachMediaStream    = reattachMediaStream;
    window.getUserMedia           = getUserMedia;
    AdapterJS.attachMediaStream   = attachMediaStream;
    AdapterJS.reattachMediaStream = reattachMediaStream;
    AdapterJS.getUserMedia        = getUserMedia;

    AdapterJS.forwardEventHandlers = function (destElem, srcElem, prototype) {
      properties = Object.getOwnPropertyNames( prototype );
      for(var prop in properties) {
        if (prop) {
          propName = properties[prop];

          if (typeof propName.slice === 'function' &&
              propName.slice(0,2) === 'on' && 
              typeof srcElem[propName] === 'function') {
              AdapterJS.addEvent(destElem, propName.slice(2), srcElem[propName]);
          }
        }
      }
      var subPrototype = Object.getPrototypeOf(prototype);
      if(!!subPrototype) {
        AdapterJS.forwardEventHandlers(destElem, srcElem, subPrototype);
      }
    };

    RTCIceCandidate = function (candidate) {
      if (!candidate.sdpMid) {
        candidate.sdpMid = '';
      }

      AdapterJS.WebRTCPlugin.WaitForPluginReady();
      return AdapterJS.WebRTCPlugin.plugin.ConstructIceCandidate(
        candidate.sdpMid, candidate.sdpMLineIndex, candidate.candidate
      );
    };

    // inject plugin
    AdapterJS.addEvent(document, 'readystatechange', AdapterJS.WebRTCPlugin.injectPlugin);
    AdapterJS.WebRTCPlugin.injectPlugin();
  };

  // This function will be called if the plugin is needed (browser different
  // from Chrome or Firefox), but the plugin is not installed.
  AdapterJS.WebRTCPlugin.pluginNeededButNotInstalledCb = AdapterJS.WebRTCPlugin.pluginNeededButNotInstalledCb ||
    function() {
      AdapterJS.addEvent(document,
                        'readystatechange',
                         AdapterJS.WebRTCPlugin.pluginNeededButNotInstalledCbPriv);
      AdapterJS.WebRTCPlugin.pluginNeededButNotInstalledCbPriv();
    };

  AdapterJS.WebRTCPlugin.pluginNeededButNotInstalledCbPriv = function () {
    if (AdapterJS.options.hidePluginInstallPrompt) {
      return;
    }

    var downloadLink = AdapterJS.WebRTCPlugin.pluginInfo.downloadLink;
    if(downloadLink) { // if download link
      var popupString;
      if (AdapterJS.WebRTCPlugin.pluginInfo.portalLink) { // is portal link
       popupString = 'This website requires you to install the ' +
        ' <a href="' + AdapterJS.WebRTCPlugin.pluginInfo.portalLink +
        '" target="_blank">' + AdapterJS.WebRTCPlugin.pluginInfo.companyName +
        ' WebRTC Plugin</a>' +
        ' to work on this browser.';
      } else { // no portal link, just print a generic explanation
       popupString = AdapterJS.TEXT.PLUGIN.REQUIRE_INSTALLATION;
      }

      AdapterJS.renderNotificationBar(popupString, AdapterJS.TEXT.PLUGIN.BUTTON, downloadLink);
    } else { // no download link, just print a generic explanation
      AdapterJS.renderNotificationBar(AdapterJS.TEXT.PLUGIN.NOT_SUPPORTED);
    }
  };

  // Try to detect the plugin and act accordingly
  AdapterJS.WebRTCPlugin.isPluginInstalled(
    AdapterJS.WebRTCPlugin.pluginInfo.prefix,
    AdapterJS.WebRTCPlugin.pluginInfo.plugName,
    AdapterJS.WebRTCPlugin.defineWebRTCInterface,
    AdapterJS.WebRTCPlugin.pluginNeededButNotInstalledCb);

  // END OF WEBRTC PLUGIN SHIM
  ///////////////////////////////////////////////////////////////////
}

(function () {

  'use strict';

  var baseGetUserMedia = null;

  AdapterJS.TEXT.EXTENSION = {
    REQUIRE_INSTALLATION_FF: 'To enable screensharing you need to install the Skylink WebRTC tools Firefox Add-on.',
    REQUIRE_INSTALLATION_CHROME: 'To enable screensharing you need to install the Skylink WebRTC tools Chrome Extension.',
    REQUIRE_REFRESH: 'Please refresh this page after the Skylink WebRTC tools extension has been installed.',
    BUTTON_FF: 'Install Now',
    BUTTON_CHROME: 'Go to Chrome Web Store'
  };

  var clone = function(obj) {
    if (null === obj || 'object' !== typeof obj) {
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

  if (window.navigator.mozGetUserMedia) {
    baseGetUserMedia = window.navigator.getUserMedia;

    navigator.getUserMedia = function (constraints, successCb, failureCb) {

      if (constraints && constraints.video && !!constraints.video.mediaSource) {
        // intercepting screensharing requests

        // Invalid mediaSource for firefox, only "screen" and "window" are supported
        if (constraints.video.mediaSource !== 'screen' && constraints.video.mediaSource !== 'window') {
          failureCb(new Error('GetUserMedia: Only "screen" and "window" are supported as mediaSource constraints'));
          return;
        }

        var updatedConstraints = clone(constraints);

        //constraints.video.mediaSource = constraints.video.mediaSource;
        updatedConstraints.video.mozMediaSource = updatedConstraints.video.mediaSource;

        // so generally, it requires for document.readyState to be completed before the getUserMedia could be invoked.
        // strange but this works anyway
        var checkIfReady = setInterval(function () {
          if (document.readyState === 'complete') {
            clearInterval(checkIfReady);

            baseGetUserMedia(updatedConstraints, successCb, function (error) {
              if (['PermissionDeniedError', 'SecurityError'].indexOf(error.name) > -1 && window.parent.location.protocol === 'https:') {
                AdapterJS.renderNotificationBar(AdapterJS.TEXT.EXTENSION.REQUIRE_INSTALLATION_FF,
                  AdapterJS.TEXT.EXTENSION.BUTTON_FF,
                  'https://addons.mozilla.org/en-US/firefox/addon/skylink-webrtc-tools/', true, true);
              } else {
                failureCb(error);
              }
            });
          }
        }, 1);

      } else { // regular GetUserMediaRequest
        baseGetUserMedia(constraints, successCb, failureCb);
      }
    };

    AdapterJS.getUserMedia = window.getUserMedia = navigator.getUserMedia;
    navigator.mediaDevices.getUserMedia = function(constraints) {
      return new Promise(function(resolve, reject) {
        window.getUserMedia(constraints, resolve, reject);
      });
    };

  } else if (window.navigator.webkitGetUserMedia) {
    baseGetUserMedia = window.navigator.getUserMedia;

    navigator.getUserMedia = function (constraints, successCb, failureCb) {
      if (constraints && constraints.video && !!constraints.video.mediaSource) {
        if (window.webrtcDetectedBrowser !== 'chrome') {
          // This is Opera, which does not support screensharing
          failureCb(new Error('Current browser does not support screensharing'));
          return;
        }

        // would be fine since no methods
        var updatedConstraints = clone(constraints);

        var chromeCallback = function(error, sourceId) {
          if(!error) {
            updatedConstraints.video.mandatory = updatedConstraints.video.mandatory || {};
            updatedConstraints.video.mandatory.chromeMediaSource = 'desktop';
            updatedConstraints.video.mandatory.maxWidth = window.screen.width > 1920 ? window.screen.width : 1920;
            updatedConstraints.video.mandatory.maxHeight = window.screen.height > 1080 ? window.screen.height : 1080;

            if (sourceId) {
              updatedConstraints.video.mandatory.chromeMediaSourceId = sourceId;
            }

            delete updatedConstraints.video.mediaSource;

            baseGetUserMedia(updatedConstraints, successCb, failureCb);

          } else { // GUM failed
            if (error === 'permission-denied') {
              failureCb(new Error('Permission denied for screen retrieval'));
            } else {
              // NOTE(J-O): I don't think we ever pass in here. 
              // A failure to capture the screen does not lead here.
              failureCb(new Error('Failed retrieving selected screen'));
            }
          }
        };

        var onIFrameCallback = function (event) {
          if (!event.data) {
            return;
          }

          if (event.data.chromeMediaSourceId) {
            if (event.data.chromeMediaSourceId === 'PermissionDeniedError') {
                chromeCallback('permission-denied');
            } else {
              chromeCallback(null, event.data.chromeMediaSourceId);
            }
          }

          if (event.data.chromeExtensionStatus) {
            if (event.data.chromeExtensionStatus === 'not-installed') {
              AdapterJS.renderNotificationBar(AdapterJS.TEXT.EXTENSION.REQUIRE_INSTALLATION_CHROME,
                AdapterJS.TEXT.EXTENSION.BUTTON_CHROME,
                event.data.data, true, true);
            } else {
              chromeCallback(event.data.chromeExtensionStatus, null);
            }
          }

          // this event listener is no more needed
          window.removeEventListener('message', onIFrameCallback);
        };

        window.addEventListener('message', onIFrameCallback);

        postFrameMessage({
          captureSourceId: true
        });

      } else {
        baseGetUserMedia(constraints, successCb, failureCb);
      }
    };

    AdapterJS.getUserMedia = window.getUserMedia = navigator.getUserMedia;
    navigator.mediaDevices.getUserMedia = function(constraints) {
      return new Promise(function(resolve, reject) {
        window.getUserMedia(constraints, resolve, reject);
      });
    };

  } else if (navigator.mediaDevices && navigator.userAgent.match(/Edge\/(\d+).(\d+)$/)) {
    // nothing here because edge does not support screensharing
    console.warn('Edge does not support screensharing feature in getUserMedia');

  } else {
    baseGetUserMedia = window.navigator.getUserMedia;

    navigator.getUserMedia = function (constraints, successCb, failureCb) {
      if (constraints && constraints.video && !!constraints.video.mediaSource) {
        // would be fine since no methods
        var updatedConstraints = clone(constraints);

        // wait for plugin to be ready
        AdapterJS.WebRTCPlugin.callWhenPluginReady(function() {
          // check if screensharing feature is available
          if (!!AdapterJS.WebRTCPlugin.plugin.HasScreensharingFeature &&
            !!AdapterJS.WebRTCPlugin.plugin.isScreensharingAvailable) {
            // set the constraints
            updatedConstraints.video.optional = updatedConstraints.video.optional || [];
            updatedConstraints.video.optional.push({
              sourceId: AdapterJS.WebRTCPlugin.plugin.screensharingKey || 'Screensharing'
            });

            delete updatedConstraints.video.mediaSource;
          } else {
            failureCb(new Error('Your version of the WebRTC plugin does not support screensharing'));
            return;
          }
          baseGetUserMedia(updatedConstraints, successCb, failureCb);
        });
      } else {
        baseGetUserMedia(constraints, successCb, failureCb);
      }
    };

    AdapterJS.getUserMedia = getUserMedia = 
       window.getUserMedia = navigator.getUserMedia;
    if ( navigator.mediaDevices &&
      typeof Promise !== 'undefined') {
      navigator.mediaDevices.getUserMedia = requestUserMedia;
    }
  }

  // For chrome, use an iframe to load the screensharing extension
  // in the correct domain.
  // Modify here for custom screensharing extension in chrome
  if (window.webrtcDetectedBrowser === 'chrome') {
    var iframe = document.createElement('iframe');

    iframe.onload = function() {
      iframe.isLoaded = true;
    };

    iframe.src = 'https://cdn.temasys.com.sg/skylink/extensions/detectRTC.html';
    iframe.style.display = 'none';

    (document.body || document.documentElement).appendChild(iframe);

    var postFrameMessage = function (object) { // jshint ignore:line
      object = object || {};

      if (!iframe.isLoaded) {
        setTimeout(function () {
          iframe.contentWindow.postMessage(object, '*');
        }, 100);
        return;
      }

      iframe.contentWindow.postMessage(object, '*');
    };
  } else if (window.webrtcDetectedBrowser === 'opera') {
    console.warn('Opera does not support screensharing feature in getUserMedia');
  }
})();

/*! skylinkjs - v0.7.0 - Wed Apr 27 2016 04:28:11 GMT+0800 (SGT) */

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
      errorCode: self.READY_STATE_CHANGE_ERROR.ADAPTER_NO_LOADED,
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
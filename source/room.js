/**
 * Handles the room sessions.
 * @class SkylinkRoom
 * @private
 * @since 0.6.8
 * @for Skylink
 */
function SkylinkRoom(room) {
  SkylinkEvent._mixin(this);

  // The room name
  this.name = globals.defaultRoom;

  if (typeof room === 'string' && !!room) {
    this.name = room;
  }

  // Random string for fetching
  this._session.random = (new Date()).getTime();
  // Protocol for connecting
  this._session.protocol = window.location.protocol;

  if (globals.forceSSL) {
    this._session.protocol = 'https:';
  }

  // The appending of parameters
  var append = '?';

  // Construct path
  this._session.path = this._session.protocol + globals.roomServer + '/api/' +
    globals.appKey + '/' + this.name;

  // Add to path if there is credentials
  if (globals.credentials) {
    // Append the startDateTime stamp and the duration
    this._session.path += '/' + globals.credentials.startDateTime + '/' +
      globals.credentials.duration;
    // Append the path
    this._session.path += '?cred=' + globals.credentials.credentials;
    // The appending is done so you have to add-on instead of instiatiating
    append = '&';
  }

  // Add the random string to enforce a new fetch over cache
  this._session.path += append + 'rand=' + this._session.random;

  // Add to path if there is regional server
  if (globals.region) {
    this._session.path += append + 'rg=' + globals.region;
  }

  log.debug([null, 'Room', this.name, 'Constructed path for fetching session']);
}

/**
 * Contains the room name.
 * @attribute name
 * @type String
 * @since 0.6.8
 * @for SkylinkRoom
 */
SkylinkRoom.prototype.name = null;

/**
 * Tha readyState for the room object.
 * @attribute readyState
 * @type Number
 * @since 0.6.8
 * @for SkylinkRoom
 */
SkylinkRoom.prototype.readyState = 0;

/**
 * Tha flag that indicates if the user is connected.
 * @attribute connected
 * @type Boolean
 * @since 0.6.8
 * @for SkylinkRoom
 */
SkylinkRoom.prototype.connected = false;

/**
 * The flag that indicates if the room is locked.
 * @attribute locked
 * @type Boolean
 * @since 0.6.8
 * @for SkylinkRoom
 */
SkylinkRoom.prototype.locked = false;

/**
 * Contains the room session information.
 * @attribute _session
 * @type JSON
 * @private
 * @since 0.6.8
 * @for SkylinkRoom
 */
SkylinkRoom.prototype._session = {
  protocol: null,
  path: null,
  random: null,
  data: null
};

/**
 * Contains the room connection information.
 * @attribute _connection
 * @type JSON
 * @private
 * @since 0.6.8
 * @for SkylinkRoom
 */
SkylinkRoom.prototype._connection = {
  // ROOM CONNECTION STATES
  // 0 - inital
  // 1 - connected
  // -1 - error
  state: 0,
  recvonly: false,
  iceServers: []
};

/**
 * Contains the room socket connection object.
 * @attribute _socket
 * @type SkylinkSocket
 * @private
 * @since 0.6.8
 * @for SkylinkRoom
 */
SkylinkRoom.prototype._socket = null;

/**
 * Contains the peer sessions.
 * @attribute _peer
 * @param {SkylinkPeer} (#peerId) The peer session.
 * @type JSON
 * @private
 * @since 0.6.8
 * @for SkylinkRoom
 */
SkylinkRoom.prototype._peers = {};

/**
 * Connects to the API server for a new room session.
 * @method fetchSession
 * @since 0.6.8
 * @for SkylinkRoom
 */
SkylinkRoom.prototype.fetchSession = function () {
  var self = this;
  var xhr = null;

  self.readyState = 0;
  self._trigger('readyState', 0, null, self.name);

  // Check if XDomainRequest is available (IE)
  if (typeof window.XDomainRequest === 'function' || typeof window.XDomainRequest === 'object') {
    xhr = new XDomainRequest();
    xhr.setContentType = function (contentType) {
      xhr.contentType = contentType;
    };

    log.warn([null, 'Room', self.name, 'XDomainRequest option is found. Using XDomainRequest for CORS']);
  // Else use XMLHttpRequest instead
  } else {
    xhr = new XMLHttpRequest();
    xhr.setContentType = function (contentType) {
      xhr.setRequestHeader('Content-type', contentType);
    };
  }

  // XMLHttpRequest onload event
  xhr.onload = function () {
    var response = JSON.parse(xhr.responseText || xhr.response || '{}');

    log.info([null, 'Room', self.name, 'Received response from API server ->'], response);

    if (!response.success) {
      self.readyState = -1;
      // ERROR STATUSES given from server
      // 403 - Room is locked
      // 401 - API Not authorized
      // 402 - run out of credits
      self._trigger('readyState', -1, {
        status: xhr.status || 200,
        errorCode: response.error,
        content: new Error(response.info)
      }, self.name);
      return;
    }

    log.debug([null, 'Room', self.name, 'Session has been initialized']);

    self._session.data = response;
    self._createSocket();

    self.readyState = 2;
    self._trigger('readyState', 2, response, self.name);
  };

  // XMLHttpRequest onerror event
  xhr.onerror = function (error) {
    log.error([null, 'Room', self.name, 'Failed retrieving session from API server'], error);

    self.readyState = -1;
    self._trigger('readyState', -1, {
      status: 0,
      errorCode: -1,
      content: new Error('Failed retrieving response from API server')
    }, self.name);
  };

  // XMLHttpRequest onprogress event
  xhr.onprogress = function () {
    log.debug([null, 'Room', self.name, 'Retrieving session from API server in-progress']);

    self.readyState = 1;
    self._trigger('readyState', 1, null, self.name);
  };

  log.debug([null, 'Room', self.name, 'Retrieving API credentials from server ->'], self._session.path);

  xhr.open('GET', self._session.path, true);
  xhr.send();
};

/**
 * Creates the socket object.
 * @method _createSocket
 * @private
 * @since 0.6.8
 * @for SkylinkRoom
 */
SkylinkRoom.prototype._createSocket = function () {
  var self = this;

  if (!self._session.data) {
    log.error([null, 'Room', self.name, 'Unable to initialize socket object as there is no session']);
    return;
  }

  self._socket = new SkylinkSocket({
    server: self._session.data.ipSigserver,
    protocol: self._session.protocol,
    timeout: globals.timeout,
    httpPortList: self._session.data.httpPortList,
    httpsPortList: self._session.data.httpsPortList
  });

  // Hook on SkylinkSocket events
  self._socket.on('connect', function () {
    self._trigger('socket:connect');
  });

  self._socket.on('disconnect', function () {
    self._trigger('socket:disconnect');
  });

  self._socket.on('message', function (message) {
    self._trigger('socket:message', message);
    self._messageReactor(message);
  });

  self._socket.on('connectError', function (state, error, transport) {
    self._trigger('socket:connectError', state, error, transport);
  });

  self._socket.on('connectRetry', function (fallbackMethod, attempt) {
    self._trigger('socket:connectRetry', fallbackMethod, attempt);
  });

  self._socket.on('error', function (error) {
    self._trigger('socket:error', error);
  });

  log.debug([null, 'Room', self.name, 'Listening to socket object events']);
};

/**
 * Creates the peer object.
 * @method _createPeer
 * @param {String} peerId The peer session ID.
 * @param {JSON} config The peer configuration.
 * @private
 * @since 0.6.8
 * @for SkylinkRoom
 */
SkylinkRoom.prototype._createPeer = function (peerId, config) {
  var self = this;

  if (self._peers[peerId]) {
    log.debug([peerId, 'Room', self.name, 'Ignoring creating of peer object as session exists']);
    return;
  }

  self._peers[peerId] = new SkylinkPeer({
    id: peerId,
    iceServers: self._connection.iceServers,
    agent: {
      name: config.user.agent.name,
      version: config.user.agent.version,
      os: config.user.agent.os
    },
    connection: {
      recvonly: config.connection.recvOnly,
      datachannel: config.connection.dataChannel,
      trickleICE: config.connection.trickleICE,
      stereo: config.connection.stereo
    }
  });

  self._peers[peerId].on('stream', function (stream) {
    self._trigger('peer:stream', peerId, stream);
  });

  self._peers[peerId].on('candidate', function (candidate) {
    self._messageConstructor('candidate', {
      candidate: candidate.candidate,
      sdpMLineIndex: candidate.sdpMLineIndex,
      sdpMid: candidate.sdpMid,
      target: peerId
    });
  });

  self._peers[peerId].on('handshakeProgress', function (state, error) {
    self._trigger('peer:handshakeProgress', peerId, state, error);
  });

  self._peers[peerId].on('iceConnectionState', function (state) {
    self._trigger('peer:iceConnectionState', peerId, state);
  });

  self._peers[peerId].on('iceGatheringState', function (state) {
    self._trigger('peer:iceGatheringState', peerId, state);
  });

  self._peers[peerId].on('signalingState', function (state) {
    self._trigger('peer:signalingState', peerId, state);
  });

  self._peers[peerId].on('offer', function (offer) {
    self._messageConstructor('offer', {
      sdp: offer.sdp,
      target: peerId
    });
  });

  self._peers[peerId].on('answer', function (answer) {
    self._messageConstructor('answer', {
      sdp: answer.sdp,
      target: peerId
    });
  });

  self._peers[peerId].sendStream(user.streams.usermedia);

  self._trigger('peer:handshakeProgress', peerId, config.type);
  self._trigger('peer:join', peerId);

  log.debug([peerId, 'Room', self.name, 'Listening to peer object events']);
};

/**
 * Connects to the signaling server to join the room.
 * @method connect
 * @param {Stream} stream The Stream object.
 * @since 0.6.8
 * @for SkylinkRoom
 */
SkylinkRoom.prototype.connect = function (stream) {
  var self = this;

  self._socket.once('connectState', function (state, error) {
    // success case
    if (state === 1) {
      self._connection.state = 1;
      self._trigger('connectState', 1, null);

      self._messageConstructor('joinRoom');
    // error case
    } else {
      self._connection.state = 1;

      if (state === 0) {
        self._trigger('connectState', -1,
          new Error('Socket disconnected whilst attempting to join room'));
        return;
      }

      self._trigger('connectState', -1, error);
    }
  }, function (state) {
    // Not the initial state
    return state !== 0;
  });

  self._connection.state = 0;
  self._trigger('connectState', 0, null);

  window.navigator.getUserMedia({
    audio: true,
    video: true
  }, function (stream) {
    user.streams.usermedia = stream;
    self._socket.connect();
  }, function (error) {
    throw error;
  });
};

/**
 * Handles the messages received from the signaling server.
 * @method _messageReactor
 * @param {JSON} message The message object data.
 * @since 0.6.8
 * @for SkylinkRoom
 */
SkylinkRoom.prototype._messageReactor = function (message) {
  var self = this;

  // type: "inRoom"
  if (message.type === 'inRoom') {
    self._session.data.sid = message.sid;
    self._connection.iceServers = message.pc_config.iceServers;
    self._connection.tieBreaker = (new Date()).getTime();

    if (typeof message.tieBreaker === 'number') {
      self._connection.tieBreaker = message.tieBreaker;
    }

    // Make firefox against other agents as the answerer always
    if (user.agent.name === 'firefox') {
      self._connection.tieBreaker -= 10000000000;
    }

    self._messageConstructor('enter');

  // type: "enter"
  } else if (message.type === 'enter') {
    self._createPeer(message.mid, message);
    self._messageConstructor('welcome', {
      target: message.mid
    });

  // type: "welcome"
  } else if (message.type === 'welcome') {
    self._createPeer(message.mid, message);

    if (self._peers[message.mid]) {
      if (message.tieBreaker > self._connection.tieBreaker) {
        self._peers[message.mid].handshakeOffer();
      } else {
        self._messageConstructor('welcome', {
          target: message.mid
        });
      }
    }

  // type: "offer"
  } else if (message.type === 'offer') {
    if (self._peers[message.mid]) {
      self._peers[message.mid].handshakeAnswer(message.sdp);
    }

  // type: "answer"
  } else if (message.type === 'answer') {
    if (self._peers[message.mid]) {
      self._peers[message.mid].handshakeComplete(message.sdp);
    }

  // type: "candidate"
  } else if (message.type === 'candidate') {
    if (self._peers[message.mid]) {
      self._peers[message.mid].addCandidate({
        sdpMid: message.sdpMid,
        sdpMLineIndex: message.sdpMLineIndex,
        candidate: message.candidate
      });
    }
  }
};

/**
 * Handles the messages received from the signaling server.
 * @method _messageReactor
 * @param {String} type The message type.
 * @since 0.6.8
 * @for SkylinkRoom
 */
SkylinkRoom.prototype._messageConstructor = function (type, data) {
  var self = this;

  // Construct the base of the message
  var message = {
    type: type,
    rid: self._session.data.room_key
  };

  if (typeof self._session.data.sid === 'string') {
    message.mid = self._session.data.sid;
  }

  // type: "joinRoom"
  if (type === 'joinRoom') {
    message.uid = self._session.data.username;
    message.cid = self._session.data.cid;
    message.userCred = self._session.data.userCred;
    message.timeStamp = self._session.data.timeStamp;
    message.apiOwner = self._session.data.apiOwner;
    message.roomCred = self._session.data.roomCred;
    message.start = self._session.data.start;
    message.len = self._session.data.len;
    // Default to false if undefined
    message.isPrivileged = self._session.data.isPrivileged === true;
    // Default to true if undefined
    message.autoIntroduce = self._session.data.autoIntroduce !== false;

  // type: "enter" / "welcome"
  } else if (type === 'enter' || type === 'welcome') {
    message.user = {
      agent: {
        name: user.agent.name,
        version: user.agent.version,
        os: user.agent.os
      },
      data: user.data
    };
    message.connection = {
      stereo: self._connection.stereo,
      recvOnly: self._connection.recvonly,
      dataChannel: globals.enableDataChannel,
      trickleICE: globals.trickleICE
    };
    message.stream = {
      audio: false,
      video: false
    };

    if (type === 'welcome') {
      message.tieBreaker = self._connection.tieBreaker;
      message.target = data.target;
    }

  // type: "candidate"
  } else if (type === 'candidate') {
    message.sdpMLineIndex = data.sdpMLineIndex;
    message.sdpMid = data.sdpMid;
    message.candidate = data.candidate;
    message.target = data.target;

  // type: "offer"
  } else if (type === 'offer' || type === 'answer') {
    message.sdp = data.sdp;
    message.target = data.target;
  }

  self._socket.send(message);
};



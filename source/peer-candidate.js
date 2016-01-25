/**
 * Handles the Peer connection and sessions of Skylink.
 * @class SkylinkPeer
 * @private
 * @since 0.6.10
 * @for Skylink
 */
function SkylinkPeer (config) {
  // Mixin for events
  SkylinkEvent._mixin(this);

  /**
   * The Peer ID.
   * @attribute id
   * @type String
   * @since 0.6.10
   * @for SkylinkPeer
   */
  this.id = config.id;

  /**
   * The Peer agent.
   * @attribute agent
   * @type JSON
   * @since 0.6.10
   * @for SkylinkPeer
   */
  this.agent = {
    name: 'Unknown',
    version: -1,
    os: ''
  };

  /**
   * The Peer custom data.
   * @attribute data
   * @type JSON
   * @since 0.6.10
   * @for SkylinkPeer
   */
  this.data = null;

  /**
   * The Peer connection "dead" status.
   * @attribute _dead
   * @type Boolean
   * @private
   * @since 0.6.10
   * @for SkylinkPeer
   */
  this._dead = false;

  /**
   * The Peer streaming information.
   * @attribute _streaming
   * @type JSON
   * @private
   * @since 0.6.10
   * @for SkylinkPeer
   */
  this._streaming = null;

  /**
   * The Peer connection configuration.
   * @attribute _connection
   * @type JSON
   * @private
   * @since 0.6.10
   * @for SkylinkPeer
   */
  this._connection = {
    failures: 0,
    monitor: {
      connected: false,
      timer: null,
      retries: 0,
      offerer: config.isWelcome
    },
    enableIceTrickle: true,
    enableDataChannel: true,
    recvOnly: this.id !== 'MCU' && globals.room.hasMCU
  };

  /**
   * The Peer ICE candidates.
   * @attribute _candidates
   * @type JSON
   * @private
   * @since 0.6.10
   * @for SkylinkPeer
   */
  this._candidates = {};

  /**
   * The Peer object reference.
   * @attribute _ref
   * @type RTCPeerConnection
   * @private
   * @since 0.6.10
   * @for SkylinkPeer
   */
  this._ref = null;

  // Start parsing the once-and-for-all data
  if (typeof config.agent.name === 'string') {
    this.agent.name = config.agent.name;
  }

  if (typeof config.agent.version === 'number') {
    this.agent.version = config.agent.version;
  }

  if (typeof config.agent.os === 'string') {
    this.agent.os = config.agent.os;
  }

  // Update the changable data
  this.updateInfo(config);

  // Start RTCPeerConnection connection
  this.connect();

  // Start adding local MediaStream
  this._addStream();

  log.log([_this.id, 'Peer', null, 'Constructed']);
}

/**
 * Gets the current Peer information.
 * @method getInfo
 * @return {JSON} info The current Peer information.
 * @since 0.6.10
 * @for SkylinkPeer
 */
SkylinkPeer.prototype.getInfo = function () {
  var _this = this;
  var mediaStatus = {
    audioMuted: true,
    videoMuted: true
  };
  var settings = {
    audio: false,
    video: false,
    bandwidth: {
      audio: 0,
      video: 0,
      data: 0
    }
  };

  // Fallback for the stream format in the past
  if (_this.stream) {
    _this.stream.tracks.forEach(function (track) {
      // Configure the audio track if it had not ended yet
      if (track.kind === 'audio' && !track.ended) {
        // Do not reconfigure if configured once
        if (!settings.audio) {
          settings.audio = clone(track.media);
        }
        // Check if audio is muted before reconfigurating
        if (mediaStatus.audioMuted) {
          mediaStatus.audioMuted = !track.enabled;
        }

      // Configure the video track if it had not ended yet
      } else if (track.kind === 'video' && !track.ended) {
        // Do not reconfigure if configured once
        if (!settings.video) {
          settings.video = clone(track.media);
        }
        // Check if video is muted before reconfigurating
        if (mediaStatus.videoMuted) {
          mediaStatus.videoMuted = !track.enabled;
        }
      }
    });
  }

  return {
    userData: _this.data,
    settings: settings,
    mediaStatus: mediaStatus,
    agent: {
      name: _this.agent.name,
      version: _this.agent.version,
      os: _this.agent.os
    },
    room: clone(globals.room.name)
  };
};

/**
 * Updates the current Peer information.
 * @method updateInfo
 * @param {JSON} config The updated information.
 * @since 0.6.10
 * @for SkylinkPeer
 */
SkylinkPeer.prototype.updateInfo = function (config) {
  var _this = this;

  _this.data = config.data;

  _this._connection.enableIceTrickle = config.enableIceTrickle && globals.config.current.enableIceTrickle;
  _this._connection.enableDataChannel = config.enableDataChannel && globals.config.current.enableDataChannel;

  _this._stream = config.streamingInfo;

  log.debug([_this.id, 'Peer', null, 'Information has been updated ->'], config);
};

/**
 * Starts the Peer connection.
 * @method connect
 * @since 0.6.10
 * @for SkylinkPeer
 */
SkylinkPeer.prototype.connect = function () {
  var _this = this;

  var RTCConfiguration = {
    iceServers: globals.room.iceServers
    // iceTransportPolicy: "all",
    // bundlePolicy: "balanced",
    // rtcpMuxPolicy: "require",
    // iceCandidatePoolSize: 0,
    // certificates: []
  };

  var RTCOptional = {
    optional: [{
      DtlsSrtpKeyAgreement: true
    }]
  };

  _this._ref = new RTCPeerConnection(RTCConfiguration, RTCOptional);

  _this._candidates = {
    incoming: {
      queue: [],
      failure: [],
      success: []
    },
    outgoing: {
      send: [],
      gathered: false
    }
  };

  // Events manager
  // RTCPeerConnection.onconnectionstatechange - not implemented yet

  // RTCPeerConnection.onicecandidateerror - not implemented yet

  // RTCPeerConnection.ontrack - not implemented yet

  // RTCPeerConnection.oniceconnectionstatechange
  this._ref.oniceconnectionstatechange = _this._reactToOniceconnectionstatechange();

  // RTCPeerConnection.onsignalingstatechange
  _this._ref.onsignalingstatechange = _this._reactToOnsignalingstatechange();

  // RTCPeerConnection.onicegatheringstatechange
  _this._ref.onicegatheringstatechange = _this._reactToOnicegatheringstatechange();

  // RTCPeerConnection.onnegotiationneeded
  _this._ref.onnegotiationneeded = _this._reactToOnnegotiationneeded();

  // RTCPeerConnection.onicecandidate
  _this._ref.onicecandidate = _this._reactToOnicecandidate();

  // RTCPeerConnection.ondatachannel
  this._ref.ondatachannel = _this._reactToOndatachannel();

  // RTCPeerConnection.onaddstream
  this._ref.onaddstream = _this._reactToOnaddstream();

  // RTCPeerConnection.onremovestream
  _this._ref.onremovestream = _this._reactToOnremovestream();

  log.debug([this.id, 'Peer', null, 'RTCPeerConnection is constructed']);
};

/**
 * Starts the Peer handshaking of "offer".
 * @method handshakeOffer
 * @since 0.6.10
 * @for SkylinkPeer
 */
SkylinkPeer.prototype.handshakeOffer = function () {
  var _this = this;

  if (_this._ref.signalingState !== 'stable') {
    log.warn([_this.id, 'Peer', null, 'RTCPeerConnection ignoring generation of local offer as ' +
      'signalingState is not "stable" ->'], _this._ref.signalingState);
    return;
  }

  if (_this._connection.enableDataChannel) {
    try {
      _this._channels.main = new SkylinkDataChannel('main', _this.id, _this._ref);

      log.debug([_this.id, 'Peer', null, 'RTCPeerConnection is constructing RTCDataChannel ->'], _this._channels.main);

    // Failed creating RTCDataChannel object
    } catch (error) {
      log.error([_this.id, 'Peer', null, 'RTCPeerConnection failed constructing RTCDataChannel ->'], error);

      _this._trigger('handshakeProgress', 'error', error);
      return;
    }
  }

  var iceRestart = false;

  if (['failed', 'disconnected'].indexOf(_this._ref.iceConnectionState) > -1) {
    log.debug([_this.id, 'Peer', null, 'RTCPeerConnection requires iceRestart as connection has failed ->'], _this._ref.iceConnectionState);

    iceRestart = true;
  }

  var RTCOfferOptions = {
    offerToReceiveAudio: true,
    offerToReceiveVideo: true,
    iceRestart: iceRestart
  };

  // Safari / IE does not support non-mandatory fields
  if (['safari', 'IE'].indexOf(globals.user.agent.name) > -1) {
    RTCOfferOptions = {
      mandatory: {
        OfferToReceiveAudio: true,
        OfferToReceiveVideo: true,
        iceRestart: iceRestart
      }
    };

  // Firefox as of 44 does not support iceRestart yet
  } else if (globals.user.agent.name === 'firefox') {
    RTCOfferOptions.iceRestart = false;

    log.warn([_this.id, 'Peer', null, 'RTCOfferOptions iceRestart is set to false because current browser does not support it']);
  }

  log.debug([_this.id, 'Peer', null, 'RTCPeerConnection is generating local offer']);

  _this._ref.createOffer(function (offer) {
    log.debug([_this.id, 'Peer', null, 'RTCPeerConnection has generated local offer ->'], offer);

    _this._handshakeSetLocal(offer);

  }, function (error) {
    log.error([_this.id, 'Peer', null, 'RTCPeerConnection failed generating local offer ->'], error);

    _this._trigger('handshakeProgress', 'error', error);

  }, RTCOfferOptions);
};

/**
 * Starts the Peer handshaking of "answer" in response of "offer".
 * @method handshakeAnswer
 * @param {RTCSessionDescription} offer The "offer" RTCSessionDescription.
 * @since 0.6.10
 * @for SkylinkPeer
 */
SkylinkPeer.prototype.handshakeAnswer = function (offer) {
  var _this = this;

  if (_this._ref.signalingState !== 'stable') {
    log.warn([_this.id, 'Peer', null, 'RTCPeerConnection ignoring remote offer as ' +
      'signalingState is not "stable" ->'], _this._ref.signalingState);
    return;
  }

  _this._handshakeSetRemote(offer, function () {

    log.debug([_this.id, 'Peer', null, 'RTCPeerConnection is generating local answer']);

    _this._ref.createAnswer(function (answer) {
      log.debug([_this.id, 'Peer', null, 'RTCPeerConnection has generated local answer ->'], answer);

      _this._handshakeSetLocal(answer);

    }, function (error) {
      log.error([_this.id, 'Peer', null, 'RTCPeerConnection failed generating local answer ->'], error);

      _this._trigger('handshakeProgress', 'error', error);

    });

  });
};

/**
 * Completes the Peer handshaking in response "answer".
 * @method handshakeComplete
 * @param {RTCSessionDescription} offer The "answer" RTCSessionDescription.
 * @since 0.6.10
 * @for SkylinkPeer
 */
SkylinkPeer.prototype.handshakeComplete = function (answer) {
  var _this = this;

  if (_this._ref.signalingState !== 'have-local-offer') {
    log.warn([_this.id, 'Peer', null, 'RTCPeerConnection ignoring received remote answer as ' +
      'signalingState is not "have-local-offer" ->'], _this._ref.signalingState);
    return;
  }

  _this._handshakeSetRemote(answer, function () {
    log.log([_this.id, 'Peer', null, 'RTCPeerConnection handshaking has completed']);
  });
};

/**
 * Reconnects the Peer connection.
 * @method reconnect
 * @param {Boolean} hardRestart The flag that indicates if Peer connection should hard restart.
 * @param {Boolean} isSelfInitated The flag that indicates if Peer restart is initiated locally.
 * @since 0.6.10
 * @for SkylinkPeer
 */
SkylinkPeer.prototype.reconnect = function (hardRestart, isSelfInitiated) {
  var _this = this;

  if (hardRestart) {
    log.debug([_this.id, 'Peer', null, 'Reconstructing RTCPeerConnection connection']);

    _this.disconnect();
    _this.connect();
  }

  // Resend the local RTCSessionDescription if handshaking is still going on
  if (['have-local-offer', 'have-remote-offer'].indexOf(_this._ref.signalingState) > -1) {
    var sessionDescription = _this._ref.localDescription;

    if (!!sessionDescription && !!sessionDescription.sdp) {
      log.debug([_this.id, 'Peer', null, 'Resending the local ' + sessionDescription.type + ' ->'], sessionDescription);

      _this._trigger(sessionDescription.type, sessionDescription);
      _this._monitorConnection();
      return;
    }
  }

  // Ping the receiving end so it will send the restart message
  if (isSelfInitated) {
    _this._trigger('restart', hardRestart);
  }
};

/**
 * Disconnects the Peer connection.
 * @method disconnect
 * @since 0.6.10
 * @for SkylinkPeer
 */
SkylinkPeer.prototype.disconnect = function () {
  var _this = this;

  _this._ref.close();

  _this._channels.forEach(function (channel) {
    channel.disconnect();
  });

  log.debug([_this.id, 'Peer', null, 'RTCPeerConnection is disconnecting']);
};

/**
 * Adds the remote ICE candidate.
 * @method addCandidate
 * @param {RTCIceCandidate} candidate The remote RTCIceCandidate.
 * @since 0.6.10
 * @for SkylinkPeer
 */
SkylinkPeer.prototype.addCandidate = function (candidate) {
  var _this = this;
  var addCandidate = false;
  var candidateId = candidate.candidate.split(' ')[0];

  globals.room.allowCandidateTypes.forEach(function (type) {
    if (candidate.candidate.indexOf(type) > 0) {
      addCandidate = true;
    }
  });

  if (!addCandidate) {
    log.warn([_this.id, 'Peer', candidateId, 'RTCPeerConnection is discarding remote ICE candidate ->'], candidate);
    return;
  }

  log.debug([_this.id, 'Peer', candidateId, 'RTCPeerConnection is adding remote ICE candidate ->'], candidate);

  _this._ref.addIceCandidate(candidate, function () {
    log.log([_this.id, 'Peer', candidateId, 'RTCPeerConnection has added remote ICE candidate ->'], candidate);

    _this._candidates.incoming.success.push(candidate);

  }, function (error) {
    log.error([_this.id, 'Peer', candidateId, 'RTCPeerConnection failed adding remote ICE candidate ->'], candidate);

    _this._candidates.incoming.failure.push(candidate);
  });
};

/**
 * Sets the local "offer" or "answer".
 * @method _handshakeSetLocal
 * @param {RTCSessionDescription} sessionDescription The local RTCSessionDescription.
 * @private
 * @since 0.6.10
 * @for SkylinkPeer
 */
SkylinkPeer.prototype._handshakeSetLocal = function (sessionDescription) {
  var _this = this;

  log.debug([_this.id, 'Peer', null, 'RTCPeerConnection is setting local ' + sessionDescription.type +
    ' ->'], sessionDescription);

  _this._ref.setLocalDescription(sessionDescription, function () {
    log.log([_this.id, 'Peer', null, 'RTCPeerConnection has set local ' + sessionDescription.type +
      ' ->'], sessionDescription);

    // If trickle ICE is enabled or ICE candidates have been gathered already, send
    if (_this._connection.enableIceTrickle || _this._candidates.outgoing.gathered) {
      _this._trigger(sessionDescription.type, sessionDescription);
      return;
    }

    log.debug([_this.id, 'Peer', null, 'RTCPeerConnection awaiting for local RTCIceCandidates to be ' +
      'generated before sending local ' + sessionDescription.type]);

  }, function (error) {
    log.error([_this.id, 'Peer', null, 'RTCPeerConnection failed setting local ' + sessionDescription.type +
      ' ->'], error);

    _this._trigger('handshakeProgress', 'error', error);

  });
};

/**
 * Sets the remote "offer" or "answer".
 * @method _handshakeSetRemote
 * @param {RTCSessionDescription} sessionDescription The remote RTCSessionDescription.
 * @private
 * @since 0.6.10
 * @for SkylinkPeer
 */
SkylinkPeer.prototype._handshakeSetRemote = function (sessionDescription) {
  var _this = this;

  log.debug([_this.id, 'Peer', null, 'RTCPeerConnection is setting remote ' + sessionDescription.type +
    ' ->'], sessionDescription);

  _this._ref.setRemoteDescription(sessionDescription, function () {
    log.log([_this.id, 'Peer', null, 'RTCPeerConnection has set remote ' + sessionDescription.type +
      ' ->'], sessionDescription);

    // Start adding all the queued ICE candidates
    log.debug([_this.id, 'Peer', null, 'RTCPeerConnection is adding any queued RTCIceCandidates']);

    _this._candidates.incoming.queue.forEach(function (candidate) {
      _this.addCandidate(candidate);
    });

    _this._candidates.incoming.queue = [];

  }, function (error) {
    log.error([_this.id, 'Peer', null, 'RTCPeerConnection failed setting remote ' + sessionDescription.type +
      ' ->'], error);

    _this._trigger('handshakeProgress', 'error', error);

  });
};

/**
 * Monitors the current Peer connection.
 * @method _monitorConnection
 * @private
 * @since 0.6.10
 * @for SkylinkPeer
 */
SkylinkPeer.prototype._monitorConnection = function () {
  var _this = this;
  var timeout = 10000;

  // Check if Peer is offerer, and increment as it takes more longer for the offerer
  if (_this._monitor.offerer) {
    timeout += 2500;
  }

  // Check if trickle ICE is disabled and increment as it takes longer
  if (!_this._connection.enableIceTrickle) {
    timeout += 40000;
  }

  // Increment the timer for every retry
  timeout += _this._connection.monitor.retries * 10000;

  // Reset the connection status to false first
  _this._connection.monitor.connected = false;

  _this._connection.monitor.timer = setTimeout(function () {
    log.log([_this.id, 'Peer', null, 'Monitor has expired ->'], timeout);

    if (_this._dead) {
      log.debug([_this.id, 'Peer', null, 'Ignoring reconnection as connection is dead']);
      return;
    }

    // Ensure the signalingState is "stable" and has both local and remote description
    var handshakingStable = _this._ref.signalingState === 'stable' &&
      (!!_this._ref.localDescription && !!_this._ref.localDescription.sdp) &&
      (!!_this._ref.remoteDescription && !!_this._ref.remoteDescription.sdp);
    // Ensure that the iceConnectionState is "connected" or "completed"
    var iceConnectionStateStable = ['connected', 'completed'].indexOf(_this._ref.iceConnectionState) > -1;
    // Ensure that the RTCDataChannel has passed
    var dataChannelStateStable = false;

    // Ensure that the "main" RTCDataChannel is opened
    if (_this._connection.enableDataChannel) {
      if (_this._channels.main && _this._channels.main.opened) {
        dataChannelStateStable = true;
      }

    // Because there is not RTCDataChannel allowed, consider it stable
    } else {
      dataChannelStateStable = true;
    }

    if (handshakingStable && iceConnectionStateStable && dataChannelStateStable) {
      _this._connection.monitor.connected = true;

      log.debug([_this.id, 'Peer', null, 'Monitor is cleared. Connection is stable']);
      return;
    }

    log.debug([_this.id, 'Peer', null, 'Monitor is restarted. Connection is not stable yet']);

    _this.reconnect(false, true);

  }, timeout);

  log.log([_this.id, 'Peer', null, 'Monitoring connection ->'], timeout);
};

/**
 * Adds the local MediaStream to the current Peer connection.
 * @method _addStream
 * @private
 * @since 0.6.10
 * @for SkylinkPeer
 */
SkylinkPeer.prototype._addStream = function () {
  var _this = this;
  var stream = null;

  // Check if local screensharing MediaStream is available to use
  if (globals.streams.screen && globals.stream.screen.stream) {
    stream = globals.streams.screen.stream;

    log.debug([_this.id, 'Peer', stream.id, 'Sending local screensharing MediaStream ->'], stream);

  // Check if local usermedia MediaStream is available to use
  } else if (globals.stream.userMedia && globals.stream.userMedia.stream) {
    stream = globals.streams.userMedia.stream;

    log.debug([_this.id, 'Peer', stream.id, 'Sending local usermedia MediaStream ->'], stream);

  // Else warn that no local MediaStreams will be use
  } else {
    log.warn([_this.id, 'Peer', null, 'Not sending any local MediaStream']);
  }

  // Loop out every local MediaStream sent and remove it
  _this._ref.getRemoteStreams().forEach(function (currentStream) {
    // Polyfill for firefox as RTCPeerConnection.removeStream is not supported yet
    if (globals.user.agent.name === 'firefox') {
      // Get every senders
      _this._ref.getSenders().forEach(function (sender) {
        // Get every tracks (firefox supports getTracks())
        currentStream.getTracks().forEach(function (track) {
          // Check if the track is the same as the RTPSender track
          if (track === sender.track) {
            _this._ref.removeTrack(sender);
          }
        });
      });

    // The other browsers support RTCPeerConnection.removeStream
    } else {
      _this._ref.removeStream(currentStream);
    }
  });

  // Add local MediaStream is there is any
  if (stream) {
    _this._ref.addStream(stream);
  }

  log.debug([_this.id, 'Peer', null, 'Configured the sending local MediaStream ->'], stream);
};

/**
 * Reacts to the RTCPeerConnection.onsignalingstatechange event.
 * @method _reactToOnsignalingstatechange
 * @private
 * @since 0.6.10
 * @for SkylinkPeer
 */
SkylinkPeer.prototype._reactToOnsignalingstatechange = function () {
  var _this = this;

  return function () {
    var state = _this._ref.signalingState;

    log.debug([_this.id, 'Peer', null, 'RTCPeerConnection.signalingState ->'], state);

    _this._trigger('signalingState', state);
  };
};

/**
 * Reacts to the RTCPeerConnection.onicegatheringstatechange event.
 * @method _reactToOnicegatheringstatechange
 * @private
 * @since 0.6.10
 * @for SkylinkPeer
 */
SkylinkPeer.prototype._reactToOnicegatheringstatechange = function () {
  var _this = this;

  return function () {
    var state = _this._ref.iceGatheringState;

    log.debug([_this.id, 'Peer', null, 'RTCPeerConnection.iceGatheringState ->'], state);

    _this._trigger('iceGatheringState', state);
  };
};

/**
 * Reacts to the RTCPeerConnection.ondatachannel event.
 * @method _reactToOndatachannel
 * @private
 * @since 0.6.10
 * @for SkylinkPeer
 */
SkylinkPeer.prototype._reactToOndatachannel = function () {
  var _this = this;

  return function (event) {
    var channel = event.channel || event;

    log.debug([_this.id, 'Peer', null, 'RTCPeerConnection received RTCDataChannel ->'], channel);

    _this._channels[channel.label] = new SkylinkDataChannel(channel, _this.id, null);
  };
};

/**
 * Reacts to the RTCPeerConnection.onaddstream event.
 * @method _reactToOnaddstream
 * @private
 * @since 0.6.10
 * @for SkylinkPeer
 */
SkylinkPeer.prototype._reactToOnaddstream = function () {
  var _this = this;

  return function (event) {
    var stream = event.stream || event;

    log.debug([_this.id, 'Peer', stream.id, 'RTCPeerConnection received MediaStream ->'], stream);

    // Check if Peer session has stream information, else it's an empty remote MediaStream that Chrome triggers
    if (!_this._streaming) {
      log.debug([_this.id, 'Peer', stream.id, 'RTCPeerConnection is discarding Ignoring received MediaStream ' +
        'as there is no streaming information ->'], stream);
      return;
    }

    // The timeout that somehow allows rendering to work
    var magicalTimeout = 0;

    if (_this.agent.name === 'firefox' && globals.user.agent.name !== 'firefox') {
      magicalTimeout = 1500;
    }

    // NOTE: Add timeouts to the firefox stream received because it seems to have some sort of black stream rendering at first
    // This may not be advisable but that it seems to work after 1500s. (tried with ICE established but it does not work and getStats)
    setTimeout(function () {
      _this._trigger('stream', stream);
    }, magicalTimeout);
  };
};

/**
 * Reacts to the RTCPeerConnection.onnegotiationneeded event.
 * @method _reactToOnnegotiationneeded
 * @private
 * @since 0.6.10
 * @for SkylinkPeer
 */
SkylinkPeer.prototype._reactToOnnegotiationneeded = function () {
  var _this = this;

  return function () {
    log.debug([_this.id, 'Peer', null, 'RTCPeerConnection.onnegotiationneeded ->'], null);
  };
};

/**
 * Reacts to the RTCPeerConnection.onremovestream event.
 * @method _reactToOnremovestream
 * @private
 * @since 0.6.10
 * @for SkylinkPeer
 */
SkylinkPeer.prototype._reactToOnremovestream = function () {
  var _this = this;

  return function (event) {
    var stream = event.stream || event;
    log.debug([_this.id, 'Peer', stream.id, 'RTCPeerConnection is removing MediaStream ->'], stream);
  };
};

/**
 * Reacts to the RTCPeerConnection.onicecandidate event.
 * @method _reactToOnicecandidate
 * @private
 * @since 0.6.10
 * @for SkylinkPeer
 */
SkylinkPeer.prototype._reactToOnicecandidate = function () {
  var _this = this;

  return function (event) {
    var candidate = event.candidate || event;
    var sendCandidate = false;

    if (event.candidate.candidate) {
      log.debug([_this.id, 'Peer', null, 'RTCPeerConnection has gathered all ICE candidates']);

      _this._candidates.outgoing.gathered = true;

      if (!_this._connection.enableIceTrickle) {
        var sessionDescription = _this._ref.localDescription;

        if (!!sessionDescription && !!sessionDescription.sdp) {
          log.debug([_this.id, 'Peer', null, 'RTCPeerConnection is sending queued local ' +
            sessionDescription.type + ' ->'], sessionDescription);

          _this._trigger(sessionDescription.type, sessionDescription);
        }
      }
      return;
    }

    if (!_this._connection.enableIceTrickle) {
      log.debug([_this.id, 'Peer', null, 'RTCPeerConnection queueing this in local generated RTCSessionDescription ->'], candidate);
      return;
    }

    globals.room.allowCandidateTypes.forEach(function (type) {
      if (candidate.candidate.indexOf(type) > 0) {
        sendCandidate = true;
      }
    });

    if (!sendCandidate) {
      log.warn([_this.id, 'Peer', null, 'RTCPeerConnection is discarding local ICE candidate ->'], candidate);
      return;
    }

    _this._trigger('candidate', candidate);
  };
};

/**
 * Reacts to the RTCPeerConnection.oniceconnectionstatechange event.
 * @method _reactToOniceconnectionstatechange
 * @private
 * @since 0.6.10
 * @for Skylink
 */
SkylinkPeer.prototype._reactToOniceconnectionstatechange = function () {
  var _this = this;

  return function () {
    var state = _this._ref.iceConnectionState;

    log.debug([_this.id, 'Peer', null, 'RTCPeerConnection.iceConnectionState ->'], state);

    _this._trigger('iceConnectionState', state);

    // Restart ICE connection state is "disconnected"
    if (state === 'disconnected') {
      _this.reconnect(false, true);

    // Restart ICE connection state is "failed"
    } else if (state === 'failed') {
      // Increment the failure counter
      _this._connection.failures++;

      // Disable trickle ICE if failures counter is 3 and MCU is not present
      // Only P2P can do hard restarts
      if (_this._connection.failures === 3 && !globals.room.hasMCU) {
         _this._connection.enableIceTrickle = false;

        _this._trigger('iceConnectionState', 'trickleFailed');

        _this.reconnect(true, true);
        return;
      }

      _this.reconnect(false, true);
    }
  };
};
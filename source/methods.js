/**
 * Refreshes a Peer connection. This function may be useful when a video stream
 *   seems to be appearing black and refreshing a Peer connection will help this use-case.
 * As of now, in a MCU environment, the User will have to leave the currently joined Room
 *   and join in back again the same Room as a fallback alternative since restart is not
 *   implemented for the MCU environment yet.
 * @method refreshConnection
 * @param {String|Array} [targetPeerId] The array of targeted Peer IDs connection to refresh
 *   the connection with.
 * @param {Function} [callback] The callback fired after all targeted Peers connection has
 *   been initiated with refresh or have met with an exception.
 *   The callback signature is <code>function (error, success)</code>.
 * @param {JSON} callback.error The error object received in the callback.
 *   If received as <code>null</code>, it means that there is no errors.
 * @param {Array} callback.error.listOfPeers The list of Peers that the
 *   refresh connection had been initiated with.
 * @param {JSON} callback.error.refreshErrors The list of errors occurred
 *   based on per Peer basis.
 * @param {Object|String} callback.error.refreshErrors.(#peerId) The Peer ID that
 *   is associated with the error that occurred when refreshing the connection.
 * @param {JSON} callback.success The success object received in the callback.
 *   If received as <code>null</code>, it means that there are errors.
 * @param {Array} callback.success.listOfPeers The list of Peers that the
 *   refresh connection had been initiated with.
 * @example
 *   SkylinkDemo.on("iceConnectionState", function (state, peerId)) {
 *     if (iceConnectionState === SkylinkDemo.ICE_CONNECTION_STATE.FAILED) {
 *       // Do a refresh
 *       SkylinkDemo.refreshConnection(peerId);
 *     }
 *   });
 * @trigger peerRestart, serverPeerRestart, peerJoined, peerLeft, serverPeerJoined, serverPeerLeft
 * @component Peer
 * @for Skylink
 * @since 0.5.5
 */
Skylink.prototype.refreshConnection = function(passedTargetPeerId, passedCallback) {
  var superRef = this;
  var listOfPeers = Object.keys(superRef._peers);
  var listOfPeersErrors = {};
  var callback = function () {};

  // Parsing the method paramters
  // refreshConnection(['p1', 'p2'])
  if (Array.isArray(passedTargetPeerId)) {
    listOfPeers = passedTargetPeerId.splice(0);

  // refreshConnection('p1')
  } else if (typeof passedTargetPeerId === 'string' && !!passedTargetPeerId) {
    listOfPeers = [passedTargetPeerId];

  // refreshConnection(function () {})
  } else if (typeof passedTargetPeerId === 'function') {
    callback = passedTargetPeerId;
  }

  // NOTE: Passing refreshConnection(function () {}, function () {}) takes in the 2nd parameter
  // refreshConnection(.., function () {})
  if (typeof passedCallback === 'function') {
    callback = passedCallback;
  }

  /* Success Case */
  var successCaseFn = function () {
    if (Object.keys(listOfPeersErrors).length > 0) {
      errorCaseFn();
      return;
    }

    var successPayload = {
      listOfPeers: listOfPeers
    };

    log.log([null, 'Skylink', 'refreshConnection()', 'Refreshed all connections ->'], successPayload);

    callback(null, successPayload);
  };

  /* Error Case */
  var errorCaseFn = function () {
    var errorPayload = {
      listOfPeers: listOfPeers,
      refreshErrors: listOfPeersErrors
    };

    log.error([null, 'Skylink', 'refreshConnection()', 'Failed refreshing all connections ->'], errorPayload);

    callback(errorPayload, null);
  };


  // Prevent refreshing empty connection list
  if (listOfPeers.length === 0) {
    listOfPeersErrors.self = new Error('Failed refreshing connections as there is no Peer connections to refresh');
    errorCaseFn();
    return;
  }

  listOfPeers.forEach(function (peerId) {
    // Dropping of Peer ID with "MCU"
    if (peerId === 'MCU') {
      return;
    }

    if (superRef._peers.hasOwnProperty(peerId) && superRef._peers[peerId]) {
      superRef._peers[peerId].handshakeRestart();
    } else {
      listOfPeersErrors[peerId] = new Error('Failed refreshing connection "' + peerId +
        '" as there is no connection with this Peer to refresh');
    }
  });

  // For MCU environment, we have to re-join the Room as there is no support for re-negotiation yet
  if (superRef._hasMCU) {
    superRef._trigger('serverPeerRestart', 'MCU', superRef.SERVER_PEER_TYPE.MCU);

    superRef.joinRoom(superRef._selectedRoom, function (error, success) {
      if (error) {
        listOfPeersErrors.MCU = error;
      }

      successCaseFn();
    });

  } else {
    successCaseFn();
  }
};

/**
 * Send a message object or string using the DataChannel connection
 *   associated with the list of targeted Peers.
 * - The maximum size for the message object would be<code>16Kb</code>.<br>
 * - To send a string length longer than <code>16kb</code>, please considered
 *   to use {{#crossLink "Skylink/sendURLData:method"}}sendURLData(){{/crossLink}}
 *   to send longer strings (for that instance base64 binary strings are long).
 * - To send message objects with platform signaling socket connection, see
 *   {{#crossLink "Skylink/sendMessage:method"}}sendMessage(){{/crossLink}}.
 * @method sendP2PMessage
 * @param {String|JSON} message The message object.
 * @param {String|Array} [targetPeerId] The array of targeted Peers to
 *   transfer the message object to. Alternatively, you may provide this parameter
 *   as a string to a specific targeted Peer to transfer the message object.
 * @example
 *   // Example 1: Send to all peers
 *   SkylinkDemo.sendP2PMessage("Hi there! This is from a DataChannel connection!"");
 *
 *   // Example 2: Send to specific peer
 *   SkylinkDemo.sendP2PMessage("Hi there peer! This is from a DataChannel connection!", targetPeerId);
 * @trigger incomingMessage
 * @since 0.5.5
 * @component DataTransfer
 * @for Skylink
 */
Skylink.prototype.sendP2PMessage = function(passedMessage, passedTargetPeerId) {
  var superRef = this;

  // Prevent sending messages when send datachannel is not enabled
  if (!superRef._enableDataChannel) {
    log.warn([null, 'Skylink', 'sendP2PMessage()', 'Failed sending message as ' +
      'datachannel functionality is not enabled ->'], passedMessage);
    return;
  }

  var listOfPeers = Object.keys(superRef._peers);
  var isPrivate = false;

  /* NOTE: Should we control "undefined" or null values being sent? */

  if (Array.isArray(passedTargetPeerId)) {
    listOfPeers = passedTargetPeerId;
    isPrivate = true;

  } else if (typeof passedTargetPeerId === 'string') {
    listOfPeers = [passedTargetPeerId];
    isPrivate = true;
  }

  // Handle MCU environment method of relaying
  if (superRef._hasMCU) {
    if (!superRef._peers.MCU) {
      log.error(['MCU', 'Skylink', 'sendP2PMessage()', 'Failed sending message as ' +
        'MCU peer connection does not exists ->'], passedMessage);
      return;
    }

    superRef._peers.MCU.channelMessage(passedMessage, isPrivate, listOfPeers);

  // Handle P2P environment method of sending
  } else {
    listOfPeers.forEach(function (peerId) {
      if (!superRef._peers[peerId]) {
        log.error([peerId, 'Skylink', 'sendP2PMessage()', 'Failed sending message as ' +
          'peer connection does not exists ->'], passedMessage);
        return;
      }

      superRef._peers[peerId].channelMessage(passedMessage, isPrivate);
    });
  }

  superRef._trigger('incomingMessage', {
    content: passedMessage,
    isPrivate: isPrivate,
    targetPeerId: isPrivate ? passedTargetPeerId : null,
    isDataChannel: true,
    senderPeerId: superRef._user.sid
  }, superRef._user.sid, superRef.getPeerInfo(), true);
};
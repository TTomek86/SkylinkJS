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

/**
 * Starts a data transfer with Peers using the DataChannel connections with
 *   [Blob](https://developer.mozilla.org/en/docs/Web/API/Blob datas).
 * - You can transfer files using the <code>input</code> [fileupload object](
 *   http://www.w3schools.com/jsref/dom_obj_fileupload.asp) and accessing the receiving
 *   files using [FileUpload files property](http://www.w3schools.com/jsref/prop_fileupload_files.asp).
 * - The [File](https://developer.mozilla.org/en/docs/Web/API/File) object inherits from
 *   the Blob interface which is passable in this method as a Blob object.
 * - The receiving Peers have the option to accept or reject the data transfer with
 *   <a href="#method_acceptDataTransfer">acceptDataTransfer()</a>.
 * - For Peers connecting from our mobile platforms
 *   (<a href="http://skylink.io/ios/">iOS</a> / <a href="http://skylink.io/android/">Android</a>),
 *   the DataChannel connection channel type would be <code>DATA_CHANNEL_TYPE.MESSAGING</code>.<br>
 *   For Peers connecting from the Web platform, the DataChannel connection channel type would be
 *  <code>DATA_CHANNEL_TYPE.DATA</code>.
 * @method sendBlobData
 * @param {Blob} data The Blob data object to transfer to Peer.
 * @param {Number} [timeout=60] The waiting timeout in seconds that the DataChannel connection
 *   data transfer should wait before throwing an exception and terminating the data transfer.
 * @param {String|Array} [targetPeerId] The array of targeted Peers to transfer the
 *   data object to. Alternatively, you may provide this parameter as a string to a specific
 *   targeted Peer to transfer the data object.
 * @param {Function} [callback] The callback fired after all the data transfers is completed
 *   successfully or met with an exception. The callback signature is <code>function (error, success)</code>.
 * @param {JSON} callback.error The error object received in the callback.
 *   If received as <code>null</code>, it means that there is no errors.
 * @param {String} [callback.error.state=null] <i>Deprecated</i>. The
 *   <a href="#event_dataTransferState">dataTransferState</a>
 *   when the error has occurred. This only triggers for a single targeted Peer data transfer.
 * @param {Object|String} [callback.error.error=null] <i>Deprecated</i>. The error received when the
 *   data transfer fails. This only triggers for single targeted Peer data transfer.
 * @param {String} callback.error.transferId The transfer ID of the failed data transfer.
 * @param {String} [callback.error.peerId=null] The single targeted Peer ID for the data transfer.
 *   This only triggers for single targeted Peer data transfer.
 * @param {Array} callback.error.listOfPeers The list of Peer that the data transfer has been
 *   initiated with.
 * @param {Boolean} callback.error.isPrivate The flag to indicate if the data transfer is a private
 *   transfer to the Peer directly and not broadcasted to all Peers.
 * @param {JSON} callback.error.transferErrors The list of errors occurred based on per Peer
 *   basis.
 * @param {Object|String} callback.error.transferErrors.(#peerId) The error that occurred when having
 *   a DataChannel connection data transfer with associated Peer.
 * @param {JSON} callback.error.transferInfo The transfer data object information.
 * @param {String} [callback.error.transferInfo.name=transferId] The transfer data object name.
 *   If there is no name based on the Blob given, the name would be the transfer ID.
 * @param {Number} callback.error.transferInfo.size The transfer data size.
 * @param {String} callback.error.transferInfo.transferId The data transfer ID.
 * @param {String} callback.error.transferInfo.dataType The type of data transfer initiated.
 *   Available types are <code>"dataURL"</code> and <code>"blob"</code>.
 * @param {String} callback.error.transferInfo.timeout The waiting timeout in seconds that the DataChannel
 *   connection data transfer should wait before throwing an exception and terminating the data transfer.
 * @param {Boolean} callback.error.transferInfo.isPrivate The flag to indicate if the data transfer is a private
 *   transfer to the Peer directly and not broadcasted to all Peers.
 * @param {JSON} callback.success The success object received in the callback.
 *   If received as <code>null</code>, it means that there are errors.
 * @param {String} [callback.success.state=null] <i>Deprecated</i>. The
 *   <a href="#event_dataTransferState">dataTransferState</a>
 *   when the data transfer has been completed successfully.
 *   This only triggers for a single targeted Peer data transfer.
 * @param {String} callback.success.transferId The transfer ID of the successful data transfer.
 * @param {String} [callback.success.peerId=null] The single targeted Peer ID for the data transfer.
 *   This only triggers for single targeted Peer data transfer.
 * @param {Array} callback.success.listOfPeers The list of Peer that the data transfer has been
 *   initiated with.
 * @param {Boolean} callback.success.isPrivate The flag to indicate if the data transfer is a private
 *   transfer to the Peer directly and not broadcasted to all Peers.
 * @param {JSON} callback.success.transferInfo The transfer data object information.
 * @param {String} [callback.success.transferInfo.name=transferId] The transfer data object name.
 *   If there is no name based on the Blob given, the name would be the transfer ID.
 * @param {Number} callback.success.transferInfo.size The transfer data size.
 * @param {String} callback.success.transferInfo.transferId The data transfer ID.
 * @param {String} callback.success.transferInfo.dataType The type of data transfer initiated.
 *   Available types are <code>"dataURL"</code> and <code>"blob"</code>.
 * @param {String} callback.success.transferInfo.timeout The waiting timeout in seconds that the DataChannel
 *   connection data transfer should wait before throwing an exception and terminating the data transfer.
 * @param {Boolean} callback.success.transferInfo.isPrivate The flag to indicate if the data transfer is a private
 *   transfer to the Peer directly and not broadcasted to all Peers.
 * @example
 *   // Example 1: Send file to all peers connected
 *   SkylinkDemo.sendBlobData(file, 67);
 *
 *   // Example 2: Send file to individual peer
 *   SkylinkDemo.sendBlobData(blob, 87, targetPeerId);
 *
 *   // Example 3: Send file with callback
 *   SkylinkDemo.sendBlobData(data,{
 *      name: data.name,
 *      size: data.size
 *    },function(error, success){
 *     if (error){
 *       console.error("Error happened. Could not send file", error);
 *     }
 *     else{
 *       console.info("Successfully uploaded file");
 *     }
 *   });
 *
 * @trigger incomingData, incomingDataRequest, dataTransferState, dataChannelState
 * @since 0.5.5
 * @component DataTransfer
 * @for Skylink
 */
Skylink.prototype.sendBlobData = function(passedData, passedTimeout, passedTargetPeerId, passedCallback) {
  var superRef = this;
  var timeout = 60,
      listOfPeers = Object.keys(superRef._peers),
      isPrivate = false,
      callback = function () {};

  if (listOfPeers.indexOf('MCU') > -1) {
    listOfPeers.splice(listOfPeers.indexOf('MCU'), 1);
  }

  // sendBlobData(.., 60)
  if (typeof passedTimeout === 'number') {
    if (passedTimeout > 0) {
      timeout = passedTimeout;
    }

  // sendBlobData(.., ['teste', 'erser'])
  } else if (Array.isArray(passedTimeout)) {
    listOfPeers = passedTimeout;
    isPrivate = true;

  // sendBlobData(.., 'ererer')
  } else if (typeof passedTimeout === 'string') {
    listOfPeers = [passedTimeout];
    isPrivate = true;

  // sendBlobData(.., function () {})
  } else if (typeof passedTimeout === 'function') {
    callback = passedTimeout;
  }

  // sendBlobData(.., .., ['ererer', 'ererer'])
  if (Array.isArray(passedTargetPeerId)) {
    listOfPeers = passedTargetPeerId;
    isPrivate = true;

  // sendBlobData(.., .., 'ererere')
  } else if (typeof passedTargetPeerId === 'string') {
    listOfPeers = [passedTargetPeerId];
    isPrivate = true;

  // sendBlobData(.., .., function () {})
  } else if (typeof passedTargetPeerId === 'function') {
    callback = passedTargetPeerId;
  }

  // sendBlobData(.., .., .., function () {})
  if (passedCallback === 'function') {
    callback = passedCallback;
  }

  var handleErrorFn = function (error, transferInfo) {
    callback({
      state: null,
      error: isPrivate && listOfPeers.length === 1 ? error : null,
      transferId: transferInfo.id || null,
      peerId: isPrivate && listOfPeers.length === 1 ? listOfPeers[0] : null,
      transferErrors: (function () {
        var list = {};

        listOfPeers.forEach(function (peerId) {
          list[peerId] = error;
        });

        return list;
      })(),
      isPrivate: isPrivate,
      transferInfo: {
        name: transferInfo.dataName || null,
        size: transferInfo.dataSize || null,
        transferId: transferInfo.id || null,
        dataType: 'blob',
        timeout: timeout,
        isPrivate: isPrivate
      }
    }, null);
  };

  var handleSuccessFn = function (transferInfo) {
    callback({
      state: null,
      transferId: transferInfo.id || null,
      peerId: isPrivate && listOfPeers.length === 1 ? listOfPeers[0] : null,
      isPrivate: isPrivate,
      transferInfo: {
        name: transferInfo.dataName || null,
        size: transferInfo.dataSize || null,
        transferId: transferInfo.id || null,
        dataType: 'blob',
        timeout: timeout,
        isPrivate: isPrivate
      }
    });
  };

  if (!(typeof passedData === 'object' && passedData instanceof Blob)) {
    handleErrorFn(
      new Error('Failed to start data transfer session as invalid Blob data object is provided'), {});
    return;
  }

  if (listOfPeers.length === 0) {
    handleErrorFn(
      new Error('Failed to start data transfer session as there is no peers to send data to'), {});
    return;
  }

  superRef._createTransfer(passedData, timeout, isPrivate, listOfPeers, function (error, transferInfo) {
    if (error) {
      handleErrorFn(error, transferInfo);
      return;
    }

    handleSuccessFn(transferInfo);
  });
};

/**
 * Terminates a current data transfer with Peer.
 * @method cancelBlobTransfer
 * @param {String} peerId The Peer ID associated with the data transfer.
 * @param {String} transferId The data transfer ID of the data transfer request
 *   to terminate the request.
 * @trigger dataTransferState
 * @component DataTransfer
 * @deprecated Use .cancelDataTransfer()
 * @for Skylink
 * @since 0.5.7
 */
Skylink.prototype.cancelBlobTransfer =
/**
 * Terminates a current data transfer with Peer.
 * @method cancelDataTransfer
 * @param {String} peerId The Peer ID associated with the data transfer.
 * @param {String} transferId The data transfer ID of the data transfer request
 *   to terminate the request.
 * @trigger dataTransferState
 * @component DataTransfer
 * @for Skylink
 * @since 0.6.1
 */
Skylink.prototype.cancelDataTransfer = function (peerId, transferId) {
  var superRef = this;

  var handleErrorFn = function (error) {
    log.error([peerId, 'Skylink', 'cancelDataTransfer()',
      'Failed terminating data transfer session ->'], {
      transferId: transferId,
      error: error
    });
  };

  var handleSuccessFn = function () {
    log.info([peerId, 'Skylink', 'cancelDataTransfer()',
      'Terminated data transfer session ->'], transferId);
  };

  if (!peerId) {
    handleErrorFn(new Error('Failed terminating data transfer session as invalid peer ID is provided'));
    return;
  }

  if (!transferId) {
    handleErrorFn(new Error('Failed terminating data transfer session as invalid transfer session ID is provided'));
    return;
  }

  if (!superRef._peers[peerId]) {
    handleErrorFn(new Error('Failed terminating data transfer session as peer session does not exists'));
    return;
  }

  superRef._peers[peerId].channelTransferCancel(transferId, function (error) {
    if (error) {
      handleErrorFn(error);
      return;
    }
    handleSuccessFn();
  });
};

/**
 * Responds to a data transfer request by a Peer.
 * @method respondBlobRequest
 * @param {String} peerId The sender Peer ID.
 * @param {String} transferId The data transfer ID of the data transfer request
 *   to accept or reject.
 * @param {Boolean} [accept=false] The flag that indicates <code>true</code> as a response
 *   to accept the data transfer and <code>false</code> as a response to reject the
 *   data transfer request.
 * @trigger dataTransferState, incomingDataRequest, incomingData
 * @component DataTransfer
 * @deprecated Use .acceptDataTransfer()
 * @for Skylink
 * @since 0.5.0
 */
Skylink.prototype.respondBlobRequest =
/**
 * Responds to a data transfer request by a Peer.
 * @method acceptDataTransfer
 * @param {String} peerId The sender Peer ID.
 * @param {String} transferId The data transfer ID of the data transfer request
 *   to accept or reject.
 * @param {Boolean} [accept=false] The flag that indicates <code>true</code> as a response
 *   to accept the data transfer and <code>false</code> as a response to reject the
 *   data transfer request.
 * @trigger dataTransferState, incomingDataRequest, incomingData
 * @component DataTransfer
 * @for Skylink
 * @since 0.6.1
 */
Skylink.prototype.acceptDataTransfer = function (peerId, transferId, accept) {
  var superRef = this;

  var handleErrorFn = function (error) {
    log.error([peerId, 'Skylink', 'acceptDataTransfer()',
      'Failed responding to data transfer session ->'], {
      transferId: transferId,
      error: error,
      accept: accept
    });
  };

  var handleSuccessFn = function () {
    log.info([peerId, 'Skylink', 'acceptDataTransfer()',
      'Response to data transfer session ->'], {
      transferId: transferId,
      accept: accept
    });
  };

  if (!(typeof peerId === 'string' && !!peerId)) {
    handleErrorFn(new Error('Failed responding to data transfer session as invalid peer ID is provided'));
    return;
  }

  if (!(typeof transferId === 'string' && !!transferId)) {
    handleErrorFn(new Error('Failed responding to data transfer session as invalid transfer session ID is provided'));
    return;
  }

  if (!superRef._peers[peerId]) {
    handleErrorFn(new Error('Failed responding to data transfer session as peer session does not exists'));
    return;
  }

  if (typeof accept !== 'boolean') {
    accept = false;
  }

  superRef._peers[peerId].channelTransferStartRespond(transferId, function (error) {
    if (error) {
      handleErrorFn(error);
      return;
    }
    handleSuccessFn();
  }, accept);
};
/**
 * Stores the uploading transfers.
 * @attribute _uploadTransfers
 * @type JSON
 * @private
 * @for Skylink
 * @since 0.6.x
 */
Skylink.prototype._uploadTransfers = {};

/**
 * Creates a DataChannel that handles the RTCDataChannel object.
 * @method _createDataChannel
 * @param {String} peerId The Peer ID.
 * @return {SkylinkDataChannel} The DataChannel class object that handles
 *   the provided RTCDataChannel object.
 * @private
 * @for Skylink
 * @since 0.6.x
 */
Skylink.prototype._createDataChannel = function (peerId, channel) {
  var superRef = this;

  /**
   * Singleton class object for the provided DataChannel object.
   * @class SkylinkDataChannel
   * @private
   * @for Skylink
   * @since 0.6.x
   */
  var SkylinkDataChannel = function () {
    /* TODO: Handle case for Android, iOS and C++ SDK */

    // Handles the .onopen event.
    this._handleOnOpenEvent();

    // Handles the .onclose event.
    this._handleOnCloseEvent();

    // Handles the .onerror event.
    this._handleOnErrorEvent();

    // Handles the .onbufferamountlow event.
    this._handleOnBufferAmountLowEvent();

    // Handles the .onmessage event.
    this._handleOnMessageEvent();

    log.log([this.peerId, 'DataChannel', this.id, 'Connection has started']);
  };

  /**
   * Stores the DataChannel ID.
   * @attribute id
   * @type String
   * @for SkylinkDataChannel
   * @since 0.6.x
   */
  SkylinkDataChannel.prototype.id = channel.label;

  /**
   * Stores the DataChannel connecting Peer ID.
   * @attribute peerId
   * @type String
   * @for SkylinkDataChannel
   * @since 0.6.x
   */
  SkylinkDataChannel.prototype.peerId = peerId;

  /**
   * Stores the DataChannel type.
   * @attribute type
   * @type String
   * @for SkylinkDataChannel
   * @since 0.6.x
   */
  SkylinkDataChannel.prototype.type = channel.label === 'main' ?
    superRef.DATA_CHANNEL_TYPE.MESSAGING : superRef.DATA_CHANNEL_TYPE.DATA;

  /**
   * Stores the DataChannel current data transfer.
   * Defaults to <code>null</code> if there is no transfers going on.
   * @attribute _transfer
   * @type JSON
   * @private
   * @for SkylinkDataChannel
   * @since 0.6.x
   */
  SkylinkDataChannel.prototype._transfer = null;

  /**
   * Stores the DataChannel connection RTCDataChannel reference.
   * @attribute _RTCDataChannel
   * @type RTCDataChannel
   * @private
   * @for SkylinkDataChannel
   * @since 0.6.x
   */
  SkylinkDataChannel.prototype._RTCDataChannel = channel;

  /**
   * Sends a message.
   * @method message
   * @param {Any} message The message object. Note that this object will be stringified.
   * @param {Boolean} [isPrivate=false] The flag that indicates if message is targeted or not.
   * @param {Array} [listOfPeers] The list of Peers to relay message for MCU environment.
   * @for SkylinkDataChannel
   * @since 0.6.x
   */
  SkylinkDataChannel.prototype.message = function (message, isPrivate, listOfPeers) {
    var ref = this;

    ref._messageSend({
      type: superRef._DC_PROTOCOL_TYPE.MESSAGE,
      sender: superRef._user.sid,
      target: Array.isArray(listOfPeers) ? listOfPeers : ref.peerId,
      data: message,
      isPrivate: isPrivate === true
    });
  };

  /**
   * Starts a transfer
   * @method transferStart
   * @param {String} transferId The transfer ID.
   * @for SkylinkDataChannel
   * @since 0.6.x
   */
  SkylinkDataChannel.prototype.transferStart = function (transferId, callback, nextPacketCallback, listOfPeers) {
    var ref = this;

    if (ref._transfer) {
      log.warn([ref.peerId, 'DataChannel', ref.id, 'Dropping of data transfer request as there ' +
        'is still a transfer session going on']);

      var ongoingTransferSessionError = new Error('Failed data transfer as there is still a transfer session going on');

      if (Array.isArray(listOfPeers)) {
        listOfPeers.forEach(function (peerId) {
          callback(peerId, ongoingTransferSessionError);
        });
      } else {
        callback(ref.peerId, ongoingTransferSessionError);
      }
      return;
    }

    if (!superRef._uploadTransfers[transferId]) {
      log.warn([ref.peerId, 'DataChannel', ref.id, 'Dropping of data transfer request as transfer session ' +
        'does not exists']);

      var noTransferSessionError = new Error('Failed data transfer as session does not exists');

      if (Array.isArray(listOfPeers)) {
        listOfPeers.forEach(function (peerId) {
          callback(peerId, noTransferSessionError);
        });
      } else {
        callback(ref.peerId, noTransferSessionError);
      }
      return;
    }

    var uploadSession = superRef._uploadTransfers[transferId];

    ref._transfer = {
      id: transferId,
      dataName: uploadSession.dataName,
      dataSize: uploadSession.dataSize,
      dataTransferredSize: 0,
      dataChunkSize: uploadSession.dataChunkSize,
      dataMimeType: uploadSession.dataMimeType,
      type: uploadSession.type,
      timeout: uploadSession.timeout,
      isPrivate: uploadSession.isPrivate,
      direction: superRef.DATA_TRANSFER_TYPE.UPLOAD,
      requestPacketFn: nextPacketCallback
    };

    if (Array.isArray(listOfPeers)) {
      listOfPeers.forEach(function (peerId) {
        callback(peerId, null);
      });
    } else {
      callback(ref.peerId, null);
    }

    ref._messageSend({
      type: superRef._DC_PROTOCOL_TYPE.WRQ,
      sender: superRef._user.sid,
      target: (Array.isArray(listOfPeers)) ? listOfPeers : null,
      id: ref._transfer.id,
      name: ref._transfer.dataName,
      size: ref._transfer.dataSize,
      dataType: ref._transfer.type,
      dataMimeType: ref._transfer.dataMimeType,
      chunkSize: ref._transfer.dataChunkSize,
      timeout: ref._transfer.timeout,
      isPrivate: ref._transfer.isPrivate
    });

    ref._transferSetState(superRef.DATA_TRANSFER_STATE.UPLOAD_REQUEST);
  };

  /**
   * Accepts or reject a transfer
   * @method transferAccept
   * @for SkylinkDataChannel
   * @since 0.6.x
   */
  SkylinkDataChannel.prototype.transferAccept = function (transferId, accept, callback) {
    var ref = this;

    if (!ref._transfer) {
      callback(new Error('Failed data transfer as there is no transfer sessions currently'));
      return;
    }

    if (ref._transfer.id !== transferId) {
      callback(new Error('Failed data transfer as transfer session ID does not match existing one'));
      return;
    }

    if (ref._transfer.accepted) {
      callback(new Error('Ignoring data transfer request as transfer has already been accepted'));
      return;
    }

    if (accept) {
      ref._transfer.accepted = true;

      ref._messageSend({
        type: superRef._DC_PROTOCOL_TYPE.ACK,
        sender: superRef._user.sid,
        ackN: 0
      });

      ref._transferSetState(superRef.DATA_TRANSFER_STATE.DOWNLOAD_STARTED);

    } else {
      ref._messageSend({
        type: superRef._DC_PROTOCOL_TYPE.ACK,
        sender: superRef._user.sid,
        ackN: -1
      });

      ref._transferSetState(superRef.DATA_TRANSFER_STATE.REJECTED);
    }

    callback(null);
  };

  /* TODO: Cancel transfer */

  /**
   * Disconnects the DataChannel.
   * @method disconnect
   * @for SkylinkDataChannel
   * @since 0.6.x
   */
  SkylinkDataChannel.prototype.disconnect = function () {
    var ref = this;

    /* NOTE: Should we clear all the transfers? Since it's dead */

    if (['closing', 'closed'].indexOf(ref._RTCDataChannel.readyState) > -1) {
      log.warn([ref.peerId, 'DataChannel', ref.id, 'Dropping of closing datachannel as ' +
        'connection is already closed ->'], ref._RTCDataChannel.readyState);
      return;
    }

    // Polyfill the .onclosing event to trigger "closing".
    //   It was removed already in the specs but the SDK has it so let's keep it.
    var closingState = superRef.DATA_CHANNEL_STATE.CLOSING;

    log.log([ref.peerId, 'DataChannel', ref.id, 'Connection ready state ->'], closingState);

    superRef._trigger('dataChannelState', closingState, ref.peerId, null, ref.id, ref.type);

    /**
     * Close RTCDataChannel connection with .close()
     */
    ref._RTCDataChannel.close();
  };

  /**
   * Sets the data transfer state.
   * @method _transferSetState
   * @param {String} state The data transfer state.
   * @param {Error} error The exception received in that state.
   * @for SkylinkDataChannel
   * @since 0.6.x
   */
  SkylinkDataChannel.prototype._transferSetState = function (state, error) {
    var ref = this;
    var transferId = null,
        transferDirection = null,
        transferError = null,
        transferData = null,
        transferSession = null,
        transferInfo = {
          name: null,
          size: 0,
          percentage: 0,
          dataType: null,
          senderPeerId: null,
          timeout: 0,
          isPrivate: false,
          transferType: null
        };

    // Prevent returning undefined values by defining before
    if (ref._transfer) {
      transferId = ref._transfer.id;
      transferDirection = ref._transfer.direction;

      transferSession = superRef._uploadTransfers[transferId];

      transferInfo.name = ref._transfer.dataName;
      transferInfo.size = ref._transfer.dataSize;
      transferInfo.percentage = ((ref._transfer.dataTransferredSize / ref._transfer.dataSize) * 100).toFixed(2);
      transferInfo.dataType = ref._transfer.type;
      transferInfo.senderPeerId = ref._transfer.direction === superRef.DATA_TRANSFER_TYPE.DOWNLOAD ?
        ref.peerId : superRef._user.sid;
      transferInfo.timeout = ref._transfer.timeout;
      transferInfo.isPrivate = ref._transfer.isPrivate;

      // Present that transfer is completed
      if (ref._transfer.dataTransferredSize === ref._transfer.dataSize) {
        // Switch the states
        if (ref._transfer.direction === superRef.DATA_TRANSFER_TYPE.DOWNLOAD) {
          state = superRef.DATA_TRANSFER_STATE.DOWNLOAD_COMPLETED;
        } else {
          state = superRef.DATA_TRANSFER_STATE.UPLOAD_COMPLETED;
        }

        // For downloads, serve the Blob object or Data URI string as it is completed
        if (state === superRef.DATA_TRANSFER_STATE.DOWNLOAD_COMPLETED) {
          if (ref._transfer.type === 'blob') {
            /* TODO: Fixes for IE <10 support for Blob polyfill */
            transferData = new Blob(ref._transfer.dataChunks, {
              type: ref._transfer.dataMimeType
            });
            /* TODO: Polyfill for downloading Blob in various browsers as file */
          } else {
            transferData = ref._transfer.dataChunks.join('');
          }
        }
      }
    }

    // Configure the transfer error if provided
    if (error) {
      transferError = {
        message: error,
        transferType: transferDirection
      };
    }

    // Clear the transfer session once it's terminated or completed
    if ([superRef.DATA_TRANSFER_STATE.ERROR,
        superRef.DATA_TRANSFER_STATE.REJECTED,
        superRef.DATA_TRANSFER_STATE.CANCEL,
        superRef.DATA_TRANSFER_STATE.UPLOAD_COMPLETED,
        superRef.DATA_TRANSFER_STATE.DOWNLOAD_COMPLETED].indexOf(state) > -1) {

      log.debug([ref.peerId, 'DataChannel', ref.id, 'Clearing transfer session as it has ended ->'], transferInfo);

      ref._transfer = null;

      // Close the RTCDataChannel if it's for transfers once it's completed
      if (ref.type === superRef.DATA_CHANNEL_TYPE.DATA) {
        log.warn([ref.peerId, 'DataChannel', ref.id, 'Closing channel as transfer session has ended']);

        ref.disconnect();
      }
    }

    transferInfo.transferType = transferDirection;

    var transferInfoWithData = clone(transferInfo);
    transferInfoWithData.data = transferData;

    // Hack to fix to ensure UPLOAD_STARTED triggers with the transferInfo.data
    /* TODO: We should SERIOUSLY fix this states that is not in order */
    /* NOTE: Why do we append data at UPLOAD_STARTED!!??? Should not it be UPLOAD_REQUEST ? */
    if ((state === superRef.DATA_TRANSFER_STATE.UPLOAD_STARTED ||
      state === superRef.DATA_TRANSFER_STATE.UPLOAD_COMPLETED) && transferSession) {
      var completedData = null;

      if (transferSession.type === 'blob') {
        /* TODO: Fixes for IE <10 support for Blob polyfill */
        completedData = new Blob(transferSession.dataChunks, {
          type: transferSession.dataMimeType
        });
        /* TODO: Polyfill for downloading Blob in various browsers as file */
      } else {
        completedData = transferSession.dataChunks.join('');
      }

      if (state === superRef.DATA_TRANSFER_STATE.UPLOAD_STARTED) {
        transferInfoWithData.data = completedData;
      } else {
        transferData = completedData;
      }
    }

    if (!(state === superRef.DATA_TRANSFER_STATE.UPLOAD_REQUEST &&
      transferDirection === superRef.DATA_TRANSFER_TYPE.UPLOAD)) {
      transferInfoWithData.data = transferInfoWithData.data || null;
      superRef._trigger('dataTransferState', state, transferId, ref.peerId, transferInfoWithData, transferError);
    }

    /* NOTE: We should add additional UPLOAD_REQUEST for uploader */
    if (state === superRef.DATA_TRANSFER_STATE.UPLOAD_REQUEST) {
      superRef._trigger('incomingDataRequest', transferId, ref.peerId, transferInfo,
        transferDirection === superRef.DATA_TRANSFER_TYPE.UPLOAD);
    }

    if (transferData) {
      superRef._trigger('incomingData', transferData, transferId, ref.peerId, transferInfo,
        transferDirection === superRef.DATA_TRANSFER_TYPE.UPLOAD);
    }
  };

  /**
   * Sends data over the RTCDataChannel object.
   * @method _messageSend
   * @param {JSON} message The message object data.
   * @private
   * @for SkylinkDataChannel
   * @since 0.6.x
   */
  SkylinkDataChannel.prototype._messageSend = function (message) {
    var ref = this;
    var dataString = null;

    if (typeof message === 'object') {
      dataString = JSON.stringify(message);

    } else {
      dataString = message;
    }

    // Prevent sending data when readyState is not "open"
    if (ref._RTCDataChannel.readyState !== 'open') {
      log.warn([ref.peerId, 'RTCDataChannel', ref.id,
        'Dropping of sending data as connection state is not "open" ->'], dataString);

      // Inform and reflect that data transfer failed due to RTCDataChannel readyState is not ready yet
      if (!(typeof message === 'object' && message.type === superRef._DC_PROTOCOL_TYPE.MESSAGE)) {
        var notOpenError = new Error('Failed transfer as datachannel is not "open"');

        ref._transferSetState(superRef.DATA_TRANSFER_STATE.ERROR, notOpenError);
      }
      return;
    }

    log.debug([ref.peerId, 'DataChannel', ref.id, 'Sending data ->'], dataString);

    /**
     * Sends message with .send()
     */
    ref._RTCDataChannel.send(dataString);

    // Start setting timeouts
    //if (!(typeof message === 'object' && message.type === superRef._DC_PROTOCOL_TYPE.MESSAGE)) {
      /* TODO: Timeouts */
    //}
  };

  /**
   * Handles the "MESSAGE" protocol.
   * @method _messageReactToMESSAGEProtocol
   * @param {JSON} message The message object data.
   * @private
   * @for SkylinkDataChannel
   * @since 0.6.x
   */
  SkylinkDataChannel.prototype._messageReactToMESSAGEProtocol = function (message) {
    var ref = this;

    // Trigger that message has been received
    superRef._trigger('incomingMessage', {
      content: message.data,
      isPrivate: message.isPrivate,
      isDataChannel: true,
      targetPeerId: superRef._user.sid,
      senderPeerId: ref.peerId
    }, ref.peerId, superRef.getPeerInfo(ref.peerId), false);
  };

  /**
   * Handles the "WRQ" protocol.
   * @method _messageReactToWRQProtocol
   * @param {JSON} message The message object data.
   * @private
   * @for SkylinkDataChannel
   * @since 0.6.x
   */
  SkylinkDataChannel.prototype._messageReactToWRQProtocol = function (message) {
    var ref = this;

    // Prevent accepting another request when there is a request going on
    if (ref._transfer) {
      log.warn([ref.peerId, 'DataChannel', ref.id, 'Dropping of transfer WRQ stage as ' +
        'there is an existing transfer session already ->'], message);
      return;
    }

    ref._transfer = {
      id: message.id,
      accepted: false,
      dataName: message.name,
      dataSize: message.size,
      dataTransferredSize: 0,
      dataChunks: [],
      dataACKIndex: 0,
      dataChunkSize: message.chunkSize,
      dataMimeType: message.dataMimeType,
      type: message.dataType || null,
      timeout: message.timeout,
      isPrivate: message.isPrivate === true,
      direction: superRef.DATA_TRANSFER_TYPE.DOWNLOAD
    };

    if (typeof ref._transfer.id !== 'string') {
      ref._transfer.id = (new Date()).getTime().toString();
    }

    if (typeof ref._transfer.name !== 'string') {
      ref._transfer.name = ref._transfer.id;
    }

    // Configure to never let timeouts be less than 1
    if (!(typeof ref._transfer.timeout === 'number' && ref._transfer.timeout > 0)) {
      log.warn([ref.peerId, 'DataChannel', ref.id, 'Setting transfer timeout to default of 60s ' +
        'as provided timeout is invalid ->'], ref._transfer.timeout);

      ref._transfer.timeout = 60;
    }

    /* TODO: Polyfill Android, iOS and C++ SDK */

    ref._transferSetState(superRef.DATA_TRANSFER_STATE.UPLOAD_REQUEST);
  };

  /**
   * Handles the "ACK" protocol.
   * @method _messageReactToACKProtocol
   * @param {JSON} message The message object data.
   * @private
   * @for SkylinkDataChannel
   * @since 0.6.x
   */
  SkylinkDataChannel.prototype._messageReactToACKProtocol = function (message) {
    var ref = this;

    // Prevent processing request if there is no request going on
    if (!ref._transfer) {
      log.warn([ref.peerId, 'DataChannel', ref.id, 'Dropping of transfer ACK stage as ' +
        'there is no existing transfer session ->'], message);
      return;
    }

    // Prevent processing request since it's at an incorrect stage.
    //   Uploader must always have requestPacketFn defined
    if (typeof ref._transfer.requestPacketFn !== 'function') {
      log.warn([ref.peerId, 'DataChannel', ref.id, 'Dropping of transfer ACK stage as ' +
        'it is at an incorrect stage ->'], message);
      return;
    }

    if (message.ackN < 0) {
      ref._transferSetState(superRef.DATA_TRANSFER_STATE.REJECTED,
        new Error('Failed data transfer as Peer has rejected transfer request'));
      return;

    } else if (message.ackN === 0) {
      ref._transferSetState(superRef.DATA_TRANSFER_STATE.UPLOAD_STARTED);
    }

    // Start request for the packet based off the acknowledgement index
    ref._transfer.requestPacketFn(message.ackN, function (data) {
      var packetSize = 0;

      if (!data) {
        ref._transferSetState(superRef.DATA_TRANSFER_STATE.ERROR,
          new Error('Failed data transfer as invalid data packet received'));
        return;
      }

      if (typeof data.size === 'number') {
        packetSize = data.size;
      } else if (typeof data.length === 'number') {
        packetSize = data.length;
      }

      ref._transfer.dataTransferredSize += packetSize;

      if (typeof data === 'string') {
        ref._messageSend(data);

        ref._transferSetState(superRef.DATA_TRANSFER_STATE.UPLOADING);

      } else {
        superRef._DataPacker.blobToBase64(data, function (dataBase64ConvertedString) {
          ref._messageSend(dataBase64ConvertedString);

          ref._transferSetState(superRef.DATA_TRANSFER_STATE.UPLOADING);
        });
      }
    });
  };

  /**
   * Handles the "DATA" protocol.
   * @method _messageReactToDATAProtocol
   * @param {String} dataString The data string base64 encoded.
   * @private
   * @for SkylinkDataChannel
   * @since 0.6.x
   */
  SkylinkDataChannel.prototype._messageReactToDATAProtocol = function (dataString) {
    var ref = this;

    // Prevent processing request if there is no request going on
    if (!ref._transfer) {
      log.warn([ref.peerId, 'DataChannel', ref.id, 'Dropping of transfer DATA stage as ' +
        'there is no existing transfer session ->'], dataString);
      return;
    }

    var packetData = null,
        packetDataSize = 0;

    if (ref._transfer.type === 'blob') {
      packetData = superRef._DataPacker.base64ToBlob(dataString);

    } else {
      packetData = dataString;
    }

    if (typeof packetData.size === 'number') {
      packetDataSize = packetData.size;

    } else if (typeof packetData.length === 'number') {
      packetDataSize = packetData.length;

    } else {
      var packetDataSizeError = new Error('Failed downloading transfer as packet received size is incorrect');

      log.error([ref.peerId, 'DataChannel', ref.id, packetDataSizeError.message + ' ->'], packetData);

      ref._transferSetState(superRef.DATA_TRANSFER_STATE.ERROR, packetDataSizeError);

      return;
    }

    ref._transfer.dataChunks[ref._transfer.dataACKIndex] = packetData;
    ref._transfer.dataTransferredSize += packetDataSize;
    ref._transfer.dataACKIndex += 1;

    ref._messageSend({
      type: superRef._DC_PROTOCOL_TYPE.ACK,
      sender: superRef._user.sid,
      ackN: ref._transfer.dataACKIndex
    });

    ref._transferSetState(superRef.DATA_TRANSFER_STATE.DOWNLOADING);
  };

  /**
   * Handles the RTCDataChannel.onopen event.
   * @method _handleOnOpenEvent
   * @private
   * @for SkylinkDataChannel
   * @since 0.6.x
   */
  SkylinkDataChannel.prototype._handleOnOpenEvent = function () {
    var ref = this;

    /**
     * Function that handles when RTCDataChannel has opened.
     */
    var onOpenFn = function () {
      var openedState = superRef.DATA_CHANNEL_STATE.OPEN;

      log.log([ref.peerId, 'DataChannel', ref.id, 'Connection ready state ->'], openedState);

      superRef._trigger('dataChannelState', openedState, ref.peerId, null, ref.id, ref.type);
    };

    var currentState = ref._RTCDataChannel.readyState;

    if (currentState === 'open') {
      log.debug([ref.peerId, 'DataChannel', ref.id, 'Connection has already been opened but delaying ' +
        'for about 500ms first before usage']);

      /* NOTE: Copied from the old logic. Still don't understand why do we need this? */
      setTimeout(onOpenFn, 500);

    } else {
      /* NOTE: What happens if the RTCDataChannel is already closed ? */

      log.log([ref.peerId, 'DataChannel', ref.id, 'Connection ready state ->'], currentState);

      ref._RTCDataChannel.onopen = onOpenFn;

      // Reflect the current state, it could be "connecting" state
      superRef._trigger('dataChannelState', currentState, ref.peerId, null, ref.id, ref.type);
    }
  };

  /**
   * Handles the RTCDataChannel.onclose event.
   * @method _handleOnCloseEvent
   * @private
   * @for SkylinkDataChannel
   * @since 0.6.x
   */
  SkylinkDataChannel.prototype._handleOnCloseEvent = function () {
    var ref = this;

    /* NOTE: What happens if the RTCDataChannel is already closed ? */
    /* TODO: Polyfill RTCDataChannel "closing" state */
    /* TODO: Terminate datatransfers when channel has closed */

    ref._RTCDataChannel.onclose = function () {
      var closedState = superRef.DATA_CHANNEL_STATE.CLOSED;

      log.log([ref.peerId, 'DataChannel', ref.id, 'Connection ready state ->'], closedState);

      superRef._trigger('dataChannelState', closedState, ref.peerId, null, ref.id, ref.type);
    };
  };

  /**
   * Handles the RTCDataChannel.onerror event.
   * @method _handleOnErrorEvent
   * @private
   * @for SkylinkDataChannel
   * @since 0.6.x
   */
  SkylinkDataChannel.prototype._handleOnErrorEvent = function () {
    var ref = this;

    /* TODO: Terminate datatransfers when channel has error */
    ref._RTCDataChannel.onerror = function (evt) {
      var error = evt.error || evt;

      log.log([ref.peerId, 'DataChannel', ref.id, 'Connection caught exception ->'], error);

      superRef._trigger('dataChannelState', superRef.DATA_CHANNEL_STATE.ERROR,
        ref.peerId, error, ref.id, ref.type);
    };
  };

  /**
   * Handles the RTCDataChannel.onbufferedamountlow event.
   * @method _handleOnBufferAmountLowEvent
   * @private
   * @for SkylinkDataChannel
   * @since 0.6.x
   */
  SkylinkDataChannel.prototype._handleOnBufferAmountLowEvent = function () {
    var ref = this;

    ref._RTCDataChannel.onbufferedamountlow = function (evt) {
      var bufferedAmount = evt.bufferedamountlow || evt;

      log.log([ref.peerId, 'DataChannel', ref.id, 'Connection buffering low ->'], bufferedAmount);
    };
  };

  /**
   * Handles the RTCDataChannel.onmessage event.
   * @method _handleOnMessageEvent
   * @private
   * @for SkylinkDataChannel
   * @since 0.6.x
   */
  SkylinkDataChannel.prototype._handleOnMessageEvent = function () {
    var ref = this;

    ref._RTCDataChannel.onmessage = function (evt) {
      var data = evt.message || evt.data || evt;

      log.log([ref.peerId, 'DataChannel', ref.id, 'Received data ->'], data);

      /* TODO: Handle receiving Binary ? Like ArrayBuffer? Perhaps check typeof constructor.name */

      try {
        var message = JSON.parse(data);

        switch (message.type) {
          case superRef._DC_PROTOCOL_TYPE.MESSAGE:
            ref._messageReactToMESSAGEProtocol(message);
            break;
          case superRef._DC_PROTOCOL_TYPE.WRQ:
            ref._messageReactToWRQProtocol(message);
            break;
          case superRef._DC_PROTOCOL_TYPE.ACK:
            ref._messageReactToACKProtocol(message);
            break;
          default:
            log.warn([ref.peerId, 'DataChannel', ref.id, 'Dropping of unknown protocol received ->'], message);
        }
      } catch (error) {
        if (data.indexOf('{') > -1) {
          log.error([ref.peerId, 'DataChannel', ref.id, 'Failed parsing message object received ->'], error);
        } else {
          ref._messageReactToDATAProtocol(data);
        }
      }
    };
  };

  return new SkylinkDataChannel();
};

/**
 * Starts a transfer to Peers.
 * In the MCU environment, the transfers will be targeted.
 * @method _createTransfer
 * @param {String|Blob} data The data object.
 * @param {Number} timeout The transfer timeout in seconds.
 * @param {Boolean} isPrivate The flag that indicates if transfer is targeted or not.
 * @param {Array} listOfPeers The list of Peers to start transfer with.
 * @param {Function} peerCallback The callback function that triggers if Peer is ready to start transfer
 *   or failed because it does not exists or no datachannel present. Signature is: (peerId, error).
 *   If <code>null</code> is returned, the transfer is ready to start.
 * @for Skylink
 * @since 0.6.x
 */
Skylink.prototype._createTransfer = function (data, timeout, isPrivate, listOfPeers, peerCallback) {
  var superRef = this;
  var transferId = (new Date ()).getTime().toString() + '-web',
      newUploadTransfer = {
        timeout: timeout,
        isPrivate: isPrivate
      };

  // Parse the Blob object data and information for chunks
  if (typeof data === 'object') {
    newUploadTransfer.dataName = data.name;
    newUploadTransfer.dataSize = data.size; //Math.ceil(data.size * 4/3);
    /* NOTE: Because in the past, Firefox had issues with 65536 sizes, so what we switched the original chunk size.
      Before Firefox issue: (Original: 49152 | Binary Size: 65536)
      After Firefox issue for resolution: (Original: 12288 | Binary Size: 16384) */
    newUploadTransfer.dataChunkSize = Math.ceil(12288 / 3) * 4; // 49152
    newUploadTransfer.dataChunks = superRef._DataPacker.chunkBlob(data, 12288); // 49152
    newUploadTransfer.dataMimeType = data.type || '';
    newUploadTransfer.type = 'blob';

  // Parse the DataURI string data and information for chunks
  } else {
    if (typeof data.length === 'number') {
      newUploadTransfer.dataSize = data.length;

    } else {
      newUploadTransfer.dataSize = data.size;
    }

    newUploadTransfer.dataChunkSize = 1212;
    newUploadTransfer.dataChunks = superRef._DataPacker.chunkDataURI(data, 1212);
    newUploadTransfer.dataMimeType = '';
    newUploadTransfer.type = 'dataURL';
  }

  // Polyfill the data name if it does not exists
  if (typeof newUploadTransfer.dataName !== 'string' || !newUploadTransfer.dataName) {
    newUploadTransfer.dataName = transferId + '-transfer';
  }

  /**
   * Function that handles returning the next packet.
   */
  var nextPacketFn = function (ackN, processCallback) {
    processCallback(newUploadTransfer.dataChunks[ackN]);
  };

  // Store the upload session
  superRef._uploadTransfers[transferId] = newUploadTransfer;

  // Filter out Peers that does not exists
  var filteredListOfPeers = listOfPeers.slice();

  for (var i = 0; i < filteredListOfPeers.length; i++) {
    var peerId = filteredListOfPeers[i];

    // Prevent sending to a Peer that does not exists
    if (!superRef._peers[peerId]) {
      peerCallback(peerId, new Error('Failed data transfer as Peer session does not exists'));
      filteredListOfPeers.splice(i, 1);
      i--;
    }
  }

  // Check if Peer is in MCU environment, which we have to use MCU to relay files
  if (superRef._hasMCU) {
    if (!superRef._peers.MCU) {
      filteredListOfPeers.forEach(function (peerId) {
        peerCallback(peerId, new Error('Failed data transfer with Peers using MCU ' +
          'because MCU Peer connection does not exists'));
      });
      return;
    }

    superRef._peers.MCU.channelTransferStart(transferId, peerCallback, nextPacketFn, filteredListOfPeers);
    return;
  }

  // Transfer files using P2P connections
  filteredListOfPeers.forEach(function (peerId) {
    superRef._peers[peerId].channelTransferStart(transferId, peerCallback, nextPacketFn);
  });
};
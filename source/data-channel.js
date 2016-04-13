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
 * Stores the list of agents that do not support multi-transfers.
 * @attribute _FALLBACK_INTEROP_AGENTS
 * @type JSON
 * @private
 * @for Skylink
 * @since 0.6.x
 */
Skylink.prototype._FALLBACK_INTEROP_AGENTS = ['Android', 'iOS', 'cpp'];

/**
 * Creates a DataChannel that handles the RTCDataChannel object.
 * @method _createDataChannel
 * @param {String} peerId The Peer ID.
 * @param {RTCDataChannel} channel The RTCDataChannel object created or received in RTCPeerConnection.
 * @param {Boolean} [fallbackAsMain=false] The flag that indicates if RTCPeerConnection will only support one RTCDataChannel connection.
 * @return {SkylinkDataChannel} The DataChannel class object that handles
 *   the provided RTCDataChannel object.
 * @private
 * @for Skylink
 * @since 0.6.x
 */
Skylink.prototype._createDataChannel = function (peerId, channel, fallbackAsMain) {
  var superRef = this;

  /**
   * Singleton class object for the provided DataChannel object.
   * @class SkylinkDataChannel
   * @private
   * @for Skylink
   * @since 0.6.x
   */
  var SkylinkDataChannel = function () {
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
   * Note that DATA type of DataChannel gets closed the moment
   *   a data transfer session is completed or terminated.
   * @attribute type
   * @type String
   * @for SkylinkDataChannel
   * @since 0.6.x
   */
  SkylinkDataChannel.prototype.type = channel.label === 'main' || fallbackAsMain === true ?
    superRef.DATA_CHANNEL_TYPE.MESSAGING : superRef.DATA_CHANNEL_TYPE.DATA;

  /**
   * Stores the DataChannel current data transfer session.
   * There can only be 1 transfer for each DataChannel.
   * If value is <code>null</code>, it means that there is no data transfer session
   *   for the current DataChannel connection.
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
   * Note that this method stringifies the message object sent, so sending any
   *   Array object with keys will cause the Array keys to be lost.
   * @method message
   * @param {Any} message The message object.
   * @param {Boolean} isPrivate The flag that indicates if message is not "broadcasted" or not.
   * @param {Array} [listOfPeers] The list of Peers to relay message used for MCU environment only.
   * @for SkylinkDataChannel
   * @since 0.6.x
   */
  SkylinkDataChannel.prototype.message = function (message, isPrivate, listOfPeers) {
    var ref = this;
    var target = ref.peerId;

    // Prevent sending message "target" as Array if is not "MCU" and listOfPeers parameter provided is an Array
    if (ref.peerId === 'MCU' && Array.isArray(listOfPeers)) {
      target = listOfPeers;
    }

    // Send "MESSAGE" message to send message object to other Peer's end
    ref._messageSend(superRef._constructDTProtocolMESSAGE(message, isPrivate, target));
  };

  /**
   * Starts a data transfer session.
   * @method transferStart
   * @param {String} transferId The data transfer session ID.
   * @param {Function} responseCallback The callback function triggered when there
   *   is a response status on the data transfer session.
   *   The callback function signature is: (<code>error</code>).
   *   If <code>error</code> value returned is not <code>null</code>, it
   *   means that there has been an Error while trying to start a data transfer session.
   * @param {Function} nextPacketCallback The callback function triggered when it is
   *   requesting for the next data chunk to be sent to Peer.
   *   The callback function signature is: (<code>ackN</code>, <code>processCallback</code>).
   *   It should return <code>ackN</code> where the value is the index of the data chunks Array,
   *   and <code>processCallback</code> should be invoked with the data chunk based on the <code>ackN</code>
   *   index requested.
   * @param {Array} [listOfPeers] The list of Peers to relay starting of data transfer used for MCU environment only.
   * @for SkylinkDataChannel
   * @since 0.6.x
   */
  SkylinkDataChannel.prototype.transferStart = function (transferId, responseCallback, nextPacketCallback, listOfPeers) {
    var ref = this;

    /**
     * Function that handles the response for callback
     */
    var handleResponseFn = function (result) {
      log.debug([ref.peerId, 'DataChannel', ref.id, 'Data transfer request status ->'], result);

      responseCallback(result);
    };

    /**
     * Function that handles the Error object to response in the callback
     */
    var handleErrorFn = function (errorMessage) {
      log.warn([ref.peerId, 'DataChannel', ref.id, 'Dropping of data transfer request as ' +
        errorMessage + ' ->'], transferId);

      handleResponseFn(new Error('Failed data transfer as ' + errorMessage));
    };

    // Prevent starting another data transfer session when there is currently a data transfer session going on
    if (ref._transfer) {
      handleErrorFn('there is still a transfer session going on');
      return;
    }

    // Prevent starting data transfer session when upload session does not exists
    if (!superRef._uploadTransfers[transferId]) {
      handleErrorFn('transfer session does not exists');
      return;
    }

    // Prevent starting data transfer session if is "MCU" and listOfPeers parameter provided is not an Array
    if (ref.peerId === 'MCU' && !Array.isArray(listOfPeers)) {
      handleErrorFn('list of Peers provided is empty for MCU environment connection');
      return;
    }

    // Define the upload session information
    var uploadSession = superRef._uploadTransfers[transferId];

    // Define the current data transfer session
    ref._transfer = {
      // Data transfer session ID
      id: transferId,
      // Data transfer session Blob name
      dataName: uploadSession.dataName,
      // Data transfer session Blob size
      dataSize: uploadSession.dataSize,
      // Data transfer session Blob mimeType
      dataMimeType: uploadSession.dataMimeType,
      // Data transfer session transferred size. In this case, it's uploading completed size.
      dataTransferredSize: 0,
      // Data transfer session chunk size to be expected
      dataChunkSize: uploadSession.dataChunkSize,
      // Data transfer session type. Types are "blob" or "dataURL"
      type: uploadSession.type,
      // Data transfer session timeout
      timeout: uploadSession.timeout,
      // Data transfer session flag that indicates if transfer is not "broadcasted" or not.
      isPrivate: uploadSession.isPrivate,
      // Data transfer direction. In this case, it's "upload"
      direction: superRef.DATA_TRANSFER_TYPE.UPLOAD,
      // Data transfer session next packet callback function that triggers when requesting for next data chunk
      requestPacketFn: nextPacketCallback,
      // Data transfer list of Peers for MCU environment only relayed
      listOfPeers: listOfPeers
    };

    // Send the response earlier so callee function can subscribe to dataTransferState events for errors or success
    handleResponseFn(null);

    // Send "WRQ" message to start data transfer session on the other Peer's end
    ref._messageSend(superRef._constructDTProtocolWRQ(ref._transfer));

    // Reflect the current state as UPLOAD_REQUEST
    ref._transferSetState(superRef.DATA_TRANSFER_STATE.UPLOAD_REQUEST);
  };

  /**
   * Responses to a data transfer session by accepting or rejecting it.
   * @method transferStartRespond
   * @param {String} transferId The data transfer session ID.
   * @param {Function} responseCallback The callback function triggered when there
   *   is a response status on response to the data transfer session.
   *   The callback function signature is: (<code>error</code>).
   *   If <code>error</code> value returned is not <code>null</code>, it
   *   means that there has been an Error while trying to response to the data transfer session.
   * @param {Boolean} acceptTransfer The flag that indicates if Peer should continue with data transfer
   *   session or reject which terminates the session.
   * @for SkylinkDataChannel
   * @since 0.6.x
   */
  SkylinkDataChannel.prototype.transferStartRespond = function (transferId, responseCallback, acceptTransfer) {
    var ref = this;

    /**
     * Function that handles the response for callback
     */
    var handleResponseFn = function (result) {
      log.debug([ref.peerId, 'DataChannel', ref.id, 'Data transfer request response status ->'], result);

      responseCallback(result);
    };

    /**
     * Function that handles the Error object to response in the callback
     */
    var handleErrorFn = function (errorMessage) {
      log.warn([ref.peerId, 'DataChannel', ref.id, 'Dropping of responding of data transfer request as ' +
        errorMessage + ' ->'], [transferId, acceptTransfer]);

      handleResponseFn(new Error('Failed responding of data transfer as ' + errorMessage));
    };

    // Prevent responding to data transfer session if there is no transfer session at all
    if (!ref._transfer) {
      handleErrorFn('there is no transfer sessions currently');
      return;
    }

    // Prevent responding to data transfer session if the current data transfer session does not match
    //   provided data transfer session ID in parameter
    if (ref._transfer.id !== transferId) {
      handleErrorFn('transfer session ID does not match existing one');
      return;
    }

    // Prevent responding to data transfer session if it has already been accepted to prevent
    //   breaking of sequence steps
    if (ref._transfer.accepted) {
      handleErrorFn('as transfer has already been accepted');
      return;
    }

    // Handle the use-case when data transfer session is accepted
    if (acceptTransfer) {
      ref._transfer.accepted = true;

      // Send "ACK" message to start data transfer session to start sending the first data chunk from Peer's end
      //  0 = first index of data chunk Array
      ref._messageSend(superRef._constructDTProtocolACK(0));

      // Reflect the current state as DOWNLOAD_STARTED since it has been accepted
      ref._transferSetState(superRef.DATA_TRANSFER_STATE.DOWNLOAD_STARTED);

    } else {
      // Send "ACK" message to start data transfer session to terminate data transfer session request from Peer's end
      ref._messageSend(superRef._constructDTProtocolACK(-1));

      // Reflect the current state as REJECTED since it has been rejected
      ref._transferSetState(superRef.DATA_TRANSFER_STATE.REJECTED);
    }

    // Response to callee function
    handleResponseFn(null);
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

    // Prevent closing RTCDataChannel if object is already "closed"
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
   * Sets the data transfer session state.
   * @method _transferSetState
   * @param {String} state The current data transfer state.
   * @param {Error} [error] The Error exception object received in terminated states.
   * @param {Boolean} [isErrorReceived=false] The flag that indicates if Error message is received from Peer.
   * @for SkylinkDataChannel
   * @since 0.6.x
   */
  SkylinkDataChannel.prototype._transferSetState = function (state, error, isErrorReceived) {
    var ref = this;

    // Prevent triggering of event states if data transfer session is empty
    if (!ref._transfer) {
      log.warn([ref.peerId, 'DataChannel', ref.id, 'Dropping of setting data transfer session state ' +
        'as there is currently no session at all ->'], [state, error]);
      return;
    }

    // Prevent triggering of event states if upload session is empty.
    //   This should not happen since upload transfers should be cleared after all the DataChannel transfer
    //   sessions has been triggered
    if (!superRef._uploadTransfers[ref._transfer.id] &&
      ref._transfer.direction === superRef.DATA_TRANSFER_TYPE.UPLOAD) {

      log.warn([ref.peerId, 'DataChannel', ref.id, 'Dropping of setting data transfer session state ' +
        'as there is no uploading session at all ->'], [ref._transfer.id, state, error]);
      /* NOTE: Should we clear the data transfer session here? */
      return;
    }

    // Store the upload session. This may not be defined for download sessions.
    var uploadSession = superRef._uploadTransfers[ref._transfer.id],
        newState = null,
        listOfPeersToTrigger = [ref.peerId];

    /**
     * Function that computes the Blob
     */
    var transferComputeBlobFn = function (dataChunks) {
      if (ref._transfer.type === 'blob') {
        /* TODO: Fixes for IE <10 support for Blob polyfill */
        // Return "blob" type of data transfers
        return new Blob(dataChunks, {
          type: ref._transfer.dataMimeType
        });
        /* TODO: Polyfill for downloading Blob in various browsers as file */
      }

      // Return "dataURL" type of data transfers
      return dataChunks.join('');
    };

    /**
     * Function that points to the correct data reference if matches states
     */
    var transferPointToBlobFn = function (isIncomingDataEvent) {
      // Check if transfer states is "COMPLETED" states
      // Configure the datachunks according to state
      if (newState === superRef.DATA_TRANSFER_STATE.DOWNLOAD_COMPLETED) {
        return transferComputeBlobFn(ref._transfer.dataChunks);

      } else if (newState === superRef.DATA_TRANSFER_STATE.UPLOAD_STARTED) {
        return transferComputeBlobFn(uploadSession.dataChunks);

      } else if (isIncomingDataEvent && newState === superRef.DATA_TRANSFER_STATE.UPLOAD_COMPLETED) {
        return transferComputeBlobFn(uploadSession.dataChunks);
      }

      return null;
    };

    /**
     * Function that returns the transferInfo payload based on state or event type.
     */
    var transferInfoPayloadFn = function (isIncomingDataEvent) {
      var transferInfo = {
        name: ref._transfer.dataName,
        /* NOTE: This seems to add 1 byte to the original file size */
        size: Math.ceil((ref._transfer.dataSize / 4) * 3),
        percentage: ((ref._transfer.dataTransferredSize / ref._transfer.dataSize) * 100).toFixed(2),
        dataType: ref._transfer.type,
        senderPeerId: ref._transfer.direction === superRef.DATA_TRANSFER_TYPE.DOWNLOAD ?
          ref.peerId : superRef._user.sid,
        timeout: ref._transfer.timeout,
        isPrivate: ref._transfer.isPrivate === true,
        transferType: ref._transfer.direction
      };

      if (!isIncomingDataEvent) {
        transferInfo.data = transferPointToBlobFn(false);
      }

      return transferInfo;
    };

    /**
     * Function that returns the transferError payload based on state or event type.
     */
    var transferErrorPayloadFn = function () {
      if (error) {
        log.error([ref.peerId, 'DataChannel', ref.id, 'Failed data transfer session ->'],
          [ref._transfer.id, error]);

        return {
          message: error,
          transferType: ref._transfer.direction
        };
      }

      return null;
    };

    // Configure to trigger for the list of Peers for MCU environment only
    if (Array.isArray(ref._transfer.listOfPeers)) {
      listOfPeersToTrigger = ref._transfer.listOfPeers;
    }

    // Configure state as completed if matches the number
    if (ref._transfer.dataTransferredSize === ref._transfer.dataSize) {
      if (ref._transfer.direction === superRef.DATA_TRANSFER_TYPE.DOWNLOAD) {
        newState = superRef.DATA_TRANSFER_STATE.DOWNLOAD_COMPLETED;

      } else {
        newState = superRef.DATA_TRANSFER_STATE.UPLOAD_COMPLETED;
      }
    }

    // Fallback to use current state if there's no overrides of state
    if (!newState) {
      newState = state;
    }

    // Prevent triggering of UPLOAD_REQUEST state for uploader
    //   Trigger "dataTransferState" event
    if (!(newState === superRef.DATA_TRANSFER_STATE.UPLOAD_REQUEST &&
      ref._transfer.direction === superRef.DATA_TRANSFER_TYPE.UPLOAD)) {

      listOfPeersToTrigger.forEach(function (peerId) {
        superRef._trigger('dataTransferState', newState, ref._transfer.id, peerId,
          transferInfoPayloadFn(false), transferErrorPayloadFn());
      });
    }

    // Trigger "incomingDataRequest" event
    if (newState === superRef.DATA_TRANSFER_STATE.UPLOAD_REQUEST) {
      listOfPeersToTrigger.forEach(function (peerId) {
        superRef._trigger('incomingDataRequest', ref._transfer.id, peerId, transferInfoPayloadFn(true),
          ref._transfer.direction === superRef.DATA_TRANSFER_TYPE.UPLOAD);
      });
    }

    // Trigger "incomingData" event
    if ([superRef.DATA_TRANSFER_STATE.DOWNLOAD_COMPLETED,
      superRef.DATA_TRANSFER_STATE.UPLOAD_COMPLETED].indexOf(newState) > -1) {

      listOfPeersToTrigger.forEach(function (peerId) {
        superRef._trigger('incomingData', transferPointToBlobFn(true), ref._transfer.id, peerId,
          transferInfoPayloadFn(true), ref._transfer.direction === superRef.DATA_TRANSFER_TYPE.UPLOAD);
      });
    }

    // Clear the transfer session once it's terminated or completed
    if ([superRef.DATA_TRANSFER_STATE.ERROR,
      superRef.DATA_TRANSFER_STATE.REJECTED,
      superRef.DATA_TRANSFER_STATE.CANCEL,
      superRef.DATA_TRANSFER_STATE.UPLOAD_COMPLETED,
      superRef.DATA_TRANSFER_STATE.DOWNLOAD_COMPLETED].indexOf(newState) > -1) {

      log.debug([ref.peerId, 'DataChannel', ref.id, 'Setting data transfer session state as completed ->'],
        ref._transfer.id);

      if (ref._transfer.checker) {
        log.warn([ref.peerId, 'DataChannel', ref.id, 'Clearing transfer session timeout as transfer session has ended']);

        clearTimeout(ref._transfer.checker);
      }

      // Send ERROR message
      if (newState === superRef.DATA_TRANSFER_STATE.ERROR && !isErrorReceived) {
        log.debug([ref.peerId, 'DataChannel', ref.id, 'Reporting error message to Peer']);

        ref._messageSend(superRef._constructDTProtocolERROR(ref._transfer, error));
      }

      // Clear the data transfer session
      ref._transfer = null;

      // Close the RTCDataChannel connection if it's for transfers once it's completed
      if (ref.type === superRef.DATA_CHANNEL_TYPE.DATA) {
        log.warn([ref.peerId, 'DataChannel', ref.id, 'Closing connection as data transfer session has ended']);

        ref.disconnect();
      }
    }
  };

  /**
   * Sends data over the RTCDataChannel connection.
   * @method _messageSend
   * @param {JSON} message The message object data.
   * @private
   * @for SkylinkDataChannel
   * @since 0.6.x
   */
  SkylinkDataChannel.prototype._messageSend = function (message) {
    var ref = this;
    var dataString = null;

    // Stringify if message is a JSON object
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
      if (typeof message === 'object' && [superRef._DC_PROTOCOL_TYPE.MESSAGE, superRef._DC_PROTOCOL_TYPE.ERROR].indexOf(message.type) > -1) {
        ref._transferSetState(superRef.DATA_TRANSFER_STATE.ERROR,
          new Error('Failed data transfer as datachannel readyState is not "open"'), false);
      }
      return;
    }

    log.debug([ref.peerId, 'DataChannel', ref.id, 'Sending data ->'], dataString);

    /**
     * Sends message with .send()
     */
    ref._RTCDataChannel.send(dataString);

    // Start setting timeouts
    if (!(typeof message === 'object' && [superRef._DC_PROTOCOL_TYPE.MESSAGE, superRef._DC_PROTOCOL_TYPE.WRQ].indexOf(message.type) > -1)) {
      ref._monitorTransferStatus();
    }
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

    // Trigger "incomingMessage" event that message has been received
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
      log.warn([ref.peerId, 'DataChannel', ref.id, 'Dropping of data transfer (WRQ) stage as ' +
        'there is an existing transfer session already ->'], message);
      return;
    }

    // Define the current data transfer session
    ref._transfer = {
      // Data transfer session ID
      /* TODO: Handle the case where transfer ID is missing for other SDKs */
      id: message.transferId,
      // Data transfer session Blob name
      dataName: message.name,
      // Data transfer session Blob size
      dataSize: message.size,
      // Data transfer session Blob mimeType
      dataMimeType: message.mimeType,
      // Data transfer session transferred size. In this case, it's uploading completed size.
      dataTransferredSize: 0,
      // Data transfer session chunk size to be expected
      dataChunkSize: message.chunkSize,
      // Data transfer session type. Types are "blob" or "dataURL"
      /* TODO: Handle the case where dataType is not provided for other SDKs */
      type: message.dataType || null,
      // Data transfer session timeout
      timeout: message.timeout,
      // Data transfer session flag that indicates if transfer is not "broadcasted" or not.
      isPrivate: message.isPrivate === true,
      // Data transfer direction. In this case, it's "download"
      direction: superRef.DATA_TRANSFER_TYPE.DOWNLOAD,
      // Data transfer session that indicates if data transfer session has been accepted or not
      accepted: false,
      // Data transfer session data chunks received stored in Array
      dataChunks: [],
      // Data transfer session data chunk index to request next
      dataACKIndex: 0
    };

    // Polyfill data transfer session ID if missing for other SDKs
    if (typeof ref._transfer.id !== 'string') {
      ref._transfer.id = (new Date()).getTime().toString();
    }

    // Polyfill data transfer session Blob name if missing. Fallback to transfer ID
    if (typeof ref._transfer.name !== 'string') {
      ref._transfer.name = ref._transfer.id;
    }

    // Configure to never let timeouts be less than 1
    if (!(typeof ref._transfer.timeout === 'number' && ref._transfer.timeout > 0)) {
      log.warn([ref.peerId, 'DataChannel', ref.id, 'Setting transfer timeout to default of 60s ' +
        'as provided timeout is invalid ->'], ref._transfer.timeout);

      ref._transfer.timeout = 60;
    }

    // Fallback for other SDK agents
    if (typeof ref._transfer.type !== 'string') {
      log.warn([ref.peerId, 'DataChannel', ref.id, 'Setting transfer type to "blob" as fallback']);

      ref._transfer.type = 'blob';
    }

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
      log.warn([ref.peerId, 'DataChannel', ref.id, 'Dropping of data transfer (ACK) stage as ' +
        'there is no existing transfer session ->'], message);
      return;
    }

    // Prevent processing request since it's at an incorrect stage.
    if (ref._transfer.direction !== superRef.DATA_TRANSFER_TYPE.UPLOAD) {
      log.warn([ref.peerId, 'DataChannel', ref.id, 'Dropping of data transfer (ACK) stage as ' +
        'it is at an incorrect stage ->'], message);
      return;
    }

    // Prevent processing request if requestPacketFn is not a function. Sanity check.
    if (typeof ref._transfer.requestPacketFn !== 'function') {
      log.warn([ref.peerId, 'DataChannel', ref.id, 'Dropping of data transfer (ACK) stage as ' +
        'next packet callback is not a function ->'], message);
      return;
    }

    // Prevent processing request if ackN is not a number. Sanity check.
    if (!(typeof message.ackN === 'number' && message.ackN > -2)) {
      log.warn([ref.peerId, 'DataChannel', ref.id, 'Dropping of data transfer (ACK) stage as ' +
        'acknowledgement number provided is incorrect ->'], message);
      return;
    }

    // Processing reject acknowledgement
    if (message.ackN < 0) {
      ref._transferSetState(superRef.DATA_TRANSFER_STATE.REJECTED,
        new Error('Failed data transfer as Peer has rejected request'));
      return;

    }

    // Processing accept acknowledgement. Send the first packet
    if (message.ackN === 0) {
      ref._transferSetState(superRef.DATA_TRANSFER_STATE.UPLOAD_STARTED);
    }

    // Start request for the packet based off the acknowledgement index
    ref._transfer.requestPacketFn(message.ackN, function (data) {
      var packetSize = 0;

      // Prevent continuation of data transfer session if invalid data chunk is received
      if (!data) {
        ref._transferSetState(superRef.DATA_TRANSFER_STATE.ERROR,
          new Error('Failed data transfer as invalid data packet is received'), false);
        return;
      }

      // Configure the correct data chunk size
      if (typeof data.size === 'number') {
        packetSize = data.size;

      } else if (typeof data.length === 'number') {
        packetSize = data.length;
      }

      // Increment the data chunk size to received size
      ref._transfer.dataTransferredSize += Math.ceil(packetSize / 3) * 4;

      // Configure to send the data chunk directly if data chunk is a string
      if (typeof data === 'string') {
        // Upload "DATA" data chunk for "dataURL" transfer type chunk
        ref._messageSend(data);
        // Reflect as UPLOADING state
        ref._transferSetState(superRef.DATA_TRANSFER_STATE.UPLOADING);

      } else {
        // Configure to send the data chunk later after conversion
        superRef._DataPacker.blobToBase64(data, function (dataBase64ConvertedString) {
          // Upload "DATA" data chunk for "blob" transfer type chunk
        ref._messageSend(dataBase64ConvertedString);
          // Reflect as UPLOADING state
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
      log.warn([ref.peerId, 'DataChannel', ref.id, 'Dropping of data transfer (DATA) stage as ' +
        'there is no existing transfer session ->'], dataString);
      return;
    }

    var packetData = null,
        packetDataSize = 0;

    // Convert to Blob data chunk if transfer type is "blob"
    if (ref._transfer.type === 'blob') {
      packetData = superRef._DataPacker.base64ToBlob(dataString);

    } else {
      packetData = dataString;
    }

    // Configure the packet size
    if (typeof packetData.size === 'number') {
      packetDataSize = packetData.size;

    } else if (typeof packetData.length === 'number') {
      packetDataSize = packetData.length;

    } else {
      ref._transferSetState(superRef.DATA_TRANSFER_STATE.ERROR,
        new Error('Failed downloading transfer as packet received size is incorrect'), false);
      return;
    }

    ref._transfer.dataChunks[ref._transfer.dataACKIndex] = packetData;
    ref._transfer.dataTransferredSize += Math.ceil(packetDataSize / 3) * 4;
    ref._transfer.dataACKIndex += 1;

    // Send "ACK" message for continuous transfers
    ref._messageSend(superRef._constructDTProtocolACK(ref._transfer.dataACKIndex));

    // Reflect DOWNLOADING state
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
   * Handles the "ERROR" protocol.
   * @method _messageReactToERRORProtocol
   * @param {JSON} message The message object data.
   * @private
   * @for SkylinkDataChannel
   * @since 0.6.x
   */
  SkylinkDataChannel.prototype._messageReactToERRORProtocol = function (message) {
    var ref = this;

    // Prevent processing request if there is no request going on
    if (!ref._transfer) {
      log.warn([ref.peerId, 'DataChannel', ref.id, 'Dropping of data transfer (ERROR) stage as ' +
        'there is no existing transfer session ->'], message);
      return;
    }

    ref._transferSetState(superRef.DATA_TRANSFER_STATE.ERROR, new Error(message.content || 'Unknown Error'), true);
  };

  /**
   * Handles the "CANCEL" protocol.
   * @method _messageReactToCANCELProtocol
   * @param {JSON} message The message object data.
   * @private
   * @for SkylinkDataChannel
   * @since 0.6.x
   */
  SkylinkDataChannel.prototype._messageReactToCANCELProtocol = function (message) {
    var ref = this;

    // Prevent processing request if there is no request going on
    if (!ref._transfer) {
      log.warn([ref.peerId, 'DataChannel', ref.id, 'Dropping of data transfer (CANCEL) stage as ' +
        'there is no existing transfer session ->'], message);
      return;
    }

    ref._transferSetState(superRef.DATA_TRANSFER_STATE.CANCEL, new Error(message.content));
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

      ref._transferSetState(superRef.DATA_TRANSFER_STATE.ERROR,
        new Error('Failed data transfer as datachannel readyState is "closed"'), false);
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

      ref._transferSetState(superRef.DATA_TRANSFER_STATE.ERROR,
        new Error('Failed data transfer datachannel connection encountered errors'), false);
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

      // Logic here is to parse the JSON string. If it fails, it's likely a data chunk (converted string)
      try {
        var message = JSON.parse(data);

        switch (message.type) {
          case superRef._DC_PROTOCOL_TYPE.MESSAGE:
            ref._messageReactToMESSAGEProtocol(message);
            break;

          case superRef._DC_PROTOCOL_TYPE.WRQ:
            if (ref._transfer && ref._transfer.checker) {
              log.debug([ref.peerId, 'DataChannel', ref.id, 'Clearing timeout']);
              clearTimeout(ref._transfer.checker);
            }
            ref._messageReactToWRQProtocol(message);
            break;

          case superRef._DC_PROTOCOL_TYPE.ACK:
            if (ref._transfer && ref._transfer.checker) {
              log.debug([ref.peerId, 'DataChannel', ref.id, 'Clearing timeout']);
              clearTimeout(ref._transfer.checker);
            }
            ref._messageReactToACKProtocol(message);
            break;

          case superRef._DC_PROTOCOL_TYPE.ERROR:
            if (ref._transfer && ref._transfer.checker) {
              log.debug([ref.peerId, 'DataChannel', ref.id, 'Clearing timeout']);
              clearTimeout(ref._transfer.checker);
            }
            ref._messageReactToERRORProtocol(message);
            break;

          case superRef._DC_PROTOCOL_TYPE.CANCEL:
            if (ref._transfer && ref._transfer.checker) {
              log.debug([ref.peerId, 'DataChannel', ref.id, 'Clearing timeout']);
              clearTimeout(ref._transfer.checker);
            }
            ref._messageReactToCANCELProtocol(message);
            break;

          default:
            log.warn([ref.peerId, 'DataChannel', ref.id, 'Dropping of unknown protocol received ->'], message);
        }

      } catch (error) {
        // Prevent triggering of failed parsing JSON error as DATA protocol
        if (data.indexOf('{') > -1) {
          log.error([ref.peerId, 'DataChannel', ref.id, 'Failed parsing message object received ->'], error);
        } else {
          if (ref._transfer && ref._transfer.checker) {
            log.debug([ref.peerId, 'DataChannel', ref.id, 'Clearing timeout']);
            clearTimeout(ref._transfer.checker);
          }
          ref._messageReactToDATAProtocol(data);
        }
      }
    };
  };

  /**
   * Starts the transfer timer
   * @method _monitorTransferStatus
   * @private
   * @for SkylinkDataChannel
   * @since 0.6.x
   */
  SkylinkDataChannel.prototype._monitorTransferStatus = function () {
    var ref = this;

    if (!ref._transfer) {
      log.warn([ref.peerId, 'DataChannel', ref.id, 'Dropping of monitoring transfer status as ' +
        'there is no transfer status present']);
      return;
    }

    log.debug([ref.peerId, 'DataChannel', ref.id, 'Monitoring transfer response']);

    ref._transfer.checker = setTimeout(function () {
      ref._transferSetState(superRef.DATA_TRANSFER_STATE.ERROR,
        new Error('Failed transfer response timeout has expired'), false);
    }, ref._transfer.timeout * 1000);
  };

  return new SkylinkDataChannel();
};

/**
 * Starts a transfer to Peers.
 * In the MCU environment, the transfers will be targeted.
 * @method _createTransfer
 * @param {String|Blob} data The data object.
 * @param {Number} timeout The transfer timeout in seconds.
 * @param {Boolean} isPrivate The flag that indicates if data transfer is not "broadcasted" or not.
 * @param {Array} listOfPeers The list of Peers to start transfer with.
 * @param {Function} responseCallback The callback function triggered when there
 *   is a response status on the data transfer session.
 *   The callback function signature is: (<code>error</code>).
 *   If <code>error</code> value returned is not <code>null</code>,
 *   it means that there has been Errors while trying to start a data transfer session.
 * @private
 * @for Skylink
 * @since 0.6.x
 */
Skylink.prototype._createTransfer = function (data, timeout, isPrivate, listOfPeers, responseCallback) {
  var superRef = this;
  // Define the current data transfer session
  var newUploadTransfer = {
    /* NOTE: Perhaps is this actually really unique? */
    // Data transfer session ID
    id: (new Date ()).getTime().toString() + '-web',
    // Data transfer session Blob name
    dataName: null,
    // Data transfer session Blob size
    dataSize: 0,
    // Data transfer session Blob mimeType
    dataMimeType: '',
    // Data transfer session chunk size to be expected
    dataChunkSize: 0,
    // Data transfer session data chunks received stored in Array
    dataChunks: [],
    // Data transfer session type. Types are "blob" or "dataURL"
    type: null,
    // Data transfer session timeout
    timeout: timeout,
    // Data transfer session flag that indicates if transfer is not "broadcasted" or not.
    isPrivate: isPrivate
  };
  // The Array of Peers that has been completed
  var hasCompleted = false,
      listOfPeersCompleted = [],
      listOfPeersErrors = {};

  /**
   * Function that handles response callback
   */
  var handleResponseFn = function (peerId, result) {
    log.debug([peerId, 'Skylink', newUploadTransfer.id, 'Starting data transfer session result ->'], result);

    if (listOfPeersCompleted.indexOf(peerId) === -1) {
      listOfPeersCompleted.push(peerId);

      if (result) {
        listOfPeersErrors[peerId] = result;
      }
    }

    if (!hasCompleted) {
      if (listOfPeersCompleted.length === listOfPeers.length) {
        hasCompleted = true;

        // Respond callback with Errors
        if (Object.keys(listOfPeersErrors).length > 0) {
          responseCallback(listOfPeersErrors);

        // Respond callback with success
        } else {
          responseCallback(null);
        }

        log.debug([null, 'Skylink', newUploadTransfer.id, 'Clearing upload data transfer session as all Peers ' +
          'has been responded with']);

        delete superRef._uploadTransfers[newUploadTransfer.id];
      }
    }
  };

  /**
   * Function that handles error parsing to serve in response callback
   */
  var handleErrorFn = function (peerId, errorMessage) {
    log.error([peerId, 'Skylink', newUploadTransfer.id, 'Failed starting data transfer session as ' + errorMessage]);

    handleResponseFn(peerId, new Error('Failed starting data transfer session as ' + errorMessage));
  };

  // Filter out Peers that does not exists
  var filteredListOfPeers = listOfPeers.slice();

  for (var i = 0; i < filteredListOfPeers.length; i++) {
    var peerId = filteredListOfPeers[i];

    // Prevent sending to a Peer that does not exists
    if (!superRef._peers[peerId]) {
      handleErrorFn(peerId, 'Peer session does not exists');
      filteredListOfPeers.splice(i, 1);
      i--;
    }
  }

  // Parse the Blob object data and information for chunks
  if (typeof data === 'object') {
    newUploadTransfer.dataName = data.name;
    newUploadTransfer.dataSize = Math.ceil(data.size / 3) * 4; //Math.ceil(data.size * 4/3);
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

    } else if (typeof data.size === 'number') {
      newUploadTransfer.dataSize = data.size;

    // Prevent parsing of invalid data size. Sanity check.
    } else {
      filteredListOfPeers.forEach(function (peerId) {
        handleErrorFn(peerId, 'provided data size is invalid');
      });
      return;
    }

    newUploadTransfer.dataChunkSize = 1212;
    newUploadTransfer.dataChunks = superRef._DataPacker.chunkDataURI(data, 1212);
    newUploadTransfer.dataMimeType = '';
    newUploadTransfer.type = 'dataURL';
  }

  // Polyfill the data name if it does not exists
  if (typeof newUploadTransfer.dataName !== 'string' || !newUploadTransfer.dataName) {
    newUploadTransfer.dataName = newUploadTransfer.id + '-transfer';
  }

  /**
   * Function that handles returning the next packet.
   */
  var nextPacketFn = function (ackN, processCallback) {
    processCallback(newUploadTransfer.dataChunks[ackN]);
  };

  /**
   * Function that subscribes to "dataTransferState" to reflect data transfer session status
   */
  var handleTransferSessionStatusFn = function (peerId) {
    /* NOTE: To check how the MCU response when a Peer rejects response */
    superRef.once('dataTransferState', function (state, transferId, evtPeerId, transferInfo, transferError) {
      if (transferError) {
        handleErrorFn(peerId, transferError.message.message || transferError.message);
        return;
      }
      handleResponseFn(peerId, null);

    }, function (state, transferId, evtPeerId) {
      return [superRef.DATA_TRANSFER_STATE.ERROR,
        superRef.DATA_TRANSFER_STATE.DOWNLOAD_COMPLETED,
        superRef.DATA_TRANSFER_STATE.UPLOAD_COMPLETED,
        superRef.DATA_TRANSFER_STATE.CANCEL,
        superRef.DATA_TRANSFER_STATE.REJECTED].indexOf(state) > -1 && evtPeerId === peerId;
    });
  };

  // Store the upload session
  superRef._uploadTransfers[newUploadTransfer.id] = newUploadTransfer;

  // Check if Peer is in MCU environment, which we have to use MCU to relay files
  if (superRef._hasMCU) {
    if (!superRef._peers.MCU) {
      filteredListOfPeers.forEach(function (peerId) {
        handleErrorFn(peerId, 'MCU connection is not ready');
      });
      return;
    }

    superRef._peers.MCU.channelTransferStart(newUploadTransfer.id, function (error) {
      if (error) {
        filteredListOfPeers.forEach(function (peerId) {
          handleResponseFn(peerId, error);
        });
        return;
      }

      filteredListOfPeers.forEach(function (peerId) {
        handleTransferSessionStatusFn(peerId);
      });

    }, nextPacketFn, filteredListOfPeers);

  // Send files with P2P channel
  } else {
    // Transfer files using P2P connections
    filteredListOfPeers.forEach(function (peerId) {
      superRef._peers[peerId].channelTransferStart(newUploadTransfer.id, function (error) {
        if (error) {
          handleErrorFn(peerId, error.message || error);
          return;
        }

        handleTransferSessionStatusFn(peerId);
      }, nextPacketFn);
    });
  }
};

/**
 * Constructs DTProtocol "WRQ" message.
 * @method _constructDTProtocolWRQ
 * @param {JSON} transfer The transfer information object.
 * @return {JSON} The WRQ message signature object.
 * @private
 * @for Skylink
 * @since 0.6.x
 */
Skylink.prototype._constructDTProtocolWRQ = function (transfer) {
  var superRef = this;

  return JSON.stringify({
    type: 'WRQ',
    transferId: transfer.id,
    agent: window.webrtcDetectedBrowser, // Deprecated
    version: window.webrtcDetectedVersion, // Deprecated
    name: transfer.dataName,
    mimeType: transfer.dataMimeType,
    dataType: transfer.type,
    size: transfer.dataSize,
    chunkSize: transfer.dataChunkSize,
    timeout: transfer.timeout,
    isPrivate: transfer.isPrivate,
    target: (Array.isArray(transfer.listOfPeers)) ? transfer.listOfPeers : null,
    sender: superRef._user.sid
  });
};

/**
 * Constructs DTProtocol "ACK" message.
 * @method _constructDTProtocolACK
 * @param {Number} packetIndex The packet request index.
 * @return {JSON} The ACK message signature object.
 * @private
 * @for Skylink
 * @since 0.6.x
 */
Skylink.prototype._constructDTProtocolACK = function (packetIndex) {
  var superRef = this;

  return JSON.stringify({
    type: 'ACK',
    sender: superRef._user.sid,
    ackN: packetIndex
  });
};

/**
 * Constructs DTProtocol "CANCEL" message.
 * @method _constructDTProtocolCANCEL
 * @param {JSON} transfer The transfer information object.
 * @return {JSON} The CANCEL message signature object.
 * @private
 * @for Skylink
 * @since 0.6.x
 */
Skylink.prototype._constructDTProtocolCANCEL = function (transfer) {
  var superRef = this;

  return JSON.stringify({
    type: 'CANCEL',
    name: transfer.dataName,
    content: 'Peer has terminated transfer'
  });
};

/**
 * Constructs DTProtocol "ERROR" message.
 * @method _constructDTProtocolERROR
 * @param {JSON} transfer The transfer information object.
 * @param {Error} error The error object.
 * @return {JSON} The ERROR message signature object.
 * @private
 * @for Skylink
 * @since 0.6.x
 */
Skylink.prototype._constructDTProtocolERROR = function (transfer, error) {
  var superRef = this;

  return JSON.stringify({
    type: 'ERROR',
    name: transfer.dataName,
    content: (error.message || error).toString(),
    isUploadError: transfer.direction === superRef.DATA_TRANSFER_TYPE.UPLOAD,
    sender: superRef._user.sid
  });
};

/**
 * Constructs DTProtocol "MESSAGE" message.
 * @method _constructDTProtocolMESSAGE
 * @param {JSON} transfer The transfer information object.
 * @param {Error} error The error object.
 * @return {JSON} The MESSAGE message signature object.
 * @private
 * @for Skylink
 * @since 0.6.x
 */
Skylink.prototype._constructDTProtocolMESSAGE = function (message, isPrivate, target) {
  var superRef = this;

  return JSON.stringify({
    type: 'MESSAGE',
    target: target,
    isPrivate: isPrivate,
    data: message,
    sender: superRef._user.sid
  });
};
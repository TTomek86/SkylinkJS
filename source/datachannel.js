/**
 * Creates a DataChannel that handles the RTCDataChannel object.
 * @method _createDataChannel
 * @param {String} peerId The Peer ID.
 * @param {String} IDDelimiter The DataChannel delimiter that determines the type of DataChannel.
 * @param {JSON} channel The Peer connection RTCDataChannel object.
 * @return {SkylinkDataChannel} The DataChannel class object that handles
 *   the provided RTCDataChannel object.
 * @private
 * @for Skylink
 * @since 0.6.x
 */
Skylink.prototype._createDataChannel = function (peerId, IDDelimiter, channel) {
  var superRef = this;

  /**
   * Singleton class object for the provided DataChannel object.
   * @class SkylinkDataChannel
   * @private
   * @for Skylink
   * @since 0.6.x
   */
  var SkylinkDataChannel = function () {
    if (!channel.label.split(IDDelimiter)[1]) {
      this.type = superRef.DATA_CHANNEL_TYPE.MESSAGING;
    }

    this._construct();
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
  SkylinkDataChannel.prototype.type = superRef.DATA_CHANNEL_TYPE.DATA;

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
   * @method sendMessage
   * @param {Any} message The message object. Note that this object will be stringified.
   * @for SkylinkDataChannel
   * @since 0.6.x
   */
  SkylinkDataChannel.prototype.sendMessage = function (message, isPrivate) {
    var ref = this;

    ref._send({
      type: superRef._DC_PROTOCOL_TYPE.MESSAGE,
      isPrivate: isPrivate === true,
      sender: superRef._user.sid,
      target: ref.peerId,
      data: message
    });
  };

  /**
   * Disconnects the DataChannel.
   * @method disconnect
   * @for SkylinkDataChannel
   * @since 0.6.x
   */
  SkylinkDataChannel.prototype.disconnect = function () {
    var ref = this;

    /* NOTE: Should we clear all the transfers? Since it's dead */
  };

  /**
   * Handles the RTCDataChannel object.
   * @method _construct
   * @private
   * @for SkylinkDataChannel
   * @since 0.6.x
   */
  SkylinkDataChannel.prototype._construct = function () {
    var ref = this;

    // Handles the .onopen event.
    ref._handleOnOpenEvent();

    // Handles the .onclose event.
    ref._handleOnCloseEvent();

    // Handles the .onerror event.
    ref._handleOnErrorEvent();

    // Handles the .onbufferamountlow event.
    ref._handleOnBufferAmountLowEvent();

    // Handles the .onmessage event.
    ref._handleOnMessageEvent();

    log.log([ref.peerId, 'DataChannel', ref.id, 'Connection has started']);
  };

  /**
   * Sends data over the RTCDataChannel object.
   * @method _send
   * @param {Any} message The message object data to be sent over.
   * @param {Boolean} [sendAsBinary=false] The flag that indicates if the data
   *   should be stringified before sending the object data over.
   * @private
   * @for SkylinkDataChannel
   * @since 0.6.x
   */
  SkylinkDataChannel.prototype._send = function (message, sendAsBinary) {
    var ref = this;

    if (ref._RTCDataChannel.readyState !== 'open') {
      log.warn([ref.peerId, 'RTCDataChannel', ref.id,
        'Dropping of sending data as connection state is not "open" ->'], {
        state: ref._RTCDataChannel.readyState,
        data: message
      });
      return;
    }

    var dataString = null;

    if (!(sendAsBinary && typeof message === 'object')) {
      dataString = JSON.stringify(message);

    } else {
      dataString = message;
    }

    log.debug([ref.peerId, 'DataChannel', ref.id, 'Sending data ->'], dataString);

    ref._RTCDataChannel.send(dataString);
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

    /* TODO: Datatransfers handling */
    ref._RTCDataChannel.onmessage = function (evt) {
      var rawData = evt.message || evt.data || evt,
          data = null;

      log.log([ref.peerId, 'DataChannel', ref.id, 'Received data ->'], rawData);

      /* TODO: Handle receiving Binary ? Like ArrayBuffer? Perhaps check typeof constructor.name */
      /* TODO: Move to a proper handler */
      try {
        data = JSON.parse(rawData);

        switch (data.type) {
          case superRef._DC_PROTOCOL_TYPE.MESSAGE:
            // Reflect received message
            superRef._trigger('incomingMessage', {

              content: data.data,
              isPrivate: data.isPrivate,
              isDataChannel: true,
              targetPeerId: superRef._user.sid,
              senderPeerId: ref.peerId

            }, ref.peerId, superRef.getPeerInfo(ref.peerId), false);
            break;
        }

      } catch (error) {
        data = rawData;
      }
    };
  };

  return new SkylinkDataChannel();
};
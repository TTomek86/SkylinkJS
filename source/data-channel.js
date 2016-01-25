var SkylinkDataPacker = {

  CHUNK_BLOB_SIZE: 49152,

  CHUNK_BASE64_SIZE: 1212,

  FIREFOX_CHUNK_BLOB_SIZE: 12288,

  processBlobToBase64: function (blob, callback) {
    var fileReader = new FileReader();
    fileReader.onload = function() {
      // Load Blob as dataurl base64 string
      var base64BinaryString = fileReader.result.split(',')[1];
      callback(base64BinaryString);
    };
    fileReader.readAsDataURL(data);
  },

  processBase64ToBlob: function (base64) {
    var byteString = atob(base64.replace(/\s\r\n/g, ''));
    // write the bytes of the string to an ArrayBuffer
    var ab = new ArrayBuffer(byteString.length);
    var ia = new Uint8Array(ab);
    for (var j = 0; j < byteString.length; j++) {
      ia[j] = byteString.charCodeAt(j);
    }
    // write the ArrayBuffer to a blob, and you're done
    return new Blob([ab]);
  },

  chunk: function (blob, chunkSize) {
    var chunksArray = [];
    var startCount = 0;
    var endCount = 0;
    var blobByteSize = blob.size;

    if (blobByteSize > chunkSize) {
      // File Size greater than Chunk size
      while ((blobByteSize - 1) > endCount) {
        endCount = startCount + chunkSize;
        chunksArray.push(blob.slice(startCount, endCount));
        startCount += chunkSize;
      }
      if ((blobByteSize - (startCount + 1)) > 0) {
        chunksArray.push(blob.slice(startCount, blobByteSize - 1));
      }
    } else {
      // File Size below Chunk size
      chunksArray.push(blob);
    }
    return chunksArray;
  },

  chunkBase64: function (dataURL) {
    var outputStr = dataURL; //encodeURIComponent(dataURL);
    var dataURLArray = [];
    var startCount = 0;
    var endCount = 0;
    var dataByteSize = dataURL.size || dataURL.length;

    if (dataByteSize > chunkSize) {
      // File Size greater than Chunk size
      while ((dataByteSize - 1) > endCount) {
        endCount = startCount + chunkSize;
        dataURLArray.push(outputStr.slice(startCount, endCount));
        startCount += chunkSize;
      }
      if ((dataByteSize - (startCount + 1)) > 0) {
        chunksArray.push(outputStr.slice(startCount, dataByteSize - 1));
      }
    } else {
      // File Size below Chunk size
      dataURLArray.push(outputStr);
    }

    return dataURLArray;
  },

  assembleBase64: function (dataURLArray) {
    var outputStr = '';

    for (var i = 0; i < dataURLArray.length; i++) {
      try {
        outputStr += dataURLArray[i];
      } catch (error) {
        console.error('Malformed', i, dataURLArray[i]);
      }
    }

    return outputStr;
  }
};

function SkylinkDataChannel (passedChannel, peerId, peerConnection) {
  // Mixin for events
  SkylinkEvent._mixin(this);

  /**
   * The DataChannel ID.
   * @attribute id
   * @type String
   * @since 0.6.10
   * @for SkylinkDataChannel
   */
  this.id = null;

  /**
   * The Peer ID that this DataChannel belongs to.
   * @attribute peerId
   * @type String
   * @since 0.6.10
   * @for SkylinkDataChannel
   */
  this.peerId = peerId;

  /**
   * The DataChannel type.
   * @attribute type
   * @type String
   * @since 0.6.10
   * @for SkylinkDataChannel
   */
  this.type = null;

  /**
   * The DataChannel opened status.
   * @attribute opened
   * @type Boolean
   * @since 0.6.10
   * @for SkylinkDataChannel
   */
  this.opened = false;

  /**
   * The DataChannel transfer.
   * @attribute _transfer
   * @type Array
   * @since 0.6.10
   * @for SkylinkDataChannel
   */
  this._transfer = null;

  /**
   * The DataChannel object reference.
   * @attribute _ref
   * @type RTCDataChannel
   * @private
   * @since 0.6.10
   * @for SkylinkDataChannel
   */
  this._ref = null;

  if (['function', 'object'].indexOf(typeof passedChannel) > -1 && passedChannel !== null) {
    this._ref = passedChannel;
    this.id = passedChannel.label;

  } else {
    var RTCDataChannelInit = {
      ordered: true,
      // protocol: "",
      // id: "",
      // negotiated: false
      //maxRetransmitTime: 3000 // in milliseconds
      //maxRetransmits: 5
    };

    this.id = passedChannel;
    this._ref = peerConnection.createDataChannel(this.id, RTCDataChannelInit);
  }

  // Only "main" DataChannel is messaging
  if (this.id === 'main') {
    this.type = 'messaging';

  // Or else it is just an opened DataChannel for transfering files
  } else {
    this.type = 'data'
  }

  // RTCDataChannel.onopen event
  _this._ref.onopen = _this._reactToOnopen();

  // RTCDataChannel.onclose event
  _this._ref.onclose = _this._reactToOnclose();

  // RTCDataChannel.onclosing event
  _this._ref.onclosing = _this._reactToOnclosing();

  // RTCDataChannel.onmessage event
  _this._ref.onmessage = _this._reactToOnmessage();

  // RTCDataChannel.onerror event
  _this._ref.onerror = _this._reactToOnerror();

  // RTCDataChannel.onerror event
  _this._ref.onbufferedamountlow = _this._reactToOnbufferedamountlow();

  log.log([_this.peerId, 'Channel', _this.id, 'Constructed']);
}

/**
 * Disconnects the DataChannel connection.
 * @method disconnect
 * @since 0.6.10
 * @for SkylinkDataChannel
 */
SkylinkDataChannel.prototype.disconnect = function () {
  var _this = this;

  if (['closed', 'closing'].indexOf(_this._ref.readyState) === -1) {
    _this._ref.close();
  }

  log.debug([_this.peerId, 'Channel', _this.id, 'RTCDataChannel is disconnecting']);
};

/**
 * Sends a P2P message to DataChannel connection.
 * @method sendMessage
 * @param {JSON} message The message object.
 * @since 0.6.10
 * @for SkylinkDataChannel
 */
SkylinkDataChannel.prototype.sendMessage = function (message, isPrivate) {
  var _this = this;

  _this._ref.send(JSON.stringify(message));

  log.debug([_this.peerId, 'Channel', _this.id, 'Sending P2P message ->'], message);
};

/**
 * Starts a P2P blob transfer to DataChannel connection.
 * @method transferBlob
 * @param {Blob|String} data The blob data object or the base64 string.
 * @param {String} transferId The transfer ID.
 * @param {Number} timeout The transfer timeout.
 * @param {Boolean} isPrivate The flag that indicates if transfer is private.
 * @since 0.6.10
 * @for SkylinkDataChannel
 */
SkylinkDataChannel.prototype.transfer = function (data, transferId, timeout, isPrivate) {
  var _this = this;
  var transferData = {
    id: transferId,
    name: transferId,
    dataType: 'blob',
    timeout: 10000,
    isPrivate: isPrivate === true,
    size: 0
  };

  // Base64 string transfers
  if (typeof data === 'string') {
    transferData.dataType = 'dataURL';
    transferData.size = data.size || data.length;

  // Blob data transfers
  } else if (typeof data.name === 'string' && !!data.name) {
    transferData.name = data.name;
    transferData.size = data.size;
  }

  if (typeof timeout === 'number' && timeout > 0) {
    transferData.timeout = timeout;
  }

  if (_this._transfer) {
    log.error([_this.peerId, 'Channel', _this.id, 'Ignoring data transfer as there is an ongoing data tranfer']);

    transferData.data = data;

    _this._trigger('transferState', 'error', transferData, {
      message: 'Failed data transfer as there is an ongoing data transfer',
      transferType: 'upload'
    });
    return;
  }

  _this._transfer = clone(transferData);

  _this._transfer.chunkSize = 0;
  _this._transfer.direction = 'upload';
  _this._transfer.ackN = 0;
  _this._transfer.dataArray = [];

  // Blob data transfers
  if (transferData.dataType === 'blob') {
    _this._transfer.chunkSize = SkylinkDataPacker.CHUNK_BLOB_SIZE;

    if (globals.user.agent.name === 'firefox') {
      _this._transfer.chunkSize = SkylinkDataPacker.FIREFOX_CHUNK_BLOB_SIZE;
    }

    _this._transfer.dataArray = SkylinkDataPacker.chunk(data, _this._transfer.chunkSize);

  // Base64 string transfers
  } else {
    _this._transfer.chunkSize = SkylinkDataPacker.CHUNK_BASE64_SIZE;
    _this._transfer.dataArray = SkylinkDataPacker.chunkBase64(data, _this._transfer.chunkSize);
  }

  _this._protocolConstructWRQ();
};

/**
 * Accepts or rejects a blob / base64 transfer to DataChannel connection.
 * @method acceptTransfer
 * @param {Boolean} accept The flag that indicates if transfer should be accepted or not.
 * @since 0.6.10
 * @for SkylinkDataChannel
 */
SkylinkDataChannel.prototype.acceptTransfer = function (accept) {
  var _this = this;

  if (!_this._transfer) {
    log.error([_this.peerId, 'Channel', _this.id, 'Ignoring transfer acceptance as there is no ongoing data tranfer']);
    return;
  }

  if (accept !== true) {
    log.debug([_this.peerId, 'Channel', _this.id 'Transfer is rejected']);

    _this._transfer = null;

    if (_this.type !== 'messaging') {
      log.debug([_this.peerId, 'Channel', _this.id, 'Disconnecting connection as transfer has been rejected']);
      _this.disconnect();
    }
    return;
  }

  _this._transfer.ackN = 0;
  _this._protocolConstructACK();
};

/**
 * Cancels a blob / base64 transfer to DataChannel connection.
 * @method cancelTransfer
 * @since 0.6.10
 * @for SkylinkDataChannel
 */
SkylinkDataChannel.prototype.cancelTransfer = function () {
  var _this = this;

  if (!_this._transfer) {
    log.error([_this.peerId, 'Channel', _this.id, 'Ignoring transfer termination as there is no ongoing data tranfer']);
    return;
  }

  if (accept !== true) {
    log.debug([_this.peerId, 'Channel', _this.id 'Transfer is rejected']);

    _this._trigger('transferState', 'cancel', {
      id: _this._transfer.id,
      name: _this._transfer.name,
      dataType: _this._transfer.dataType,
      timeout: _this._transfer.timeout,
      isPrivate: _this._transfer.isPrivate === true,
      size: _this._transfer.size
    }, null);

    _this._transfer = null;

    if (_this.type !== 'messaging') {
      log.debug([_this.peerId, 'Channel', _this.id, 'Disconnecting connection as transfer has been rejected']);
      _this.disconnect();
    }
    return;
  }

  _this._protocolConstructDATA();
};

/**
 * Sends the P2P data to DataChannel connection.
 * @method _send
 * @param {String} data The data to be sent.
 * @private
 * @since 0.6.10
 * @for SkylinkDataChannel
 */
SkylinkDataChannel.prototype._send = function (data) {
  var dataString = '';

  if (typeof data !== 'string') {
    dataString = JSON.stringify(data);
  } else {
    dataString = data;
  }

  if (_this._ref.readyState !== 'open') {
    log.warn([_this.peerId, 'Channel', _this.id, 'RTCDataChannel is discarding data as readyState is not "opened" ->'], data);
    return;
  }

  log.debug([_this.peerId, 'Channel', _this.id, 'Sending P2P data ->'], data);

  _this._ref.send(dataString);
}

/**
 * Reacts to the RTCDataChannel.onopen event.
 * @method _reactToOnopen
 * @private
 * @since 0.6.10
 * @for SkylinkDataChannel
 */
SkylinkDataChannel.prototype._reactToOnopen = function () {
  var _this = this;

  var handler = function () {
    log.debug([_this.peerId, 'Channel', _this.id, 'RTCDataChannel.readyState ->'], 'open');

    _this._trigger('readyState', 'open');
  };

  var currentState = _this._ref.readyState;

  if (currentState === 'open') {
    // NOTE: the datachannel was not defined in array before it was triggered
    // set a timeout to allow the dc objec to be returned before triggering "open"
    setTimeout(handler, 500);
    return null;
  }

  _this._trigger('readyState', currentState, null);

  return handler;
};

/**
 * Reacts to the RTCDataChannel.onclose event.
 * @method _reactToOnclose
 * @private
 * @since 0.6.10
 * @for SkylinkDataChannel
 */
SkylinkDataChannel.prototype._reactToOnclose = function () {
  var _this = this;

  return function () {
    log.debug([_this.peerId, 'Channel', _this.id, 'RTCDataChannel.readyState ->'], 'closed');

    _this._trigger('readyState', 'closed', null);
  };
};

/**
 * Reacts to the RTCDataChannel.onclosing event.
 * @method _reactToOnclosing
 * @private
 * @since 0.6.10
 * @for SkylinkDataChannel
 */
SkylinkDataChannel.prototype._reactToOnclosing = function () {
  var _this = this;

  return function () {
    log.debug([_this.peerId, 'Channel', _this.id, 'RTCDataChannel.readyState ->'], 'closing');

    _this._trigger('readyState', 'closing', null);
  };
};

/**
 * Reacts to the RTCDataChannel.onmessage event.
 * @method _reactToOnmessage
 * @private
 * @since 0.6.10
 * @for SkylinkDataChannel
 */
SkylinkDataChannel.prototype._reactToOnmessage = function () {
  var _this = this;

  return function (event) {
    var message = event.message || event;

    log.debug([_this.peerId, 'Channel', _this.id, 'RTCDataChannel received P2P message ->'], message);
  };
};

/**
 * Reacts to the RTCDataChannel.onerror event.
 * @method _reactToOnerror
 * @private
 * @since 0.6.10
 * @for SkylinkDataChannel
 */
SkylinkDataChannel.prototype._reactToOnerror = function () {
  var _this = this;

  return function (event) {
    var error = event.error || event;

    log.error([_this.peerId, 'Channel', _this.id, 'RTCDataChannel connection encountered exception ->'], error);

    _this._trigger('readyState', 'error', error);
  };
};

/**
 * Reacts to the RTCDataChannel.onbufferedamountlow event.
 * @method _reactToOnbufferedamountlow
 * @private
 * @since 0.6.10
 * @for SkylinkDataChannel
 */
SkylinkDataChannel.prototype._reactToOnbufferedamountlow = function () {
  var _this = this;

  return function () {
    log.warn([_this.peerId, 'Channel', this.id, 'RTCDataChannel connection is bufferring low ->'], {
      amount: _this._ref.bufferedAmount,
      amountLowThreshold: _this._ref.bufferedAmountLowThreshold
    });
  };
};

/**
 * Constructs the "MESSAGE" object.
 * @method _protocolConstructMESSAGE
 * @param {Any} data The message to send.
 * @param {Boolean} isPrivate The flag that indicates if message is private.
 * @since 0.6.10
 * @for SkylinkDataChannel
 */
SkylinkDataChannel.prototype._protocolConstructMESSAGE = function (data, isPrivate) {
  var _this = this;

  return {
    type: 'MESSAGE',
    // Sending info
    sender: globals.user.id,
    target: isPrivate ? _this.peerId : null,
    // Is Private
    isPrivate: isPrivate,
    // Data
    data: data
  };
};

/**
 * Constructs the "WRQ" object.
 * @method _protocolConstructWRQ
 * @since 0.6.10
 * @for SkylinkDataChannel
 */
SkylinkDataChannel.prototype._protocolConstructWRQ = function () {
  var _this = this;

  return {
    type: 'WRQ',
    // Sending info
    sender: globals.user.id,
    target: _this.peerId,
    // Agent info
    agent: globals.user.agent.name,
    version: globals.user.agent.version,
    // Is Private
    isPrivate: _this._transfer.isPrivate,
    // Data info
    id: _this._transfer.id,
    name: _this._transfer.name,
    size: _this._transfer.size,
    type: _this._transfer.dataType,
    chunkSize: _this._transfer.chunkSize,
    timeout: _this._transfer.timeout
  };
};

/**
 * Constructs the "ACK" object.
 * @method _protocolConstructACK
 * @param {Number} ackN The current acknowledgement packet received number.
 * @since 0.6.10
 * @for SkylinkDataChannel
 */
SkylinkDataChannel.prototype._protocolConstructACK = function () {
  var _this = this;

  return {
    type: 'ACK',
    // Sending info
    sender: globals.user.id,
    // Ack no
    ackN: _this._transfer.ackN,
    // Data info
    id: _this._transfer.id,
    name: _this._transfer.name,
    type: _this._transfer.dataType
  };
};

/**
 * Constructs the "CANCEL" object.
 * @method _protocolConstructCANCEL
 * @since 0.6.10
 * @for SkylinkDataChannel
 */
SkylinkDataChannel.prototype._protocolConstructCANCEL = function () {
  var _this = this;

  return {
    type: 'CANCEL',
    // Sending info
    sender: globals.user.id,
    // Data info
    id: _this._transfer.id,
    name: _this._transfer.name,
    type: _this._transfer.dataType,
    // Error object
    content: 'Peer has terminated transfer'
  };
};

/**
 * Constructs the "ERROR" object.
 * @method _protocolConstructERROR
 * @param {Error} error The error object received.
 * @since 0.6.10
 * @for SkylinkDataChannel
 */
SkylinkDataChannel.prototype._protocolConstructERROR = function (error) {
  var _this = this;

  return {
    type: 'ERROR',
    // Sending info
    sender: globals.user.id,
    // Data info
    id: _this._transfer.id,
    name: _this._transfer.name,
    type: _this._transfer.dataType,
    // Error object
    content: error.message || error,
    isUploadError: _this._transfer.direction === 'upload'
  };
};

/**
 * Reacts to the "MESSAGE" object.
 * @method _protocolReactToMESSAGE
 * @param {JSON} data The message received.
 * @since 0.6.10
 * @for SkylinkDataChannel
 */
SkylinkDataChannel.prototype._protocolReactToMESSAGE = function (message) {
  var _this = this;

  _this._trigger('message', message.data, message.isPrivate === true);
};

/**
 * Reacts to the "WRQ" object.
 * @method _protocolReactToWRQ
 * @param {JSON} data The message received.
 * @since 0.6.10
 * @for SkylinkDataChannel
 */
SkylinkDataChannel.prototype._protocolReactToWRQ = function (message) {
  var _this = this;
  var transferId = message.id || (new Date ()).getTime().toString();

  if (_this._transfer) {
    log.warn([_this.peerId, 'Channel', _this.id, 'Ignoring transfer request as there is an ongoing transfer ->'], message);
    return;
  }

  _this._transfer = {
    id: transferId,
    name: message.name || transferId,
    direction: 'download',
    size: message.size,
    type: message.type || 'blob',
    ackN: 0,
    receivedSize: 0,
    chunkSize: message.chunkSize,
    timeout: message.timeout || 10000,
    isPrivate: message.isPrivate === true,
    dataArray: []
  };

  var transferData = {
    id: _this._transfer.id,
    name: _this._transfer.name,
    dataType: _this._transfer.dataType,
    timeout: _this._transfer.timeout,
    isPrivate: _this._transfer.isPrivate === true,
    size: _this._transfer.size
  };

  _this._trigger('transferState', 'request', transferData, null);
};

/**
 * Reacts to the "ACK" object.
 * @method _protocolReactToACK
 * @param {JSON} data The message received.
 * @since 0.6.10
 * @for SkylinkDataChannel
 */
SkylinkDataChannel.prototype._protocolReactToACK = function (message) {
  var _this = this;
  var transferId = message.id || (new Date ()).getTime().toString();

  if (_this._transfer) {
    log.warn([_this.peerId, 'Channel', _this.id, 'Ignoring transfer acknowledgement as there is an ongoing transfer ->'], message);
    return;
  }

  var transferData = {
    id: _this._transfer.id,
    name: _this._transfer.name,
    dataType: _this._transfer.dataType,
    timeout: _this._transfer.timeout,
    isPrivate: _this._transfer.isPrivate === true,
    size: _this._transfer.size,
    data: null
  };

  if (message.ackN === -1) {
    _this._trigger('transferState', 'rejected', transferData, null);

    _this._transfer = null;

    if (_this.type !== 'messaging') {
      log.debug([_this.peerId, 'Channel', _this.id, 'Disconnecting connection as transfer has been rejected']);
      _this.disconnect();
    }
    return;

  } else if (message.ackN === 0) {
    _this._trigger('transferState', 'uploadStarted', transferData, null);
  }

  _this.

  _this._trigger('transferState', 'request', {
    id: transferId,
    name: _this._transfer.name,
    type: _this._transfer.type,
    size: _this._transfer.size,
    timeout: _this._transfer.timeout,
    isPrivate: _this._transfer.isPrivate,
    data: null
  }, null);
};






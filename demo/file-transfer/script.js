var SkylinkDemo = new Skylink();

SkylinkDemo.on('peerJoined', function(peerId, peerInfo, isSelf) {
  var user = 'You';
  if (!isSelf) {
    user = peerInfo ? peerInfo.userData || peerId : peerId;
    var targetItem = document.createElement('option');
    targetItem.id = peerId + '_target';
    targetItem.value = peerId;
    targetItem.innerHTML = 'Send file to ' + peerInfo.userData + ' only';
    document.getElementById('target').appendChild(targetItem);
  }
  addMessage(user + ' joined the room', 'action');
});

SkylinkDemo.on('peerLeft', function(peerId, peerInfo, isSelf) {
  var user = 'You';
  if (!isSelf) {
    var peerInfo = SkylinkDemo.getPeerInfo(peerId);
    console.info(peerInfo);
    user = peerInfo ? peerInfo.userData || peerId : peerId;
    document.getElementById('target').removeChild(
      document.getElementById(peerId + '_target'));
  }
  addMessage(user + ' left the room', 'action');
});

SkylinkDemo.on('dataTransferState', function(state, transferId, peerId, transferInfo, error) {
  var displayName = SkylinkDemo.getPeerInfo(peerId).userData;

  switch (state) {
    case SkylinkDemo.DATA_TRANSFER_STATE.UPLOAD_REQUEST:
      var result = confirm('Incoming transfer request!\n\nFile: ' + transferInfo.name +
        '\n\nSize: ' + transferInfo.size + '\n\nAccept?');
      SkylinkDemo.acceptDataTransfer(peerId, transferId, result);
      break;
    case SkylinkDemo.DATA_TRANSFER_STATE.UPLOAD_STARTED:
      addMessage('You\'ve sent a file: ' + transferInfo.name);
      break;
    case SkylinkDemo.DATA_TRANSFER_STATE.DOWNLOAD_STARTED:
      addFile(transferId, peerId, displayName, transferInfo, false);
      break;
    case SkylinkDemo.DATA_TRANSFER_STATE.UPLOADING:
      var transferStatus = document.getElementById(peerId + '_' + transferId);
      if (transferStatus) {
        transferStatus.innerHTML = (transferInfo.percentage * 100);
        transferStatus.innerHTML += '%';
      } else {
        addFile(transferId, peerId, displayName, transferInfo, true);
      }
      break;
    case SkylinkDemo.DATA_TRANSFER_STATE.DOWNLOADING:
      var transferStatus = document.getElementById(peerId + '_' + transferId);
      transferStatus.innerHTML = (transferInfo.percentage * 100);
      transferStatus.innerHTML += '%';
      break;
    case SkylinkDemo.DATA_TRANSFER_STATE.DOWNLOAD_COMPLETED:
      var transferStatus = document.getElementById(peerId + '_' + transferId);
      transferStatus.innerHTML = 'Completed';
      transferStatus = document.getElementById(transferId);
      var received = new window.Blob(transferInfo.data);
      transferStatus.href = URL.createObjectURL(received);
      transferStatus.style.display = 'block';
      break;
    case SkylinkDemo.DATA_TRANSFER_STATE.UPLOAD_COMPLETED:
      var transferStatus = document.getElementById(peerId + '_' + transferId);
      transferStatus.innerHTML = 'Completed';
      break;
    case SkylinkDemo.DATA_TRANSFER_STATE.REJECTED:
      alert(displayName + ' has rejected your request.\n\nFile: ' + transferInfo.name +
        '\n\nSize: ' + transferInfo.size);
      break;
    case SkylinkDemo.DATA_TRANSFER_STATE.ERROR:
      addMessage(transferId + ' failed. Reason: \n' +
        error.message);
      var transferStatus = document.getElementById(peerId + '_' + transferId);
      transferStatus.innerHTML = 'Failed';
      break;
    case SkylinkDemo.DATA_TRANSFER_STATE.CANCEL:
      addMessage(transferId + ' canceled. Reason: \n' +
        error.message);
      var transferStatus = document.getElementById(peerId + '_' + transferId);
      transferStatus.innerHTML = 'Canceled';
  }
});

SkylinkDemo.init(config, function (error, success) {
  if (success) {
    var displayName = 'User_' + Math.floor((Math.random() * 1000) + 1);
    SkylinkDemo.joinRoom({
      userData: displayName,
      audio: false,
      video: false
    });
  }
});

function sendFile() {
  var target = document.getElementById('target').value;
  var files = document.getElementById('file').files;
  var file = files[0];
  // SkylinkDemo.sendBlobData(files[0], (target === 'group') ? null : target);
  var fileReader = new FileReader();
  fileReader.onload = function() {
    SkylinkDemo.sendArrayBufferData(fileReader.result, (target === 'group') ? null : target);
  };
  fileReader.readAsArrayBuffer(file);
}

function addMessage(message, className) {
  var infobox = document.getElementById('infobox'),
    div = document.createElement('div');
  div.className = className;
  div.innerHTML = message;
  infobox.appendChild(div);
}

function addFile(transferId, peerId, displayName, transferInfo, isUpload) {
  var transfers = document.getElementById('transfers'),
    item = document.createElement('tr');
  item.innerHTML = '<td>' + transferId + '</td><td>' +
    ((isUpload) ? '&#8657;' : '&#8659;') + '</td>' +
    '<td>' + displayName + '</td><td>' + transferInfo.name +
    '</td><td><span id="' + peerId + '_' + transferId + '"></span>' +
    ((!isUpload) ? '<a id="' + transferId + '" href="#" download="' +
      transferInfo.name + '" style="display:none">Download</a>' : '') + '</td>';
  transfers.appendChild(item);
}

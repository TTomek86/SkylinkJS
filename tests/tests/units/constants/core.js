/**
 * NOTE: What's the point of these tests? Well, it's a dummy test checker to check if these constants exists as
 *   the way it should and sometimes removing something accidentally, these tests will help.
 */
'use strict';

var expect = chai.expect;
var assert = chai.assert;
var should = chai.should;

describe('Constants::Skylink', function () {
  var skylink = new Skylink();

  describe('Dummy check if exists and defined correctly', function () {

    function test (constant, keyValues, constantTypeof) {
      it(constant, function () {
        assert.typeOf(skylink[constant], constantTypeof);
        expect(skylink[constant]).to.deep.equal(keyValues);
      });
    }

    /* Skylink.AUDIO_CODEC */
    test('AUDIO_CODEC', {
      AUTO: 'auto',
      ISAC: 'ISAC',
      OPUS: 'opus',
      SILK: 'SILK',
      ILBC: 'iLBC',
      G722: 'G722',
      G711: 'G711'
    }, 'object');

    /* Skylink.CANDIDATE_GENERATION_STATE */
    test('CANDIDATE_GENERATION_STATE', {
      NEW: 'new',
      GATHERING: 'gathering',
      COMPLETED: 'completed'
    }, 'object');


    /* Skylink.DATA_CHANNEL_STATE */
    test('DATA_CHANNEL_STATE', {
      CONNECTING: 'connecting',
      OPEN: 'open',
      CLOSING: 'closing',
      CLOSED: 'closed',
      ERROR: 'error'
    }, 'object');

    /* Skylink.DATA_CHANNEL_TYPE */
    test('DATA_CHANNEL_TYPE', {
      MESSAGING: 'messaging',
      DATA: 'data'
    }, 'object');

    /* Skylink.DATA_TRANSFER_DATA_TYPE */
    test('DATA_TRANSFER_DATA_TYPE', {
      BINARY_STRING: 'binaryString',
      BINARY: 'binary',
      STRING: 'string'
    }, 'object');

    /* Skylink.DATA_TRANSFER_SESSION_TYPE */
    test('DATA_TRANSFER_SESSION_TYPE', {
      BLOB: 'blob',
      DATAURL: 'dataURL'
    }, 'object');

    /* Skylink.DATA_TRANSFER_STATE */
    test('DATA_TRANSFER_STATE', {
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
    }, 'object');

    /* Skylink.DATA_TRANSFER_TYPE */
    test('DATA_TRANSFER_TYPE', {
      UPLOAD: 'upload',
      DOWNLOAD: 'download'
    }, 'object');

    /* Skylink.DT_PROTOCOL_VERSION */
    test('DT_PROTOCOL_VERSION', '0.1.0', 'string');

    /* Skylink.GET_PEERS_STATE */
    test('GET_PEERS_STATE', {
      ENQUIRED: 'enquired',
      RECEIVED: 'received'
    }, 'object');

    /* Skylink.HANDSHAKE_PROGRESS */
    test('HANDSHAKE_PROGRESS', {
      ENTER: 'enter',
      WELCOME: 'welcome',
      OFFER: 'offer',
      ANSWER: 'answer',
      ERROR: 'error'
    }, 'object');

    /* Skylink.ICE_CONNECTION_STATE */
    test('ICE_CONNECTION_STATE', {
      STARTING: 'starting',
      CHECKING: 'checking',
      CONNECTED: 'connected',
      COMPLETED: 'completed',
      CLOSED: 'closed',
      FAILED: 'failed',
      TRICKLE_FAILED: 'trickleFailed',
      DISCONNECTED: 'disconnected'
    }, 'object');

    /* Skylink.INTRODUCE_STATE */
    test('INTRODUCE_STATE', {
      INTRODUCING: 'introducing',
      INTRODUCED: 'introduced',
      ERROR: 'error'
    }, 'object');

    /* Skylink.LOG_LEVEL */
    test('LOG_LEVEL', {
      DEBUG: 4,
      LOG: 3,
      INFO: 2,
      WARN: 1,
      ERROR: 0,
      NO_LOGS: -1
    }, 'object');

    /* Skylink.PEER_CONNECTION_STATE */
    test('PEER_CONNECTION_STATE', {
      STABLE: 'stable',
      HAVE_LOCAL_OFFER: 'have-local-offer',
      HAVE_REMOTE_OFFER: 'have-remote-offer',
      CLOSED: 'closed',
      ERROR: 'error'
    }, 'object');

    /* Skylink.READY_STATE_CHANGE */
    test('READY_STATE_CHANGE', {
      INIT: 0,
      LOADING: 1,
      COMPLETED: 2,
      ERROR: -1
    }, 'object');

    /* Skylink.READY_STATE_CHANGE_ERROR */
    test('READY_STATE_CHANGE_ERROR', {
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
    }, 'object');

    /* Skylink.READY_STATE_CHANGE_ERROR_STATUS */
    test('READY_STATE_CHANGE_ERROR_STATUS', {
      NO_REQUEST_MADE: -2,
      REQUEST_ERROR: -1,
      REQUEST_EMPTY_RESULT: 0,
      REQUEST_FAILED: 200
    }, 'object');

    /* Skylink.CANDIDATE_GENERATION_STATE */
    test('CANDIDATE_GENERATION_STATE', {
      NEW: 'new',
      GATHERING: 'gathering',
      COMPLETED: 'completed'
    }, 'object');

    /* Skylink.REGIONAL_SERVER */
    test('REGIONAL_SERVER', {
      APAC1: 'sg',
      US1: 'us2'
    }, 'object');

    /* Skylink.SERVER_PEER_TYPE */
    test('SERVER_PEER_TYPE', {
      MCU: 'mcu'
      //SIP: 'sip'
    }, 'object');

    /* Skylink.SM_PROTOCOL_VERSION */
    test('SM_PROTOCOL_VERSION', '0.1.1', 'string');

    /* Skylink.SOCKET_ERROR */
    test('SOCKET_ERROR', {
      CONNECTION_FAILED: 0,
      RECONNECTION_FAILED: -1,
      CONNECTION_ABORTED: -2,
      RECONNECTION_ABORTED: -3,
      RECONNECTION_ATTEMPT: -4
    }, 'object');

    /* Skylink.SOCKET_FALLBACK */
    test('SOCKET_FALLBACK', {
      NON_FALLBACK: 'nonfallback',
      FALLBACK_PORT: 'fallbackPortNonSSL',
      FALLBACK_SSL_PORT: 'fallbackPortSSL',
      LONG_POLLING: 'fallbackLongPollingNonSSL',
      LONG_POLLING_SSL: 'fallbackLongPollingSSL'
    }, 'object');

    /* Skylink.SYSTEM_ACTION */
    test('SYSTEM_ACTION', {
      WARNING: 'warning',
      REJECT: 'reject'
    }, 'object');

    /* Skylink.SYSTEM_ACTION_REASON */
    test('SYSTEM_ACTION_REASON', {
      //FAST_MESSAGE: 'fastmsg',
      ROOM_LOCKED: 'locked',
      //ROOM_FULL: 'roomfull',
      DUPLICATED_LOGIN: 'duplicatedLogin',
      SERVER_ERROR: 'serverError',
      //VERIFICATION: 'verification',
      EXPIRED: 'expired',
      ROOM_CLOSED: 'roomclose',
      ROOM_CLOSING: 'toclose'
    }, 'object');

    /* Skylink.TURN_TRANSPORT */
    test('TURN_TRANSPORT', {
      UDP: 'udp',
      TCP: 'tcp',
      ANY: 'any',
      NONE: 'none',
      ALL: 'all'
    }, 'object');


    /* Skylink.VERSION */
    test('VERSION', '0.7.0', 'string');

    /* Skylink.VIDEO_CODEC */
    test('VIDEO_CODEC', {
      AUTO: 'auto',
      VP8: 'VP8',
      VP9: 'VP9',
      H264: 'H264',
      H264UC: 'H264UC'
    }, 'object');

    /* Skylink.VIDEO_RESOLUTION */
    test('VIDEO_RESOLUTION', {
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
    }, 'object');
  });
});


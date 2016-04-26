/**
 * NOTE: What's the point of these tests? Well, it's a dummy test checker to check if these constants exists as
 *   the way it should and sometimes removing something accidentally, these tests will help.
 */
'use strict';

var expect = chai.expect;
var assert = chai.assert;
var should = chai.should;

describe('init()', function () {
  var skylink = new Skylink();

  function printParam (param) {
    if (typeof param === 'function') {
      return param.toString();
    } else {
      return JSON.stringify(param);
    }
  }

  function generateCreds (room, duration, startDateTime) {
    var concatStr = room + '_' + duration + '_' + startDateTime;
    //! Do not EXPOSE to any users
    var hash = CryptoJS.HmacSHA1(concatStr, config.key.secret);
    var base64String = hash.toString(CryptoJS.enc.Base64);
    return encodeURIComponent(base64String);
  }

  describe('Cases that results in invalid parameter error', function () {
    function test (paramError, options) {
      it('ERROR -> (' + printParam(options) + ', cb)', function (done) {
        skylink.init(options, function (error, success) {
          expect(error).to.not.equal(null);
          expect(success).to.equal(null);

          assert.instanceOf(error.error, Error, 'Is instance of Error');
          assert.isString(error.error.message);
          expect(error.error.message).to.contain('"' + paramError + '"');

          expect(error.status).to.deep.equal(skylink.READY_STATE_CHANGE_ERROR_STATUS.NO_REQUEST_MADE);
          expect(error.errorCode).to.deep.equal(skylink.READY_STATE_CHANGE_ERROR.NO_PATH);

          done();
        });
      });
    }

    test('appKey', null);
    test('appKey', true);
    test('appKey', false);
    test('appKey', 123);
    test('appKey', 1.23);
    test('appKey', '');
    test('appKey', []);
    test('appKey', {});
    test('appKey', { appKey: ''});
    test('appKey', { apiKey: ''});
    test('roomServer', { appKey: 'xxxx', roomServer: 'test.com' });
    test('roomServer', { appKey: 'xxxx', roomServer: '//test.com/' });
    test('roomServer', { appKey: 'xxxx', roomServer: '//test.com/test/' });
    test('roomServer', { appKey: 'xxxx', roomServer: '//' });
    test('region', { appKey: 'xxxx', region: 'test' });
    test('TURNServerTransport', { appKey: 'xxxx', TURNServerTransport: 'test' });
    test('credentials.startDateTime', { appKey: 'xxxx', credentials: {} });
    test('credentials.startDateTime', { appKey: 'xxxx', credentials: { startDateTime: null } });
    test('credentials.startDateTime', { appKey: 'xxxx', credentials: { startDateTime: true } });
    test('credentials.startDateTime', { appKey: 'xxxx', credentials: { startDateTime: false } });
    test('credentials.startDateTime', { appKey: 'xxxx', credentials: { startDateTime: 123 } });
    test('credentials.startDateTime', { appKey: 'xxxx', credentials: { startDateTime: 1.23 } });
    test('credentials.startDateTime', { appKey: 'xxxx', credentials: { startDateTime: '' } });
    test('credentials.startDateTime', { appKey: 'xxxx', credentials: { startDateTime: [] } });
    test('credentials.startDateTime', { appKey: 'xxxx', credentials: { startDateTime: {} } });
    test('credentials.startDateTime', { appKey: 'xxxx', credentials: { startDateTime: 'xx' } });
    test('credentials.duration', { appKey: 'xxxx', credentials: { startDateTime: (new Date()).toISOString() } });
    test('credentials.duration', { appKey: 'xxxx', credentials: { startDateTime: (new Date()).toISOString(), duration: null } });
    test('credentials.duration', { appKey: 'xxxx', credentials: { startDateTime: (new Date()).toISOString(), duration: true } });
    test('credentials.duration', { appKey: 'xxxx', credentials: { startDateTime: (new Date()).toISOString(), duration: false } });
    test('credentials.duration', { appKey: 'xxxx', credentials: { startDateTime: (new Date()).toISOString(), duration: '' } });
    test('credentials.duration', { appKey: 'xxxx', credentials: { startDateTime: (new Date()).toISOString(), duration: 'test' } });
    test('credentials.duration', { appKey: 'xxxx', credentials: { startDateTime: (new Date()).toISOString(), duration: [] } });
    test('credentials.duration', { appKey: 'xxxx', credentials: { startDateTime: (new Date()).toISOString(), duration: {} } });
    test('credentials.credentials', { appKey: 'xxxx', credentials: { startDateTime: (new Date()).toISOString(), duration: 123 } });
    test('credentials.credentials', { appKey: 'xxxx', credentials: { startDateTime: (new Date()).toISOString(), duration: 123, credentials: null } });
    test('credentials.credentials', { appKey: 'xxxx', credentials: { startDateTime: (new Date()).toISOString(), duration: 123, credentials: true } });
    test('credentials.credentials', { appKey: 'xxxx', credentials: { startDateTime: (new Date()).toISOString(), duration: 123, credentials: false } });
    test('credentials.credentials', { appKey: 'xxxx', credentials: { startDateTime: (new Date()).toISOString(), duration: 123, credentials: '' } });
    test('credentials.credentials', { appKey: 'xxxx', credentials: { startDateTime: (new Date()).toISOString(), duration: 123, credentials: [] } });
    test('credentials.credentials', { appKey: 'xxxx', credentials: { startDateTime: (new Date()).toISOString(), duration: 123, credentials: {} } });
    test('audioCodec', { appKey: 'xxxx', audioCodec: 'test' });
    test('videoCodec', { appKey: 'xxxx', videoCodec: 'test' });
  });

  describe('Cases that results in dependency load error', function () {
    function testResponse (errorCode, fn) {
      skylink.init('xxxxx', function (error, success) {
        expect(error).to.not.equal(null);
        expect(success).to.equal(null);

        assert.instanceOf(error.error, Error, 'Is instance of Error');
        assert.isString(error.error.message);
        expect(error.error.message).to.not.be.empty;

        expect(error.status).to.deep.equal(skylink.READY_STATE_CHANGE_ERROR_STATUS.NO_REQUEST_MADE);
        expect(error.errorCode).to.deep.equal(errorCode);

        fn();
      });
    }

    it('ERROR -> No AdapterJS loaded', function (done) {
      var _tempAdapterJS = window.AdapterJS;
      window.AdapterJS = null;
      testResponse(skylink.READY_STATE_CHANGE_ERROR.ADAPTER_NO_LOADED, function () {
        window.AdapterJS = _tempAdapterJS;
        done();
      });
    });

    it('ERROR -> No socket.io-client loaded', function (done) {
      var _tempIO = window.io;
      window.io = null;
      testResponse(skylink.READY_STATE_CHANGE_ERROR.NO_SOCKET_IO, function () {
        window.io = _tempIO;
        done();
      });
    });

    it('ERROR -> No XMLHttpRequest API', function (done) {
      var _tempXHR = window.XMLHttpRequest;
      window.XMLHttpRequest = null;
      testResponse(skylink.READY_STATE_CHANGE_ERROR.NO_XMLHTTPREQUEST_SUPPORT, function () {
        window.XMLHttpRequest = _tempXHR;
        done();
      });
    });
  });

  describe('Cases that results in connection error', function () {
    function test (status, errorCode, options) {
      it('ERROR -> (' + printParam(options) + ', cb)', function (done) {
        skylink.init(options, function (error, success) {
          expect(error).to.not.equal(null);
          expect(success).to.equal(null);

          assert.instanceOf(error.error, Error, 'Is instance of Error');
          assert.isString(error.error.message);
          expect(error.error.message).to.not.be.empty;

          expect(error.status).to.deep.equal(status);
          expect(error.errorCode).to.deep.equal(errorCode);

          done();
        });
      });
    }

    test(skylink.READY_STATE_CHANGE_ERROR_STATUS.REQUEST_ERROR,
      skylink.READY_STATE_CHANGE_ERROR.XML_HTTP_REQUEST_ERROR, {
        roomServer: '//api1.temasys.com.sg',
        appKey: 'test'
      });

    test(skylink.READY_STATE_CHANGE_ERROR_STATUS.REQUEST_FAILED,
      skylink.READY_STATE_CHANGE_ERROR.API_INVALID, {
        roomServer: '//api.temasys.com.sg',
        appKey: 'test'
      });

    test(skylink.READY_STATE_CHANGE_ERROR_STATUS.REQUEST_FAILED,
      skylink.READY_STATE_CHANGE_ERROR.API_CREDENTIALS_NOT_MATCH, {
        appKey: config.key.id,
        defaultRoom: 'test',
        credentials: {
          duration: 20,
          startDateTime: (new Date()).toISOString(),
          credentials: generateCreds('test', 21, (new Date()).toISOString())
        }
      });
  });

  describe('Cases that results in connection success', function () {
    function test (options) {
      it('SUCCESS -> (' + printParam(options) + ', cb)', function (done) {
        skylink.init(options, function (error, success) {
          expect(success).to.not.equal(null);
          expect(error).to.equal(null);

          assert.typeOf(success.serverUrl, 'string');
          expect(success.state).to.equal(skylink.READY_STATE_CHANGE.COMPLETED);
          expect(success.state).to.equal(options.appKey);
          assert.typeOf(success.roomServer, 'string');
          expect(success.defaultRoom).to.equal(options.defaultRoom);
          expect(success.selectedRoom).to.equal(options.defaultRoom);
          expect(success.serverRegion).to.equal(null);
          assert.typeOf(success.enableDataChannel, 'boolean');
          assert.typeOf(success.enableIceTrickle, 'boolean');
          assert.typeOf(success.enableTURNServer, 'boolean');
          assert.typeOf(success.enableSTUNServer, 'boolean');
          assert.typeOf(success.TURNTransport, 'string');
          assert.typeOf(success.audioFallback, 'boolean');
          assert.typeOf(success.forceSSL, 'boolean');
          assert.typeOf(success.socketTimeout, 'number');
          assert.typeOf(success.forceTURNSSL, 'boolean');
          assert.typeOf(success.audioCodec, 'string');
          assert.typeOf(success.videoCodec, 'string');
          assert.typeOf(success.forceTURN, 'boolean');
          assert.typeOf(success.usePublicSTUN, 'boolean');

          done();
        });
      });
    }

    var date = (new Date()).toISOString();
    test({
      appKey: config.key.id,
      defaultRoom: 'test',
      credentials: {
        duration: 20,
        startDateTime: date,
        credentials: generateCreds('test', 20, date)
      }
    });

    test({
      appKey: config.key.id,
      defaultRoom: 'test'
    });
  });

});
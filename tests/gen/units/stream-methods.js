/*! skylinkjs - v1.0.0 - Mon Jul 06 2015 09:48:19 GMT+0800 (SGT) */

//mocha.bail();
//mocha.run();

var expect = chai.expect;
var assert = chai.assert;
var should = chai.should;

/* Test timeouts */
var testTimeout = 35000;
var gUMTimeout = 25000;
var testItemTimeout = 4000;

/* Shared functions */
// Checking the bytes of the canvas
var checkCanvas = function (ctx, width, height) {
  var nimg = ctx.getImageData(0, 0, width, height);

  var d = nimg.data;

  var i;

  for (i = 0; i < d.length; i += 4) {
    var r = d[i];
    var g = d[i + 1];
    var b = d[i + 2];

    if (r !== 0 || g !== 0 || b !== 0) {
      return true;
    }
  }

  return false;
};

// Drawing into a canvas using video
var drawCanvas = function (v, callback) {
  var draw = function (v,c,w,h) {
    if(v.paused || v.ended) {
      return false;
    }
    c.drawImage(v,0,0,w,h);
    setTimeout(draw,20,v,c,w,h);
  };

  var canvas = document.getElementById('test');

  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.id = 'test';
    document.body.appendChild(canvas);
  }

  var context = canvas.getContext('2d');

  var cw = Math.floor(canvas.clientWidth);
  var ch = Math.floor(canvas.clientHeight);
  canvas.width = cw;
  canvas.height = ch;

  draw(v,context,cw,ch);

 setTimeout(function () {
   v.pause();

   callback( checkCanvas(context, cw, ch) );
 }, 50);
};

/* Template */
describe('stream | methods', function () {
  this.timeout(testTimeout + 2000);
  this.slow(2000);

  var stream = null;

before(function (done)  {
  stream = new Stream();
  done();
});

/* Beginning of #start() */
describe('#start()', function () {

  it('is typeof "function"', function (done) {
    this.timeout(testItemTimeout);

    assert.typeOf(stream.start, 'function');

    done();
  });

  /* Beginning of parameters (JSON options) */
  describe('When parameters is (JSON options)', function () {

    var constraints = {
      audio: true,
      video: true
    };

    // requires auto getUserMedia
    it('triggers "streaming" event', function (done) {
      this.timeout(testItemTimeout);

      stream.once('streaming', function () {
        done();
      });

      stream.start(constraints);
    });

    it('#_constraints is typeof "object"', function (done) {
      this.timeout(testItemTimeout);

      assert.typeOf(stream._constraints, 'object');

      done();
    });

    it('#_constraints is a JSON object', function (done) {
      this.timeout(testItemTimeout);

      var resultStr = JSON.stringify(stream._constraints);

      expect(resultStr[0]).to.equal('{');
      expect(resultStr[resultStr.length - 1]).to.equal('}');

      done();
    });

    it('#_constraints to equal constraints passed in', function (done) {
      this.timeout(testItemTimeout);

      expect(stream._constraints).to.equal(constraints);

      done();
    });

    it('#readyState has a value of "streaming"', function (done) {
      this.timeout(testItemTimeout);

      expect(stream.readyState).to.equal('streaming');

      done();
    });

    it('#_objectRef is typeof "object"', function (done) {
      this.timeout(testItemTimeout);

      (typeof stream._objectRef).should.be.eql('object');

      done();
    });

    it('#_objectRef has getAudioTracks() function', function (done) {
      this.timeout(testItemTimeout);

      assert.typeOf(stream._objectRef.getAudioTracks, 'function');

      done();
    });

    it('#_objectRef has getVideoTracks() function', function (done) {
      this.timeout(testItemTimeout);

      assert.typeOf(stream._objectRef.getVideoTracks, 'function');

      done();
    });

  });
  /* End of parameters (JSON options) */

  /* Beginning of parameters (null, MediaStream object) */
  describe('When parameters is (null, MediaStream object)', function () {

    var constraints = {
      audio: true,
      video: true
    };
    var object = null;

    before(function (done) {
      window.getUserMedia(constraints, function (data) {
        object = data;
        done();
      }, function (error) {
        throw error;
      });
    });

    // requires auto getUserMedia
    it('triggers "streaming" event', function (done) {
      this.timeout(testItemTimeout);

      stream.once('streaming', function () {
        done();
      });

      stream.start(null, object);
    });

    it('#_constraints has a value of null', function (done) {
      this.timeout(testItemTimeout);

      expect(stream._constraints).to.equal(null);

      done();
    });

    it('#readyState has a value of "streaming"', function (done) {
      this.timeout(testItemTimeout);

      expect(stream.readyState).to.equal('streaming');

      done();
    });

    it('#_objectRef is typeof "object"', function (done) {
      this.timeout(testItemTimeout);

      (typeof stream._objectRef).should.be.eql('object');

      done();
    });

    it('#_objectRef has getAudioTracks() function', function (done) {
      this.timeout(testItemTimeout);

      assert.typeOf(stream._objectRef.getAudioTracks, 'function');

      done();
    });

    it('#_objectRef has getVideoTracks() function', function (done) {
      this.timeout(testItemTimeout);

      assert.typeOf(stream._objectRef.getVideoTracks, 'function');

      done();
    });

    it('#_objectRef is the same as provided MediaStream object', function (done) {
      this.timeout(testItemTimeout);

      (stream._objectRef).should.be.eql(object);

      done();
    });

  });
  /* End of parameters (null, MediaStream object) */

  /* Beginning of parameters (JSON options, MediaStream object) */
  describe('When parameters is (JSON options, MediaStream object)', function () {

    var constraints = {
      audio: true,
      video: true
    };

    var object = null;

    before(function (done) {
      window.getUserMedia(constraints, function (data) {
        object = data;
        done();
      }, function (error) {
        throw error;
      });
    });

    // requires auto getUserMedia
    it('triggers "streaming" event', function (done) {
      this.timeout(testItemTimeout);

      stream.once('streaming', function () {
        done();
      });

      stream.start(constraints, object);
    });

    it('#_constraints is typeof "object"', function (done) {
      this.timeout(testItemTimeout);

      assert.typeOf(stream._constraints, 'object');

      done();
    });

    it('#_constraints is a JSON object', function (done) {
      this.timeout(testItemTimeout);

      var resultStr = JSON.stringify(stream._constraints);

      expect(resultStr[0]).to.equal('{');
      expect(resultStr[resultStr.length - 1]).to.equal('}');

      done();
    });

    it('#_constraints to equal constraints passed in', function (done) {
      this.timeout(testItemTimeout);

      expect(stream._constraints).to.equal(constraints);

      done();
    });

    it('#readyState has a value of "streaming"', function (done) {
      this.timeout(testItemTimeout);

      expect(stream.readyState).to.equal('streaming');

      done();
    });

    it('#_objectRef is typeof "object"', function (done) {
      this.timeout(testItemTimeout);

      (typeof stream._objectRef).should.be.eql('object');

      done();
    });

    it('#_objectRef has getAudioTracks() function', function (done) {
      this.timeout(testItemTimeout);

      assert.typeOf(stream._objectRef.getAudioTracks, 'function');

      done();
    });

    it('#_objectRef has getVideoTracks() function', function (done) {
      this.timeout(testItemTimeout);

      assert.typeOf(stream._objectRef.getVideoTracks, 'function');

      done();
    });

    it('#_objectRef is the same as provided MediaStream object', function (done) {
      this.timeout(testItemTimeout);

      (stream._objectRef).should.be.eql(object);

      done();
    });

  });
  /* End of parameters (JSON options, MediaStream object) */

});
/* End of #start() */

/* Beginning of #attachStream() */
describe('#attachStream()', function () {

  var video = document.createElement('video');
  video.autoplay = 'autoplay';
  video.muted = 'muted';

  it('is typeof "function"', function (done) {
    this.timeout(testItemTimeout);

    assert.typeOf(stream.attachStream, 'function');

    done();
  });

  it('attaches stream to video element', function (done) {
    this.timeout(testItemTimeout);

    // only supported from IE 9.0 and above
    video.onplaying = function () {
      drawCanvas(video, function (hasStream) {
        expect(hasStream).to.equal(true);
        done();
      });
    };

    document.body.appendChild(video);

    // wait for a second because onplay is a <video> DOM event
    if (window.webrtcDetectedBrowser === 'IE' ||
      window.webrtcDetectedBrowser === 'safari') {
      setTimeout(function () {
        video.onplay();
      }, 1000);
    }

    stream.attachStream(video);
  });

  it('removes "muted" and "autoplay" for plugin objects', function (done) {
    this.timeout(testItemTimeout);

    // for IE / Safari plugin objects to be false
    if (window.webrtcDetectedBrowser === 'IE' ||
      window.webrtcDetectedBrowser === 'safari') {
      video.hasAttribute('autoplay').should.be.eql(false);
      video.hasAttribute('muted').should.be.eql(false);
    } else {
      // for chrome autoplay="autoplay" means true.
      // so expect it as autoplay
      expect(!!video.autoplay).to.equal(true);
      expect(!!video.muted).to.equal(true);
    }

    done();
  });

});
/* End of #attachStream() */

/* Beginning of #getVideoTracks() */
describe('#getAudioTracks()', function () {

  it('is typeof "function"', function (done) {
    this.timeout(testItemTimeout);

    assert.typeOf(stream.getAudioTracks, 'function');

    done();
  });

  it('returns the same tracks from #_audioTracks', function (done) {
    this.timeout(testItemTimeout);

    var tracks = stream.getAudioTracks();

    expect(tracks).to.deep.equal(stream._audioTracks);
    expect(tracks).to.have.length(stream._audioTracks.length);

    done();
  });

});
/* End of #getAudioTracks() */

/* Beginning of #getAudioTracks() */
describe('#getVideoTracks()', function () {

  it('is typeof "function"', function (done) {
    this.timeout(testItemTimeout);

    assert.typeOf(stream.getAudioTracks, 'function');

    done();
  });

  it('returns the same tracks from #_videoTracks', function (done) {
    this.timeout(testItemTimeout);

    var tracks = stream.getVideoTracks();

    expect(tracks).to.deep.equal(stream._videoTracks);
    expect(tracks).to.have.length(stream._videoTracks.length);

    done();
  });

});
/* End of #getVideoTracks() */

/* Beginning of #stop() */
describe('#stop()', function () {

  it('is typeof "function"', function (done) {
    this.timeout(testItemTimeout);

    assert.typeOf(stream.start, 'function');

    done();
  });

  it('triggers "stopped" event', function (done) {
    this.timeout(testItemTimeout);

    stream.once('stopped', function () {
      done();
    });

    stream.stop();
  });

  it('#readyState has a value of "stopped"', function (done) {
    this.timeout(testItemTimeout);

    expect(stream.readyState).to.equal('stopped');

    done();
  });

});
/* End of #stop() */
});
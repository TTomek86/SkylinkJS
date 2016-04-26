/**
 * Module that handles requests to API to start connection session.
 * @class SkylinkAPI
 * @private
 * @for Skylink
 * @since 0.7.0
 */
var SkylinkAPI = {
  /**
   * Function that builds the HTTP URL for the SDK to fetch and start connection session to.
   * @method URLBuilderFn
   * @param {JSON} options The parameter options.
   * @param {Boolean} forceSSL The <code>init()</code> <code>forceSSL</code> parameter option.
   * @param {String} appKey The <code>init()</code> <code>appKey</code> parameter option.
   * @param {String} roomServer The <code>init()</code> <code>roomServer</code> parameter option.
   * @param {String} region The <code>init()</code> <code>region</code> parameter option.
   * @param {JSON} credentials The <code>init()</code> <code>credentials</code> parameter option.
   * @param {String} selectedRoom The selected Room name to fetch and start connection session to.
   * @return {String} The generated HTTP URL based on options provided.
   * @private
   * @for SkylinkAPI
   * @since 0.7.0
   */
  URLBuilderFn: function (options) {
    var baseUrl = (options.forceSSL ? 'https:' : window.location.protocol),
        queries = ['rand=' + (new Date()).getTime()];

    // Append API url
    baseUrl += options.roomServer + '/api/' + options.appKey + '/' + options.selectedRoom;

    if (options.credentials) {
      baseUrl += '/' + options.credentials.startDateTime + '/' + options.credentials.duration;
      queries.splice(0, 0, 'cred=' + options.credentials.credentials);
    }

    if (options.region) {
      queries.splice(0, 0, 'rg=' + options.region);
    }

    return baseUrl + '?' + queries.join('&');
  },

  /**
   * Function that fetchs from HTTP URL (build from <code>options</code> parameter provided)
   *   to start connection session to.
   * @method URLBuilderFn
   * @param {JSON} options The parameter options.
   *   <small>See <code>URLBuilderFn()</code> function for full parameter options</small>
   * @param {Function} fn The parameter callback function that triggers on HTTP request state change.
   * @param {String} fn.state The callback function parameter payload to determine the current state
   *   of the HTTP request.<br>
   *   <blockquote class="sub">
   *   <code>"loading"</code>: The state when loading HTTP request.<br>
   *   <code>"loaded"</code>: The state when connection session has started.<br>
   *   <code>"error"</code>: The state when connection session has errors<br>
   *   <code>"retry"</code>: The state when retrying loading HTTP request when timeout.
   *     Maximum retries are <var>5</var></blockquote>
   * @param {JSON} fn.data The callback function parameter payload that contains the error object which
   *   follows the <code>readyStateChange</code> <code>error</code> event payload
   *   or the connection session data.
   * @private
   * @for SkylinkAPI
   * @since 0.7.0
   */
  requestFn: function (options, fn) {
    var self = this;
    var xhr = null,
        retries = 0;

    if (['object', 'function'].indexOf(typeof window.XDomainRequest) > -1) {
      xhr = new window.XDomainRequest();

    } else {
      xhr = new window.XMLHttpRequest();
    }

    var openFn = function () {
      var url = self.URLBuilderFn(options);

      fn('request', url);

      xhr.open('GET', url, true);
      xhr.send();
    };

    xhr.onload = function () {
      var result = JSON.parse(xhr.responseText || xhr.response || '{}');

      if (Object.keys(result).length === 0) {
        fn('error', {
          errorCode: Skylink.prototype.READY_STATE_CHANGE_ERROR.XML_HTTP_REQUEST_ERROR,
          content: new Error('Failed API request as loaded session is empty'),
          status: 0
        });
        return;
      }

      if (result.success) {
        fn('started', result);

      } else {
        fn('error', {
          errorCode: result.error,
          content: new Error(result.info),
          status: 200
        });
      }
    };

    xhr.onerror = function (error) {
      if (retries === 5) {
        fn('error', {
          errorCode: Skylink.prototype.READY_STATE_CHANGE_ERROR.XML_HTTP_REQUEST_ERROR,
          content: new Error('Failed API request as connection has timed out'),
          status: -1
        });
        return;
      }

      retries++;

      fn('restart', retries);

      openFn();
    };

    xhr.onprogress = function (evt) {
      fn('starting');
    };

    openFn();
  }

};
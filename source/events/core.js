var SkylinkEventList = {
  /**
   * Event triggered when room connection information is being retrieved from platform server.
   * - This is also triggered when <a href="#method_init">init()</a> is invoked, but
   *   the socket connection events like <a href="#event_channelOpen">channelOpen</a> does
   *   not get triggered but stops at <u>readyStateChange</u> event.
   * @event readyStateChange
   * @param {String} readyState The current ready state of the retrieval when the event is triggered.
   *   [Rel: Skylink.READY_STATE_CHANGE]
   * @param {JSON} [error=null] The error object thrown when there is a failure in retrieval.
   *   If received as <code>null</code>, it means that there is no errors.
   * @param {Number} error.status Http status when retrieving information.
   *   May be empty for other errors.
   * @param {Number} error.errorCode The
   *   <a href="#attr_READY_STATE_CHANGE_ERROR">READY_STATE_CHANGE_ERROR</a>
   *   if there is an <a href="#event_readyStateChange">readyStateChange</a>
   *   event error that caused the failure for initialising Skylink.
   *   [Rel: Skylink.READY_STATE_CHANGE_ERROR]
   * @param {Object} error.content The exception thrown that caused the failure
   *   for initialising Skylink.
   * @param {Number} error.status The XMLHttpRequest status code received
   *   when exception is thrown that caused the failure for initialising Skylink.
   * @param {String} room The selected room connection information that Skylink is attempting
   *   to retrieve the information for to start connection to.
   * @component Events
   * @for Skylink
   * @since 0.4.0
   */
  readyStateChange: []
};
/**
 * Handles the data chunking and conversion.
 * @attribute _DataPacker
 * @type JSON
 * @private
 * @for Skylink
 * @since 0.6.x
 */
Skylink.prototype._DataPacker = {

  /**
   * Chunks Blob object into smaller Blob data chunks.
   * @method chunkBlob
   * @param {Blob} blob The Blob data object.
   * @param {Number} chunkSize The Blob data chunk size to chunk into.
   * @return {Array} chunksArray The Array of Blob chunks.
   * @private
   * @for Skylink
   * @since 0.6.x
   */
  chunkBlob: function (blob, chunkSize) {
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

  /**
   * Chunks Data URI string into smaller strings.
   * @method chunkDataURI
   * @param {String} blob The Data URI string.
   * @param {Number} chunkSize The Data URI string chunk size to chunk into.
   * @return {Array} chunksArray The Array of Data URI chunks.
   * @private
   * @for Skylink
   * @since 0.6.x
   */
  chunkDataURI: function (dataURL, chunkSize) {
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

  /**
   * Converts the base64 encoded string into Blob data chunk object.
   * @method base64ToBlob
   * @param {String} base64String The base64 encoded string.
   * @return {Blob} chunk The Blob data chunk.
   * @private
   * @for Skylink
   * @since 0.6.x
   */
  base64ToBlob: function (base64String) {
    var byteString = atob(base64String.replace(/\s\r\n/g, ''));
    // write the bytes of the string to an ArrayBuffer
    var ab = new ArrayBuffer(byteString.length);
    var ia = new Uint8Array(ab);
    for (var j = 0; j < byteString.length; j++) {
      ia[j] = byteString.charCodeAt(j);
    }
    // write the ArrayBuffer to a blob, and you're done
    return new Blob([ab]);
  },

  /**
   * Converts the Blob data chunk into base64 encoded string.
   * @method blobToBase64
   * @param {String} base64String The Blob data chunk.
   * @param {Function} fn The callback function triggered when conversion is completed.
   *   The callback function signature is: (<code>base64String</code>).
   *   The <code>base64String</code> is the converted base64 encoded string.
   * @return {Blob} chunk The Blob data chunk.
   * @private
   * @for Skylink
   * @since 0.6.x
   */
  blobToBase64: function (blob, fn) {
    var fileReader = new FileReader();
    fileReader.onload = function() {
      // Load Blob as dataurl base64 string
      fn(fileReader.result.split(',')[1]);
    };
    fileReader.readAsDataURL(blob);
  }

};
var skylink = new Skylink();

skylink.on('readyStateChange', function (state, error, room) {
  console.info('readyStateChange', state, error, room);
});

function generateCreds (room, duration, startDateTime) {
  var concatStr = room + '_' + duration + '_' + startDateTime;
  //! Do not EXPOSE to any users
  var hash = CryptoJS.HmacSHA1(concatStr, 'ddzawg4yasmj9');
  var base64String = hash.toString(CryptoJS.enc.Base64);
  return encodeURIComponent(base64String);
}
//! This is the Room name that will only be joined for the connection session
var room  = 'testlet', //
    credentials  = {
     //! Set as 2 Hours.
      duration: 2,
      //! Currently is configure for Now. Can be configured with any starting date if preferred.
      startDateTime: (new Date()).toISOString(),
      credentials: null
    };
credentials.credentials = generateCreds(room, credentials.duration, credentials.startDateTime);


skylink.init({
  roomServer: '//staging-api.temasys.com.sg',
  appKey: config.appKey,
  defaultRoom: room
});

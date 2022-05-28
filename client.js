const Ably = require("ably");

// Creating a client with token based auth, way to renew token using API_KEY
const ablyClient = new Ably.Realtime({
  defaultTokenParams: {ttl: 20000, capability: '{"*":["*"]}'},
  queryTime: true,
  useTokenAuth : true,
  key: '',
  // log: {
  //   "level": 3, // debug
  //   "handler": (msg)=> {
  //     console.log(msg);
  //   }
  // }
});

// listen to all events on connection
ablyClient.connection.on((eventName, error)=> {
  console.log("Connection event :: ", eventName, " error :: ", error);
});

const ablyChannel = ablyClient.channels.get("channel1");
ablyChannel.subscribe(function(message) {
  console.log('channel1 message :: ' + message.name + ', data :: ' + JSON.stringify(message.data));
}); 
ablyChannel.on((eventName, error)=> {
  console.log("channel1 event :: ", eventName, " error :: ", error);
});

setTimeout(() => {
  console.log("Explicitly authorizing with capability");
  ablyClient.auth.authorize({ttl: 19000, capability: '{"*":["*"]}'});
}, 2000);

// ably.auth.requestToken({clientId: '1234', ttl: 10000}, function(err, tokenDetails) {
//   // tokenDetails is instance of TokenDetails
//   // see https://www.ably.com/docs/rest/authentication/#token-details for its properties

//   // Now we have the token, we can send it to someone who can instantiate a client with it:
// })

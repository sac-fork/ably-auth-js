const Ably = require("ably");
const { beforeChannelAttach } = require('./auth-utils');
const { getSignedToken } = require("./mock-auth-server");

// Creating a client with token based auth using authCallback
const ablyClient = new Ably.Realtime({
  queryTime: true,
  useTokenAuth: true,
  authCallback: async (tokenParams, callback) => {
    try {
      const token = await getSignedToken(); // Replace this by network request to PHP server
      callback(null, token);
    } catch (error) {
      callback(error, null);
    }
  }
  // log: {
  //   "level": 3, // debug
  //   "handler": (msg)=> {
  //     console.log(msg);
  //   }
  // }
});

// listen to all events on connection
ablyClient.connection.on((stateChange, error) => {
  console.log("Connection event :: ", stateChange, " error :: ", error);
  if (stateChange.current == 'disconnected' && stateChange.reason?.code == 40142) { // key/token status expired
    console.log("Connection token expired https://help.ably.io/error/40142");
  }
});

beforeChannelAttach(ablyClient, (realtimeChannel, errorCallback) => {
  if (realtimeChannel.name.startsWith("public:")) {
    errorCallback(null)
  }
  // Write custom logic here
  console.log(`Written some custom logic for channel before attach :: ${realtimeChannel.name}`)
  errorCallback(null)
  //
});

const ablyChannel = ablyClient.channels.get("channel1");
ablyChannel.subscribe(function (message) {
  console.log('channel1 message :: ' + message.name + ', data :: ' + JSON.stringify(message.data));
});

ablyChannel.on((eventName, error) => {
  console.log("channel1 event :: ", eventName, " error :: ", error);
  const stateChange = eventName;
  if (stateChange.current == 'failed' && stateChange.reason?.code == 40160) {
    console.log("Channel denied access based on given capability https://help.ably.io/error/40160");
  }
});

// setTimeout(() => {
//   console.log("Explicitly authorizing with capability");
//   ablyClient.auth.authorize({ ttl: 2000, capability: '{"channel":["*"]}' });
// }, 4000);

// ably.auth.requestToken({clientId: '1234', ttl: 10000}, function(err, tokenDetails) {
//   // tokenDetails is instance of TokenDetails
//   // see https://www.ably.com/docs/rest/authentication/#token-details for its properties

//   // Now we have the token, we can send it to someone who can instantiate a client with it:
// })

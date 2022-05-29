const Ably = require("ably");
const { beforeChannelAttach, toTokenDetails } = require('./auth-utils');
const { getSignedToken } = require("./mock-auth-server");

// Creating a client with token based auth using authCallback

let catcheToken = null;
const authOptions = {
  queryTime: true,
  useTokenAuth: true,
  authCallback: async (_, callback) => { // get token from tokenParams
    try {
      const jwtToken = await getSignedToken(null, catcheToken); // Replace this by network request to PHP server
      catcheToken = jwtToken;
      const tokenDetails = toTokenDetails(jwtToken);
      callback(null, tokenDetails);
    } catch (error) {
      callback(error, null);
    }
  }
}

const ablyClient = new Ably.Realtime({
  ...authOptions
  // log: {
  //   "level": 3, // debug
  //   "handler": (msg)=> {
  //     console.log(msg);
  //   }
  // }
});

// listen to all events on connection
ablyClient.connection.on((stateChange, error) => {
  console.log("LOGGER:: Connection event :: ", stateChange, " error :: ", error);
  if (stateChange.current == 'disconnected' && stateChange.reason?.code == 40142) { // key/token status expired
    console.log("LOGGER:: Connection token expired https://help.ably.io/error/40142");
  }
});



beforeChannelAttach(ablyClient, (realtimeChannel, errorCallback) => {
  const channelName = realtimeChannel.name;
  if (channelName.startsWith("public:")) {
    errorCallback(null)
  }

  // Use cached token if has channel capability and is not expired
  const token = ablyClient.auth.tokenDetails;
  if (token) {
    const tokenHasChannelCapability = token.capability.includes(channelName);
    if (tokenHasChannelCapability && token.expires >= Date.now()) { // TODO : Replace with server time
      errorCallback(null)
    }
  }

  console.log(`LOGGER :: Written some custom logic for channel before attach :: ${channelName}`);
  // explicitly request token for given channel name
  getSignedToken(channelName, catcheToken).then(jwtToken => { // get upgraded token with channel access
    catcheToken = jwtToken;
    ablyClient.auth.authorize(null, {...authOptions, token: toTokenDetails(jwtToken)}, (err, tokenDetails) => {
      if (err) {
        errorCallback(err);
      } else {
        errorCallback(null)
      }
    });
  })
});

const ablyChannel = ablyClient.channels.get("channel1");
ablyChannel.subscribe(function (message) {
  console.log('LOGGER :: channel1 message :: ' + message.name + ', data :: ' + JSON.stringify(message.data));
});

ablyChannel.on((eventName, error) => {
  console.log("LOGGER :: event :: ", eventName, " error :: ", error);
  const stateChange = eventName;
  if (stateChange.current == 'failed' && stateChange.reason?.code == 40160) {
    console.error("LOGGER :: Channel denied access based on given capability https://help.ably.io/error/40160");
    console.log("LOGGER :: Forced requesting new token for channel");
    const channelName = ablyChannel.name;
    getSignedToken(channelName, catcheToken).then(jwtToken => { // get upgraded token with channel access
      catcheToken = jwtToken;
      ablyClient.auth.authorize(null, {...authOptions, token: toTokenDetails(jwtToken)}, (err, tokenDetails) => {
        if (err) {
          console.error("LOGGER :: Error authorizing channel token", err);
        } else {
          console.log('LOGGER :: attaching channel after getting token');
          ablyChannel.attach(err=> {
            if (err) {
            console.error("Error with attaching the channel", err);
            }
          })
        }
      });
    });
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

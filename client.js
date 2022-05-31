const Ably = require("ably");
const { beforeChannelAttach, toTokenDetails } = require('./auth-utils');
const {SequentialAuthTokenRequestExecuter} = require('./token-request');

// Creating a client with token based auth using authCallback

let catcheToken = null;
const authRequestExecuter = new SequentialAuthTokenRequestExecuter();
const authOptions = {
  queryTime: true,
  useTokenAuth: true,
  authCallback: async (_, callback) => { // get token from tokenParams
    try {
      const jwtToken = await authRequestExecuter.request(null); // Replace this by network request to PHP server
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
ablyClient.connection.on((stateChange) => {
  console.log("LOGGER:: Connection event :: ", stateChange);
  if (stateChange.current == 'disconnected' && stateChange.reason?.code == 40142) { // key/token status expired
    console.log("LOGGER:: Connection token expired https://help.ably.io/error/40142");
  }
});


beforeChannelAttach(ablyClient, (realtimeChannel, errorCallback) => {
  const channelName = realtimeChannel.name;
  if (channelName.startsWith("public:")) {
    console.log('LOGGER :: PUBLIC CHANNEL SKIPPING TOKEN CHANNEL AUTH', channelName);
    errorCallback(null);
    return;
  }

  // Use cached token if has channel capability and is not expired
  const token = ablyClient.auth.tokenDetails;
  if (token) {
    const tokenHasChannelCapability = token.capability.includes(channelName);
    if (tokenHasChannelCapability && token.expires >= Date.now()) { // TODO : Replace with server time
      console.log('LOGGER :: USING CACHED TOKEN FOR CHANNEL :: ', channelName)
      errorCallback(null);
      return;
    }
  }

  console.log(`LOGGER :: REQUESTING SIGNED TOKEN FOR :: ${channelName}`);
  // explicitly request token for given channel name
  authRequestExecuter.request(channelName).then(jwtToken => { // get upgraded token with channel access
    catcheToken = jwtToken;
    ablyClient.auth.authorize(null, { ...authOptions, token: toTokenDetails(jwtToken) }, (err, tokenDetails) => {
      if (err) {
        errorCallback(err);
      } else {
        errorCallback(null);
      }
    });
  })
});

const onChannelFailed = (ablyChannel) => stateChange => {
  console.log("Called on channel failed");
  if (stateChange.reason?.code == 40160) { // channel capability rejected https://help.ably.io/error/40160
    handleChannelAuthError(ablyChannel);
  }
}

const onStateChange = (ablyChannel) => stateChange => {
   console.log("LOGGER :: CHANNEL STATE CHANGE :: ", stateChange, " CHANNEL NAME :: ", ablyChannel.name);
}

const publicChannel = ablyClient.channels.get("public:channel");
publicChannel.on("failed", onChannelFailed(publicChannel));
publicChannel.on(onStateChange(publicChannel));
publicChannel.subscribe(function (message) {
  console.log('LOGGER :: publicChannel message :: ' + message.name + ', data :: ' + JSON.stringify(message.data));
});

const privateChannel = ablyClient.channels.get("private:channel");
privateChannel.on("failed", onChannelFailed(privateChannel));
privateChannel.on(onStateChange(privateChannel));
privateChannel.subscribe(function (message) {
  console.log('LOGGER :: privateChannel:channel message :: ' + message.name + ', data :: ' + JSON.stringify(message.data));
});


const privateChannel2 = ablyClient.channels.get("private:channel2");
privateChannel2.on("failed", onChannelFailed(privateChannel2));
privateChannel2.on(onStateChange(privateChannel2));
privateChannel2.subscribe(function (message) {
  console.log('LOGGER :: privateChannel2:channel message :: ' + message.name + ', data :: ' + JSON.stringify(message.data));
});

const handleChannelAuthError = (realtimeChannel) => {
  console.error("LOGGER :: Channel denied access based on given capability https://help.ably.io/error/40160");
  console.log("LOGGER :: Forced requesting new token for channel");
  const channelName = realtimeChannel.name;
  authRequestExecuter.request(channelName).then(jwtToken => { // get upgraded token with channel access
    catcheToken = jwtToken;
    ablyClient.auth.authorize(null, { ...authOptions, token: toTokenDetails(jwtToken) }, (err, tokenDetails) => {
      if (err) {
        console.error("LOGGER :: Error authorizing channel token", err);
      } else {
        console.log('LOGGER :: attaching channel after getting token');
        realtimeChannel.attach(err => {
          if (err) {
            console.error("Error with attaching the channel", err);
          } else {
            console.log("LOGGER :: Attached channel without any issues");
          }
        })
      }
    });
  });
}


// setTimeout(() => {
//   console.log("Explicitly authorizing with capability");
//   ablyClient.auth.authorize({ ttl: 2000, capability: '{"channel":["*"]}' });
// }, 4000);

// ably.auth.requestToken({clientId: '1234', ttl: 10000}, function(err, tokenDetails) {
//   // tokenDetails is instance of TokenDetails
//   // see https://www.ably.com/docs/rest/authentication/#token-details for its properties

//   // Now we have the token, we can send it to someone who can instantiate a client with it:
// })

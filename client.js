const Ably = require("ably");

/* ABLY CLIENT LIB */
/* Instance the Ably library */
const ably = new Ably.Realtime(); // provide authUrl or authCallBack for receiving token

/* Subscribe to the 'some_channel' channel with the Ably client */
// const ablyChannel = ably.channels.get(ablyChannelName);
// ablyChannel.subscribe(function(message) {
//   console.log('Ably client received a message: ' + message.name + ', data: ' + JSON.stringify(message.data));
// });

ably.auth.requestToken(function(err, tokenDetails) {
  // tokenDetails is instance of TokenDetails
  // see https://www.ably.com/docs/rest/authentication/#token-details for its properties

  // Now we have the token, we can send it to someone who can instantiate a client with it:
  console.error(err);
  console.log(tokenDetails)
  // var clientUsingToken = new Ably.Realtime(tokenDetails.token);
})

const main = async() => {
  try {
  const token = await ably.auth.requestToken();
  console.log('token is ', token);
  } catch(e) {
    console.error(e)
  }
}

main()
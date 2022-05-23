const Ably = require("ably");

/* ABLY CLIENT LIB */
/* Instance the Ably library */
const ably = new Ably.Realtime(); // provide authUrl or authCallBack for receiving token

/* Subscribe to the 'some_channel' channel with the Ably client */
// const ablyChannel = ably.channels.get(ablyChannelName);
// ablyChannel.subscribe(function(message) {
//   console.log('Ably client received a message: ' + message.name + ', data: ' + JSON.stringify(message.data));
// });

const main = async() => {
  try {
  const token = await ably.auth.requestToken();
  console.log('token is ', token);
  } catch(e) {
    console.error(e)
  }
}

main()
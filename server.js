const express = require("express");
const cors = require("cors");

const API_KEY = 'appid.keyid:keysecret'; // Replace this with your API key
const ablyRest = new Ably.Realtime(API_KEY);

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());

// test ping-pong message
app.get("/ping", (_req, res) => {
  res.send("pong");
});

// auth method for accepting active channel, channel names and current token, returns token
app.post("/ably/auth", (req, res) => {
  ablyRest.auth.createTokenRequest(function(err, tokenRequest) {
    // now send the tokenRequest back to the client, which will
    // use it to request a token and connect to Ably
  });
});

const port = process.env.PORT || 5000;
app.listen(port, (error) => {       // Listen
  if(!error) {
      console.log(`Server is Successfully Running, and App is listening on port ${port}`);
  }
   else {
      console.log("Error occured, server can't start", error);
    }
  }
);
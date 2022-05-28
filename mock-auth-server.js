const { isNullOrUndefinedOrEmpty, signJWT } = require("./auth-utils");
const Ably = require("ably/promises");

const API_KEY = '';
const APP_ID = API_KEY.split('.')[0],
    KEY_PARTS = API_KEY.split(':'),
    KEY_NAME = KEY_PARTS[0],
    KEY_SECRET = KEY_PARTS[1];

const ablyClient = new Ably.Rest(API_KEY);

const tokenInvalidOrExpired = (_) => false;
const clientId = 'sacdaddy@gmail.com'

const getSignedToken = async (channelName = null, token = null) => {
    const header = {
        "typ":"JWT",
        "alg":"HS256",
        "kid": KEY_NAME
    }
    let channelClaims = new Set(['"public:*":["*"]']);
    let iat = 0;
    let expired = 0;
    if (!isNullOrUndefinedOrEmpty(token) && !tokenInvalidOrExpired(token)) {
        // get existing claims from the token
        // set iat from the token
        // set expiry from exisiting token 
    }
    if (iat == 0) {
        const time = await ablyClient.time();
        iat = Math.round(time/1000);
        exp = iat + 3600; /* time of expiration in seconds */
    }
    if (!isNullOrUndefinedOrEmpty(channelName)) {
        channelClaims.add(`{"${channelName}":["*"]}`)
    }
    const capabilities = Array.from(channelClaims).join(',');
    const claims = {
        iat,
        exp,
        "x-ably-clientId": clientId,
        "x-ably-capability": `{${capabilities}}`
    }
    return signJWT(header, claims, KEY_SECRET);
}

module.exports = { getSignedToken }
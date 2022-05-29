const { isNullOrUndefinedOrEmpty, parseJwt} = require("./auth-utils");
const Ably = require("ably/promises");
const jwt = require("jsonwebtoken");

const API_KEY = '';
const APP_ID = API_KEY.split('.')[0],
    KEY_PARTS = API_KEY.split(':'),
    KEY_NAME = KEY_PARTS[0],
    KEY_SECRET = KEY_PARTS[1];

const ablyClient = new Ably.Rest(API_KEY);

const tokenInvalidOrExpired = (serverTime, token) => {
    const parsedJwt = parseJwt(token);
    return parsedJwt.exp * 1000 <= serverTime;
};

const clientId = 'sacdaddy@gmail.com'

const getSignedToken = async (channelName = null, token = null) => {
    const header = {
        "typ":"JWT",
        "alg":"HS256",
        "kid": KEY_NAME
    }
    let channelClaims = new Set(['"public:*":["*"]']);
    let iat = 0;
    let exp = 0;
    let serverTime = await ablyClient.time();
    if (!isNullOrUndefinedOrEmpty(token) && !tokenInvalidOrExpired(serverTime, token)) {
        const parsedJwt = parseJwt(token);
        iat = parsedJwt.iat;
        exp = parsedJwt.exp;
        channelClaims = new Set(parsedJwt['x-ably-capability'].slice(1, -1).split(','));
    }
    if (iat == 0) {
        iat = Math.round(serverTime/1000);
        exp = iat + 4; /* time of expiration in seconds */
    }
    if (!isNullOrUndefinedOrEmpty(channelName)) {
        channelClaims.add(`"${channelName}":["*"]`)
    }
    const capabilities = Array.from(channelClaims).join(',');
    const claims = {
        iat,
        exp,
        "x-ably-clientId": clientId,
        "x-ably-capability": `{${capabilities}}`
    }
    // signJWT(header, claims, KEY_SECRET); broken
    return jwt.sign(claims, KEY_SECRET, {header});
}

module.exports = { getSignedToken }
const { createHmac } = require('crypto');

const isNullOrUndefined = (obj) => obj == null || obj === undefined;
let isEmptyString = (stringToCheck, ignoreSpaces = true) => (ignoreSpaces ? stringToCheck.trim() : stringToCheck) === '';
const isNullOrUndefinedOrEmpty = (obj) => obj == null || obj === undefined || isEmptyString(obj);

const beforeChannelAttach = (ablyClient, authorize) => {
    const dummyRealtimeChannel = ablyClient.channels.get("dummy");
    const internalAttach = dummyRealtimeChannel.__proto__._attach; // get parent class method, store it in temp. variable
    if (isNullOrUndefined(internalAttach)) {
        console.warn("channel internal attach function not found, please check for right library version")
        return;
    }
    function customInternalAttach(forceReattach, attachReason, errCallback) {// Define new function that needs to be added
        const bindedInternalAttach = internalAttach.bind(this); // bind object instance at runtime based on who calls printMessage
        // custom logic before attach
        authorize(this, (error) => {
            if (error) {
                errCallback(error);
                return;
            } else {
                bindedInternalAttach(forceReattach, attachReason, errCallback);// call internal function here
            }
        })
    }
    dummyRealtimeChannel.__proto__._attach = customInternalAttach; // add updated extension method to parent class, auto binded
}

const parseJwt = (token) => {
    try {
        // Get Token Header
        const base64HeaderUrl = token.split('.')[0];
        const base64Header = base64HeaderUrl.replace('-', '+').replace('_', '/');
        const headerData = JSON.parse(atob(base64Header));

        // Get Token payload and date's
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace('-', '+').replace('_', '/');
        const dataJWT = JSON.parse(atob(base64));
        dataJWT.header = headerData;

        // TODO: add expiration at check ...

        return dataJWT;
    } catch (err) {
        return false;
    }
}

// Broken, needs to be fixed as per jwt.sign();
const signJWT = (header, claims, privateKey) => {
    const base64Header = btoa(JSON.stringify(header));
    const base64Claims = btoa(JSON.stringify(claims));
    const signature = hash((base64Header + "." + base64Claims), privateKey);
    return base64Header + "." + base64Claims + "." + signature;
}

function hash(text, privateKey) {
    return createHmac('sha256', privateKey).update(text).digest('hex');
}

const btoa = (text) => {
    return Buffer.from(text, 'binary').toString('base64');
};

const atob = (base64) => {
    return Buffer.from(base64, 'base64').toString('binary');
};

const isTokenExpired = () => {

}

const hasAccessToClaim = (ChannelName) => {

}

module.exports = { isNullOrUndefined, beforeChannelAttach, isNullOrUndefinedOrEmpty,
     isTokenExpired, hasAccessToClaim, signJWT, hash }
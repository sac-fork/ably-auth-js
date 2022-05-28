const isNullOrUndefined = (obj) => obj == null || obj === undefined;

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

module.exports = { isNullOrUndefined, beforeChannelAttach }
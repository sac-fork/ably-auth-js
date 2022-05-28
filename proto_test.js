class Message {
    constructor(message) {
        this.message = message;
    }
    printMessage () { return this.message}; // mock function that returns message instead of priting it
}

const hello = new Message("Hey there");
const bye = new Message("Bye there");
const messageFn = hello.__proto__.printMessage; // get parent class method, store it in temp. variable

function printMessage() {                   // Define new function that needs to be added
    // Write custom logic here
    const bindedMessageFn = messageFn.bind(this); // bind object instance at runtime based on who calls printMessage
    console.log(bindedMessageFn());               // call internal function here
}

hello.__proto__.printMessage = printMessage; // add updated extension method to parent class, auto binded

hello.printMessage();
bye.printMessage();
const promise = new Promise(async (resolve, reject) => {
    const value = Promise.resolve(5);
    resolve(value)
})

promise.then(message => console.log(message));

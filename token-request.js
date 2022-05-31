const { getSignedToken } = require("./mock-auth-server");

class SequentialAuthTokenRequestExecuter {
    cachedToken = null;

    constructor(token) {
        this.cachedToken = token;
        this.queue = new TaskQueue();
    }

    execute = (tokenRequestFn) => new Promise(async (resolve, reject) => {
        await this.queue.run(tokenRequestFn, async (reqFn) => {
            try {
                const token = await reqFn(this.cachedToken);
                this.cachedToken = token;
                resolve(token);
            } catch (err) {
                reject(err);
            }
        })
    })

    request = channelName => this.execute(token => getSignedToken(channelName, token));
}

function TaskQueue(tasks = [], concurrentCount = 1) {
    this.total = tasks.length;
    this.todo = tasks;
    this.running = [];
    this.count = concurrentCount;
}

TaskQueue.prototype.runNext = function () {
    return ((this.running.length < this.count) && this.todo.length);
}

TaskQueue.prototype.run = async function (task, executer) {
    if (task) {
        this.todo.push({ task, executer });
    }
    while (this.runNext()) {
        const { task, executer } = this.todo.shift();
        this.running.push(task);
        await executer(task);
        this.running.shift();
    }
}

module.exports = { SequentialAuthTokenRequestExecuter };
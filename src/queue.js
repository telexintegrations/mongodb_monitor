class TaskQueue {
    constructor() {
        this.queue = [],
        this.processing = false
    }

    //adding task to our queue
    async addTask(task) {
        this.queue.push(task);
        if (!this.processing) {
            this.processQueue();
        }
    }

    //run the queue one by one according to the First in, First out rule to avoid process delay and backlog
    async processQueue() {
        if (this.queue.length === 0) {
            this.processing = false;
            return;
        }

        this.processing = true;
        const task = this.queue.shift();

        try {
            await task();
        } catch (error) {
            console.log(`Process error: ${error}`);
        }

        this.processQueue();
    }

}

const taskQueue = new TaskQueue();

module.exports = taskQueue;
var Client =  require('ssh2').Client;
var uuid = require('node-uuid');

module.exports = (function () {
    function PromisedSSH(options) {
        this.host = options.host;
        this.port = options.port;
        this.username = options.username;
        this.privateKey = options.privateKey;

        this.maxConcurrent = 3;

        this.connection = new Client();
        this.connected = false;

        this.tasks = {
            data: {},
            order: []
        };
    }

    PromisedSSH.prototype.connect = function (callbacks) {
        var that = this;

        this.connection.on('ready', function() {
            that.connected = true;

            that.runTasks();

            if(callbacks && callbacks.success) {
                callbacks.success();
            }
        });

        this.connection.on('error', function(error) {
            that.connected = false;

            if(callbacks && callbacks.error) {
                callbacks.error(error.message);
            }
        });

        this.connection.on('close', function(hadError) {
            that.connected = false;
        });

        try {
            this.connection.connect({
                host: this.host,
                port: this.port,
                username: this.username,
                privateKey: this.privateKey
            });
        } catch(error) {
            if(callbacks && callbacks.error) {
                callbacks.error(error.message);
            }
        }
    };

    PromisedSSH.prototype.addTask = function(command, callbacks) {
        var id = uuid.v4();

        var task = {
            status: 'pending',
            command: command,
            callbacks: callbacks,
            outputIsError: false,
            data: ''
        }

        this.tasks.order.push(id);
        this.tasks.data[id] = task;

        this.runTasks();
    };

    PromisedSSH.prototype.findTasks = function(criteria) {
        var results = [];

        var that = this;

        // iterate through all the tasks
        this.tasks.order.forEach(function(id) {
            var task = that.tasks.data[id];

            results.push(id);

            // iterate through criteria
            // in case of mismatch ID will be removed from results
            for (var key in criteria) {
                if(typeof task[key] === 'undefined' || task[key] !== criteria[key]) {
                    results.pop();
                }
            }
        });

        return results;
    };

    PromisedSSH.prototype.runTasks = function() {
        if(this.connected === false) {
            return false;
        }

        var pendingTasks = this.findTasks({
            status: "pending"
        });

        var ongoingTasks = this.findTasks({
            status: "ongoing"
        });

        var that = this;

        var tasksToRunCount = Math.min(pendingTasks.length, this.maxConcurrent - ongoingTasks.length);

        for (var i = 0; i < tasksToRunCount; i++) {
            var id = pendingTasks[i];

            this.executeTask(id);
        }
    }

    PromisedSSH.prototype.executeTask = function(id) {
        var that = this;

        var task = this.tasks.data[id];

        task.status = 'ongoing';

        this.connection.exec(task.command, function(err, stream) {
            if(err) {
                task.data = err;

                that.completeTask(id);
            }

            stream.on('close', function(code, signal) {
                that.completeTask(id);
            });

            stream.on('data', function(data) {
                task.data += data;
            });

            stream.stderr.on('data', function(error) {
                task.outputIsError = true;
                task.data += error;
            });
        });
    };

    PromisedSSH.prototype.completeTask = function(id) {
        var task = this.tasks.data[id];

        task.status = 'done';

        if(!task.outputIsError) {
            if(task.callbacks && task.callbacks.success) {
                task.callbacks.success(task.data);
            }
        } else {
            if(task.callbacks && task.callbacks.error) {
                task.callbacks.error(task.data);
            }
        }

        this.runTasks();
    };

    return PromisedSSH;
})();

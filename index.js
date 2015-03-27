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

        this.tasks = {};
        this.order = [];
    }

    PromisedSSH.prototype.connect = function (callback) {
        var that = this;

        this.connection.on('ready', function() {
            that.connected = true;

            that.runTasks();

            if(callback) {
                callback();
            }
        });

        this.connection.on('error', function(error) {
            that.connected = false;

            if(callback) {
                callback(error.toString());
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

    PromisedSSH.prototype.disconnect = function() {
        this.connection.end();
    };

    PromisedSSH.prototype.addTask = function(command, callback) {
        var id = uuid.v4();

        var task = {
            status: 'pending',
            command: command,
            callback: callback,
            stdout: '',
            stderr: ''
        }

        this.order.push(id);
        this.tasks[id] = task;

        this.runTasks();
    };

    PromisedSSH.prototype.findTasks = function(criteria) {
        var results = [];

        var that = this;

        // iterate through all the tasks
        this.order.forEach(function(id) {
            var task = that.tasks[id];

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

        var task = this.tasks[id];

        task.status = 'ongoing';

        this.connection.exec(task.command, function(err, stream) {
            if(err) {
                task.stderr = err.toString();

                that.completeTask(id, "aborted");
            } else {
                stream.on('close', function(code, signal) {
                    that.completeTask(id, "done");
                });

                stream.on('data', function(data) {
                    task.stdout += data;
                });

                stream.stderr.on('data', function(error) {
                    task.stderr += error;
                });
            }
        });
    };

    PromisedSSH.prototype.completeTask = function(id, status) {
        var task = this.tasks[id];

        task.status = status;

        if(task.callback) {
            task.callback(task.stdout, task.stderr);
        }

        this.runTasks();
    };

    return PromisedSSH;
})();

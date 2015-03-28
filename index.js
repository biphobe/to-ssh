var Client =  require('ssh2').Client;
var uuid = require('node-uuid');

module.exports = (function () {
    function ToSSH(options) {
        this.host = options.host;
        this.port = options.port ? options.port : 22;
        this.username = options.username ? options.username : 'root';
        this.parallel = options.parallel ? options.parallel : 1;

        if(options.password) {
            this.password = options.password;
        }

        if(options.passphrase) {
            this.passphrase = options.passphrase;
        }

        if(options.privateKey) {
            this.privateKey = options.privateKey;
        }

        this.connection = new Client();
        this.connected = false;

        this.tasks = {};
        this.order = [];
    }

    ToSSH.prototype.connect = function (callback) {
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
            var connectionOptions = {
                host: this.host,
                port: this.port,
                username: this.username
            };

            if(typeof this.password !== "undefined") {
                connectionOptions.password = this.password;
            }

            if(typeof this.passphrase !== "undefined") {
                connectionOptions.passphrase = this.passphrase;
            }

            if(typeof this.passphrase !== "undefined") {
                connectionOptions.passphrase = this.passphrase;
            }

            if(typeof this.privateKey !== "undefined") {
                connectionOptions.privateKey = this.privateKey;
            }

            this.connection.connect(connectionOptions);
        } catch(error) {
            if(callback) {
                callback(error.toString());
            }
        }
    };

    ToSSH.prototype.disconnect = function() {
        this.connection.end();
    };

    ToSSH.prototype.addTask = function(command, callback) {
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

    ToSSH.prototype.findTasks = function(criteria) {
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

    ToSSH.prototype.runTasks = function() {
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

        var tasksToRunCount = Math.min(pendingTasks.length, this.parallel - ongoingTasks.length);

        for (var i = 0; i < tasksToRunCount; i++) {
            var id = pendingTasks[i];

            this.executeTask(id);
        }
    }

    ToSSH.prototype.executeTask = function(id) {
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

    ToSSH.prototype.completeTask = function(id, status) {
        var task = this.tasks[id];

        task.status = status;

        if(task.callback) {
            task.callback(task.stdout, task.stderr);
        }

        this.runTasks();
    };

    return ToSSH;
})();

# Task-Oriented SSH

## Description

Simple and easy to use SSH2 wrapper for [node.js](http://nodejs.org/).

Why task-oriented? Because each command you want to invoke is being added to the queue as task to run - it's for the sole purpose of giving you the ability to manipulate concurrency.

You can add 5 tasks to queue and run them all in the same time or run them one by one. It's up to you.

## Requirements

* [node.js](http://nodejs.org/) - v0.8.7 or newer ([@todo] - check it - may run on even lower versions)

## Installation

```bash
$ npm install to-ssh
```

Remember to load the library:

```javascript
var ToSSH = require('to-ssh');
```

## Features

* Handles multiple connections to different hosts in the same time
* Can queue requests or send them in parallel
* Runs callbacks asynchronously
* Easy to implement, use and maintain

# API & Examples

## Examples

```javascript
var ssh = new ToSSH({
    host: "http://github.com",
    privateKey: fs.readFileSync({{ path-to-your-key }})
});

ssh.connect();

ssh.addTask('whoami', function(data, error) {
    if(!error) {
        console.log(data); // "root"
    }
});
```

```javascript
var ssh = new ToSSH({
    host: "http://github.com",
    privateKey: fs.readFileSync({{ path-to-your-key }})
    port: 22,
    username: "root"
    parallel: 2
    // password: ''
    // passphrase: ''
});

ssh.connect(function(hasError) {
    if(!hasError) {
        console.log("Connection established!");
    }
});

ssh.addTask('sleep 2; date +"%T"'); // 19:23:28\n
ssh.addTask('sleep 2; date +"%T"'); // 19:23:28\n
ssh.addTask('sleep 2; date +"%T"'); // 19:23:30\n
ssh.addTask('sleep 2; date +"%T"'); // 19:23:30\n

ssh.disconnect();
```

## API

#### constructor: new ToSSH(options)
- `options` **{object}** - _required_ - object with options necessary to establish connection
    - options.`host` **{string}** - _required_ - hostname
    - options.`username` **{string}** - _required_ - username; **default:** "root"
    - options.`privateKey` **{string}** - _optional_ - path to your private key; **default:** null
    - options.`port` **{number}** - _optional_ - port; **default:** 22
    - options.`conecurrency` **{number}** - _optional_ - max number of concurrent connections to the host; **default:** 1
    - options.`password` **{string}** - _optional_ - password; **default:** null
    - options.`passphrase` **{string}** - _optional_ - password to the encrypted `privateKey`; **default:** null

> **NOTE:** You always have to specify either `privateKey` or `password` for the client to establish connection!

#### ToSSH.connect([callback]);
- `callback` **{function}** - callback to be invoked on connection success/error. If an error occurs while connecting an {**string**} `error` will be passed to the callback

#### ToSSH.disconnect();

#### ToSSH.addTask(command, [callback]);
- `command` **{string}** - command to be executed
- `callback` **{function}** - callback to be invoked after command's execution. Two parameters which will contain the output will be passed to the function: `stderr` and `stdout`, both of the **{string}** type

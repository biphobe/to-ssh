# Task-Oriented SSH

## Description

Simple and easy to use SSH2 wrapper for [node.js](http://nodejs.org/).

Why task-oriented? Because each command you want to invoke is being added to the queue as task to run - it's for the sole purpose of giving you the ability to manipulate concurrency.

You can add 5 tasks to queue and run them all in the same time or run them one by one. It's up to you.

## Requirements

* [node.js](http://nodejs.org/) - v0.8.7 or newer ([@todo] - check it - may run on even lower versions)

## Features

* Handles multiple connections to different hosts in the same time
* Can queue requests or send them in parallel
* Runs callbacks asynchronously
* Easy to implement, use and maintain


## Installation

```bash
$ npm install to-ssh
```

## Examples & API

### Initialize

```javascript
var ToSSH = require('to-ssh');
```
```javascript
var ssh = new ToSSH(options);
```

- `options` **{object}** - _required_ - object with options necessary to establish connection
    - options.`host` **{string}** - _required_ - hostname
    - options.`username` **{string}** - _optional_ - username; **default:** "root"
    - options.`privateKey` **{string}** - _optional_ - path to your private key; **default:** null
    - options.`port` **{number}** - _optional_ - port; **default:** 22
    - options.`conecurrency` **{number}** - _optional_ - max number of concurrent connections to the host; **default:** 1
    - options.`password` **{string}** - _optional_ - password; **default:** null
    - options.`passphrase` **{string}** - _optional_ - password to the encrypted `privateKey`; **default:** null

> **NOTE:** You always have to specify either **`privateKey`** or **`password`**!

```javascript
var ssh = new ToSSH({
    host: "http://github.com",
    privateKey: fs.readFileSync({{ path-to-your-key }})
});
```

#### ssh.connect([`callback`])
Connects to the host specified in options.
- `callback` **{function}** - callback to be invoked on connection success/error. If an error occurs while connecting an {**string**} `error` will be passed to the callback

```javascript
ssh.connect(function(error) {
    if(!error) {
        console.log("Connected!"); // -> "Connected!"
    }
});
```

#### ssh.addTask(`command`, [`callback`])
Adds the tasks to queue and executes if possible.
- `command` **{string}** - command to be executed
- `callback` **{function}** - callback to be invoked after command's execution. Two parameters which will contain the output will be passed to the function: `stdout`, `stderr`, both of the **{string}** type

```javascript
ssh.addTask('whoami', function(stdout, stderr) {
    if(!stderr) {
        console.log(stdout); // -> "root"
    }
});
```

#### ssh.disconnect()
Disconnects from the host.

```javascript
ssh.disconnect();
```

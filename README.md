### This release is experimental
### Stable release will be deployed in the middle of April!

# ToSSH

## Description

Simple and easy to use SSH2 wrapper for [node.js](http://nodejs.org/).


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
* Can queue tasks
* Can send requests in parallel

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

[@todo]
var fs = require('fs');
var util = require('util');
var events = require('events');
var Util = require('./util.js');

var FileCacher = module.exports = function() {
	do {
		this._path = './tmp/' + Util.uuid() + '.cache';
	} while ((stat = Util.stat(this._path)));

	this._fd = null;
	
	try {
		this._fd = fs.openSync(this._path, 'w');
	} catch (e) {
		console.log('server.Request could not open ' + this._path + ' to cach request body: will discard request body');
	}
};

util.inherits(FileCacher, events.EventEmitter);

FileCacher.prototype.accumulate = function(chunk) {
	if (!this._fd) return;
	fs.writeSync(this._fd, chunk, 0, chunk.length, null);
};

FileCacher.prototype.end = function(callback) {
	fs.closeSync(this._fd);
};

FileCacher.prototype.__defineGetter__('path', function() { return this._path; });


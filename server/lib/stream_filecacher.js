/* The MIT License (MIT)

Copyright (c) 2012 https://github.com/jrop

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE. */

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


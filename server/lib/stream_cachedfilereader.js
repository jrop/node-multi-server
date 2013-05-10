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

var CachedFileReader = function(path, name) {
	this._fd = null;
	this._path = path;
	this._name = name;
	
	this._resetTimer();
	
	try {
		this._fd = fs.openSync(path, 'r');
	} catch (e) {
		console.log('Response cannot create body reader');
	}
};

CachedFileReader.prototype.read = function(buffer, offset, length, position) {
	if (this._fd) {
		var read = fs.readSync(this._fd, buffer, offset, length, position);
		this._resetTimer();
		
		if (read == 0)
			this._cleanup();
		
		return read;
	} else
		return 0;
};

CachedFileReader.prototype.readAll = function() {
	if (this._fd) {
		fs.closeSync(this._fd);
		var data = fs.readFileSync(this._path);
		this._cleanup();
		return data;
	} else
		return '';
};

/**
 * callback: the same callback as require('util').pump
 */
CachedFileReader.prototype.moveTo = function(path, callback) {
	require('util').pump(
		fs.createReadStream(this._path),
		fs.createWriteStream(path),
		function() {
			this.me._cleanup();
			if (this.callback)
				this.callback();
		}.bind({me: this, callback: callback})
	);
};

CachedFileReader.prototype._cleanup = function() {
	try {
		fs.closeSync(this._fd);
	} catch (e) { }
	try {	
		fs.unlinkSync(this._path);
		console.log('deleted ' + this._path);
	} catch (e) { }
	clearTimeout(this._timer);
};

CachedFileReader.prototype._resetTimer = function() {	
	this._timer = setTimeout(function() {
		this._cleanup();
	}.bind(this), 30000);
	// TODO: make timeout time-span configurable; hard-coded 30 seconds for now
};

CachedFileReader.prototype.__defineGetter__('name', function() {
	return this._name;
});

module.exports = CachedFileReader;


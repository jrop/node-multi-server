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
var buffer = require('buffer');

var StringSource = function(str) {
	this.str = str;
	this.read = function(buff, offset, length, encoding) {
		if (!offset) offset = 0;
		if (!length) length = buff.length;
		
		var toRead = Math.min(str.length, length);
		buff.write(this.str, offset, length, encoding);
		this.str = this.str.substring(length);
		return toRead;
	};
	
	this.readString = function(length, encoding) {
		var s = this.str.substring(0, length);
		this.str = this.str.substring(length);
		return s;
	};
	
	this.end = function() {
		this.str = '';
	};
};

var FileSource = function(path) {
	this.fd = fs.openSync(path, 'r');
	
	this.read = function(buff, offset, length, encoding) {
		if (!offset) offset = 0;
		if (!length) length = buff.length;
		
		var read = fs.readSync(this.fd, buff, offset, length, null);
		return read;
	};
	
	this.readString = function(length, encoding) {
		return fs.readSync(this.fd, length, null, encoding);
	};
	
	this.end = function() {
		fs.closeSync(this.fd);
	};
};

var LineReader = function(stream, delim) {
	if (!delim)
		delim = '\n';
	
	this.delim = delim;
	this.stream = stream;
	this.chunkSize = 512;
	this.s = '';
};

LineReader.prototype.peekLine = function() {
	var hasNewLine = this.__fill();
	if (hasNewLine) {
		var i = this.s.indexOf(this.delim);
		var ln = this.s.substring(0, i);
		return ln;
	} else {
		if (this.s == '')
			return null;
		else {
			var ln = this.s;
			return ln;	
		}
	}
};

LineReader.prototype.readLine = function() {
	var ln = this.peekLine();
	if (ln) {
		this.s = this.s.substring(ln.length + this.delim.length);
		return ln;
	}
	return ln;
};

LineReader.prototype.__fill = function() {
	while (this.s.indexOf(this.delim) == -1) {
		var read = this.stream.readString(this.chunkSize);
		this.s += read[0];
		if (read[1] < this.chunkSize)
			break;
	};
	console.log('BEGIN __fill:');
	console.log(">'" + this.s + "'<");
	console.log('END   __fill');
	return this.s.indexOf(this.delim) != -1;
};

var stream = {
	fromString: function(s) { return new StringSource(s); },
	fromFile: function(path) { return new FileSource(path); },
	LineReader: LineReader
};

module.exports = stream;

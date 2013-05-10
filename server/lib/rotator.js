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

var buffer = require('buffer');
var util = require('util');
var events = require('events');

var Rotator = module.exports = function(len) {
	this.actualLen = 0;
	this.pos = 0;
	this.len = 0;
	this.buff = new buffer.Buffer(0);
	this.changeLength(len);
};

util.inherits(Rotator, events.EventEmitter);

Rotator.prototype.changeLength = function(len) {
	if (len == this.len)
		return;
	
	var start = 0;
	if (len < this.len) {
		// shortening...
		while (this.len > len) {
			this.shiftBuffer();
			--this.len;
		}
		if (this.pos > this.len) {
			this.pos = this.len - 1;
		}
	} else {
		start = len - this.len;
	}
	
	var buff = new buffer.Buffer(len);
	this.buff.copy(buff, start, 0, Math.min(this.buff.length, buff.length))
	this.buff = buff;
	this.len = len;
};

Rotator.prototype.shiftBuffer = function(emit) {
	if (emit == undefined)
		emit = true;
	
	if (emit && this.actualLen > this.len)
		this.emit('out', this.buff.slice(0, 1));
	
	if (this.actualLen > this.len)
		--this.actualLen;
	
	for (var i = 1; i < this.buff.length; ++i) {
		this.buff[i - 1] = this.buff[i];
	}
};

Rotator.prototype.rotateSingle = function(buff) {
	++this.actualLen;
	this.shiftBuffer();
	this.buff.writeInt8(buff.readInt8(0), this.buff.length - 1);
};

Rotator.prototype.rotate = function(buff) {
	for (var i = 0; i < buff.length; ++i) {
		this.rotateSingle(buff.slice(i, i + 1));
	}
};

/**
 * Erase num 'chacaters' from front of rotator
 */
Rotator.prototype.erase = function(num) {
	while (num > 0 && this.actualLen > 0) {
		--this.actualLen;
		--num;
	}
	//for (var i = 0; i < position; ++i)
	//	this.shiftBuffer(false);
	//this.actualLen = this.actualLen - position + 1;
	//this.pos = this.pos - position + 1;
};

Rotator.prototype.startsWith = function(buff) {
	if (buff.length > this.actualLen)
		return false;
	
	var start = this.len - this.actualLen;
	for (var i = 0; i < buff.length; ++i) {
		if (buff[i] != this.buff[i + start])
			return false;
	}
	return true;
};

Rotator.prototype.toString = function(encoding) {
	var start = this.len - this.actualLen;
	return this.buff.toString(encoding, start, start + this.actualLen);
};

Rotator.prototype.__defineGetter__('length', function() { return this.len; });
Rotator.prototype.__defineGetter__('contentLength', function() { return this.actualLen; });

// BEGIN test
/*
//var s = 'The q';//uick brown fox jumps over the lazy dog.';
var r = new Rotator(5);
r.on('out', function(buff) {
	process.stdout.write(buff.toString());
});

//for (var i = 0; i < s.length; ++i) {
//	r.rotate(new buffer.Buffer(s.charAt(i)));
//	console.log("'" + r.toString() + "'");
//}
r.rotate(new buffer.Buffer('abcdef'));
r.erase(1); // erase 'b'
r.rotate(new buffer.Buffer('gh'));
console.log("'" + r.toString() + "'");
*/
// END   test

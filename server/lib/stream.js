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
	this.fd = fs.openSync(path);
	
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

var LineReader = function(stream) {
	this.stream = stream;
	this.chunkSize = 512;
	this.s = '';
};

LineReader.prototype.readLine = function() {
	var hasNewLine = this.__fill();
	if (hasNewLine) {
		var i = this.s.indexOf('\n');
		var ln = this.s.substring(0, i);
		this.s = this.s.substring(i + 1);
		return ln;
	} else {
		if (s == '')
			return null;
		else {
			var ln = this.s;
			this.s = '';
		}
	}
};

LineReader.prototype.__fill = function() {
	while (s.indexOf('\n') == -1) {
		var read = this.stream.readString(this.chunkSize);
		this.s += read[0];
		if (read[1] < this.chunkSize)
			return false;
	};
	return true;
};

var stream = {
	fromString: function(s) { return new StringSource(s); },
	fromFile: function(path) { return new FileSource(path); },
	LineReader: LineReader
};

module.exports = stream;

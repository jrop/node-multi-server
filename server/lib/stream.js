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

var fs = require('fs');

var BodyReader = function(path) {
	this._fd = null;
	this._path = path;
	
	this._resetTimer();
	
	try {
		this._fd = fs.openSync(path, 'r');
	} catch (e) {
		console.log('Response cannot create body reader');
	}
};

BodyReader.prototype.read = function(buffer, offset, length, position) {
	if (this._fd) {
		var read = fs.readSync(this._fd, buffer, offset, length, position);
		this._resetTimer();
		
		if (read == 0)
			this._cleanup();
		
		return read;
	} else
		return 0;
};

BodyReader.prototype.readAll = function(buffer, offset, length, position) {
	if (this._fd) {
		fs.closeSync(this._fd);
		var data = fs.readFileSync(this._path);
		this._cleanup();
		return data;
	} else
		return '';
};

BodyReader.prototype._cleanup = function() {
	try {
		fs.closeSync(this._fd);
	} catch (e) { }
	try {	
		fs.unlinkSync(this._path);
		//console.log('deleted ' + this._path);
	} catch (e) { }
	clearTimeout(this._timer);
};

BodyReader.prototype._resetTimer = function() {	
	this._timer = setTimeout(function() {
		this._cleanup();
	}.bind(this), 5000);
};

module.exports = BodyReader;

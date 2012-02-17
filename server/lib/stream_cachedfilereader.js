var fs = require('fs');

var CachedFileReader = function(path) {
	this._fd = null;
	this._path = path;
	
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

module.exports = CachedFileReader;
var FileCacher = require('./stream_filecacher.js');

var UploadedFile = module.exports = function(filename) {
	this.filename = filename;
	this._cacher = new FileCacher();
};

UploadedFile.prototype.accumulate = function(chunk) {
	this._cacher.accumulate(chunk);
};

UploadedFile.prototype.end = function() {
	this._cacher.end();
};

UploadedFile.prototype.__defineGetter__('path', function() { return this._cacher.path; });

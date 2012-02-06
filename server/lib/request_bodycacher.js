var fs = require('fs');
var util = require('util');
var events = require('events');
var Util = require('./util.js');

var BodyCacher = function(req) {
	do {
		this._path = './tmp/' + Util.uuid() + '.body.cache';
	} while ((stat = Util.stat(this._path)));

	this._fileWriter = null;
	this._intBuff = '';
	this._intBuffDirty = false;
	this._safe2Write = true;
	this._closeStaged = false;
	
	try {
		this._fileWriter = fs.createWriteStream(this._path, { flags: 'w' });
		this._fileWriter.on('drain', function() {
			if (!this._intBuffDirty) return;
			//console.log('draining ' + this._intBuff);
			var chunk = this._intBuff;
			this._intBuff = '';
			this._intBuffDirty = false;
			this._safe2Write = true;
			
			this.accumulate(chunk);
			
			if (this._closeStaged)
				this._close();
		}.bind(this));
		
		this._fileWriter.on('error', function(e) {
			console.log('Error (' + this._path + '):');
			console.log(e);
		}.bind(this));
		
		//this._fileWriter.on('close', function() {
		//	console.log('The BodyCacher has closed');
		//});
	} catch (e) {
		console.log('server.Request could not open ' + this._fileCachPath + ' to cach request body: will discard request body');
	}
	
	req.on('data', function(chunk) {
		this.accumulate(chunk);
	}.bind(this));
	
	req.on('end', function() {
		this.end(function() {
			this.emit('end');
		}.bind(this));
	}.bind(this));
};

util.inherits(BodyCacher, events.EventEmitter);

BodyCacher.prototype.accumulate = function(chunk) {
	if (!this._fileWriter) return;
	//console.log(this._fileWriter);
	//console.log('writing:');
	//console.log(chunk);
	if (this._safe2Write) {
		var wrote = this._fileWriter.write(chunk);
		if (!wrote) {
			this._safe2Write = false;
			//console.log('--> kernel buff full');
		}
	} else {
		this._intBuff += chunk;
		this._intBuffDirty = true;
		//console.log('--> wrote to int buff');
	}
};

BodyCacher.prototype.end = function(callback) {
	//console.log('ending');
	if (this._fileWriter) {
		if (callback)
			this._fileWriter.on('close', function() {
				//console.log('ended');
				//console.log(this._fileWriter);
				callback();
			}.bind(this));
		
		if (this._intBuffDirty) {
			//console.log('staging close');
			this._closeStaged = true;
		} else
			this._close();
	} else
		callback();
};

BodyCacher.prototype._close = function() {
	//console.log('closing: _close');
	//this._fileWriter.end();
	//this._fileWriter.destroy();
	this._fileWriter.destroySoon();
};

BodyCacher.prototype.__defineGetter__('path', function() { return this._path; });

module.exports = BodyCacher;


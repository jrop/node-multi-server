var util = require('util');
var events = require('events');
var fs = require('fs');
var Util = require('./util.js');

//
// ====================
// = BodyCacher class =
// ====================
//

var BodyCacher = function(path) {
	this._path = path;
	this._fileWriter = null;
	this._intBuff = '';
	this._intBuffDirty = false;
	this._safe2Write = true;
	this._closeStaged = false;
	
	try {
		this._fileWriter = fs.createWriteStream(path, { flags: 'w' });
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
};

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

BodyCacher.prototype.close = function(callback) {
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
	}
};

BodyCacher.prototype._close = function() {
	//console.log('closing: _close');
	//this._fileWriter.end();
	//this._fileWriter.destroy();
	this._fileWriter.destroySoon();
}

//
// ====================
// = BodyReader class =
// ====================
//

var BodyReader = function(path) {
};

//
// =================
// = Request class =
// =================
//

var Request = module.exports = function(nodeReq) {
	this._req = nodeReq;
	
	var ck = nodeReq.headers.cookie;
	if (ck) {
		ck = ck.split(';');
		var data = { };
		for (var i = 0; i < ck.length; ++i) {
			var nmVal = ck[i].split('=');
			var name = (nmVal.length >= 1) ? nmVal[0] : undefined;
			var val = (nmVal.length >= 2) ? nmVal[1] : undefined;
		
			if (name) {
				name = decodeURIComponent(nmVal[0]).trim();
				if (val) {
					val = decodeURIComponent(nmVal[1]);
					data[name] = val;
				} else {
					data[name] = undefined;
				}
			}
		}
		//console.log('Request setting up cookies: ');
		//console.log(data);
		this.cookies = data;
	} else
		this.cookies = { };
	
	// cache request body:
	do {
		this._fileCachePath = './tmp/' + Util.uuid() + '.body.cache';
	} while ((stat = Util.stat(this._fileCachePath)));
	
	this._cacher = new BodyCacher(this._fileCachePath);
	
	this._req.on('data', function(chunk) {
		this._cacher.accumulate(chunk);		
		this.emit('data', chunk);
	}.bind(this));
	
	this._dataReceived = false;
	this._req.on('end', function() {
		this._cacher.close(function() {
			this._dataReceived = true;
			this.emit('dataend');
			this.emit('end');
		}.bind(this));
	}.bind(this));
	
	this._req.on('close', function() {
		this.emit('close');
	}.bind(this));
};

util.inherits(Request, events.EventEmitter);

var R = Request.prototype;

R.__defineGetter__('dataPath', function() { return this._fileCachePath; });
R.data = function(callback) {
	if (!callback)
		return;
	
	if (!this._dataReceived) {
		this.on('dataend', function() {
			//console.log('dataend:' + this.dataPath);
			callback();
		}.bind(this));
	} else
		callback();
};

R.__defineGetter__('method', function() { return this._req.method; });
R.__defineGetter__('url', function() { return this._req.url; });
R.__defineGetter__('headers', function() { return this._req.headers; });
R.__defineGetter__('trailers', function() { return this._req.trailers; });
R.__defineGetter__('httpVersion', function() { return this._req.httpVersion; });

R.setEncoding = function(enc) { return this._req.setEncoding(enc); };
R.pause = function() { return this._req.pause(); };
R.resume = function() { return this._req.resume(); };

R.__defineGetter__('connection', function() { return this._req.connection; });

var util = require('util');
var events = require('events');
var fs = require('fs');
var Util = require('./util.js');

var BodyParser = require('./request_bodyparser.js');
var CachedFileReader = require('./stream_cachedfilereader.js');

var Request = module.exports = function(nodeReq) {
	this._req = nodeReq;
	this._params = { files: [ ] };
	
	this.__bodyParsed = function(params) {
		this._params = params;
		this._parsed = true;
		this.emit('parsed');
	};
	
	this._bodyParser = new BodyParser(this);
	this._bodyParser.on('parsed', this.__bodyParsed.bind(this));
	if (this._bodyParser.parsed)
		this.__bodyParsed(this._bodyParser.params);
	
	// BEGIN read cookies
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
	// END read cookies
	
	this._req.on('data', function(chunk) {
		this.emit('data', chunk);
	}.bind(this));
	
	this._req.on('end', function() {
		this.emit('end');
	}.bind(this));
	
	this._req.on('close', function() {
		this.emit('close');
	}.bind(this));
};

util.inherits(Request, events.EventEmitter);

var R = Request.prototype;

R.__defineGetter__('method', function() { return this._req.method; });
R.__defineGetter__('url', function() { return this._req.url; });
R.__defineGetter__('headers', function() { return this._req.headers; });
R.__defineGetter__('trailers', function() { return this._req.trailers; });
R.__defineGetter__('httpVersion', function() { return this._req.httpVersion; });

R.__defineGetter__('params', function() { return this._params; });
R.__setParams = function(p) { return this._params = p; };
R.__defineGetter__('parsed', function() { return this._parsed == true; });

R.setEncoding = function(enc) { return this._req.setEncoding(enc); };
R.pause = function() { return this._req.pause(); };
R.resume = function() { return this._req.resume(); };

R.__defineGetter__('connection', function() { return this._req.connection; });

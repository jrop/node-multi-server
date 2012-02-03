var util = require('util');
var events = require('events');

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

R.setEncoding = function(enc) { return this._req.setEncoding(enc); };
R.pause = function() { return this._req.pause(); };
R.resume = function() { return this._req.resume(); };

R.__defineGetter__('connection', function() { return this._req.connection; });

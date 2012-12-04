var http = require('http');
var util = require('util');
var events  = require('events');

var Response = module.exports = function(nodeResp) {
	this._headersSent = false;
	this._cookies = { };
	this._resp = nodeResp;
	
	this._resp.on('close', function() {
		this.emit('close');
	}.bind(this));
};

util.inherits(Response, events.EventEmitter);

var R = Response.prototype;

R._setCookieHeader = function() {
	if (this._headersSent)
		return;
	this.emit('sendheaders');

	//console.log('---Setting Cookie Header---');
	//console.log(this._cookies);
	//console.trace();
	var list = [];
	var cookies = this._cookies;
	for (var mbr in cookies) {
		var cookie = cookies[mbr];
		
		var val = cookie.value;
		var s = encodeURIComponent(mbr) + '=' + encodeURIComponent(val) + '; ';
		if (cookie.expires) {
			s += 'Expires=';
			if (cookie.expires.toUTCString)
				s += cookie.expires.toUTCString() + '; ';
			else
				s += cookie.expires + '; ';
		}
		
		if (cookie.domain != undefined)
			s += 'Domain=' + cookie.domain + '; ';
		if (cookie.path != undefined)
			s += 'Path=' + cookie.path + '; ';
		if (cookie.secure == true)
			s += 'Secure; ';
		if (cookie.httpOnly == true)
			s += 'HttpOnly';
		
		list.push(s);
	}
	
	//console.log('Cookies:');
	//console.log(list);
	//console.log('---End Setting Cookie Header---');
	this._resp.setHeader('Set-Cookie', list);
};

R.setCookie = function(name, value, params) {
	params.value = value;
	this._cookies[name] = params;
	//console.log('---Setting cookie, headers sent?: ' + this._headersSent + '---');
	//console.log(this._cookies);
	//console.log('---End Setting cookie---');
};

R.getCookie = function(name) {
	if (this._cookies[name])
		return this._cookies[name].value;
	else
		return undefined;
};

R.deleteCookie = function(name) {
	this.setCookie(name, '', { expires: new Date(0) });
};

R.write = function(chunk, encoding) {
	this._setCookieHeader();
	this._resp.write(chunk, encoding);
	this._headersSent = true;
};

R.writeHead = function(statusCode, reasonPhrase, headers) {
	if (this._headersSent)
		return;

	this._setCookieHeader();
	this._resp.writeHead(statusCode, reasonPhrase, headers);
	this._headersSent = true;
};

R.setHeader = function(name, value) {
	var regex = /Set-Cookie/i;
	if (regex.test(name)) {
		throw new Error("Cannot set cookie using Response.setHeader; use Response.setCookie instead.");
	} else
		this._resp.setHeader(name, value);
};

R.getHeader = function(name) {
	var regex = new Regex('^' + name + '$', 'i');
	for (var hdr in this._resp.headers) {
		if (regex.test(hdr))
			return this._resp.headers[hdr];
	}
};

R.redirect = function(path) {
	this.statusCode = 302;
	this.setHeader('Location', path);
	this._setCookieHeader();
	this.end();
};

R.__defineGetter__('statusCode', function() { return this._resp.statusCode; });
R.__defineSetter__('statusCode', function(val) { this._resp.statusCode = val; });

R.writeContinue = function() { this._resp.writeContinue(); };
R.getHeader = function(name) { return this._resp.getHeader(name); };
R.removeHeader = function(name) { return this._resp.removeHeader(name); };
R.addTrailers = function(headers) { return this._resp.addTrailers(headers); };

R.end = function(data, encoding) {
	this.emit('end');
	this._resp.end(data, encoding);
};


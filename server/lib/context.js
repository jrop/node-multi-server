/* The MIT License (MIT)

Copyright (c) 2012 https://github.com/jrop

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE. */

var Session = require('./session.js');
var util = require('util');
var events = require('events');

var Context = module.exports = function Context(request, response, arguments) {
	this._loaded = false;
	this._request = request;
	this._response = response;
	this._arguments = arguments;
	this._session = new Session(this);
	
	this.__load();
	
	this._response.on('end', function() {
		this.emit('unload');
	}.bind(this));
};

util.inherits(Context, events.EventEmitter);

Context.prototype.__load = function() {
	if (!this._request.parsed)
		this._request.on('parsed', function() {
			this.__checkLoaded();
		}.bind(this));
	else
		this.__checkLoaded();
		
	this._session.load(function(err) {
		//console.log('Session.load callback called');
		this.__checkLoaded();
	}.bind(this));
};

Context.prototype.__loadSession = function() {
	this._session.load(function() {
		this._loaded = true;
		this.emit('load');
	}.bind(this));
};

Context.prototype.__checkLoaded = function() {
	if (this.loaded) {
		this.emit('load');
	}
};
			
Context.prototype.__defineGetter__('loaded', function() {
	/*console.log('==Context.loaded==');
	console.log(this._request.parsed);
	console.log(this._session.loaded);
	console.log('==^^^^^^^^^^^^^^==\n');*/
	return this._request.parsed && this._session.loaded;
});

Context.prototype.__defineGetter__('request', function() { return this._request; });
Context.prototype.__defineGetter__('response', function() { return this._response; });
Context.prototype.__defineGetter__('arguments', function() { return this._arguments; });
Context.prototype.__defineGetter__('session', function() { return this._session; });


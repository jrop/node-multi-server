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


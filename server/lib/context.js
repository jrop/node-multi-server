var Session = require('./session.js');
var util = require('util');
var events = require('events');

var Context = module.exports = function Context(request, response, matches) {
	this._loaded = false;
	this._request = request;
	this._response = response;
	this._matches = matches;
	this._session = new Session(this);
	
	// load
	this._session.load(function() {
		this._loaded = true;
		this.emit('load');
	}.bind(this));
	
	this._response.on('end', function() {
		this.emit('unload');
	}.bind(this));
};

util.inherits(Context, events.EventEmitter);

Context.prototype.__defineGetter__('loaded', function() { return this._loaded; });
Context.prototype.__defineGetter__('request', function() { return this._request; });
Context.prototype.__defineGetter__('response', function() { return this._response; });
Context.prototype.__defineGetter__('matches', function() { return this._matches; });
Context.prototype.__defineGetter__('session', function() { return this._session; });


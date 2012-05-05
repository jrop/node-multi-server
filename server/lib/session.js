var Util = require('./util.js');

/**
 * Default session memory store:
 */
function MemoryStore() {
	this._sessions = {},
	
	this.load = function(id, callback) {
		this.__cleanupId(id);
		var s = this._sessions[id];
		var found = s != undefined;
		var data = undefined;
		var expires = undefined;
		var fingerprint = undefined;
		if (found) {
			data = s.data;
			expires = s.expires;
			fingerprint = s.fingerprint;
		}
		callback(found, data, fingerprint, expires);
	};
	
	this.save = function(id, data, fingerprint, expires, callback) {
		this._sessions[id] = { data: data, fingerprint: fingerprint, expires: expires };
		//console.log('saved:');
		//console.log(this._sessions);
		callback(null);
	};
	
	this.destroy = function(id, callback) {
		this._sessions[id] = undefined;
		if (callback)
			callback();
	};
	
	this.cleanup = function() {
		for (var id in this._sessions) {
			this.__cleanupId(id);
		}
	};
	
	this.__cleanupId = function(id) {
		var now = parseInt((new Date()).getTime() * 1000);
		if (this._sessions[id] && now > this._sessions[id].expires)
			this._sessions[id] = undefined;
	};
	
	this.checkid = function(id, callback) {
		if (callback)
			callback(this._sessions[id] == undefined);
	};
}

MemoryStore.getInstance = function() {
	if (!MemoryStore._inst)
		MemoryStore._inst = new MemoryStore();
	return MemoryStore._inst;
};

/**
 * Session stores should implement:
 * load(id [string], callback) : id is session id, callback is function(data, fingerprint, expires) {...}
 * save(id, data, fingerprint, expires [unix time in seconds (the number of seconds since 1 January 1970 00:00:00 UTC)], callback) : callback is function(error) {...}
 * destroy(id, callback)
 * cleanup()
 * checkid(id) : returns true if the given id is unique
 */
var Session = module.exports = function(context, store) {
	this._ctx = context;
	
	if (!store) {
		// create default memory-store
		store = MemoryStore.getInstance();
		//console.log(store._sessions);
	}
	this._store = store;
	
	var ip = context.request.headers['x-forwarded-for'] || context.request.connection.remoteAddress;
	this._fingerprint = Util.md5(ip + context.request.headers['user-agent']);
	
	this.__reset();

	this._id = this._ctx.request.cookies.sid;
	if (!this._id) {
		this.__setId();
	}
	//console.log('Cookie: ' + this._ctx.request.cookies.sid);
	//console.log('My Id: ' + this._id);
	
	this._ctx.response.on('sendheaders', function() {
		if (this._isEmpty)
			return;
		
		this._ctx.response.setCookie('sid', this._id, {
			expires: this._expires, 
			path: '/', 
			httpOnly: true
		});
		//console.log(this._ctx.response._cookies);
		this._store.cleanup();
	}.bind(this));
};

var S = Session.prototype;


S.__reset = function() {
	this._loaded = false;
	this._data = undefined;
	this._isEmpty = true;
	
	var now = (new Date()).getTime() / 1000;
	this._expires = new Date((now + 60 * 60) * 1000);
	
	this.__setId();
}

S.__setId = function() {
	this._isEmpty = true;
	this._id = Util.uuid().replace(/-/g, '');
	this._store.checkid(this._id, function(isUnique) {
		if (!isUnique)
			this.__setId();
	}.bind(this));
};

S.__dateToUnixTime = function(date) {
	if (date.getTime)
		return date.getTime() * 1000;
	else
		return date;
};

/**
 * @param callback function() {...}
 */
S.load = function(callback) {
	if (this._loaded == true)
		return;
	
	this._store.load(this._id, function(found, data, fingerprint, expires) {
		if (this.me._fingerprint != fingerprint) {
			this.me.__reset();
			this.me._loaded = true;
			this.callback();
			return;
		}
		
		this.me._loaded = true;
		this.me._data = data;
		this.me._expires = expires;
		this.callback();
	}.bind({ me : this, callback: callback}));
};

S.getData = function() {
	return this._data || { };
};

S.setData = function(data) {
	this._data = data;
	this._isEmpty = false;
};


S.destroy = function(callback) {
	this._ctx.response.deleteCookie('sid');
	this.__reset();
	
	this._store.destroy(this._id, function() {
		if (this.callback)
			callback();
	});
};

S.__defineGetter__('id', function() { return this._id; });
S.__defineGetter__('loaded', function() { return this._loaded; });


S.__defineGetter__('hasData', function() { return this._data != undefined; });

S.__defineGetter__('expires', function() { return this._expires; });
S.__defineSetter__('expires', function(val) { this._expires = val; });

/**
 * @param callback function(err) {...}
 */
S.save = function(callback) {
	this._store.save(this._id, this._data, this._fingerprint, this.__dateToUnixTime(this._expires), function(err) {
		if (this.callback)
			this.callback(err);
	}.bind({ me: this, callback: callback }));
};

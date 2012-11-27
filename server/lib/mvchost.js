var util = require('util');
var fs = require('fs');
var Host = require('./host.js');

var MvcHost = function(rootPath) {
	this.__rootPath = rootPath;
}

MvcHost.prototype = new Host();

MvcHost.prototype.addPath = function(pathRegex, responder) { };
	
MvcHost.prototype.removePath = function(pathRegex) { };

MvcHost.__stat = function(path) {
	try {
		var stat = fs.statSync(path);
		stat.path = path;
		return stat;
	} catch (ex) {
		return undefined;
	}
}

MvcHost.prototype.__strEndsWith = function(str, suffix) {
	return (str.lastIndexOf(suffix)) == (str.length - (suffix.length));
}

MvcHost.prototype.__fileResponder = function(ctx) {
	// by the time this get's called, it's not really in an instance of MvcHost
	// 'this' is set to include the locals 'path', and 'thiz' (points to instance of MvcHost)
	var locals = { };
	
	var cstat = MvcHost.__stat(this.path + '.js') || MvcHost.__stat(this.path + '/.js');
	if (cstat) {
		// call controller
		var pathmod = require('path');
		var pathToMod = pathmod.resolve(process.cwd() + '/' + cstat.path);
		
		delete require.cache[pathToMod]; // unload module (if it's already been loaded)
		controller = require(pathToMod);
		
		if (!controller.acceptsArgs && ctx.matches && ctx.matches.length > 0) {
			var def = this.thiz.getDefaultResponder();
			if (def)
				def(ctx);
			else
				ctx.response.end();
			return;
		}
		
		if (typeof controller.request == 'function')
			locals = controller.request(ctx);
		else
			locals = controller;
	}
	
	var vstat = MvcHost.__stat(this.path + '.ejs') || MvcHost.__stat(this.path + '/.ejs');
	if (vstat) {
		// call view with 'locals'
		var ejs = require('ejs');
		if (!locals)
			locals = { };
		locals.ctx = ctx;
		
		ctx.response.write(
			ejs.render(
				fs.readFileSync(vstat.path).toString(),
				{ locals : locals }
			)
		);
		ctx.response.end();
	}
}

MvcHost.prototype.__getResponderObjFor = function(path, args) {
	var stat = MvcHost.__stat(path + '.js')
		|| MvcHost.__stat(path + '.ejs')
		|| MvcHost.__stat(path + '/.js')
		|| MvcHost.__stat(path + '/.ejs')
		|| MvcHost.__stat(path); // this one goes last, just in case 'path' is a directory
	
	if (!stat) {
		// may be abbreviated: check for extensions
		return undefined;
	} else {
		if (stat.isDirectory()) {
			// Directory: cannot serve (note: if index.js exists in a directory, that will be taken into account during this.__stat above)
			return undefined;
		} else if (stat.isFile()) {
			// return file responder
			return { responder: this.__fileResponder.bind({ path: path, thiz: this }), matches: args };
		}
	}
	
	return undefined;
}

MvcHost.prototype.lookup = function(path) {
	path = this.__rootPath + path;
	parts = path.split('/');
	for (var i = parts.length; i > 1; --i) {
		tmpPath = parts.slice(0, i).join('/');
		var obj = this.__getResponderObjFor(tmpPath, parts.slice(i));
		if (obj) {
			return obj;
		}
	}
	return null;
};

MvcHost.prototype.indexOf = function(pathRegex) {
	return -1;
};

module.exports = MvcHost;


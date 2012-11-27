var util = require('util');
var fs = require('fs');
var Host = require('./host.js');

/**
 * viewHandlers : [
 * 	{
 * 		extension: '.ejs',
 * 		handler: function(ctx, file) { ...render code... }
 * 	}, ...
 * ]
 */
function MvcHost(rootPath, viewHandlers) {
	this.__rootPath = rootPath;
	this.__viewHandlers = viewHandlers || [ ];
};

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
};

MvcHost.prototype.__pathIsDir = function(path) {
	var stat = MvcHost.__stat(path);
	return (stat) ? stat.isDirectory() : false;
}

MvcHost.prototype.__strEndsWith = function(str, suffix) {
	return (str.lastIndexOf(suffix)) == (str.length - (suffix.length));
};

MvcHost.prototype.__getHandlerForExtension = function(ext) {
	for (var i = 0; i < this.__viewHandlers.length; ++i) {
		var handler = this.__viewHandlers[i];
		if (handler.extension == ext)
			return handler.handler;
	}
};

MvcHost.prototype.__fileResponder = function(ctx) {
	function respondWithDefault(ctx, host) {
		var def = host.getDefaultResponder();
		if (def)
			def(ctx);
		else
			ctx.response.end();
	}
	
	// by the time this get's called, it's not really in an instance of MvcHost
	// 'this' is set to include the locals 'path', and 'thiz' (points to instance of MvcHost)
	var view_args = { };
	var controller = undefined;
	var controller_args = ctx.matches || [ ];
	
	var cstat = MvcHost.__stat(this.path + '.js') || MvcHost.__stat(this.path + '/index.js');
	if (cstat) {
		// call controller
		var pathmod = require('path');
		var pathToMod = pathmod.resolve(process.cwd() + '/' + cstat.path);
		
		delete require.cache[pathToMod]; // unload module (if it's already been loaded)
		controller = require(pathToMod);
		
		if ((controller_args.length > 0) && !controller.acceptsArgs) {
			// not cool: trying to send args to a controller that doesn't accept them
			respondWithDefault(ctx, this.thiz);
			return;
		}
		
		if (typeof controller.request == 'function')
			view_args = controller.request(ctx);
		else
			view_args = controller;
	}
	if (!view_args) view_args = { };
	view_args.ctx = ctx;
	
	// find appropriate view (if any) and call its associated handler
	if ((controller_args.length > 0) && (!controller || !controller.acceptsArgs)) {
		// not cool: trying to send args to a controller that doesn't accept them
		respondWithDefault(ctx, this.thiz);
		return;
	} else {
		var vStats = this.thiz.__getStatsForViews(this.path);
		//console.log(vStats);
		for (var i = 0; i < vStats.length; ++i) {
			var vStat = vStats[i];
		
			if (vStat) {
				var ext = vStat.path.substr(vStat.path.lastIndexOf('.'));
				var handler = this.thiz.__getHandlerForExtension(ext);
				if (typeof handler == 'function') {
					handler(ctx, vStat.path, view_args);
					return;
				}
			}
		}
	}
	
	// we got this far, and nothing got rendered?? I guess it's not up to us...
	//respondWithDefault(ctx, this.thiz);
};

MvcHost.prototype.__getStatsForViews = function(path) {
	var stats = [ ];
	for (var i = 0; i < this.__viewHandlers.length; ++i) {
		var handler = this.__viewHandlers[i];
		
		//console.log(handler);
		var fullPath = path + handler.extension;
		if (this.__pathIsDir(path))
			fullPath = path + '/index' + handler.extension;
		//console.log(fullPath);
		stats.push(MvcHost.__stat(fullPath));
	}
	//console.log('Stats:');
	//console.log(stats);
	return stats;
};

MvcHost.prototype.__getResponderObjFor = function(path, args) {
	var stat = MvcHost.__stat(path + '.js') || MvcHost.__stat(path + '/index.js');
	var viewStats = this.__getStatsForViews(path);
	for (var i = 0; i < viewStats.length; ++i) {
		stat = stat || viewStats[i];
	}
	
	stat = stat || MvcHost.__stat(path); // this one goes last, just in case 'path' is a directory
	//console.log('Stat is:');
	//console.log(stat);
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
};

MvcHost.prototype.lookup = function(path) {
	path = this.__rootPath + path;
	parts = path.split('/');
	for (var i = parts.length; i > 1; --i) {
		tmpPath = parts.slice(0, i).join('/');
		var obj = this.__getResponderObjFor(tmpPath, parts.slice(i));
		
		//console.log(tmpPath);
		//console.log(obj);
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


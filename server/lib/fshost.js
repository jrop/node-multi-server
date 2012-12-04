var util = require('util');
var fs = require('fs');
var Host = require('./host.js');

function FsHost(rootPath) {
	this.__rootPath = rootPath;
};

FsHost.prototype = new Host();

FsHost.__stat = function(path) {
	try {
		var stat = fs.statSync(path);
		stat.path = path;
		return stat;
	} catch (ex) {
		return undefined;
	}
};

FsHost.prototype.__fileResponder = function(ctx) {
	function respondWithDefault(ctx, host) {
		var def = host.getDefaultResponder();
		if (def)
			def(ctx);
		else
			ctx.response.end();
	}
	
	// by the time this get's called, it's not really in an instance of FsHost
	// 'this' is set to include the locals 'path', and 'thiz' (points to instance of FsHost)
	var controller_result = { };
	var controller = undefined;
	var controller_args = ctx.arguments || [ ];
	
	var cstat = FsHost.__stat(this.path + '.js') || FsHost.__stat(this.path + '/index.js');
	if (cstat) {
		// call controller
		var pathmod = require('path');
		var pathToMod = pathmod.resolve(process.cwd() + '/' + cstat.path);
		
		delete require.cache[pathToMod]; // unload module (if it's already been loaded)
		controller = require(pathToMod);
		
		if (controller) {
			if ((controller_args.length > 0) && !controller.acceptsArgs) {
				// not cool: trying to send args to a controller that doesn't accept them
				respondWithDefault(ctx, this.thiz);
				return;
			}
		
			if (typeof controller == 'function')
				controller_result = controller.request(ctx);
			else if (typeof controller.request == 'function')
				controller_result = controller.request(ctx);
			else
				controller_result = controller;
		}
	}
};

FsHost.prototype.__getResponderObjFor = function(path, args) {
	var stat = FsHost.__stat(path + '.js')
		|| FsHost.__stat(path + '/index.js')
		|| FsHost.__stat(path); // this one goes last, just in case 'path' is a directory

	if (!stat) {
		// no matches
		return undefined;
	} else {
		if (stat.isDirectory()) {
			// Directory: cannot serve (note: if index.js exists in a directory, that will be taken into account during this.__stat above)
			return undefined;
		} else if (stat.isFile()) {
			// return file responder
			return { responder: this.__fileResponder.bind({ path: path, thiz: this }), arguments: args };
		}
	}
	
	return undefined;
};

FsHost.prototype.lookup = function(path) {
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

module.exports = FsHost;


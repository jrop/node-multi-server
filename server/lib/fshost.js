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

FsHost.prototype.__fileResponder = function(stat, host, ctx) {
	function respondWithDefault() {
		var def = host.getDefaultResponder();
		if (def)
			def(ctx);
		else
			ctx.response.end();
	}
	
	// by the time this get's called, it's not really in an instance of FsHost
	var controller = undefined;
	var controller_args = ctx.arguments || [ ];
	
	// call controller
	var path = require('path');
	var pathToMod = path.resolve(process.cwd() + '/' + stat.path);
	
	// make sure caching is up to date:
	if (require.cache[pathToMod]) {
		var tm = require.cache[pathToMod].time;
		if (stat.mtime.getTime() > tm) {
			// modified since last cache...
			delete require.cache[pathToMod]; // unload module (if it's already been loaded)
		}
	}
	
	controller = require(pathToMod);
	require.cache[pathToMod].time = new Date().getTime(); // update access time
	
	if (controller) {
		if ((controller_args.length > 0) && !controller.acceptsArgs) {
			// not cool: trying to send args to a controller that doesn't accept them
			respondWithDefault();
			return;
		}
	
		if (typeof controller == 'function')
			controller(ctx); // finally!, we actually call the function...
		else
			respondWithDefault();
	} else
		respondWithDefault();
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
			return {
				responder: this.__fileResponder.bind(
						null,
						stat,
						this
					),
				arguments: args
			};
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


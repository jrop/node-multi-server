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

var liveRequire = require('./live_require.js');
var Access = require('./access.js');

function Host(rootPath) {
	this.__rootPath = rootPath;
	this.defaultResponder = require('./defaultresponder.js');
}

Host.prototype.getDefaultResponder = function() {
	return this.defaultResponder;
};

Host.prototype.setDefaultResponder = function(fn) {
	this.defaultResponder = fn;
};

Host.__stat = function(path) {
	try {
		var stat = fs.statSync(path);
		stat.path = path;
		return stat;
	} catch (ex) {
		return undefined;
	}
};

Host.prototype.__fileResponder = function(stat, host, ctx) {
	function respondWithDefault() {
		var def = host.getDefaultResponder();
		if (def && typeof def.responder == 'function')
			def.responder(ctx);
		else
			ctx.response.end();
	}
	
	// by the time this get's called, it's not really in an instance of Host
	var controller = undefined;
	var controller_args = ctx.arguments || [ ];
	
	// call controller
	var path = require('path');
	var pathToMod = path.resolve(process.cwd() + '/' + stat.path);
	
	controller = liveRequire(pathToMod);
	require.cache[pathToMod].time = new Date().getTime(); // update access time
	
	if (controller) {
		if (typeof controller == 'function') {
			var access = new Access(pathToMod, this.__rootPath);
			if (!access.check(ctx)) {
				respondWithDefault();
			} else {
				// finally!, we actually call the function...
				var currDir = process.cwd();
				process.chdir(path.dirname(stat.path));
			
				controller(ctx);
			
				process.chdir(currDir);
			}
		} else
			respondWithDefault();
	} else
		respondWithDefault();
};

Host.prototype.__getResponderObjFor = function(path, args) {
	var scriptExt = require('./config.js').get('Host.scriptExtension');
	var stat = Host.__stat(path + scriptExt)
		|| Host.__stat(path + '/index' + scriptExt)
		|| Host.__stat(path); // this one goes last, just in case 'path' is a directory

	if (!stat) {
		// no matches
		return undefined;
	} else {
		if (stat.isDirectory()) {
			// Directory: cannot serve (note: if index.js exists in a directory, that will be taken into account during this.__stat above)
			return undefined;
		} else if (stat.isFile()) {
			if (stat.path.endsWith('.req.js')) {
				// return file responder
				var path = require('path');
				return {
					responder: this.__fileResponder.bind(
							null,
							stat,
							this
						),
					arguments: args,
					path: path.dirname(stat.path)
				};
			} else {
				// else just serve the file directly
				return {
					responder: function(ctx) {
						require('./dispatcher.js').serveFile(stat.path, ctx);
					}
				};
			}
		}
	}
	
	return undefined;
};

Host.prototype.lookup = function(path) {
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

module.exports = Host;

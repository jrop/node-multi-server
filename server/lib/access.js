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

var _path = require('path');

var liveRequire = require('./live_require.js');
var Host = {};
var Config = require('./config.js');

/*
 * @param path: path to .req.js 'live' module; it is assumed 'path' is a path to a file that exists
 */
function Access(path, rootPath) {
	path = _path.resolve(path);
	rootPath = _path.resolve(rootPath);
	
	Host = require('./host.js');
	this.__accessObj = {};
	
	var stat = Host.__stat(path);
	if (stat.path.endsWith(Config.get('Host.scriptExtension'))) {
		this.__mod = liveRequire(stat.path);
		if (typeof this.__mod == 'function' /* is script-file */ && this.__mod.access /* has access-object */)
			this.__accessObj = this.__mod.access;
	}
	
	var currPath = path;
	do {
		currPath = _path.dirname(currPath);
		stat = Host.__stat(currPath + '/.access' + Config.get('Host.scriptExtension'));
		if (stat) {
			this.__mergeIn(liveRequire(stat.path));
		}
	} while (currPath != rootPath);
}

Access.prototype.__mergeIn = function(accessObj) {
	// this only works merging single-level objects in
	// (what if member b.x has new "sub-members" not in a.x?
	// this will say: oh, a already has x, so don't overwrite it.
	// not sure if that's a problem, because the access object
	// should really be a simple configuration object.)
	for (var mbr in accessObj) {
		if (!(mbr in this.__accessObj))
			this.__accessObj[mbr] = accessObj[mbr];
	}
}

Access.prototype.check = function(ctx, callback) {
	callback = (typeof callback == 'function') ? callback : function() {};
	//console.log('Checking:');
	//console.log(this.__accessObj);
	if (((ctx.arguments || []).length > 0) && !this.__accessObj.acceptsArgs) {
		// not cool: trying to send args to a script that doesn't accept them
		callback(false);
	}
	
	if (this.__accessObj.deny)
		callback(false);
	
	if (typeof this.__accessObj.check == 'function') {
		this.__accessObj.check(ctx, function(ok) {
			if (!ok) callback(false);
		});
	}
		
	callback(true);
}

module.exports = Access;


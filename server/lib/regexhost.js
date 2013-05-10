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

var Host = require('./host.js');

function RegexHost(config) {
	this.paths = new Array();
	
	this.addPath = function(pathRegex, responder) {
		if (typeof pathRegex == typeof '')
			pathRegex = new RegExp(pathRegex);
		this.paths.push({path : pathRegex, responder : responder});
	};
	
	this.removePath = function(pathRegex) {
		var i = this.indexOf(path);
		if (i != -1)
			this.paths.splice(i, 1);
	};
	
	this.lookup = function(path) {
		for (var i = 0; i < this.paths.length; ++i) {
			var match = this.paths[i].path.exec(path);
			if (match != null)
				return { arguments : match, responder : this.paths[i].responder };
		}
		return null;
	};

	this.indexOf = function(pathRegex) {
		for (var i = 0; i < this.paths.length; ++i) {
			if (this.paths[i].path == path)
				return i;
		}
		return -1;
	};
	
	if (config != undefined) {
		for (var i = 0; i < config.length; ++i) {
			var c = config[i];
			this.addPath(c.path, c.responder);
		}
	}
}

RegexHost.prototype = new Host();

module.exports = RegexHost;

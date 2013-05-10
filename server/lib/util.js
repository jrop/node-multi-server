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

module.exports = {
	md5 : function(str) {
		if (str && typeof str != 'string')
			str = '' + str;
		return require('crypto').createHash('md5').update(str).digest('hex')
	},
	
	uuid : function() {
		var genHex = function(num) {
			var chars = '0123456789abcdef';
			var s = '';
			for (var i = 0; i < num; ++i) {
				var rand = Math.floor(Math.random() * 16);
				s += chars.charAt(rand);
			}
			return s;
		};
		
		return genHex(8) + '-'
			+ genHex(4) + '-'
			+ genHex(4) + '-'
			+ genHex(4) + '-'
			+ genHex(12);
	},
	
	stat : function(path) {
		var fs = require('fs');
		var stat = null;
		try { stat = fs.statSync(path); } catch(e) { stat = null; }
		return stat;
	},
	
	uniqueFileName : function(path) {
		var fs = require('fs');
		var files = fs.readdirSync(path);
		var fname = '';
		do {
			fname = module.exports.uuid();
		} while (files.indexOf(fname) != -1);
		return fname;
	}
};


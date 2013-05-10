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

var HeaderParser = module.exports = function() {
};

HeaderParser.prototype.parseLine = function(ln) {
	var obj = { };
	var ln = ln.split(';');
	for (var i = 0; i < ln.length; ++i) {
		var tkn = ln[i].trim().split('=');
		if (tkn.length == 2) {
			var nm = tkn[0];
			var val = tkn[1];
			if (val[0] == '"')
				val = val.substring(1, val.length - 1);
			obj[nm] = val;
		}
	}
	return obj;
}

HeaderParser.prototype.parse = function(header) {
	header = header.trim();
	var headerObj = { };
	//console.log('header:' + this.header);
	
	while (header.length > 0) {
		// read and parse line
		var lineEnd = header.indexOf('\n');
		if (lineEnd == -1)
			lineEnd = header.length;
		else
			++lineEnd;
		
		var line = header.substring(0, lineEnd);
		// parse the line:
		var nm = line.substring(0, line.indexOf(':')).toLowerCase();
		var val = line.substring(line.indexOf(':') + 1);
		var lineObj = this.parseLine(val);
		headerObj[nm] = {
			rawValue: val.trim(),
			values: lineObj
		};
		
		header = header.substring(lineEnd);
	}
	return headerObj;
	//console.log(this.headerObj);
};

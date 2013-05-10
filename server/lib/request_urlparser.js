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

var UrlParser = module.exports = function() {
	//application/x-www-form-urlencoded
	this.params = { };
	
	this._state = 'name'; // 'name' || 'value'
	this._name = '';
	this._value = '';
	this.decode = function(s) {
		return decodeURIComponent(s.replace(/\+/g, ' '));
	};
	
	this.parse = function(str) {
		//console.log('request body:>\'' + str + '\'<');
		for (var i = 0; i < str.length; ++i) {
			var c = str.charAt(i);
			if (c == '=' || c == '&') {
				// change states
				if (this._state == 'value') { // changing to a 'name' state
					this.params[this.decode(this._name)] = this.decode(this._value);
					this._name = '';
					this._value = '';
				}
				this._state = (this._state == 'name') ? 'value': 'name';
			} else {
				this['_' + this._state] += c;
			}
		}
		if (c != '&') {
			//this['_' + this._state] += c;
			if (this._name != '')
				this.params[decodeURIComponent(this._name.replace(/\+/g, ' '))] = decodeURIComponent(this._value.replace(/\+/g, ' '));
		}
		//console.log(this.params);
	};
};

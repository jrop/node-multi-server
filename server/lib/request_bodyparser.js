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

/* Example headers:
{ host: 'node.flutastic.info:8777',
  'user-agent': 'Mozilla/5.0 (X11; Linux i686; rv:10.0) Gecko/20100101 Firefox/1
0.0',
  'accept-language': 'en-us,en;q=0.5',
  'accept-encoding': 'gzip, deflate',
  referer: 'http://node.flutastic.info/debug',
  'content-type': 'multipart/form-data; boundary=---------------------------1993
99165559958719913169283',
  via: '1.1 node.flutastic.info',
  'x-forwarded-for': '70.56.48.217',
  'x-forwarded-host': 'node.flutastic.info',
  'x-forwarded-server': 'node.flutastic.info',
  connection: 'Keep-Alive',
  'content-length': '427' }*/
var util = require('util');
var events = require('events');
var buffer = require('buffer');

var FileCacher = require('./stream_filecacher.js');
var CachedFileReader = require('./stream_cachedfilereader.js');
var UrlParser = require('./request_urlparser.js');
var MultipartParser = require('./request_multipartparser.js');

var BodyParser = function(req) {
	this.parsed = false;
	this.params = { files: [ ] };
	this.on('parsed', function(params) {
		this.parsed = true;
		this.params = params;
	}.bind(this));
	
	this._req = req;
	var cl = this._req.headers['content-length'];
	if (cl) {
		var ct = this._req.headers['content-type'];
		if (ct.indexOf('multipart/form-data') != -1) {
			// create multipart/form-data parser
			// and parse it:
			//console.log('multipart');
			this._parser = new MultipartParser(this._req);
			
			req.on('data', function(buff) {
				this._parser.accumulate(buff);
			}.bind(this));
			
			req.on('end', function() {
				this._parser.end();
				this.emit('parsed', this._parser.params);
			}.bind(this));
		} else if (ct == 'application/x-www-form-urlencoded') {
			// form- urlencoded:
			// read it and send it to the parser:
			//console.log('form-urlencoded');
			
			this._parser = new UrlParser();
			
			var s = '';
			this._req.on('data', function(chunk) { s += chunk.toString(); });
			this._req.on('end', function() {
				this.me._parser.parse(s);
				this.me.emit('parsed', this.me._parser.params);
			}.bind({s : s, me : this}));
		} else {
			// raw data...
			//console.log('raw data');
			this._parser = new FileCacher();
			
			this._req.on('data', function(chunk) {
				this._parser.accumulate(chunk);
			}.bind(this));
			this._req.on('end', function() {
				this._parser.end();
				this.emit('parsed', {
					raw: new CachedFileReader(this._parser.path),
					files: [ ]
				});
			}.bind(this));
		}
	} else {
		// empty parser
		//console.log('empty');
		this.emit('parsed', { files: [ ] });
	}
};

var BP = BodyParser;
util.inherits(BP, events.EventEmitter);

module.exports = BodyParser;

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
var BodyCacher = require('./request_bodycacher.js');
var stream = require('./stream.js');

////////////////////////
// BEGIN MultipartParser
////////////////////////
var MultipartParser = function(req) {
	//multipart/form-data
	this._req = req;
	this.params = { };

	this.getBoundary = function(s) {
		var start = s.indexOf('boundary=');
		if (start != -1) {
			start += 'boundary='.length;
			var end = s.indexOf(';', start);
			if (end == -1)
				end = s.length;
		
			return s.substring(start, end);
		}
		return '';
	};
	
	this.readSection = function(lr) {
		var ln = '';
		while((ln = lr.readLine())) {
			console.log(ln);
		}
		//console.log(lr.peekLine());
		console.log('done');
	};
	
	this.parse = function(strm) {
		var lr = new stream.LineReader(strm);
		var sec = null;
		while((sec = this.readSection(lr))) {
			//console.log(sec);
		}
		console.log('DONE!');
	};

	// BEGIN read boundary
	this._boundary = this.getBoundary(this._req.headers['content-type']);
	console.log('the boundary is:');
	console.log(this._boundary);
	// END read boundary
};
//////////////////////
// END MultipartParser
//////////////////////

//////////////////
// BEGIN UrlParser
//////////////////
var UrlParser = function() {
	//application/x-www-form-urlencoded
	this.params = { };
	
	this._state = 'name'; // 'name' || 'value'
	this._name = '';
	this._value = '';
	this.decode = function(s) {
		return decodeURIComponent(s.replace(/\+/g, ' '));
	};
	
	this.parse = function(str) {
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
		if (c != '=' && c != '&')
			this['_' + this._state] += c;
		if (this._name != '')
			this.params[decodeURIComponent(this._name)] = decodeURIComponent(this._value);
		
		//console.log(str);
		//console.log(this.params);
	};
};
////////////////
// END UrlParser
////////////////

var BodyParser = function(req) {
	this._req = req;
	//console.log(req.headers);
	var cl = this._req.headers['content-length'];
	if (cl) {
		var ct = this._req.headers['content-type'];
		if (ct.indexOf('multipart/form-data') != -1) {
			// create multipart/form-data parser
			// and parse it:
			console.log('multipart');
			
			var cacher = new BodyCacher(this._req);
			cacher.on('end', function() {
				this.me._parser = new MultipartParser(this.me._req);
				//console.log(this.cacher.path);
				//console.log(module);
				this.me._parser.parse(stream.fromFile(this.cacher.path));
				this.me.emit('parse');
			}.bind({ cacher: cacher, me : this}));
		} else if (ct == 'application/x-www-form-urlencoded') {
			// form- urlencoded:
			// read it and send it to the parser:
			console.log('form-urlencoded');
			
			this._parser = new UrlParser();
			
			var s = '';
			this._req.on('data', function(chunk) { s += chunk.toString(); });
			this._req.on('end', function() {
				this.me._parser.parse(s);
				this.me.emit('parse', this.me._parser.params);
			}.bind({s : s, me : this}));
		} else {
			// raw data...
			console.log('raw data');
			this._parser = new BodyCacher(this._req);
		}
	} else {
		// empty parser
		console.log('empty');
		this._parser = {
			parse : function() { },
			params: { }
		};
	}
};

var BP = BodyParser;
util.inherits(BP, events.EventEmitter);

BP.prototype.initParams = function() {
	this._req.params = this._parser.params || { };
};

module.exports = BodyParser;

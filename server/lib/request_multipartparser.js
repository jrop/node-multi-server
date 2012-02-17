var fs = require('fs');
var buffer = require('buffer');
var util = require('util');
var events = require('events');

var Util = require('./util.js');
var Rotator = require('./rotator.js');
var HeaderParser = require('./headerparser.js');
var UploadedFile = require('./request_multipartparser_uploadedfile.js');
var CachedFileReader = require('./stream_cachedfilereader.js');

var MultipartParser = module.exports = function(req) {
	this.params = { files: [ ] };
	this.state = 'none';
	this.rotator = new Rotator(0);
	this.headerParser = new HeaderParser();
	this.boundaries = new Array();
	//this.cache = fs.openSync('body.cache', 'w');
	
	var ct = { };
	if (req.headers['content-type'])
		ct = this.headerParser.parseLine(req.headers['content-type']);
	var boundary = ct.boundary;
	
	this.addBoundary('--' + boundary);
	this.addDelimeter('\r\n\r\n', 'newline');//'\\r\\n\\r\\n');
	
	this.isFile = false;
	this.fieldName = '';
	this.fieldValue = '';
	this.rotator.on('out', function(buff) {
		//fs.writeSync(this.cache, buff, 0, buff.length, null);
		if (this.state == 'header') {
			this.fieldValue += buff.toString();
		} else if (this.state == 'content') {
			if (this.isFile) {
				this.fieldValue.accumulate(buff);
			} else {
				this.fieldValue += buff.toString();
			}
		}
	}.bind(this));
};

util.inherits(MultipartParser, events.EventEmitter);

var MP = MultipartParser;

MP.prototype.addDelimeter = function(b, name) {
	this.boundaries.push({
		value: b,
		name: name,
		buff: new buffer.Buffer(b)
	});
	
	// sort on descending length
	this.boundaries.sort(function(x, y) {
		var xl = x.value.length;
		var yl = y.value.length;
		return yl - xl; // if xl < yl: > 0; if xl > yl: < 0
	});
	
	//console.log(this.boundaries);
	if (this.boundaries[0].value.length != this.rotator.length)
		this.rotator.changeLength(this.boundaries[0].value.length);
};

MP.prototype.addBoundary = function(b) {
	this.addDelimeter(b + '\r\n', 'boundary');
	this.addDelimeter('\r\n' + b, 'boundary');
	this.addDelimeter('\r\n' + b + '--', 'end');
};

MP.prototype.accumulate = function(buff) {
	for (var i = 0; i < buff.length; ++i) {
		this.rotator.rotate(buff.slice(i, i + 1));
		// check for boundaries...
		for (var j = 0; j < this.boundaries.length; ++j) {
			var bound = this.boundaries[j];
			if (this.checkForDelimeter(bound)) {
				//fs.writeSync(this.cache, bound.buff, 0, bound.buff.length, null);
				if (bound.name == 'boundary') {
					this.__cleanupFields();
					
					this.state = 'header';
				} else if (bound.name == 'newline') {
					if (this.state == 'header') {
						// the headers section just ended:
						var header = this.headerParser.parse(this.fieldValue);
						this.fieldValue = '';
						this.fieldName = '';
						this.isFile = false;
						
						if (header['content-type']) {
							if (header['content-type'].values.boundary)
								this.addBoundary(header['content-type'].values.boundary);
						}
					
						if (header['content-disposition']) {
							var cd = header['content-disposition'];
							if (cd.values.filename != undefined) {
								var uuid = Util.uuid() + '.upload.cache';
								if (cd.values.filename == '') {
									cd.values.filename = uuid;
								}
								
								this.isFile = true;
								this.fieldName = cd.values.filename;
								this.fieldValue = new UploadedFile(uuid);
								
								//console.log('starting file ' + this.fieldName);
							} else {
								this.isFile = false;
								this.fieldName = cd.values.name;
							}
						}
					
						this.state = 'content';
					} else if (this.state == 'content') {
						this.rotator.emit('out', new buffer.Buffer('\r\n\r\n'));
					}
				} else if (bound.name == 'end') {
				}
				break;
			}
		}
	}
};

MP.prototype.__cleanupFields = function() {
	if (this.fieldName != '') {
		if (this.isFile) {
			//console.log(this.fieldName);
			//console.log(this.fieldValue);
			//console.log('closing file ' + this.fieldName);
			this.fieldValue.end();
			this.params.files.push(new CachedFileReader(this.fieldValue.path));
		} else
			this.params[this.fieldName] = this.fieldValue;
	}
	
	this.fieldValue = '';
	this.fieldName = '';
	this.isFile = false;
};

MP.prototype.checkForDelimeter = function(bound) {
	if (this.rotator.contentLength != this.rotator.length)
		return;
	
	if (this.rotator.startsWith(bound.buff)) {
		//console.log('\nV===================');
		//console.log('{' + bound.name + '}');// + this.rotator.toString());
		//print(this.rotator.toString());
		//console.log('^===================');
		//console.log(">'" + bound.name + ':' + this.rotator.toString() + "'<");
		this.rotator.erase(bound.buff.length);
		return true;
	} //else
		//print(this.rotator.toString());
	return false;
};

MP.prototype.end = function() {
	this.__cleanupFields();
	//fs.closeSync(this.cache);
};


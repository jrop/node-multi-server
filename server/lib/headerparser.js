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

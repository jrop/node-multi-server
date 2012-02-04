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
		try { fs.statSync(path); } catch(e) { }
		return stat;
	}
};

module.exports = {
	md5 : function(str) {
		if (str && typeof str != 'string')
			str = '' + str;
		return require('crypto').createHash('md5').update(str).digest('hex')
	}
};

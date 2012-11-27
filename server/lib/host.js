function Host(config) {
	this.paths = new Array();
	this.defaultResponder = require('./defaultresponder.js').default;
	
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
				return { matches : match, responder : this.paths[i].responder };
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
	
	this.getDefaultResponder = function() {
		return this.defaultResponder;
	};
	
	this.setDefaultResponder = function(fn) {
		this.defaultResponder = fn;
	};
	
	if (config != undefined) {
		for (var i = 0; i < config.length; ++i) {
			var c = config[i];
			this.addPath(c.path, c.responder);
		}
	}
}

module.exports = Host;

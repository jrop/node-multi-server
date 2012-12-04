function Host() {
	this.defaultResponder = require('./defaultresponder.js').default;
}

Host.prototype.getDefaultResponder = function() {
	return this.defaultResponder;
};

Host.prototype.setDefaultResponder = function(fn) {
	this.defaultResponder = fn;
};

module.exports = Host;

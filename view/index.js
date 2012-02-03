var ejs = require('ejs');
var fs = require('fs');

function View(fname, locals, options) {
	var fContents = 'View file is non-existent';
	try {
		fContents = fs.readFileSync(fname).toString();
	} catch (e) { }

	this.ejsRender = ejs.compile(fContents, options);
	this.locals = locals || { };
	this.__isviewclass = true;
	
	this.render = function(context, contentType) {
		if (!contentType)
			contentType = 'text/html';
		
		var response = context.response;
		response.setHeader('Content-type', contentType);
		response.write(this.renderString(locals));
		response.end();
	};
	
	this.renderString = function() {
		// pre-process locals for sub-Views
		var locals = this.locals;
		for (var mbr in locals) {
			if (locals[mbr] && locals[mbr].__isviewclass) // this local var is a View itself, render it first
				locals[mbr] = locals[mbr].renderString();
		}
		return this.ejsRender(locals)
	};
	
	this.setLocals = function(locals) {
		this.locals = locals;
	};
}

module.exports = {
	View : View,
	render : function(context, locals) {
		var tpl = require('./');
		tpl.__singleton.setLocals(locals);
		tpl.__singleton.render(context);
	},
	__singleton : new View(require('path').dirname(module.filename) + '/theme.ejs')
};

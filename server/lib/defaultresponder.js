module.exports = {
	default : function(ctx) {
		ctx.response.write('Default responder');
		ctx.response.end();
	},
	
	error : function(ctx) {
		try {
			ctx.response.statusCode = 500;
			ctx.response.write('<h3>Internal Server Error</h3>');
			ctx.response.end();
		} catch (ex) {
		}
	}
};

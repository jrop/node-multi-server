var events = require('events');
var Context = require('./context.js');
var Request = require('./request.js');
var Response = require('./response.js');

/**
 * Singleton
 */
function Dispatcher() {
	events.EventEmitter.call(this);
	
	this.hosts = new Array();
	this.__defaultResponder = require('./defaultresponder.js');
	
	this.__error = function (request, response, ex) {
		this.__respond(this.__defaultResponder.error, request, response, null);
		console.log(ex.message);
		console.log(ex.stack);
	};
	
	this.__respond = function(responder, request, response, matches) {
		var context = new Context(request, response, matches);
		if (!context.loaded) {
			context.on('load', function() {
				responder(context);
			});
		} else
			responder(context);
	};
	
	this.addHost = function(pattern, host) {
		if (typeof pattern == typeof '')
			pattern = new RegExp(pattern);
		this.hosts.push({pattern: pattern, host: host});
	};
	
	this.lookupHost = function(str) {
		for (var i = 0; i < this.hosts.length; ++i) {
			if (this.hosts[i].pattern.test(str))
				return this.hosts[i].host;
		}
	};
	
	this.serveFile = function(path, context) {
		var file = require('fs');
		var stat = undefined
		try {
			stat = file.statSync(path);
		} catch (ex) {
			return false;
		}
		
		if (stat != undefined && !stat.isDirectory()) {
			// read mime-type of file, and send it
			//console.log(stat);
			var date = new Date();
			date.setDate(date.getDate() + 3);
			
			var response = context.response;
			response.setHeader('Expires', date);
			response.setHeader('Cache-Control', 60 * 60 * 24 * 7);
			response.setHeader('Content-type', require('mime').lookup(path));
			response.write(file.readFileSync(path));
			response.end();
			return true; // that's it for files!
		}
		
		return false;
	};
	
	this.dispatch = function(request, response) {
		this.emit('request', request);
		
		var req = new Request(request);
		var resp = new Response(response);
		var host = this.lookupHost(request.headers.host);
		if (host != undefined) {
			var obj = host.lookup(req.url);
			if (obj && typeof obj.responder == 'function') {
				try {
					this.__respond(obj.responder, req, resp, obj.matches);
				} catch (ex) {
					this.__error(req, resp, ex);
				}
			} else {
				try {
					this.__respond(host.getDefaultResponder(req.headers.host), req, resp, null);
				} catch (ex) {
					this.__error(req, resp, ex);
				}
			}
		} else {
			this.__respond(this.__defaultResponder.default, req, resp, null);
		}
	};
	
	//this.redirect = function(newPath) {
	//	request.url = newPath;
	//	this.dispatch(request, response);
	//};
	
	this.listen = function(port) {
		require('http').createServer(function (req, resp) {
			console.log('Serving: ' + req.headers.host + ' => ' + req.url);
			require('./dispatcher.js').dispatch(req, resp);
		}).listen(port);
		console.log('Dispatcher listening on port ' + port);
	};
}

Dispatcher.prototype = new events.EventEmitter();

module.exports = new Dispatcher(); // single instance

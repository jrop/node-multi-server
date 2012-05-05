About
=====

This module is aimed at providing node with a simlper interface for creating and hosting multiple websites, supporting Sessions, Cookies, HTML Forms (www-form-data), and File Uploads internally (multipart/form-data).  This module is in early development, and not all functionality is gauranteed to work.

HTTPS is not supported (yet!).

Again, this is all highly untested code, so it is not gauranteed to work.

API Use
=======

A basic server setup will end up looking something like the following (be sure to replace portions within angled brackets):

	var server = require('<location of this module''s package.json>');
	server.Dispatcher.addHost('<your host regex (e.g, example.com)>', new server.Host([
		{
			path: '^(.*)$',
			responder: function(context) {
				var resp = context.response;
				resp.setHeader('Content-Type', 'text');
				resp.write('Hello World!\n');
				resp.write('Path requested: ' + context.matches[1] + '\n');
				resp.end();
			}
		}
	]));
	server.Dispatcher.listen(8080);

With this system, you can host multiple 'virtual' hosts on a single server (much like Apache''s virtual hosts).  The API will find the appropriate host, and then attempt to match the requested path with the paths specified in the `server.Host` configuration.

Form data is passed through `context.request.params`.  To handle uploaded files, simply use the `context.request.params.files` array.  Uploaded files stick around as temporary files for 30 seconds in the `./tmp` directory (I hope for all of this to be configurable in the near future).

TODO
====

1. Make temp directory and uploaded file timeout configurable
2. Create better documentation

Notes
=====

This module does not attempt to provide any attempt in assisting with template/view management.  For this kind of functionality, there are plenty of standalone modules (my personal favorite is `ejs`).

Installation
============

These are just plain [node modules][http://nodejs.org/docs/latest/api/modules.html] right now.  Eventually, I want to host this in an NPM repo for easy installation.

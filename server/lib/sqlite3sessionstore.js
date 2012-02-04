// TODO:
// 1) is sqlite3 the best session store? it seams awfully brittle
// 2) session security: see http://stackoverflow.com/questions/3881077/php-session-security
//    i.e., need to store user fingerprint along with session (like IP + user agent string)

var sqlite3 = require('sqlite3');

this.__create_table_sql = 'CREATE TABLE IF NOT EXISTS sessions (id INTEGER PRIMARY KEY AUTOINCREMENT, data TEXT, expires INTEGER);';
	this.__db_file = 'session.db';
	
	this.getCleanSql = function() {
		var d = new Date();
		var utime = parseInt(d.getTime() / 1000);
		var sql = "DELETE FROM sessions WHERE expires < " + utime;
		return sql;
	};
	
	this.openDB = function(callback) {
		var db = new sqlite3.Database(this.__db_file);
		var me = this;
		
		db.serialize(function () {
			db.run(me.getCleanSql());
			db.run(me.__create_table_sql, function(err, row) {
				if (!err)
					callback(db);
				else
					callback(undefined);
			});
		});
	};
	
	this.load = function(ctx, callback) {
		var server = require('server');
		var ck = ctx.request.cookies;
		//console.log(ck);
		if (!ck || !ck.sid) {
			callback(undefined);
			return;
		}
		
		this.openDB(function (db) {
			if (!db)
				callback(undefined);
			
			db.prepare("SELECT * FROM sessions WHERE id='" + ck.sid + "';")
			.get(function (err, row) {
				var jsonObj = undefined;
				var ret = undefined;
				if (!err && row) {
					jsonObj = JSON.parse(row.data);
					ret = { id: row.id, data : jsonObj, expires : new Date(row.expires) }
				}
				
				db.close();
				callback(ret);
		  	}).finalize();
		});
	};
	
	/**
	 * @param session { data: { ... }, expires: Date [, id: sid ] }
	 */
	this.save = function(ctx, session, callback) {
		if (!session.expires || typeof session.expires != 'number') {
			var d = new Date();
			if (session.getTime) // date object
				d = session.expires;
			
			session.expires = parseInt((d.getTime() / 1000.0) + /* 1 hour in seconds: */ 60 * 60);
		}

		var sqlite3 = require('sqlite3');
		var json = JSON.stringify(session.data).replace(/'/g, "''");
		
		this.openDB(function (db) {
			if (!db)
				callback(undefined);
			
			if (session.id)
				sql = "UPDATE sessions SET data='" + json + "', expires=" + session.expires + " WHERE id='" + session.id + "'";
			else
				sql = "INSERT INTO sessions (data, expires) VALUES ('" + json  + "', " + session.expires + ")";
			
			//console.log(sql);
			db.run(sql, function (err, row) {
				var server = require('server');
				ctx.response.setCookie('sid', this.lastID || session.id);
				db.close();
				callback(err);
			});
		});
	};

var UrlParser = module.exports = function() {
	//application/x-www-form-urlencoded
	this.params = { };
	
	this._state = 'name'; // 'name' || 'value'
	this._name = '';
	this._value = '';
	this.decode = function(s) {
		return decodeURIComponent(s.replace(/\+/g, ' '));
	};
	
	this.parse = function(str) {
		for (var i = 0; i < str.length; ++i) {
			var c = str.charAt(i);
			if (c == '=' || c == '&') {
				// change states
				if (this._state == 'value') { // changing to a 'name' state
					this.params[this.decode(this._name)] = this.decode(this._value);
					this._name = '';
					this._value = '';
				}
				this._state = (this._state == 'name') ? 'value': 'name';
			} else {
				this['_' + this._state] += c;
			}
		}
		if (c != '=' && c != '&')
			this['_' + this._state] += c;
		if (this._name != '')
			this.params[decodeURIComponent(this._name)] = decodeURIComponent(this._value);
		
		//console.log(str);
		//console.log(this.params);
	};
};

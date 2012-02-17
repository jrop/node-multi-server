var util = require('util');
var events = require('events');
var buffer = require('buffer');

var BoundaryDetector = module.exports = function() {
	this.boundaries = new Array();
};

util.inherits(BoundaryDetector, events.EventEmitter);

var BD = BoundaryDetector.prototype;
BD.addBoundary = function(b, name) {
	this.boundaries.push({
		name: name,
		index: -1,
		complete: false,
		value: b
	});
};

BD.__isRipe = function(bound) {
	return bound.index == -1 && bound.complete;
};

BD.__isInProgress = function(bound) {
	return bound.index != -1 && !bound.complete;
};

// return 'ripe' boundaries: a ripe one is one that just stopped matching
BD.__defineGetter__('ripe', function() {
	var ret = [];
	for (var i = 0; i < this.boundaries.length; ++i) {
		var b = this.boundaries[i];
		if (this.__isRipe(b))
			ret.push(b);
	}
	return ret;
});

BD.__defineGetter__('inProgress', function() {
	var inP = [];
	for (var i = 0; i < this.boundaries.length; ++i) {
		var b = this.boundaries[i];
		if (this.__isInProgress(b))
			inP.push(b);
	}
	return inP;
});

// -----------------------------13415169481676236505715590690
// -----------------------------3762392374259258961408495653
BD.accumulate = function(buff) {
	for (var i = 0; i < buff.length; ++i) {
		var singleBuff = buff.slice(i, i + 1);
		
		// check single character 'c'
		var c = singleBuff.toString();
		var stopped = false;
		var matched = false;
		//process.stdout.write('{' + c + '}\n');
		for (var j = 0; j < this.boundaries.length; ++j) {
			var bound = this.boundaries[j];
			if (bound.value[bound.index + 1] == c) {
				// still matches
				++bound.index;
				bound.complete = (bound.index == bound.value.length - 1);
				matched = true;
			} else {
				// doesn't match
				if (bound.index != -1) { // doesn't match __anymore__ (it did at one time in the past)
					stopped = {
						value: bound.value.substring(0, bound.index + 1),
						stoppedAt: bound.index
					};
				}
				
				bound.index = -1;
				bound.complete = false;
			}
		}
		
		if (stopped && !matched) {
			var bTmp = new buffer.Buffer(stopped.value);
			this.emit('data', bTmp);
		}
		
		if (!matched) {
			this.emit('data', singleBuff);
		}
		this.__cleanup();
	}
};

BD.__cleanup = function() {
	// what this function does:
	// (1) fire boundaries that are complete (only happens 1 at a time)
	// (2) reset all other boundaries (ONLY if at least one boundarie is complete
	
	// BEGIN (1)
	var foundComplete = false;
	for (var i = 0; i < this.boundaries.length; ++i) {
		var b = this.boundaries[i];
		if (b.complete) {
			foundComplete = true;
			this.emit('boundary', b.value, b.name);
		}
	}
	// END (1)
	
	// BEGIN (2)
	if(foundComplete) {
		for (var i = 0; i < this.boundaries.length; ++i) {
			var b = this.boundaries[i];
			b.index = -1;
			b.complete = false;
		}
	}
	// END (2)
};

BD.end = function(buff) {
	
};

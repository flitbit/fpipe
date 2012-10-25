'use strict';

var events = require('events'),
util       = require('util');

var logsink = new events.EventEmitter();
var uncaughtExceptionTrap = function(err) {
			logsink.on('uncaughtException', err);
		};

function Pipe(source) {
	Pipe.super_.call(this);
	
	if (source && typeof source !== 'function') {
		throw new TypeError('[Function] source must be a function!');
	}
	var self = this;
	Object.defineProperties(self, {
		_source: {
			value: source,
			writable: true
		},
		_middleware: { value: [] },
	});
	this.on('uncaughtException', uncaughtExceptionTrap);
	this.on('newListener', this.__onNewListener);
}
util.inherits(Pipe, events.EventEmitter);

Object.defineProperties(Pipe.prototype, {
		__onNewListener: {
		value: function(name, listener) {
			if (name === 'uncaughtException') {
				this.removeListener('uncaughtException', uncaughtExceptionTrap);
			}
		}
	},
	use: { 
		value: function(middleware) {
			if (typeof middleware !== 'function') {
				throw new TypeError('[Function] middleware must be a function!');
			}
			this._middleware.push(middleware);
			return this;
		},
		enumerable: true
	},
	source: { 
		value: function(src) {
			if (src) {
				if (typeof src !== 'function') {
					throw new TypeError('[Function] source must be a function!');
				}
				this._source = src;	
			} else {
				this._source = null;
			}
			return this;
		}
	},
	performEnd: {
		value: function(state, err, res) {
			if (state.callback) {
				state.callback(err, res);
			}
		}
	},
	performStep: {
		value: function(state, n, err, res) {
			if (err || n >= state.middleware.length) {
				if (state.callback) {
					state.callback(err, res);
				} 
			} else {
				var self = this, step = state.middleware[n];
				try {
					step(res, function(ee, dd) {
						process.nextTick(function() {
							self.performStep(state, n + 1, ee, dd);
						});
					},
					function(ee, dd) {
						process.nextTick(function() {	
							self.performEnd(state, ee, dd);
						});
					});
				} catch (e) {
					state.callback(e, res);
				}
			}
		}
	},
	execute: { 
		value: function(callback) {
			if (!this._source) {
				throw new Error('Invalid operation; the pipe doesn\'t have a source.');
			}
			var self = this, middleware = this._middleware;
			var args = Array.prototype.slice.call(arguments, 1);
			var cb = function(err,res) {
				var state = { 
					middleware: middleware,
					callback: function(ee, rr) {
						try {
							callback(ee, rr);
						} catch (eee) {
							self.emit('uncaughtException', eee);
						}
					}
				};
				self.performStep(state, 0, err, res);
			};
			if (args.length) {
				this._source.apply(this, args.concat([cb]));
			}
			else {
				this._source(cb);
			}
			return this;
		},
		enumerable: true
	},
	clone: {
		value: function(source) {
			var self = this;
			var src = source || this._source;
			var result = new Pipe(src);
			this._middleware.forEach(function(middleware) {
				result.use(middleware);
			});
			this.listeners('uncaughtException').forEach(function(listener) {
				if (listener !== uncaughtExceptionTrap) {
					result.on('uncaughtException', listener);
				}
			});

			return result;
		},
		configurable: true
	}
});

exports.create = function(source) {
	return new Pipe(source);
};
exports.version = require('../package').version;
exports.log_sink = logsink;

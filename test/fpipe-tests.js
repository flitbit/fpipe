var vows = require('vows'),
should   = require('should'),
util     = require('util'),
pipe     = require('../index');

vows.describe('Pipe').addBatch({
	'With an empty pipe': {
		topic: function() {
			return pipe.create();
		},
		'we can assign a source function': {
			topic: function(it) {
				should.exist(it);
				should.not.exist(it._source);
				it.source(function(cb) {
					cb(null, 'You called me.');
				});
				should.exist(it._source);
				return it;
			},
			'and execute the pipe.': {
				topic: function(it) {
					it.execute(this.callback);	
				},
				'The pipe shall not produce an error.': function(err, res) {
					should.not.exist(err);
				},
				'The pipe shall provide the predicted message.': function(err, res) {
					res.should.eql('You called me.');
				} 
			},
			'and clone the pipe.': {
				topic: function(it) {
					this.origin = it;
					should.exist(it);
					return it.clone();
				},
				'The clone shall be a distinct instance.': function(clone) {
					should.exist(clone);
					clone.should.not.eql(this.origin);
				},
				'The clone shall be executable.': {
					topic: function(clone) {
						clone.execute(this.callback);
					},
					'The Clone shall not produce an error.': function(err, res) {
						should.not.exist(err);
					},
					'The Clone shall produce the expected message.': function(err, res) {
						res.should.eql('You called me.');
					}
				}
			},
			'and use middleware with the pipe (clone).': { 
				topic: function(it) {
					var clone = it.clone();
					clone.use(function(res, callback) {
						callback(null, 'Observed: ' + res);	
					});
					clone.execute(this.callback);	
				},
				'The Clone shall not produce an error.': function(err, res) {
					should.not.exist(err);
				},
				'The Clone shall produce the expected message.': function(err, res) {
					res.should.eql('Observed: You called me.');
				} 
			}
		}
	}
})
.addBatch({
	'When initializing a pipe over a function taking an argument...': {
		topic: function() {
			return pipe.create(function(you, callback) {
				if (you && typeof you !== 'string') {
					throw new TypeError('[String] you must be a string or null.');
				}
				var who = you || 'you';
				if (callback) {
					callback(null, 'Hello '.concat(who,'.'));
				}
			});
		},
		'upon executing the pipe without an argument...': {
			topic: function(it) {
				it.execute(this.callback);
			},
			'The pipe shall produce a type error.': function(err, res) {
				res.should.be.an.instanceof(TypeError);
			}
		},
		'upon executing the pipe with an argument intended for the source...': {
			topic: function(it) {
				it.execute(this.callback, 'Bob');
			},
			'The pipe shall produce the expected message.': function(err, res) {
				should.not.exist(err);
				res.should.eql('Hello Bob.');
			} 
		} 
	}
}).addBatch({
	'When working with a pipe and unreliable middleware...': {
		topic: function() {
			var p = pipe.create(function(you, callback) {
				if (you && typeof you !== 'string') {
					throw new TypeError('[String] you must be a string or null.');
				}
				var who = you || 'you';
				if (callback) {
					callback(null, 'Hello '.concat(who,'.'));
				}
			});
			p.use(function(res, next) {
				if (res.indexOf('Bomb') > 0) {
					throw new Error('Bomb has been detonated!');
				}
				next(null, res);
			}).use(function(res, next) {
				next(null, res);
			});
			return p;
		},
		'when executed with safe data...': {
			topic: function(it) {
				it.execute(this.callback, 'Bob');
			},
			'The pipe shall produce the expected message.': function(err, res) {
				should.not.exist(err);
				res.should.eql('Hello Bob.');
			} 
		},
		'when executed with unsafe data...': {
			topic: function(it) {
				it.execute(this.callback, 'Bomb');
			},
			'The pipe shall trap the error and forward it to the caller.': function(err, res) {
				should.exist(err);
				err.should.be.an.instanceof(Error);
				err.should.have.property('message').eql('Bomb has been detonated!');
			} 
		} 
	}
}).export(module);

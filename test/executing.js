var util = require('util'),
fpipe    = require('../index');

var pipe = fpipe.create();

pipe.use(function(res, next) {
	var modified = (res) 
		? 'Observed: '.concat(res)
		: 'Observed nothing.';
	next(null, modified);
});

// Create a pipe over a function that does not take any arguments
// other than the callback...
pipe.source(function(callback) {
	callback(null, "Somebody poked me!");
});

// Execute the pipe, providing a callback.
pipe.execute(function(err, res) {
	if (err) {
		console.log('Got an error: ' + err);
	} else {
		console.log('Got a result: ' + res);
	}
});

// Create a clone, replacing the source with
// a function that expects an argument...
var pipe2 = pipe.clone(function(you, callback) {
	// simulate some latency, then say hi...
	setTimeout(function() {
		callback(null, 'Hi ' + you);
	}, 1000);
});

// Since the source of second pipe takes an argument,
// we pass it after our callback. Any arguments following
// the callback are curried to the source in front of
// the callback so you'll want to ensure that enough
// arguments are passed (even if some are null) so that
// the callback is positioned correctly.
pipe2.execute(function(err, res) {
	if (err) {
		console.log('Got an error: ' + err);
	} else {
		console.log('Got a result: ' + res);
	}
}, 'tester');


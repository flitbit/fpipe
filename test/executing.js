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

// Create another pipe (by cloning), and replace the source with
// a source that requires an argument...
var pipe2 = pipe.clone(function(you, callback) {
	// simulate some latency, then say hi...
	setTimeout(function() {
		callback(null, 'Hi ' + you);
	}, 1000);
});

// If our source takes an argument, pass the argument when you
// execute the pipe and it is curried to the source...  
pipe2.execute(function(err, res) {
	if (err) {
		console.log('Got an error: ' + err);
	} else {
		console.log('Got a result: ' + res);
	}
}, 'tester');


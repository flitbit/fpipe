var util = require('util'),
fpipe    = require('../lib/fpipe');

// Gets a random integer between 0 (zero) and max
function randomWait(max) {
	return Math.floor(Math.random() * (max+1));
}

// Waits a random period of time before returning a dumb message to the
// callback given.
function do_something_uninteresting(callback) {
	// simulate latency
	var wait = randomWait(1000);
	setTimeout(function() {
		callback(null, "It took me ".concat([wait, " milliseconds to notice you."]));
	}, wait);	
}

// Logs it then calls next.
function logIt(it, next) {
	util.log(util.inspect(it));

	next(null, it);
}

// Observes it (by writing it to the console), then calls next.
function observeIt(it, next) {
	console.log("observed: ".concat(it));

	next(null, it);
}

// Create an fpipe over our uninteresting function...
var pipe = fpipe.create(do_something_uninteresting);

// Add some middleware...
pipe.use(logIt);
pipe.use(observeIt);

// Execute the pipe...
pipe.execute(function(err, res) {
	if (err) {
		console.log("Got an error: ".concat(util.inspect(err, false, 99)));
	} else {
		console.log("Got a message: ".concat(res));
	}
});

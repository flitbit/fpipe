Node.js module for grafting a middleware pipeline over a target function.

_fpipe_ is a simple module that allows you to easily add a series of functions between a _source_ function and a _target_ callback. 
Each function in the series (middleware) is executed in turn, potentially modifying the _source's_ result, and ultimately, if no middleware throws an exception, the _target_ callback is invoked in the Node.js style.

### Simple Example

``` javascript
var util = require('util'),
fpipe    = require('fpipe');

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
```

### Install
```
npm install fpipe
```

### Tests
Tests are written using [vows](http://vowsjs.org/) & [should.js](https://github.com/visionmedia/should.js/). If you've installed in a development environment you can use npm to run the tests.

```
npm test fpipe
```

### API 

The module exposes 3 items:

* `create`   - a factory for creating fpipes.
* `log_sink` - a shared event emitter where any uncaught exception are exposed.
* `version`  - exposes the module's version.



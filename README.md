# Function Pipe

A function pipe enables the management and execution of a series of operations between a _source function_ and a _target callback_. Each operation in the series (often referred to as _middleware_) is executed in turn, potentially modifying the _source_'s result, and ultimately, a caller provided _target callback_ is invoked.

If you've used [node](http://nodejs.org) for a while you are probably familiar with the function pipe pattern; it is used by [connect](https://github.com/senchalabs/connect), [express](https://github.com/visionmedia/express), and [flatiron](https://github.com/flatiron) to name a few. The goal of the **fpipe** module is to extract the function pipe behavior common to these great frameworks and encapsulate it for the community's use.

**fpipe** ensures executions of the pipeline are isolated from overlapping activity, including subsequent modifications to the pipe. It is useful for layering over asynchronous functions when numerous simultaneous executions are anticipated.

## Installation
```
npm install fpipe
```

## Testing
Tests are written using [vows](http://vowsjs.org/) & [should.js](https://github.com/visionmedia/should.js/) (you may need to install them). If you've installed in a development environment you can use npm to run the tests.

```
npm test fpipe
```

## Simple Example

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
## Documentation

An standard import of fpipe `var fpipe = require('fpipe')` is assumed in all of the code examples. The import results in an object having the following public properties:

* `create`   - a factory for creating fpipes.
* `log_sink` - a shared event emitter where any uncaught exception are exposed.
* `Pipe` - the fpipe implementation class.
* `version`  - exposes the module's version.

### `create`

Constructs a new function pipe. 

``` javascript
// Create a pipe without a source function...
var my = fpipe.create();
```

or

``` javascript
// Create a pipe over a source function...
var my = fpipe.create(function(callback) { 
	callback(null, { here_is: "a result" });
});
```

### `Pipe`

A function pipe derives from Node.js' EventEmitter and exposes the following interface:

*Properties*

* `_source` - the _source_ function over which the pipe will execute.
* `_middleware` - an array containing the currently configured middleware on the pipe; this is the series of functions that will execute between the _source_ function and the _target_ callback.

*Operations*

* `use` - adds a middleware function to the series of functions that the pipe will execute.
* `execute` - invokes the _source_ function, the middleware series, and ultimately the _target_ callback.
* `source` - sets the pipe's _source_ function.
* `clone` - clones the pipe, optionally changing it's _source_ function.

*Events*

* "uncaughtException" - occurs when the pipe encounters an uncaught exception. Generally speaking, this only occurs when your callback throws. Exceptions occurring during the series are given to your callback directly (as per the Node.js callback style).

#### `Pipe.use`

Adds a middleware function to the series of functions that the pipe will execute.

*arguments*

* `middleware` - a middleware function (described below).

To be useful, any `middleware` function should take the following 2 arguments.

* `res` - the result of the predicessor step in the middleware pipeline.
* `next` - the next middleware step in the pipeline.

Well behaved middleware will always call `next`. The `next` function is a callback in the [Node.js style](http://nodemanual.org/latest/nodejs_dev_guide/working_with_callbacks.html):

Logically, the `next` function behaves like this: 

``` javascript
function myCallback(err, res) {
	if (err) {
		// a prior function in the series resulted in error,
		// stop the pipe and notify the target callback...
		this.notifyTargetOfError(err);
	} else {
		// no error yet, continue processing...
		this.performNextMiddleware(res);
	}
}
```

Example of well-behaved (albeit trivial), middleware function: 

``` javascript
var my = fpipe.create(function(callback) {
	callback(null, { here_is: "a result" });
});

my.use(function(res, next) {
	console.log(util.inspect(res));

	next(null, res);
});
```

If a middleware function throws an error it will be caught by the Pipe, which will behave as if the middleware returned the error to `next`.

#### `Pipe.execute`

Executes the function pipe, starting with the `source` function that you provided, then continuing with each `middleware` in turn, and finally ending by invoking the callback given.

*arguments*

* `callback` - a nodejs style callback taking an error and a result.
* `any..any-n` - any value(s) that must be curried to the _source function_

``` javascript
var util = require('util'),
fpipe    = require('fpipe');

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
```



const util = require('util');
const Promise = require('bluebird');
const { Pipe } = require('../lib');

// Gets a random integer between 0 (zero) and max
function randomWait(max) {
  return Math.floor(Math.random() * (max + 1));
}

// Waits a random period of time before returning a dumb message to the
// callback given.
function doSomethingUninteresting(data) {
  // simulate latency
  var wait = randomWait(1000);
  return Promise.delay(wait).then(
    () => `It took me ${wait} milliseconds to notice you gave me ${data}.`
  );
}

// Logs it then calls next.
function logIt(it) {
  util.log(util.inspect(it));
  return it;
}

// Observes it (by writing it to the console).
function observeIt(it) {
  util.log(`observed: ${it}`);
  return it;
}

// Create an fpipe over our uninteresting function...
var pipe = new Pipe(doSomethingUninteresting)
  // Add some middleware...
  .pipe(logIt)
  .pipe(observeIt);

// Proccess the pipeline
pipe
  .process('funcklewinker')
  .then(msg => util.log('Got a message: '.concat(msg)))
  .catch(err =>
    util.log('Got an error: '.concat(util.inspect(err, false, 99)))
  );

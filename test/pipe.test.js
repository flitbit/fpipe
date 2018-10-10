const { Pipe } = require('..');
const { log } = require('util');
const Promise = require('bluebird');

function nullFn() {}

test('.ctor() with no args succeeds', () => {
  const pipe = new Pipe();
  expect(pipe).toBeDefined();
});

test('.ctor(fn) succeeds', () => {
  const pipe = new Pipe(nullFn);
  expect(pipe).toBeDefined();
});

test('.ctor([fn]) succeeds', () => {
  const pipe = new Pipe([nullFn]);
  expect(pipe).toBeDefined();
});

test('.ctor([fn,fn]) succeeds', () => {
  const pipe = new Pipe([nullFn, nullFn]);
  expect(pipe).toBeDefined();
});

test('.ctor(fn,fn) succeeds', () => {
  const pipe = new Pipe(nullFn, nullFn);
  expect(pipe).toBeDefined();
});

test('.pipe() succeeds with no arguments (but is dumb)', () => {
  const pipe = new Pipe();
  const pipe1 = pipe.pipe();
  expect(pipe1).toBeDefined();
  // Oh, by the way, pipes are immutable, so .pipe() creates a new pipe.
  expect(pipe1).not.toBe(pipe);
});

test('.pipe(fn) adds a function to the pipe', async done => {
  try {
    const pipe = new Pipe().pipe(arg => `arguments[0]: ${arg}`);
    const res = await pipe.process();
    expect(res).toMatch('arguments[0]: undefined');
    done();
  } catch (err) {
    done(err);
  }
});

test('.pipe(fn, fn, fn) adds functions to the pipe in the order specified', async done => {
  try {
    const pipe = new Pipe().pipe(
      x => x + 1,
      x => x + 1,
      x => {
        log(`observed: ${x}`);
        return x;
      }
    );
    const res = await pipe.process(0);
    expect(res).toBe(2);
    done();
  } catch (err) {
    done(err);
  }
});

test('.pipe([fn, fn, fn]) adds functions to the pipe in the order specified', async done => {
  try {
    const pipe = new Pipe().pipe(
      x => x + 1,
      x => x + 1,
      x => {
        log(`observed: ${x}`);
        return x;
      }
    );
    const res = await pipe.process(0);
    expect(res).toBe(2);
    done();
  } catch (err) {
    done(err);
  }
});

test('.pipe(...) can mix and match async and non-async', async done => {
  try {
    const pipe = new Pipe().pipe(
      x => x + 1,
      async x => {
        await Promise.delay(2);
        return x + 1;
      },
      x => {
        log(`observed: ${x}`);
        return x;
      }
    );
    const res = await pipe.process(0);
    expect(res).toBe(2);
    done();
  } catch (err) {
    done(err);
  }
});

test('.pipe(...) will resolve promises', async done => {
  try {
    const pipe = new Pipe().pipe(
      x => x + 1,
      x => Promise.delay(2).then(() => x + 1),
      x => {
        log(`observed: ${x}`);
        return x;
      }
    );
    const res = await pipe.process(0);
    expect(res).toBe(2);
    done();
  } catch (err) {
    done(err);
  }
});

test('.process(...) passes args to the pipeline', async done => {
  try {
    const one = Math.floor(Math.random() * 10) + 1;
    const two = Math.floor(Math.random() * 10) + 1;
    const pipe = new Pipe().pipe(
      (x, y) => x + y,
      x => Promise.delay(2).then(() => x + 1),
      x => {
        log(`observed: ${x}`);
        return x;
      }
    );
    const res = await pipe.process(one, two);
    expect(res).toBe(one + two + 1);
    done();
  } catch (err) {
    done(err);
  }
});

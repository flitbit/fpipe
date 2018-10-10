# Function Pipe

A function pipe eases the construction of extensible processing pipelines.

Each step in the pipeline takes the result of the prior step as input, and produces its own result, which in turn, is used by the next step in the pipeline, until processing is complete and a final result is produced. Each step in the pipeline can be thought of as middleware, but unlike the [connect framework](https://github.com/senchalabs/connect), the inputs and outputs are not related to nodejs' original callback pattern.

## 2018 Breaking Changes

The 2018 version 1.0.0 has very little in common with the version published in 2012. The 2018 version of the `Pipe` is exclusively ES6, and is intended for use in nodejs.

## Getting Started

Create a pipeline by constructing an instance of the `Pipe` class, optionally specifying initial processing steps, then as needed, add additional processing steps using the `.pipe()` method, and eventually, execute the pipeline using the `.process()` method.

```javascript
const res = await new Pipe(fn1)
  .pipe(fn2)
  .pipe(fn3)
  .process('an argument for fn1');

console.log(`Result of pipeline processing: ${res}`);
```

The result of each step in the process cascades into the next step, just like `Promise`'s `.then()` method.

```text
arg ---v
   fn1(arg1) ---v
            fn2(arg2) ---v
                     fn3(arg3) ---v
                                  result
```

The constructor can take multiple steps...

```javascript
const res = await new Pipe(fn1, fn2, fn3).process('an argument for fn1');

console.log(`Result of pipeline processing: ${res}`);
```

`.pipe()` can take multiple steps...

```javascript
const res = await new Pipe(fn2)
  .pipe(
    fn2,
    fn3
  )
  .process(42);
```

Arguments passed to `.process()` are projected into the first step...

```javascript
const res = await new Pipe((x, y) => x + y)
  .pipe(x => x + 1)
  .pipe(x => x * 2)
  .process(10, 10);
```

Each step's result can be projected down stream in the pipe...

```javascript
const res = await new Pipe((x, y) => [x * 2, y * 5], true)
  .pipe(
    (x, y) => [x + y, 1],
    true
  )
  .pipe((x, y) => (x + y) * 2)
  .process(5, 2);
```

Errors propagate to the caller...

```javascript
const stdout = console.log.bind(console);
try {
  const res = await new Pipe()
    .pipe(() => stdout('click'))
    .pipe(() => stdout('click'))
    .pipe(() => {
      throw new Error('Boom!');
    })
    .pipe(() => stdout('click'))
    .pipe(() => stdout('click'))
    .process();
} catch (err) {
  assert.equal('Boom!', err.message);
}
```

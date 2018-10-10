const isPromise = require('is-promise');
const $steps = Symbol('steps');

class Pipe {
  static overPipeline(pipeline) {
    const pipe = new Pipe();
    pipe[$steps] = this.makeTuples(pipeline);
    return pipe;
  }
  static makeTuples(steps) {
    // steps can be defined as a pair (function, boolean) where the boolean
    // indicates whether the result of the function is an array of input for the
    // subsequent step (the array will be projected as arguments).
    let tuples = [];
    if (steps) {
      let cursor = -1;
      let item, next;
      const len = steps.length;
      while (++cursor < len) {
        item = steps[cursor];
        if (Array.isArray(item)) {
          item = Pipe.overPipeline(item);
        } else if (typeof item !== 'function' && !(item instanceof Pipe)) {
          throw new Error(
            `Invalid pipeline; array must contain processing steps, each optionally followed by a boolean. Received ${item} in position ${cursor}.`
          );
        }
        next = cursor + 1 < len ? steps[cursor + 1] : undefined;
        if (next && typeof next === 'boolean') {
          ++cursor;
        }
        tuples.push([item, next && typeof next === 'boolean' && next === true]);
      }
    }
    return tuples;
  }

  constructor() {
    this[$steps] = Pipe.makeTuples(arguments);
  }

  pipe() {
    const steps = this[$steps];
    const other = new Pipe();
    other[$steps] = steps.concat(Pipe.makeTuples(arguments));
    return other;
  }

  async process() {
    const steps = this[$steps];
    let i = 0;
    const len = steps.length;
    let result;
    if (len) {
      let [step, expand] = steps[0];
      result =
        step instanceof Pipe
          ? step.process.apply(step, [...arguments])
          : step.apply(null, [...arguments]);
      while (isPromise(result)) {
        result = await result;
      }
      while (++i < len) {
        let [next, nexp] = steps[i];
        if (expand && Array.isArray(result)) {
          result =
            next instanceof Pipe
              ? next.process.apply(next, result)
              : next.apply(null, result);
        } else {
          result = next instanceof Pipe ? next.process(result) : next(result);
        }
        expand = nexp;
        while (isPromise(result)) {
          result = await result;
        }
      }
    }
    return result;
  }
}

module.exports = Pipe.Pipe = Pipe;

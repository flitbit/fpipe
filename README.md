# Function Pipe

A function pipe eases the construction of extensible processing pipelines.

Each step in the pipeline takes the result of the prior step as input, and produces its own result, which in turn, is used by the next step in the pipeline, until processing is complete and a final result is produced. Each step in the pipeline can be thought of as middleware, but unlike the [connect framework](https://github.com/senchalabs/connect), the inputs and outputs are not related to nodejs' original callback pattern.

## 2018 Breaking Change

Version 1 has very little in common with the version I published in 2012. This version of the `Pipe` is exclusively ES6, and is intended for use in nodejs.

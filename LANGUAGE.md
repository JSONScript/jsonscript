# JSONScript language

## The simplest script

The simplest script in JSONScript is a single instruction that calls an external executor method with some arguments:

```JSON
{
  "$exec": "router",
  "$method": "get",
  "$args": { "path": "/resource/1" }
}
```

The executor is any object that is provided to the JSONScript interpreter by the environment it executes in. The executor is defined by its name that is either an identifier or UUID (UUIDs are used for temporary external objects that can be created in the process of script evaluation).

In the example above it is an object with the name "router" (the value of the keyword "$exec") that has different methods including "get" (the value of the keyword "$method").

When this simple script is evaluated its value will be the resolved value that the executor returns. See [Synchronous and asynchronous values](#synchronous-and-asynchronous-values).

JSONScript core includes other instructions that will be shown later and the interpreter may allow to define your own custom instructions.

With JSONScript you can combine instructions in three ways:

- sequential evaluation
- parallel evaluation
- evaluating instruction keyword values with the scripts


## Synchronous and asynchronous values

Individual instructions and parts of the script can evaluate to synchronous and asynchronous value.

A synchronous value is any data that is available and can be used immediately.

An asynchronous value is a value that is currently not available and will be available (resolved/fullfilled/bound) in the future. Different programming languages implement asynchronous values as [promises, futures, etc.](https://en.wikipedia.org/wiki/Futures_and_promises)


## Sequential evaluation

JSONScript can include several instructions that will be executed sequentially:

```JSON
[
  {
    "$exec": "router",
    "$method": "get",
    "$args": { "path": "/resource/1" }
  },
  {
    "$exec": "router",
    "$method": "put",
    "$args": { "path": "/resource/1", "body": { "test": "test" } }
  }
]
```

"Sequential" means that the next script begins evaluating only after the script in the previous item has evaluated (and if the result is an asynchronous value this value has resolved into synchronous).

The example above will retrive the value of some resource and once it was retrieved it will update it. The sequential execution guarantees that it will be the value before the update.

The result of the evaluation of the whole script above is a single asynchronous value (assuming that instructions return asynchronous values) that resolves into the array with results of both instructions.

Sequential evaluation is not limited to executing individual instructions - any scripts can be combined using this JSONScript primitive.

For example, this script does the same as the script above for two resources:

```JSON
[
  [
    {
      "$exec": "router",
      "$method": "get",
      "$args": { "path": "/resource/1" }
    },
    {
      "$exec": "router",
      "$method": "put",
      "$args": { "path": "/resource/1", "body": { "test": "test" } }
    }
  ],
  [
    {
      "$exec": "router",
      "$method": "get",
      "$args": { "path": "/resource/2" }
    },
    {
      "$exec": "router",
      "$method": "put",
      "$args": { "path": "/resource/2", "body": { "test": "test" } }
    }
  ]
]
```

The result of this script evaluation is the array of two arrays containing two items each, the items being the results of evaluation of individual instructions.


## Parallel evaluation

JSONScript can include several instructions that will be executed in parallel:

```JSON
{
  "res1": {
    "$exec": "router",
    "$method": "get",
    "$args": { "path": "/resource/1" }
  },
  "res2": {
    "$exec": "router",
    "$method": "get",
    "$args": { "path": "/resource/2" }
  }
}
```

The meaning of "parallel" depends on the environment in which the script executes and on the interpreter implementation. The implementation should not guarantee any order in which evaluation of individual scripts will start, and instructions don't wait until another instruction evaluates (and resolves) to begin executing.

The example above retrieves the values fo two resources. The result of the evaluation of the whole script above is a single asynchronous value (assuming that instructions return asynchronous values) that resolves into the object with the results of both instructions available in properties "res1" and "res2".

The names of properties in the object can be any strings that do NOT start with "$" (properties that stat with "$" are resolved fot the instruction keywords).

Parallel evaluation is not limited to executing individual instructions - any scripts can be combined using this JSONScript primitive.

For example, the script below is similar to the example in the previous section that updates two resources but it does it in parallel:

```JSON
{
  "res1": [
    {
      "$exec": "router",
      "$method": "get",
      "$args": { "path": "/resource/1" }
    },
    {
      "$exec": "router",
      "$method": "put",
      "$args": { "path": "/resource/1", "body": { "test": "test" } }
    }
  ],
  "res2": [
    {
      "$exec": "router",
      "$method": "get",
      "$args": { "path": "/resource/2" }
    },
    {
      "$exec": "router",
      "$method": "put",
      "$args": { "path": "/resource/2", "body": { "test": "test" } }
    }
  ]
}
```

This example combines parallel and sequential evaluation. Each resource update only starts after the current value is retrieved, but the update of "/resource/2" does not need to wait until the "/resource/1" finished updating.

The result of this script evaluation is the object with two properties "res1" and "res2" each containing two items with the results of individual instructions.

You can see how by combining individual instruction calls, sequential and parallel evaluation you can build advanced scripts.

Let's see what other instructions are defined in JSONScript core.


## Accessing data instance with `$data`

During the evaluation the script can use the data instance passed to the interpeter in addition to the script:

```JSON
[
  {
    "$exec": "router",
    "$method": "get",
    "$args": { "path": { "$data": "/path" } }
  },
  {
    "$exec": "router",
    "$method": "put",
    "$args": { "path": { "$data": "/path" }, "body": { "$data": "/body" } }
  }
]
```

Data instance:

```JSON
{
  "path": "/resource/1",
  "body": { "test": "test" }
}
```

The instruction to get data has a single keyword "$data" that is a JSON-pointer to the part of the passed data instance.

"$data" allows to separate the passed data from the script in this way avoiding repetition and making the scripts reusable.

Not only some part of arguments can use scripts to evaluate it, any value in the script can be any other script as long as it is evaluated to the correct type of value.


## Accessing the parts of the current script with `$ref`.

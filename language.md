---
page_name: language
title: JSONScript - Language Tutorial
layout: main
---
# JSONScript language

## The simplest script

The simplest script in JSONScript is a single instruction that calls an external executor method with some arguments:

```json
{
  "$exec": "router",
  "$method": "get",
  "$args": { "path": "/resource/1" }
}
```

The executor is any object that is provided to the JSONScript interpreter by the environment it executes in. The executor is defined by its name that is either an identifier or UUID (UUIDs are used for temporary external objects that can be created in the process of script evaluation).

In the example above it is an object with the name `"router"` (the value of the keyword `$exec`) that has different methods including `"get"` (the value of the keyword `$method`).

When this simple script is evaluated its value will be the resolved value that the executor returns. See [Synchronous and asynchronous values](#synchronous-and-asynchronous-values).

The full syntax above allows all properties to be evaluated - executor name and methods can be the result of some other scripts. For the majority of cases when these are constants the short syntax can be used:

```json
{ "$$router.get": { "path": "/resource/1" } }
```

This is achieved via [macros](#macros) support.

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

```json
[
  {
    "$exec": "router",
    "$method": "get",
    "$args": { "path": "/resource/1" }
  },
  {
    "$exec": "router",
    "$method": "put",
    "$args": { "path": "/resource/1", "body": "test" }
  }
]
```

or with short syntax:

```json
[
  { "$$router.get": { "path": "/resource/1" } },
  { "$$router.put": { "path": "/resource/1", "body": "test" } }
]
```

"Sequential" means that the next script begins evaluating only after the script in the previous item has evaluated (and if the result is an asynchronous value this value has resolved into synchronous).

The example above will retrive the value of some resource and once it was retrieved it will update it. The sequential execution guarantees that it will be the value before the update.

The result of the evaluation of the whole script above is a single asynchronous value (assuming that instructions return asynchronous values) that resolves into the array with results of both instructions.

Sequential evaluation is not limited to executing individual instructions - any scripts can be combined using this JSONScript primitive.

For example, this script does the same as the script above for two resources:

```json
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
      "$args": { "path": "/resource/1", "body": "test" }
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
      "$args": { "path": "/resource/2", "body": "test" }
    }
  ]
]
```

or with short syntax:

```json
[
  [
    { "$$router.get": { "path": "/resource/1" } },
    { "$$router.put": { "path": "/resource/1", "body": "test" } }
  ],
  [
    { "$$router.get": { "path": "/resource/2" } },
    { "$$router.put": { "path": "/resource/2", "body": "test" } }
  ]
]
```


The result of this script evaluation is the array of two arrays containing two items each, the items being the results of evaluation of individual instructions.


## Parallel evaluation

JSONScript can include several instructions that will be executed in parallel:

```json
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

or with short syntax:

```json
{
  "res1": { "$$router.get": { "path": "/resource/1" } },
  "res2": { "$$router.get": { "path": "/resource/2" } }
}
```

The meaning of "parallel" depends on the environment in which the script executes and on the interpreter implementation. The implementation should not guarantee any order in which evaluation of individual scripts will start, and instructions don't wait until another instruction evaluates (and resolves) to begin executing.

The example above retrieves the values fo two resources. The result of the evaluation of the whole script above is a single asynchronous value (assuming that instructions return asynchronous values) that resolves into the object with the results of both instructions available in properties `"res1"` and `"res2"`.

The names of properties in the object can be any strings that do NOT start with "$" (properties that stat with "$" are resolved fot the instruction keywords).

Parallel evaluation is not limited to executing individual instructions - any scripts can be combined using this JSONScript primitive.

For example, the script below is similar to the example in the previous section that updates two resources but it does it in parallel:

```json
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
      "$args": { "path": "/resource/1", "body": "test" }
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
      "$args": { "path": "/resource/2", "body": "test" }
    }
  ]
}
```

or with short syntax:

```json
{
  "res1": [
    { "$$router.get": { "path": "/resource/1" } },
    { "$$router.put": { "path": "/resource/1", "body": "test" } }
  ],
  "res2": [
    { "$$router.get": { "path": "/resource/2" } },
    { "$$router.put": { "path": "/resource/2", "body": "test" } }
  ]
}
```

This example combines parallel and sequential evaluation. Each resource update only starts after the current value is retrieved, but the update of `"/resource/2"` does not need to wait until the `"/resource/1"` finished updating.

The result of this script evaluation is the object with two properties `"res1"` and `"res2"` each containing two items with the results of individual instructions.

You can see how by combining individual instruction calls, sequential and parallel evaluation you can build advanced scripts.

Let's see what other instructions are defined in JSONScript core.


## Accessing data instance with `$data`

During the evaluation the script can use the data instance passed to the interpeter in addition to the script:

```json
[
  {
    "$exec": "router",
    "$method": "get",
    "$args": { "path": { "$data": "/path" } }
  },
  {
    "$exec": "router",
    "$method": "put",
    "$args": { "$data": "" }
  }
]
```

or with short syntax:

```json
[
  { "$$router.get: { "path": { "$data": "/path" } } },
  { "$$router.put": { "$data": "" } }
]
```

Data instance:

```json
{
  "path": "/resource/1",
  "body": { "test": "test" }
}
```

The instruction to get data has a single keyword `$data` that is a JSON-pointer to the part of the passed data instance.

`$data` allows to separate the passed data from the script in this way avoiding repetition and making the scripts reusable.

Not only some part of arguments can use scripts to evaluate it, any value in the script can be any other script as long as it is evaluated to the correct type of value.

For example, the executor name can be the result of the call to another executor:

```json
{
  "$exec": { "$exec": "chooseRouter" },
  "$method": "get",
  "$args": { "path": { "$data": "/path" } }
}
```


## Accessing the parts of the current script with `$ref`

The script can use results from any part of the script in another part of the script with `$ref` instruction.

The previous example where executor name was the result of another script evaluation could be re-written like this:

```json
{
  "router": { "$exec": "chooseRouter" },
  "response": {
    "$exec": { "$ref": "2/router" },
    "$method": "get",
    "$args": { "path": { "$data": "/path" } }
  }
}
```

In this way the script will evaluate to the object that contains both the response and the name of the router that returned it.

The value of `$ref` keyword should be an absolute or relative JSON-pointer.

If an absolute JSON-pointer is used it means the pointer in the whole script object.

The realtive JSON-pointer is the pointer relative to `$ref` instruction object, so `"0/"` means the instruction itself (it can't be evaluated though, see below), `"1/"` - the parent object etc.

Although the example uses parallel processing, the second instruction will not start executing until the first one completes because references should always return evaluated values of the script, rather than the script itself.

It is easy to create the script that will never evaluate:
- two instructions using references to the results of each other.
- the instruction in array (sequential processing) using the reference to the result of the next instruction.
- the reference to itself or to the child of itself.

JSONScript interpreters should both try to determine such situations as early as possible and to allow defining evaluation timeout(s).


## Conditional evaluation with `$if`

`$if` instruction can be used to choose the strict that will be evaluated based on some condition:

```json
{
  "$if": { "$exec": "checkAvailability", "$args": "router1" },
  "$then": {
    "$exec": "router1",
    "$method": "get",
    "$args": { "path": "/resource/1" }
  },
  "$else": {
    "$exec": "router2",
    "$method": "get",
    "$args": { "path": "/resource/1" }
  }
}
```

or with short syntax:

```json
{
  "$if": { "$$checkAvailability": "router1" },
  "$then": { "$$router1.get": { "path": "/resource/1" } },
  "$else": { "$$router2.get": { "path": "/resource/1" } }
}
```

The result of the evaluation of the script in `$if` keyword should be a boolean value, otherwise the whole script will fail to evailuate (no type coercion is made).

If the condition is `true` then the script in `$then` keyword will be evaluted and its result will be the result of `$if` instruction, otherwise the script in `$else` will be evaluated and `$if` evaluate to its result.

Please note that the interpreter should NOT evaluate both scripts and choose the result - it should evaluate only one of the scripts.

`$else` keyword is optional, if it is absent and the condition is `false`, `$if` will evaluate to `null`.

Scalar values can be used in any place where the script is expected - they evaluate to themselves. We can refactor the script above in this way:

```json
{
  "$exec": {
    "$if": { "$exec": "checkAvailability", "$args": "router1" },
    "$then": "router1",
    "$else": "router2"
  },
  "$method": "get",
  "$args": { "path": "/resource/1" }
}
```

or using reference:

```json
{
  "router": {
    "$if": { "$exec": "checkAvailability", "$args": "router1" },
    "$then": "router1",
    "$else": "router2"
  },
  "response": {
    "$exec": { "$ref": "2/router" },
    "$method": "get",
    "$args": { "path": "/resource/1" }
  }
}
```

 In the examples above `$if` instruction evaluates to `"router1"` or to `"router2"`, depending on the condition. In the first case the script returns only `get` result, the result of the second script includes that name of executor that executed the method.


## Delayed evaluation with `$delay`

`$delay` instruction can be used to delay the start of evaluation of any script. That can be useful, for example, if you need to ensure that one script starts evaluating after another script starts, but you don't need for it to wait for the completion (as in sequential processing):

```json
{
  "res1": {
    "$exec": "router",
    "$method": "get",
    "$args": { "path": "/resource/1" }
  },
  "res2": {
    "$delay": {
      "$exec": "router",
      "$method": "get",
      "$args": { "path": "/resource/2" }
    },
    "$wait": 50
  }
}
```

or with short syntax:

```json
{
  "res1": { "$$router.get": { "path": "/resource/1" } },
  "res2": {
    "$delay": { "$$router.get": { "path": "/resource/2" } },
    "$wait": 50
  }
}
```

The evaluation result will be the same as without `$delay` istruction, but the second "$exec" instruction will start executing at least 50 milliseconds later than the first.

This instruction can also be used to create asynchronous value from synchronous value. For example if some executor expects an asynchronous value as an argument and you want to pass a constant, you can use `$delay`:

```json
{
  "$exec": "logger",
  "$method": "resolve",
  "$args": {
    "message": "Resolved",
    "asyncValue": { "$delay": "test", "$wait": 1000 }
  }
}
```

or with short syntax:

```json
{
  "$$logger.resolve": {
    "message": "Resolved",
    "asyncValue": { "$delay": "test", "$wait": 1000 }
  }
}
```

In the example above a hypothetical logger logs message when asynchronous value is resolved. `$delay` instruction result is an asynchrnous value that resolves 1 second after its evaluation with the value `"test"`.

`$wait` keyword is optional, the default is 0. It means that the interpreter should schedule the script evaluation as soon as possible but do not execute it immediately.


## Defining and calling functions with `$func` and `$call`

Anonymous or named function can be defined in the script to be passed to executors (either predefined or supplied by user) or simply to be used multiple times.

```json
[
  {
    "$func": {
      "$exec": "router",
      "$method": "get",
      "$args": { "path": { "$data": "/path" } }
    },
    "$name": "getRes",
    "$args": [ "path" ]
  },
  {
    "$call": "getRes",
    "$args": [ "/resource/1" ]
  },
  {
    "$call": { "$ref": "/0" },
    "$args": { "path": "/resource/2" }
  },
  {
    "$call": { "$ref": "1/0" },
    "$args": "/resource/3"
  }
]
```

or with short syntax:

```json
[
  {
    "$func": { "$$router.get" { "path": { "$data": "/path" } } },
    "$name": "getRes",
    "$args": [ "path" ]
  },
  { "$#getRes": [ "/resource/1" ] },
  {
    "$call": { "$ref": "/0" },
    "$args": { "path": "/resource/2" }
  },
  {
    "$call": { "$ref": "1/0" },
    "$args": "/resource/3"
  }
]
```

In the example above the same function `getRes` is used three times, being called by name and using $ref with absolute and relative JSON-pointers. Arguments can be passed to function as array, as an object (property names should match parameters declarations, otherwise an exception will be thrown) and as a scalar value if there is only one parameter.

Functions can be used as parameters in the executors:

```json
{
  "$exec": "array",
  "$method": "map",
  "$args": {
    "data": [
      "/resource/1",
      "/resource/2",
      "/resource/3"
    ],
    "iterator": {
      "$func": {
        "$exec": "router1",
        "$method": "get",
        "$args": {
          "path": { "$data": "/path" }
        }
      },
      "$args": ["path"]
    }
  }
}
```

or with short syntax:

```json
{
  "$$array.map": {
    "data": [
      "/resource/1",
      "/resource/2",
      "/resource/3"
    ],
    "iterator": {
      "$func": {
        "$$router1.get": { "path": { "$data": "/path" } }
      },
      "$args": ["path"]
    }
  }
}
```

If the function was previously defined it can be passed either using `"$ref"` with an absolute or relative JSON-pointer or `{ "$func": "myfunc" }. The latter always evaluates as the reference to the existing function rather than the function that always returns string "myfunc", to define the function that always returns the same string you can use "$quote".


## Using any value without evaluation with `$quote`

To insert an object that contains properties that start with `"$"` that normally should only be used in instructions you can use `$quote` instruction: For example, this script:

```json
{
  "$quote": {
    "$exec": "myExec"
  }
}
```

evaluates as: `{ "$exec": "myExec" }` and the executor is not called.

`$quote` can also be used to define the function that always returns the same string:

```json
{
  "$func": { "$quote": "foo" }
}
```

The anonymous function defined above always returns the string `"foo"`. Without `$quote` it would have been the reference to the function with the name `foo`.


## Calculations

Predefined executor `calc` defines methods for arythmetic, comparison and logical operations. For all operations the arguments (`$args`) should be an array and operations are applied to the list:

```json
{ "$+": [ 1, 2, 3 ] }
```

or using the full syntax:

```json
{
  "$exec": "calc",
  "$method": "add",
  "$args": [ 1, 2, 3 ]
}
```

Full syntax can be useful if you need to determine the required operation using some script:

```json
{
  "$exec": "calc",
  "$method": { "$data": "/method" },
  "$args": [ 1, 2, 3 ]
}
```

For arythmetic and comparison operations arguments must be numbers, there is no type coercion.

For boolean operations arguments must be boolean values.

Equality operations can work with any type.


Defined operations:

| method|short syntax|evaluation|
|--------------|:---:|---|
| add          |"$+" |add all arguments|
| subtract     |"$-" |subtract arguments from the first argument|
| multiply     |"$*" |multiply all arguments|
| divide       |"$/" |divide the first argument by the rest|
| equal        |"$=="|true if all arguments are equal|
| notEqual     |"$!="|true if at least one argument is different|
| greater      |"$>" |true if arguments are descending|
| greaterEqual |"$>="|true if arguments are not ascending|
| lesser       |"$<" |true if arguments are ascending|
| lesserEqual  |"$<="|true if arguments are not descending|
| and          |"$&&"|true if all arguments are true|
| or           |"$||"|true if one or more arguments are true and the rest are false|
| xor          |"$^^"|true if exactly one argument is true and others are false|
| not          |"$!" |negates boolean value|


## Array iteration

Predefined executor `array` implements methods for array iteration:

```json
{
  "$$array.map": {
    "data": [
      "/resource/1",
      "/resource/2",
      "/resource/3"
    ],
    "iterator": {
      "$func": {
        "$$router.get": { "path": { "$data": "/path" } }
      },
      "$args": ["path"]
    }
  }
}
```

The example above calls the method `get` of executor `router` for all paths. The result of evaluation of this script will be the array of responses.

Same script using full syntax:

```json
{
  "$exec": "array",
  "$method": "map",
  "$args": {
    "data": [
      "/resource/1",
      "/resource/2",
      "/resource/3"
    ],
    "iterator": {
      "$func": {
        "$exec": "router",
        "$method": "get",
        "$args": { "path": { "$data": "/path" } }
      },
      "$args": ["path"]
    }
  }
}
```

Defined array methods:

| method |evaluation result|
|--------|---|
| map    |new array with function call results for each item|
| filter |new array of original items for which function calls return `true`|
| every  |`true` if all function calls return `true`|
| some   |`true` if at least one function call returns `true`|


This script filters only positive numbers from array:

```
{
  "$$array.filter": {
    "data": [ -2, -1, 0, 1, 2, 3 ],
    "iterator": {
      "$func": {
        "$>": [ { "$data": "/num" }, 0 ]
      },
      "$args": ["num"]
    }
  }
}
```

For all methods iterator function is called with 3 parameters: array item, item index and the array itself.


## Macros

JSONScript defines several core macros to support short syntax for calculations and for calling executors methods and functions. The interpreter may allow to define your own custom macros.

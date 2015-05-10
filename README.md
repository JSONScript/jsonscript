# JSONScript
Platform independent scripting language expressed in JSON format


## Problem
-----

Management of remote systems is usually done via APIs.

It is often required to make multiple sequential or parallel calls, sometimes with some conditions between calls, to get the required result. It can be achieved in two ways:

1. Sending multiple requests to the remote system and implementing all the logic in the client system. The advantage of this approach is that the remote system remains unchanged and client can easily change the logic and flow of requests. The disadvantage is the latency - each request should travel via the network.

2. Implementing additional methods/endpoints in the remote system. The advantage of this approach is that the client has to make only one request. The disadvantage is that it requires changing the remote system (= coding + testing + documenting + deploying + monitoring + supporting...). In some cases it is simply impossible. When it is possible, it inevitably leads to the frowing complexity of the remote system as more and more specialized methods/APIs are added to it. 

In some cases, developers implement "batch endpoints" that allow to process multiple requests in parallel in a single HTTP request. It covers some of the cases when multiple requests are sent, but only a relatively small share.


## Solution
-----

JSONScript allows you to send a script to the remote system that will be interpreted by the remote system. It will execute all the containig instructions sequesntially, or in parallel, passing results from one instruction to another when required, and returning all results to the client. All this in a single HTTP (or any other transport) request.

JSONScript allows to keep the API of remote system conscise and simple, only implementing simple basic methods. At the same time JSONScript allows the client to implement an advanced logic with conditions and looping, sequential and concurrent execution, defining and calling functions and handling exceptions. So quite advanced execution can be requested from the remote system in a single transport request.

At the same time JSONScript allows keeping the remote system completely secure as only the commands registered with interpreter can be envoked from the JSONScript script.


## Qualities
-----

- Platform and language independent
- Asynchronous and concurrent
- Supports all control from instructions from general purpose languages, including functions and exception handling
- Does not support any data structures or calculations - they will be provided by the host platform.
- Results from all previous instructions in the script can be used as parameters by the following instructions.


## Language
-----

JSONScript uses JSON format to express the script.

A valid JSONScript script can be an object or an array.

JSON data is a valid JSONScript as long as none of the objects keys use $ as the first symbol. If you need to use JSON data with the key starting with "$", it can be escaped with "\": `{ "\$exec": "name" }`.

If there is no execution instructions in JSON, it will return the same JSON as the result of it's execution by JSONScript interpreter.


### $exec - basic execution instruction
-----

Syntax:

```
{ "$exec": "<executor>",
  "$method": "<method>",
  "$args": <JSONScript> }
```

Basic instruction in JSONScript is Object that has keys `$exec` (shortened "executor"), `$method` and `$args`.

Basic instruction is also a valid JSONScript script and can be executed on its own.

Instruction can be executed synchronously or asynchronously, as determined by processor. The implementation of asynchronous execution is determined by the implementation of the interpreter and the features available in the host language - it can use callbacks, promises, generators, co-routines, etc. to determine instruction completion.

`$exec` is the string with the name of the instruction processor that was previously registered with JSONScript interpreter. Depending on the implementation of the interpreter, an instruction processor can be an object or function.

`$method` is the string with the name of method that the instruction processor supports. Methods should NOT be previously registered with interpreter, if the method is not supported, the processor should throw an exception METHOD_NOT_IMPLEMENTED.

`$args` can be a scalar, object or array with arguments. Arguments can be references to the results of previous instructions, as shown below, and any valid JSONScript. If some of the argument is a JSONScript, the result of it's execution will be passed.

The result of the basic instruction execution should be any valid JSON.


##### Examples

Instruction to execute HTTP request on the local process (without sending request) to update some resource with id=1:

```JSON
{ "$exec": "router",
  "$method": "PUT",
  "$args":
  { "url": "/resource/1",
    "body": { "active": false }
    "headers": { "Content-Type": "application/json" } } }
```


JSONScript to create a resource and a child resource using basic HTTP endpoints (can be done in a single request):

```JSON
{ "$exec": "router",
  "$method": "POST",
  "args":
  { "url": "/child_resource",
    "body":
    { "name": "My child resource",
      "resource_id":
      { "$exec": "router",
        "$method": "POST",
        "args":
        { "url": "/resource",
          "body": { "name": "My resource" } } } } } }
```

In the example above the result of the script execution is used as an argument for another script. The same can be achieved more elegantly (and is recommended) using sequential execution and reference (see below). The script above will return only the id of child resource, results of scripts in `$args` are not returned.


Instruction to perform database access (dbjs here is some non-existent processor for database access from JSONScript):

```JSON
{ "$exec": "dbjs",
  "$method": "select",
  "$args":
  { "table": "resources",
    "where": { "id": 1 } } }
```

Instruction to execute bash script (e.g., to use on internal network):

```JSON
{
  "$exec": "bash",
  "$method": "node",
  "$args": [ "--harmony", "myapp.js" ] }
```


### Comments
-----

Syntax:

```
{ "$/": "<comment>" }
```

Comments can be used inside JSONScript. To any object "$/" key can be added - it will be removed before execution. To any array the object `{ "$/": "comment" }` can be added. This object will be removed before execution, and it will not affect absolute or relative references (see below).


### Sequential execution
-----

Syntax:

```
[ <JSONScript>,
  <JSONScript>,
  ... ]
```

Sequential execution is expressed as the array of execution steps. Each step should be a valid JSONScript script. It can be either a basic instruction or any other valid JSONScript execution construct (including array for sequential execution).

Interpreter will ensure that the next step will start only after the previous step has completed.

The result of sequential execution is the array of execution results from each step.

The following execution steps can use the results of the previous steps as their arguments, as shown in the examples and in [References to the previous results].


##### Examples

JSONScript to create a resource and a child resource using basic HTTP endpoints (can be done in a single request):

```JSON
[ { "$exec": "router",
    "$method": "POST",
    "args":
    { "url": "/resource",
    "body": { "name": "My resource" } } },
  { "$exec": "router",
    "$method": "POST",
    "args":
    { "url": "/child_resource",
    "body":
    { "name": "My child resource",
      "resource_id": { "$ref": -1 } } } } ]
```

In this example `{ "$ref": -1 }` will be substituted with the result of the previous instruction execution. Instead of relative indeces, absolute indeces can also be used, with the first instruction in the list having the index of 0. So in this example `{ "$ref": 0 }` would mean the same.

Also to refer to the result of the previous instruction { "$ref": "-" } can be used.

Results of previous sub-instructions and super-instructions can also be referred, as long as they were completed before the current step. See [References to the previous results].


### Parallel execution
-----

Syntax:

```
{ "<step_name>": <JSONScript>,
  "<step_name>": <JSONScript>,
  ...,
  / "$concurrency": <JSONScript> / }
```

/ ... / above means an optional element.


Parallel execution is expressed as the object with each key containing an execution step - see [Sequential execution] for details about execution steps.

Each execution step has a name - its key in the object. This key can be a string starting from letter and containing letters, numbers and symbols "_" and "-".

Interpreter will not wait for the results of any steps in the object to start executing other steps, as long as this steps do not refer to the results of other steps (see below), although a special key `$concurrency` can be used to limit the maximum number of steps executing in parallel. Interpreter should also allow setting the default maximum concurrency used if this key is not present.

The implementation of parallel execution is determined by the implementation of the interpreter and the features available in the host language - it can use threads, fibers, event loops, etc.

The result of parallel execution is the JSON object with the same keys containing the results of each keys.

Execution steps in parallel execution can refer to the results of other steps in the same object and they can refer to the results of other instruction executed previously - see Examples and [References to the previous results].


##### Examples

Request two resources in parallel:

```JSON
{ "1": 
  { "$exec": "router",
    "$method": "GET",
    "args":
    { "url": "/resource/1" } },
  "2":
  { "$exec": "router",
    "$method": "GET",
    "args":
    { "url": "/resource/2" } } }
```

Request two records:

```JSON
{ "1": 
  { "$exec": "dbjs",
    "$method": "select",
    "$args":
    { "table": "users",
      "where": { "id": 1 } } },
  "2": 
  { "$exec": "dbjs",
    "$method": "select",
    "$args":
    { "table": "documents",
      "where": { "id": 23 } } }
```

It can be argued that the same can be achieved using SQL, but it is less safe exposing SQL that a limited commands set all of which are safe. As long as only safe commands are exposed to interpreter, the whole script is also safe.


Request post with title "My post" and all comments:

```JSON
{ "post": 
  { "$exec": "router",
    "$method": "GET",
    "args":
    { "url": "/post" }
    { "qs": 
      { "title": "My post",
        "limit": 1 } } },
  "comments":
  { "$exec": "router",
    "$method": "GET",
    "args":
    { "$/": "get all comments for post_id",
      "url": "/comments/:post_id",
      "params": { "post_id": { "$ref": "post.id" } } } } }
```

Although parallel execution construct is used in the example above, it will be executed sequentially, as the result of the first step is used in the arguments of the second step. `{ "$ref": "post.id" }` returns the property `id` of the post returned by the first instruction.

Interpreter should try to detect any possible circular references as early as possible before executing any steps, in which case the construct will throw an exception CIRCULAR_REFERENCE. Because "$ref" value can be another script, it may require some processing to be done before the circular reference is detected.


### Control flow
-----

JSONScript supports control flow instructions that affect the order of excution by supporting loops, conditionals, functions, exception handling and returning results from the script.

All control frow constructs are objects with some special key starting from "$".


#### $end - Ending script execution
-----

Syntax:

```
{ "$end": <JSONScript> }
```


In some cases you may only want the result of the last step in sequential execution returned as a script result.

It can be done using `$end` instruction, that is an object with the single `$end` key. The value of the key will be the result of the script execution. As everything, the key can be any valid JSONScript - scalar, data, or the script which result will be the result of the containing script (or function) execution.

Although it is possible to always use `$end` to explicitly declare the script results, it is not idiomatic and not recommended, as it would require additional processing from the interpreter.


Exapmle:

Add the comment to the post with the title "My post":

```JSON
[ { "post": 
    { "$exec": "router",
      "$method": "GET",
      "args":
      { "url": "/post" }
      { "qs": 
        { "title": "My post",
          "limit": 1 } } },
    "comment":
    { "$exec": "router",
      "$method": "POST",
      "args":
      { "url": "/comments/:post_id",
        "params": { "post_id": { "$ref": "post.id" } },
        "body": { "text": "My comment" } } } },
  { "$end": { "$ref": "-.comment" } } ]
```

In the example above the result of `{ "$ref": "-.comment" }` is the result of substep "comment" in the previous step. `{ "$ref": "0.comment" }` would return the same, but the former is idiomatic and recommended as it allows adding additional steps in the beginning without changing the `$end` instruction.

Without the end instruction the post would also be returned, which is a waste in case the client doesn't need it.


### $each - basic iteration and mapping construct

Syntax:

```
{ "$each": <JSONScript>,
  / "$as": "<reference_name>", /
  "$do": <JSONScript>,
  / "$concurrency": <JSONScript> / }
```

/ ... / above means optional elements.


The `$each` construct allows to call another script passing each element of the previous data structure (or script result) as an argument.

`$each` - data structure or the result of another script to iterate, can be object or array

`$do` - the script that will be executed with each element of the structure in $each.

`$as` - the reference name to use in arguments in the script in `$do`. If `$as` key is not specified, the element value can be referred to as { $ref: "~" }. It is recommended in simple cases. But in complex cases giving a name to the iteration reference can add clarity.

`$concurrency` - prevents concurrency or specifies the maximum number of steps that can be executed in parallel. If `$concurrency` key is not specified, arrays and objects in `$each` key are iterated in parallel. `$concurrency: false` prevents concurrency completely. `$concurrency: <number>` limits the number of parallel tasks. The value for `$concurrency` can also be the result of JSONScript script.

Examples:



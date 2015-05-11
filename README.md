# JSONScript

Platform independent asynchronous and concurrent scripting language using JSON format.

JSONScript is created to manage scripted execution in remote systems to avoid the latency between requests.

It uses JSON as its representaion format for both data and control structures, being similar to lisp (homoiconic). It implements control structures that are somewhat similar to JavaScript. It is fundamentally asynchronous and concurrent without the need to use any special keywords for it. It is extremely flexible and powerful as it allows to define functions, macros and to manipulate the script during it's execution. At the same time it is simple as it doesn't define or create any data structures apart from those that are created in the result of the JSONScript script execution. All the actual processing in the remote system is done synchronously or asynchronously by the executors supplied by the host environment.


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

JSONScript allows to keep the API of remote system conscise and simple, only implementing simple basic methods. At the same time JSONScript allows the client to implement an advanced logic with conditions and looping, sequential and concurrent execution, defining and calling functions and handling exceptions. In this way quite advanced execution can be requested from the remote system in a single transport request.

At the same time JSONScript allows keeping the remote system completely secure as only the executors registered with the interpreter can be used from the JSONScript script.


## Qualities
-----

- Platform and language independent
- Asynchronous and concurrent
- Implements calculations
- Implements all control from instructions from general purpose languages, including functions, macros and exception handling
- Does not implement any data structures - they should be provided by the host platform.
- Results from previously executed instructions in the script can be used as parameters by the following instructions.


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
{ "$exec": <JSONScript>,
  "$method": <JSONScript>,
  "$args": <JSONScript> }
```

Basic instruction in JSONScript is Object that has keys `$exec` (shortened "executor"), `$method` and `$args`.

Basic instruction is also a valid JSONScript script and can be executed on its own.

Instruction can be executed synchronously or asynchronously, as determined by processor. The implementation of asynchronous execution is determined by the implementation of the interpreter and the features available in the host language - it can use callbacks, promises, generators, co-routines, etc. to determine instruction completion.

`$exec` is the string (or script that has the string result) with the name of the instruction processor that was previously registered with JSONScript interpreter. Depending on the implementation of the interpreter, an instruction processor can be an object or function.

`$method` is the string (or script that has the string result) with the name of method that the instruction processor supports. Methods should NOT be previously registered with interpreter, if the method is not supported, the processor should throw an exception METHOD_NOT_IMPLEMENTED.

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
  "$args":
  { "url": "/child_resource",
    "body":
    { "name": "My child resource",
      "resource_id":
      { "$exec": "router",
        "$method": "POST",
        "$args":
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
{ "$/": <JSONScript> }
```

Comments can be used inside JSONScript. To any object "$/" key can be added - it will be removed before execution. To any array the object `{ "$/": "comment" }` can be added. This object will be removed before execution, and it will not affect absolute or relative references (see below). If the comment is <JSONScript> it won't be executed or even parsed. It allows easily commenting out blocks of code in the script.


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
    "$args":
    { "url": "/resource",
      "body": { "name": "My resource" } } },
  { "$exec": "router",
    "$method": "POST",
    "$args":
    { "url": "/child_resource",
      "body":
      { "name": "My child resource",
        "resource_id": { "$": -1 } } } } ]
```

In this example `{ "$": -1 }` will be substituted with the result of the previous instruction execution. Instead of relative indeces, absolute indeces can also be used, with the first instruction in the list having the index of 0. So in this example `{ "$": 0 }` would mean the same.

Also to refer to the result of the previous instruction { "$": "-" } can be used.

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

If steps do not use results of other steps, the order in which execution steps are started is not defined and can be different every time the script is called. It is wrong to assume that the order of starting parallel tasks will be the same as the order of keys in JSON.


##### Examples

Request two resources in parallel:

```JSON
{ "1": 
  { "$exec": "router",
    "$method": "GET",
    "$args":
    { "url": "/resource/1" } },
  "2":
  { "$exec": "router",
    "$method": "GET",
    "$args":
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
    "$args":
    { "url": "/post" }
    { "qs": 
      { "title": "My post",
        "limit": 1 } } },
  "comments":
  { "$exec": "router",
    "$method": "GET",
    "$args":
    { "$/": "get all comments for post_id",
      "url": "/comments/:post_id",
      "params": { "post_id": { "$": "post.id" } } } } }
```

Although parallel execution construct is used in the example above, it will be executed sequentially, as the result of the first step is used in the arguments of the second step. `{ "$": "post.id" }` returns the property `id` of the post returned by the first instruction.

Interpreter should try to detect any possible circular references as early as possible before executing any steps, in which case the construct will throw an exception CIRCULAR_REFERENCE. Because "$" value can be another script, it may require some processing to be done before the circular reference is detected.


### Calculations
-----

Syntax:

```JSON
{ "$calc": <JSONScript>,
  "$args": <JSONScript> }
```

Tecnically it is just a syntax sugar for `$exec`, where `$calc` processor supplied by the interpreter is used.

`$calc` - operation to be called. Can be "+", "-", etc. (or a script returning such string) or standard Math functions. See [Operations]

`$args` - operands to which the operation is applied. TODO objects/arrays

Short syntax for basic operations is also supported (and recommended):

```JSON
{ "$<op>": <JSONScript> }
```

where <op> can be +, -, *, /, etc. (see [Operations])


Examples:

TODO


### Functions
-----

Syntax:

Define function:

```
{ "$func": <JSONScript>,
  "$args": <JSONScript>,
  "do": <JSONScript> }
```

Call function:

```
{ "$call": <JSONScript>,
  "$args": <JSONScript> }
```

TODO


### Control flow
-----

JSONScript supports control flow instructions that affect the order of excution by supporting loops, conditionals, functions, exception handling and returning results from the script.

All control frow constructs are objects with some special key starting from "$".


#### $res, $return, $end - creating results and terminating script execution

There are three keys that would create result, return value from the current function or completely terminate the script:

- `$res` - defines the result of the current execution construct (array or object). It will also create the return value of the function or of the whole script but only if its containing construct is the last construct executed in the function or the current script. See [Functions]. It is the most recommended instruction to use, as it doesn't break the flow of the script.

- `$return` - in addition to defining the result as `$res` does it also exits the currently executed function. Using `$return` outside of function is a syntax error.

- `$end` - defines the result and terminates the whole script execution. In most cases, this instruction is not needed and not recommended.


Syntax:

```
{ "$res": <JSONScript> }

{ "$return": <JSONScript> }

{ "$end": <JSONScript> }
```

In some cases you may only want the result of the last step in sequential execution returned as a script result.

It can be done using `$res` instruction, that is an object with the single `$res` key. The value of the key will be the result of the script execution. As everything, the key can be any valid JSONScript - scalar, data, or the script which result will be the result of the containing block, script (or function) execution.

Although it is possible to always use `$res` to explicitly declare the results, it is not idiomatic and not recommended, as it would require additional processing from the interpreter.


Exapmle:

Add the comment to the post with the title "My post":

```JSON
[ { "post": 
    { "$exec": "router",
      "$method": "GET",
      "$args":
      { "url": "/post" }
      { "qs": 
        { "title": "My post",
          "limit": 1 } } },
    "comment":
    { "$exec": "router",
      "$method": "POST",
      "$args":
      { "url": "/comments/:post_id",
        "params": { "post_id": { "$": "post.id" } },
        "body": { "text": "My comment" } } } },
  { "$res": { "$": "-.comment" } } ]
```

In the example above the result of `{ "$": "-.comment" }` is the result of substep "comment" in the previous step. `{ "$": "0.comment" }` would return the same, but the former is idiomatic and recommended as it allows adding additional steps in the beginning without changing the `$end` instruction.

Without the end instruction the post would also be returned, which is a waste in case the client doesn't need it.


### $map and $reduce - iteration and mapping constructs

Syntax:

```
{ "$map": <JSONScript>,
  / "$as": <JSONScript>, /
  "$do": <JSONScript>,
  / "$concurrency": <JSONScript> / }

{ "$reduce": <JSONScript>,
  / "$as": <JSONScript>, /
  / "$seed": <JSONScript>, /
  "$do": <JSONScript> }
```

/ ... / above means optional elements.


The `$map` and `$reduce` constructs allows to call another script passing each element of the previous data structure (or script result) as an argument. `$reduce` is executed sequentially as each step can refer to the result of the previous step. When object is itereated, the order is undefined, it is wrong to assume that it will the same as order of keys in JSON.

`$map` or `$reduce` - data structure or the result of another script to iterate, can be object or array

`$do` - the script that will be executed with each element of the structure in `$map`.

`$as` - the reference name to use in arguments in the script in `$do`. It as usually a string, but can be a script returning the string, as anything else. If `$as` key is not specified, the iteration item value can be referred to as { "$": "~" }. It is recommended in simple cases. But in complex cases giving a name to the iteration reference can add clarity. Index (or key) of the iteration item can be referred to as { "$": "#" }. There is no special syntax for it as it is not needed in most cases.

`$seed` - can be used in `$reduce` construct. It is the initial value of accumulator for reduce operation. Inside `$do` script the value of accumulator can be used as the argument and can be referred to with { "$": "=" }. If the `$seed` is not specified, the first item in `$reduce` key will be used as seed; and for the first item `$do` script will NOT be executed.

`$concurrency` - can be used used in `$map` construct. It prevents concurrency or specifies the maximum number of steps that can be executed in parallel. If `$concurrency` key is not specified, arrays and objects in `$map` keys are iterated in parallel. `$concurrency: false` prevents concurrency completely. `$concurrency: <number>` limits the number of parallel tasks. The value for `$concurrency` can also be the result of JSONScript script.

Examples:

1. Request 10 latest posts of a given user together with comments

```JSON
[ [ { "$func": "getPosts",
      "$args": [ "user_id", "limit" ],
      "$do":
      { "$exec": "router",
        "$method": "GET",
        "$args":
        { "url": "/post" }
        { "qs": 
          { "user_id": { "$": "user_id" },
            "limit": { "$": "limit" } } } } },
    { "$func": "getComments",
      "$args": "post",
      "$do":
      { "$exec": "router",
        "$method": "GET",
        "$args":
        { "url": "/comments/:post_id",
          "params": { "post_id": { "$": "post.id" } } } } } ],
  { "$map":
    { "$call": "getPosts",
      "$args": [ 37, 10 ] },
    "$do":
    [ { "$call": "getComments",
        "$args$": "~" },
      { "$res": 
        { "post": { "$": "~" },
          "comments": { "$": "-" } } } ] },
  { "$res$": "-" } ]
```

The example above will iterate the list of posts for the specified user, up to 10 posts (as should be defined in `router`), and request the list of comments for each post. `$res` instruction is used to include both the post and the coments in the result; without it the result would be the array of arrays, with internal arrays containing comments.

`{ "$": "~" }` refers to the iteration value (the post), `{ "$": "-" }` refers to the result of the previous instruction in the array (the array of comments).

`{ "$res$": "-" }` is a simplified (and recommended) syntax for `{ "$res": { "$": "-" } }` - the result using the reference to the previous item.

`"$args$": "~"` is a simplified syntax for `"$args": { "$": "~" }` - arguments using the reference to the iteration value.

In general, adding "$" symbol after the key that expects value, converts it to the key that expects a reference. It can only be done with JSONScript keys that start with "$" but not with data keys.

With named iteration value and the concurrency limit (requested from executor "options" that could have been supplied to the interpreter) the script could look like this:

```JSON
[ <functions from the example above>,
  { "$map":
    { "$call": "getPosts",
      "$args": [ 37, 10 ] },
    "$as": "post"
    "$do":
    [ { "$call": "getComments",
        "$args": { "$": "post" } },
      { "$res": 
        { "post": { "$": "post" },
          "comments": { "$": "-" } } } ],
    "$concurrency":
    { "$exec": "options",
      "$method": "get",
      "$args": "concurrency" } },
  { "$res$": "-" } ]
```

This example is just to show that any JSONScript can be used for any value. It is more likely that concurency won't be passed in the script at all and instead supplied as an option to the interpreter by the host environment/application. Although there may be situation when the client can supply the requered concurrency that would affect the price of execution by some 3rd party api.

The functions declarations are not included in the script, although they should be passed together with the script. Interpreters may implement hashing and precompiling functions for the following executions, no special syntax is defined for it.


2. Count the number of characters in all comments in the last ten posts of user:


```JSON
[ <functions from the example above>,
  { "$reduce":
    { "$call": "getPosts",
      "$args": [ 37, 10 ] },
    "$as": "post",
    "$seed": 0,
    "$do":
    [ { "$call": "getComments",
        "$args": { "$": "post" } },
      { "$+":
        [ { "$": "=", "$/": "this is reduce accumulator" },
          { "$calc": "length",
            "$args": { "$": "-.text", "$/": "this is comment text" } } ] },
      { "$": "-" } ] },
  { "$res$": "-" } ]
```

It is worth noting that if you wanted to simply count the number of comments rather than characters, you would not need to use reduce, it can be done by simply adding the results of `$map` operation.

The script below count the number of comments in the last 10 posts of the user:

```JSON
[ <functions from the example above>,
  { "$+":
    { "$map":
      { "$call": "getPosts",
        "$args": [ 37, 10 ] },
      "$do":
      { "$calc": "length",
        "$args":
        { "$call": "getComments",
          "$args": { "$": "~" } } } } },
  { "$res$": "-" } ]
```

The above script first gets the array of the numbers of all the comments for each post using `$map` and then simply adds then using `$+`.

If you need to do some other kind of aggregation and you want to accentuate the sequence of execution steps you can use references:


### $if and $switch - conditional constructs
-----

Syntax:

```
{ "$if": <JSONScript>,
  "$then": <JSONScript>,
  / "$else": <JSONScript> / }
```

```
{ "$switch": <JSONScript>,
  "$cases": <JSONScript> }
```

#### $if
-----

`$if` - the script evaluating the condition.

`$then` - this script that will be executed if the condition result is truthy (any value that is not falsy: true, any number but 0, non-empty string, etc.).

`$else` - this optional script will be executed if the condition result is falsy (false, 0, null, empty string). If else is not specified and the condition is falsy, the value of the condition will be returned as the result.


Examples:

TODO


#### $switch
-----

`$switch` - the script evaluating the selector. Can be any simple value that will be converted to string to match the key in the `$cases`.

`$cases` - the object (or the script returning the object) where the script to execute is selected based on the selector. If the selector value is not the string, the value will be converted to string. If it is not a scalar, the exception will be thrown.  The default case can be provided with the key `$default`.


Examples:

Check in the log the last resource changed and return this resource and its child resources:

```JSON
[ { "$func": "getResourceAndChild",
    "$args": [ "resName", "resId", "subResName" ],
    "$do":
    { "$object":
      [ { "key": { "$": "resName" },
          "value":
          { "$exec": "resource",
            "$method": "read",
            "$args":
            { "resource": { "$": "resName" },
              "id": { "$": "resId" } } } },
        { "key": { "$": "subResName" },
          "value":
          { "$exec": "resource",
            "$method": "read",
            "$args":
            { "resource": { "$": "subResName" },
              "where":
              { "parentId": { "$": "resId" } } } } } ] },

  { "$exec": "resource",
    "$method": "list",
    "$args":
    { "resource": "log",
      "order": "desc",
      "limit": 1 } },

  { "$def": "lastLog", "$$": "-[0]" },
  { "$def": "lastResId", "$$": "lastLog.resourceId" },

  { "$switch": { "$": "lastLog.resourceName" },
    "$cases":
    { "A":
      { "$call": "getResourceAndChild",
        "$args": [ "A", { "$": "lastResId" }, "childOfA" ] },
      "B":
      { "$call": "getResourceAndChild",
        "$args": [ "B", { "$": "lastResId" }, "childOfB" ] } } },

  { "$res$": "-" } ]
```

TODO transformations (`$object` and `$array`).
TODO named references `$def`, `$` and `$$`
TODO `$get` and `$set`

`{ "$def": "lastLog", "$$": "-[0]" }` is a simplified syntax for `{ "$def": "lastLog", "$": { "$": "-[0]" } }`.

Instead of `{ "$": "lastResId" }` can be used a relative reference `{ "$": "^-3[0].resourceId" }` or an absolute reference `{ "$": "/1[0].resourceId" }`

See [References].


### $try, $catch, $finally and `$throw` -  exceptions and exception handling

Syntax:

```
{ "$throw": <JSONScript> }

{ "$try": <JSONScript>,
  "$catch": <JSONScript>,
  "$finally" <JSONScript> }
```

`$try` - script in this key is executed first.

`$catch` - this script will be executed if the script in `$try` throws exceptions. You can refer to the exception using { "$": "-" } or { "$": "$try" }. If the exception is thrown inside `$catch` script, it will bubble up to the next containing `$try/$catch` construct. Unhandled exceptions terminate the script (in many cases it is the desired result).

`$finally` - this script will be executed in all cases, after `$catch`, if the exception was thrown, or after `$try` if there was no exception. You can refer to the results of "$try" and "$catch" using `{ "$": "$try" }` and `{ "$": "$catch" }`. `{ "$": "-" }` will refer to the previously executed block (`$try` or `$catch`).


### $script - scripts returning scripts

Syntax:

```
{ "$script": <JSONScript>,
  / "$recur": <JSONScript> / }
```

<JSONScript> will be executed. If the result is data (i.e., JSON that has no keys starting with "$") it will be the result of `$script` construct. If the result is JSONScript, it will be executed again.

Without `$recur` it will continue until the script result is data.

`$recur: false` prevents this recursion. The returned script is executed only once and even if it returns JSONScript it will be the result. It can be useful for generating functions.

`$recur: <number>` limits the recursion to a specified number of times.


### $def - defining named references, modifying the results and changing the JSONScript in functions, iteration blocks and the one that was not processed yet.

Syntax:

```
{ "$def": <JSONScript>,
  "$": <JSONScript> }

{ "$def": <JSONScript>,
  "$$": <JSONScript> }


`$def` - the reference. Can be the name of the refence (as in the example above), an absolute or relative reference.

`$` - the value that the reference will point to. This value can be either data or script. If the reference points to the script that wasn't executed it, it will change it and the new script will be executed (or if the data is assigned, this data will be used as result of the replaced construct). If the reference points to the function, it will be changed - the changed script will be executed the next time the function is called. You can even change the function name in this way.

`$$` - As shown above, this is the equivalent of using the value of reference `{ "$": <JSONScript> }` as the value of the defined reference. If `$def` defines or redefines the named reference, it will point to the same data as the reference in `$$`. If `$def` overwrites an absolute or relative reference to the script, the value from `$$` will be copied by value (deep-cloned).

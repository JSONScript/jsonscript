# JSONScript

Platform independent asynchronous and concurrent scripting language using JSON format.

JSONScript is created to manage scripted execution in remote systems to avoid the latency between requests.

It uses JSON as its representaion format for both data and control structures, being similar to lisp (homoiconic). It implements control structures that are somewhat similar to JavaScript. It is fundamentally asynchronous and concurrent without the need to use any special keywords for it. It is extremely flexible and powerful as it allows to define and pass functions and closures, macros and to manipulate the script during it's execution. At the same time it is simple as it doesn't define or create any data structures apart from those that are created in the result of the JSONScript script execution. All the actual processing in the remote system is done synchronously or asynchronously by the executors supplied by the host environment.


## Project state

JSONScript has been recently started and currently is under development. This repository contains language specification that is being finalized and no other development has been started yet.

Soon there will be a JavaScript interpreter for JSONScript and a compiler of JSONScript to JavaScript. Once it is done, there will be the middleware for express web framework to support batch processing of requests on the server using JSONScript.


## Mailing list

If you would like to receive an email when some usable part is complete, please sign up to the Mailchimp mailing list [here](http://eepurl.com/bmSE3z).


## Problem

Management of remote systems is usually done via APIs.

It is often required to make multiple sequential or parallel calls, sometimes with some conditions between calls, to get the required result. It can be achieved in two ways:

1. Sending multiple requests to the remote system and implementing all the logic in the client system. The advantage of this approach is that the remote system remains unchanged and client can easily change the logic and flow of requests. The disadvantage is the latency - each request should travel via the network.

2. Implementing additional methods/endpoints/parameters in the remote system. The advantage of this approach is that the client has to make only one request. The disadvantage is that it requires changing the remote system (= coding + testing + documenting + deploying + monitoring + supporting...). In some cases it is simply impossible. When it is possible, it inevitably leads to the growing complexity of the remote system as more and more specialized methods/APIs are added to it. 

In some cases, developers implement "batch endpoints" that allow to process multiple requests in parallel in a single HTTP request. It covers some of the cases when multiple requests are sent, but not all.


## Solution

JSONScript allows you to send a script to the remote system that will be interpreted by the remote system. It will execute all the containig instructions sequentially, or in parallel, and returning all results to the client. All this in a single HTTP (or any other transport) request.

JSONScript allows to keep the API of remote system conscise and simple, only implementing basic methods. At the same time JSONScript allows the client to implement an advanced logic with conditions and looping, sequential and concurrent execution, defining and calling functions and handling exceptions. In this way quite advanced execution can be requested from the remote system in a single transport request.

At the same time JSONScript allows keeping the remote system completely secure as only the executors registered with the interpreter can be used from the JSONScript script and the interpreter can limit resources (time, memory, etc.) that the script can use.


## JSONScript qualities

- Platform and language independent
- Asynchronous and concurrent
- All control flow instructions from general purpose languages, including functions and exception handling
- Macros
- Calculations and string manipulations
- No data structures apart from JSON itself.
- Results from executed instructions can be used as parameters by the following instructions.


## Script execution

As the script executes, each instruction returns some data. By default this data replaces the script itself and all results will be available to the interpreter to pass back to the host system that requested execution. Host system usually sends results back to the client, but can do anything else with them, e.g. logging, storing to the database, etc.).

There is the instruction `$result` that changes which results will be stored after executing certain instructions.


## Language

JSONScript uses JSON format to express the script.

A valid JSONScript script can be an object or an array.

JSON data is a valid JSONScript as long as none of the objects keys and values use "$" and "." as their first symbol. If you need to use JSON data with the key starting with "$" or ".", it can be escaped with "\": `{ "\$exec": "name" }`. This "\" will be removed from data by JSONScript interpreter.

Keys starting from "$" mean JSONScript commands or some variable/function/executor names.

If there is no execution instructions in JSONScript ( no keys starting with "$"), it will return the same JSON as the result.


### Envoking methods of executors provided by the host environment.

Syntax:

```
{ "$exec": <JSONScript:string:Executor>,
  "$method": <JSONScript:string:method>,
  "$args": <JSONScript> }
```

or short (uses macro):

```
{"$<Executor>.<method>()": <JSONScript:arguments> }
```

Executor should be registered with the interpreter before it can be used in the script. The name of the executor should be a valid identifier (first character is latin letter, others are letters, numbers, "_" and "-") with the first capital letter. First capital letter cannot be used in functions and variables in the script.

The first (full) syntax with the keys `$exec` (shortened "executor"), `$method` and `$args` allows to compute both the name of the executor and of the method. Any script returning the string can be used in their place.

Because in most cases it is not needed, the conscise syntax can be used, where both the executor and method are provided in the key and arguments in the value.


Basic instruction is also a valid JSONScript script and can be executed on its own.

Instruction can be executed synchronously or asynchronously, as determined by the executor. The implementation of asynchronous execution is determined by the implementation of the interpreter and the features available in the host language - it can use callbacks, promises, generators, co-routines, etc. to determine instruction completion.

`$exec` is the name of the executor that was previously registered with JSONScript interpreter. Depending on the implementation of the interpreter, an executor can be an object or function.

`$method` is the name of method that the executor supports. Methods are not registered with interpreter; if the method is not supported, the executor should throw an exception METHOD_NOT_IMPLEMENTED.

`$args` can be a scalar, object or array with arguments. Array is passed as multiple arguments, scalar and object are passed as a single argument. Arguments can be references to the results of previous instructions, as shown below, and any valid JSONScript. If some of the argument is a JSONScript, the result of it's execution will be passed.

The result of the basic instruction execution should be a valid JSON.


##### Examples

Instruction to execute HTTP request to update some resource with id=1 (full syntax):

```JSON
{ "$exec": "Router",
  "$method": "put",
  "$args":
  { "url": "/resource/1",
    "body": { "active": false }
    "headers": { "Content-Type": "application/json" } } }
```


JSONScript to create a resource and a child resource using basic HTTP endpoints (short syntax):

```JSON
{ "$Router.post()":
  { "url": "/child_resource",
    "body":
    { "name": "My child resource",
      "resource_id":
      { "$Router.post()":
        { "url": "/resource",
          "body": { "name": "My resource" } } } } } }
```

In the example above the result of the script execution is used as an argument for another script. The same can be achieved more elegantly (and is recommended) using sequential execution and reference (see below). The script above will return only the id of child resource, results of scripts in arguments are not returned.


Instruction to perform database access (dbjs here is some non-existent processor for database access from JSONScript):

```JSON
{ "$Dbjs.select":
  { "table": "resources",
    "where": { "id": 1 } } }
```

Instruction to execute bash script (e.g., to use on internal network):

```JSON
{ "$Bash.node":
  [ "--harmony", "myapp.js" ] }
```


### Comments

Syntax:

```
{ "$comment": <JSONScript> }
```

or

```
{ "$/": <JSONScript> }
```

Comments can be used inside JSONScript. To any object "$/" key can be added - it will be removed before execution. To any array the object `{ "$/": "comment" }` can be added. This object will be removed before execution, and it will be not included in the length of array and will not affect indeces of other array elements. If the comment is <JSONScript> it won't be executed or even parsed/validated. It allows easily commenting out blocks of code in the script.


### Sequential execution

Syntax:

```
[ / { "$concurrency": <JSONScript:boolean|number> }, /
  <JSONScript>,
  <JSONScript>,
  ...
  / , { "$result": <JSONScript> } / ]
```

/ ... / above means an optional element.


Sequential execution is expressed as the array of execution steps. Each step should be a valid JSONScript script. It can be either a basic instruction or any other valid JSONScript execution construct (including array for sequential execution).

Interpreter will ensure that the next step will start only after the previous step has completed.

If the first element in array is `$concurrency` instruction some or all instructions can be executed in parallel. `Number` means concurrency limit, `true` - all instruction will start in order without waiting for the previous instructions to complete, `false` is the default for sequential execution.

`$concurrency` instruction does not have to be the first array element, also there can be multiple concurrency instructions. Whenever it is used it will affect concurrency of the execution of the following steps in the array.

The result of sequential execution is the array of execution results from each step, although it can be changed with `$result` instruction, that must be the last instruction in the array (see examples), or previous executed `$results` instruction.

The following execution steps can use the results of the previous steps as their arguments, as shown in the examples.


##### Examples

JSONScript to create a resource and a child resource using basic HTTP endpoints (to do it in a single request):

```JSON
[ { "$res_id":
    { "$Router.post()":
      { "url": "/resource",
        "body": { "name": "My resource" } } } },
  { "$Router.post()":
    { "url": "/child_resource",
      "body":
      { "name": "My child resource",
        "resource_id": "$res_id" } } } ]
```

In this example `{ "$":"res_id" }` will be substituted with the result of the previous instruction execution.

Instead of using named reference, in this case the reference to the previous result can be used. Named reference make it clearer what is the meaning of the value.

Results of previous sub-instructions and super-instructions can also be referred, as long as they were completed before the current step and the references to them were created.

It is important to understand that `res_id` is not a varaible in the traditional meaning. It is a reference to the object where the script is located and when the script is executed and replaced with its result, `res_id` becomes the reference to the result of the script.

See [References]() below for more details.


### Parallel execution

Syntax:

```
{ "<step_name>": <JSONScript>,
  "<step_name>": <JSONScript>,
  ...,
  / , "$concurrency": <JSONScript> /
  / , "$result": <JSONScript> / }
```

/ ... / above means an optional element.


Parallel execution is expressed as the object with each key containing an execution step - see [Sequential execution] for details about execution steps.

Each execution step has a name - its key in the object. This key should be a valid identifier - a string starting from lowercase letter and containing letters, numbers and symbols "_" and "-".

Interpreter will not wait for the completion of any steps in the object to start executing other steps, as long as this steps do not refer to the results of other steps (see below), although a special key `$concurrency` can be used to limit the maximum number of steps executing in parallel. Interpreter should also allow setting the default maximum concurrency that will be used if this key is absent.

The implementation of parallel execution is determined by the implementation of the interpreter and the features available in the host language - it can use threads, fibers, event loops, etc.

The result of parallel execution is the JSON object with the same keys containing the results of each keys.

Execution steps in parallel execution can refer to the results of other steps in the same object and they can refer to the results of other instructions executed previously - see Examples and [References]. If that is the case, the step will wait for the completion of the step which result it needs.

If steps do not use results of other steps, the order in which execution steps are started is not defined and can be different every time the script is called. It is wrong to assume that the order of starting parallel tasks will be the same as the order of keys in JSON.


##### Examples

Request two resources in parallel:

```JSON
{ "1": 
  { "$Router.get()":
    { "url": "/resource/1" } },
  "2":
  { "$Router.get()":
    { "url": "/resource/2" } } }
```

Request two records:

```JSON
{ "1": 
  { "$Dbjs.select":
    { "table": "users",
      "where": { "id": 1 } } },
  "2": 
  { "$Dbjs.select":
    { "table": "documents",
      "where": { "id": 23 } } }
```

It can be argued that the same can be achieved using SQL, but it is less safe exposing SQL than a limited commands set all of which are safe. As long as only safe commands are exposed to interpreter, the whole script is also safe.


Request post with title "My post" and all comments:

```JSON
{ "post": 
  { "$Router.get()":
    { "url": "/post" }
    { "qs": 
      { "title": "My post",
        "limit": 1 } } },
  "comments":
  { "$Router.get()":
    { "$/": "get all comments for post_id",
      "url": "/comments/:post_id",
      "params": { "post_id": "$post.id" } } } }
```

Although parallel execution construct is used in the example above, it will be executed sequentially, as the result of the first step is used in the arguments of the second step. `{ "$":"post.id" }` returns the property `id` of the post returned by the first instruction.

Interpreter should try to detect any possible circular references as early as possible before executing any steps, in which case the construct will throw an exception CIRCULAR_DEPENDENCY. Because "$" value can be another script, it may require some processing to be done before the circular dependency is detected.


### References

Syntax:

Creating reference:

```
{ "$def": <JSONScript:string:reference_name>,
  "$value": <JSONScript> }
```

or short (macro)

```
{ "$<reference_name>": <JSONScript> }
```

Using reference:

```
{ "$get": <JSONScript:string:reference_name> }
```

or short (macro)

```
"$<reference_name>"


Assigning new value (or script) to the reference:

```
{ "$set": <JSONScript:string:reference_name>,
  "$value": <JSONScript> }
```

or short (macro)

```
{ "$<reference_name>=": <JSONScript> }
```

Using full syntax for declaring, using and assigning the reference allows to compute its name, in most cases the name is known in advance and the short syntax can be used.

<reference_name> name should be a valid identifier and cannot be the same as any reserved word (see [Reserved words]()).

References in JSONScript cannot be redeclared - it will be a run time error. But references can be re-assigned both before and after script execution.

Re-assigning them after execution will replace the data. Re-assigning before execution allows both to prevent any execution by putting data in its place and to change the script (`$script` instruction should be used for it).

There is a special reference referring to the previously executed instruction:
`{ "$get":"$" }` or `"$"`. It can be used to avoid creating named references if it is going to be sed in he next instruction only once and makes chaining instructions more convenient.


### Object property and array elements access

TODO


### Calculatios

Syntax:

```JSON
{ "$calc": <JSONScript:string:operation>,
  "$args": <JSONScript:array:arguments> }
```

or short (macro)

```JSON
{ "$<operation>": <JSONScript> }
```

where <operation> can be +, -, *, /, etc. (see [Operations]()).


`$calc` - operation to be called (or a script returning operation as a string).

`$args` - single operand or array of operands to which the operation is applied (depends on the operation).


Examples:

TODO


### Functions

Syntax:

Define function:

```
{ "$def": <JSONScript:string:function_name>,
  "$args": <JSONScript:array|object:args_names|args_names:types>,
  "$func": <JSONScript> }
```

or short (macro):

```
{ "$<function_name>": <JSONScript:array|object:args_names|args_names:types>,
  "$func": <JSONScript> }
```

or anonymous arrow syntax (macro):

```
{ "$<arg_name>=>": <JSONScript> }
```


Call function:

```
{ "$call": <JSONScript:>,
  "$args": <JSONScript> }
```

or short (macro)

```
{ "$<function_reference>()": <JSONScript: array|object: args_list|args_by_name> }
```

Full syntax allows to compute the function name. Arguments in the function declaration can be either array of argument names (both the array and each name can be computed) or the object where the key is the argument name and the value is the allowed argument type (in a string, can be "number", "string", "boolean", "object", "array", "function"). If the value is an empty string, the value of any type can be passed. In all cases null can be passed (or argument can be omitted, which is equivaluent to passing null), unless "!" is added to the type in which case the argument is required.

When calling a function that was decraled with the list of arguments in array, either an object or an array can be used to pass arguments (both the whole array/object or each argument can be computed). In case array is used, the arguments will be matched to their names by order. In case the object is used, the arguments will be matched by name. No type checking will be performed and all arguments are optional.

When calling a function that was declared with the arguments names and possibly types in an object, only the object can be used to pass arguments. The arguments will be matched by name (as objects have no order) and the type checking will be done if the types were provided in the function declaration. If the types do not match, the exception ARGUMENT_TYPE_ERROR will be thrown.

In both array and object syntax of passing argument in the function call, additional arguments can be passed. All the arguments will be available in the $arguments reference which is both the array and object, as the arguments can be accessed by their indices (if the array syntax of passing was used or is the function was declared with arguments list in array and the argument is present in the declaration) and by their keys (if object was used to pass the arguments or if the argument name is present in the function declaration).

#### Function scopes

Function creates its own scope. References declared inside the function are not accssible from the outside. Using the same name as existing outside reference is allowed and it will make an outside reference unavailable inside the function.

Function scope can be accessed using `{ "$": "scope" }`. "scope" is a reserved word that cannot be used as a reference (or function) name. If there is a reference called "a" inside the scope it can be accessed as `{ "$": "scope.a" }`.

Parent scope is the scope property of the scope object, `{ "$": "scope.scope" }`.

Global scope (the scope of the script) can be accessed using a reserved reference `{ "$": "global" }` and the references defined in the global scope are the properties of "global" reference. See [Accessing properties and array elements]().


#### Functions as references

Function name is also a reference to its declaration. That allows to assign a completely different function to the same name (using `$script` instruction) or to replace it with the data (in which case it will be the part of the script result) so no furhter function call will be possible (it will throw REFERENCE_IS_NOT_FUNCTION exception).


#### Functions as values and closures

Function can be declared inside the function, it can be passed as an argument value and returned as the function result (using `$return` instruction).

If the function is a closure (it uses references from outside scope), they will be available even if the containing function finished execution. Every time the closure is created, it will have its own copy of the scope references.


TODO Examples


### Control flow

JSONScript supports control flow instructions that affect the order of excution by supporting loops, conditionals, functions, exception handling and returning results from the script.

All control frow constructs are objects with some special key starting from "$".


#### $result, $return, $end - creating results and terminating script execution

There are three keys that would create result, return value from the current function or completely terminate the script:

- `$result` - defines the result of the current execution construct (array or object). It will also create the return value of the function or of the whole script but only if its containing construct is the last construct executed in the function or the current script. See [Functions]. It is the most recommended instruction to use, as it doesn't break the flow of the script.

- `$return` - in addition to defining the result as `$res` does it also exits the currently executed function. Using `$return` outside of a function is a syntax error.

- `$end` - defines the result and terminates the whole script execution. In most cases, this instruction is not needed and not recommended.


Syntax:

```
{ "$result": <JSONScript> }

{ "$return": <JSONScript> }

{ "$end": <JSONScript> }
```

In some cases you may only want the result of the last step in sequential execution returned as a script result.

It can be done using `$result` instruction, that is an object with the single `$result` key. The value of the key will be the result of the script execution. As everything, the key can be any valid JSONScript - scalar, data, or the script which result will be the result of the containing block, script (or function) execution.

Although it is possible to always use `$result` to explicitly declare the results, it is not idiomatic and not recommended, as it complicates the script.


Exapmle:

Add the comment to the post with the title "My post":

```JSON
[ { "post": 
    { "Router.get()":
      { "url": "/post" }
      { "qs": 
        { "title": "My post",
          "limit": 1 } } },
    "comment":
    { "$Router.post()":
      { "url": "/comments/:post_id",
        "params": { "post_id": "$post.id" },
        "body": { "text": "My comment" } } } },
  { "$result": "$.comment" } ]
```

In the example above the result of `"$.comment"` is the result of substep "comment" in the previous step.

Without the `$result` instruction the post would also be returned, which is a waste in case the client doesn't need it.


### Collections

There are the following instruction that can be used both with arrays and objects: each, map, reduce, filter, some, every, find.

With arrays additionally these instructions can be used: push, pop, shift, unshift, slice, splice, reverse, sort, indexOf.

These methods accept collection as the first argument and the function (or function reference) that will be called for each item in collection as the second argument.

Syntax:

```
{ "$_.<method>()":
  [ <Collection>,
    <JSONScript:function_definition|function_reference>
    / , <options> / ] }
```


The iteration constructs allows to call function passing each element of the previous data structure (or script result) as an argument. `$reduce` is executed sequentially as each step can refer to the result of the previous step. When object is itereated, the order is undefined, it is wrong to assume that it will the same as order of keys in JSON.

`options.concurrency` - can be used used in `map` method. It prevents concurrency or specifies the maximum number of steps that can be executed in parallel. If `$concurrency` key is not specified, arrays and objects are iterated in parallel. `concurrency` equal to `false` prevents concurrency completely. `<number>` limits the number of parallel tasks. The value for `concurrency` can also be the result of JSONScript script.

Examples:

1. Request 10 latest posts of a given user together with comments

```JSON
[ { "$getPosts": ["user_id", "limit"],
    "$func":
    { "$Router.get()": 
      { "url": "/post"
        "qs": 
        { "user_id": "$user_id",
          "limit": "$limit" } } } },
  { "$getComments": ["post"],
    "$func":
    { "$Router.get()":
      { "url": "/comments/:post_id",
        "params": { "post_id": "$post.id" } } } },
  { "$_.map()":
    [ { "$getPosts": [ 37, 10 ] },
      { "$post =>":
        { "post": "$post",
          "comments": { "$getComments()": ["$post"] } } } ] },
  { "$result": "$" } ]
```

The example above will iterate the list of posts for the specified user, up to 10 posts (as should be defined in `router`), and request the list of comments for each post. `$result` instruction is used to include both the post and the coments in the result; without it the result would be the array of arrays, with internal arrays containing comments.

`{ "$":"post" }` refers to the iteration value.

`{ "$result": {"$":"$"} }` is the reference to the previous item.


With the concurrency limit (requested from executor "options" that could have been supplied to the interpreter) the script will look like this:

```JSON
[ "<functions from the example above>",
  { "$_.map()":
    [ { "$getPosts()": [37, 10] },
      { "$": [ "post" ],
        "$func":
        { "post": "$post",
          "comments":
          { "$getComments()": ["$post"] } } },
      { "concurrency": { "$Options.get()": "concurrency" } } ] },
  { "$result": "$" } ]
```

This example is just to show that any JSONScript can be used for any value. It is more likely that concurency won't be passed in the script at all and instead supplied as an option to the interpreter by the host environment/application. Although there may be situation when the client can supply the requered concurrency that would affect the price of execution by some 3rd party api.

The functions declarations are not included in the script, although they should be passed together with the script. Interpreters may implement hashing and precompiling functions for the following executions, no special syntax is defined for it.


2. Count the number of characters in all comments in the last ten posts of user:


```JSON
[ <functions from the example above>,
  { "$_.reduce()":
    [ { "$getPosts()": [37, 10] },
      { "$": [ "charsCount", "post" ],
        "$func":
        [ { "$getComments()": "$post" },
          { "$_.map()": [ "$", { "$_.property()":"text" } ] },
          { "$_.map()": [ "$", "$_.length" ] },
          { "$+": "$" },
          { "$result":
            { "$+": [ "$", "$charsCount" ] } } ] },
      0 ] },
  { "$result": "$" } ]
```

It is worth noting that if you wanted to simply count the number of comments rather than characters, you would not need to use reduce, it can be done by simply adding the results of `$map` operation.

The script below count the number of comments in the last 10 posts of the user:

```JSON
[ "<functions from the example above>",
  { "$+":
    { "$_.map()":
      [ { "$getPosts()": [37, 10] },
        { "$": "post",
          "$func":
          { "$_.length()":
            { "$getComments()": ["$post"] } } } ] } },
  { "$result": "$" } ]
```

The above script first gets the array of the numbers of all the comments for each post using `$_.map` and then simply adds then using `$+`.

If you need to do some other kind of aggregation and you want to accentuate the sequence of execution steps you can use references:


### $if and $switch - conditional constructs

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

`$if` - the script evaluating the condition.

`$then` - this script that will be executed if the condition result is truthy (any value that is not falsy: true, any number but 0, non-empty string, etc.).

`$else` - this optional script will be executed if the condition result is falsy (false, 0, null, empty string). If else is not specified and the condition is falsy, the value of the condition will be returned as the result.


Examples:

TODO


#### $switch

`$switch` - the script evaluating the selector. Can be any simple value that will be converted to string to match the key in the `$cases`.

`$cases` - the object (or the script returning the object) where the script to execute is selected based on the selector. If the selector value is not the string, the value will be converted to string. If it is not a scalar, the exception will be thrown.  The default case can be provided with the key `$default`.


Examples:

Check in the log the last resource changed and return this resource and its child resources:

```JSON
[ { "$getResourceAndChild": [ "resName", "resId", "subResName" ],
    "$func":
    { "$object":
      [ { "key": "$resName",
          "value":
          { "$Resource.read()":
            { "resource": "$resName",
              "id": "$resId" } } },
        { "key": "$subResName",
          "value":
          { "$Resource.read()":
            { "resource": "$subResName",
              "where":
              { "parentId": "$resId" } } } } ] },

  { "$Resource.list()":
    { "resource": "log",
      "order": "desc",
      "limit": 1 } },

  { "$lastLog": "$[0]" },
  { "$lastResId": "$lastLog.resourceId" },

  { "$switch": { "$lastLog.resourceName" },
    "$cases":
    { "A":
      { "$getResourceAndChild()":
        ["A", "$lastResId", "childOfA"] },
      "B":
      { "$getResourceAndChild()":
        ["B", "$lastResId", "childOfB"] } } },

  { "$result": "$" } ]
```


### Loops - `$while`, `$for`, `$break`, `$continue`.

Syntax:

While loop

```
{ $while: <JSONScript>, $do: <JSONScript> }
```

For loop (macro):

```
{ $for: <JSONScript:array:for_clauses>, $do: <JSONScript> }
```

<for_clauses> syntax:

```
[<JS:initialization>, <JS:condition>, <JS:increment>]
```


```
{ $for: '<reference_name>', $in: <JSONScript:object|array>, $do: <JS> }
```

```
{ $for: '<reference_name>', $of: <JSONScript:object|array>, $do: <JS> }
```


```
'$break'
```

```
'$continue'
```


### Exceptions and exception handling - $try, $catch, $finally and `$throw`

Syntax:

```
{ "$throw": <JSONScript> }

{ "$try": <JSONScript>,
  "$catch": <JSONScript>
  / , "$finally" <JSONScript> / }
```

`$try` - script in this key is executed first.

`$catch` - this script will be executed if the script in `$try` throws exceptions. You can refer to the exception using { "$": "-" } or { "$": "$try" }. If the exception is thrown inside `$catch` script, it will bubble up to the next containing `$try/$catch` construct. Unhandled exceptions terminate the script (in many cases it is the desired result).

`$finally` - this script will be executed in all cases, after `$catch`, if the exception was thrown, or after `$try` if there was no exception. You can refer to the results of "$try" and "$catch" using `{ "$": "$try" }` and `{ "$": "$catch" }`. `{ "$": "-" }` will refer to the previously executed block (`$try` or `$catch`).


TODO: examples


### $script - scripts returning scripts

Syntax:

```
{ "$script": <JSONScript>
  / , "$recur": <JSONScript> /
  / , "$sandbox": <JSONScript> / }
```

<JSONScript> will be executed. If the result is data (i.e., JSON that has no keys starting with "$") it will be the result of `$script` construct. If the result is JSONScript, it will be executed again.

Without `$recur` it will continue until the script result is data.

`$recur: false` prevents this recursion. The returned script is executed only once and even if it returns JSONScript it will be the result. It can be useful for generating functions.

`$recur: <number>` limits the recursion to a specified number of times.

`$sandbox: true` to prevent access to outside symbols, root and scope. Essentially, script will execute in its own scope with no access to the outside scope. $sandbox: [ "$scope", "$a" ] will only allow access to certain symbols ($scope should not allow $scope.$scope to avoid traversing up the scope tree). The default value is `false`.


### Transformations: `$object` and `$array`

TODO


### Script evaluation vs "quoting": `$eval` and `$code`

TODO


### Macros

Syntax:


```
{ $macro: <JS:string:rule>, $code: <JSONScript:code_template> }
```


Previous result reference:

```
{ $macro: '$', $code: { $:'$' } }
```

Create reference:

```
{ $macro: { '$%reference:ident': '%value' },
  $code: { $def: '%reference', $value: '%value' } }
```

Set reference value:

```
{ $macro: { '$%reference:ident=': '%value' },
  $code: { $set: '%reference', $value: '%value' } }
```

Get reference value:

```
{ $macro: { '%key': '$%reference:ident' },
  $code: { '%key': { $get: '%reference' } } }
```

Call function:

```
{ $macro: { '$%func:ident()': '%args' },
  $code: { $call: '%func', $args: '%args' } }
```

Define function:

```
{ $macro: { '$%name:ident': '%args', $func: '%body' }
  $code: { $def: '%name', $args: '%args', $func: '%body' } }
```

Anonymous function

```
{ $macro: { $: '%args', $func: '%body' }
  $code: { $args: '%args', $func: '%body' } }
```

Arrow function

```
{ $macro: { '$%name:ident=>': '%body' },
  $code: { $args: ['%name'], $func: '%body' } }
```

Map macro

```
{ $macro:
  { $map: '%coll',
    $as: '%val:ident',
    '/\$(index|key)/?':  '%index:ident'
    $do: '%body' },
  $code:
  { $map:
    [ '%coll',
      { $:
        { $eval:
          { $if: '%index',
            $then: { $code: ['%val', '%index'] },
            $else: { $code: ['%val'] } } },
        $func: '%body' } ] } }
```


### Reserved words

JSONScript reserves all the words that are reserved in JavaScript ES6, ES7 and those that were reserved in the previous version of JavaScript for future use.

Although many of these reserved words are not currently used, they cannot be used for references. They can be used though for property names.

```
break, case, class, catch, const, continue, debugger, default, delete, do, else, export, extends, finally, for, function, if, import, in, instanceof, let, new, of, return, super, switch, this, throw, try, typeof, var, void, while, with, yield

enum, await

implements, module, package, protected, static, interface, private, public

abstract, boolean, byte, char, double, final, float, goto, int, long, native, short, synchronized, transient, volatile
```

In addition there are these reserved words currently used:

```
args, call, code, def, do, end, eval, exec, func, get, global, macro, method, result, scope, script, set
```

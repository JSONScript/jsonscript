# JSONScript

Platform independent asynchronous and concurrent scripting language using JSON format.

JSONScript is created to manage scripted execution in remote systems to avoid the latency between requests and unnecessary transfers of intermediary results.

It's work in progress.

[![Build Status](https://travis-ci.org/JSONScript/jsonscript.svg?branch=master)](https://travis-ci.org/JSONScript/jsonscript)


## Features

JSONScript:

- uses JSON as its representaion format for both data and control structures, being similar to lisp (homoiconic)
- defines simple control structures.
- is asynchronous and concurrent without the need to use any special keywords
- actual processing in the remote system is done synchronously or asynchronously by the functions and objects supplied to JSONScript interpreter by the host environment.


## Problem

Management of remote systems is usually done via APIs.

It is often required to make multiple sequential or parallel calls, sometimes with some conditions between calls, to get the required result. It can be achieved in two ways:

1. Sending multiple requests to the remote system and implementing all the logic in the client system. The advantage of this approach is that the remote system remains unchanged and the client can easily change the logic and flow of requests. The disadvantage is the latency and the traffic - each request should travel via the network.

2. Implementing additional methods/endpoints/parameters in the remote system. The advantage of this approach is that the client has to make only one request. The disadvantage is that it requires changing the remote system (= coding + testing + documenting + deploying + monitoring + supporting...). In some cases it is simply impossible. When it is possible, it inevitably leads to the growing complexity of the remote system as more and more specialized methods/APIs are added to it. 

In some cases, developers implement "batch endpoints" that allow to process multiple requests sequentially or in parallel in a single HTTP request. It covers only use cases when results are independent and there are no conditions or some other logic between requests.


## Solution

JSONScript allows you to send a script to the remote system that will be interpreted by the remote system. It will execute the script and return all results to the client. All this in a single HTTP (or any other transport) request.

JSONScript allows to keep the API of remote system conscise and simple, only implementing basic methods. At the same time JSONScript allows the client to implement an advanced logic with conditions and looping, sequential and concurrent execution, defining and calling functions and handling exceptions. In this way quite advanced execution can be requested from the remote system in a single transport request.

At the same time JSONScript allows keeping the remote system completely secure as only the functions and objects registered with the interpreter can be used from the JSONScript script and the interpreter can limit resources (time, memory, etc.) that the script can use.


## Script execution

As the script executes, each instruction returns some data. By default this data replaces the script itself and all results will be available to the interpreter to pass back to the host system that requested execution. Host system usually sends results back to the client, but can do anything else with them, e.g. logging, storing to the database, etc.).


## Language

See [Language](https://github.com/JSONScript/jsonscript/blob/master/LANGUAGE.md)

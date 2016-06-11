---
page_name: index
title: JSONScript - Scripted server-side processing of existing endpoints and services
layout: main
---
# JSONScript

Language for scripted server-side processing of existing endpoints and services.

[![Build Status](https://travis-ci.org/JSONScript/jsonscript.svg?branch=master)](https://travis-ci.org/JSONScript/jsonscript)
[![npm version](https://badge.fury.io/js/jsonscript.svg)](https://www.npmjs.com/package/jsonscript)


## Script example

```json
{
  "$$array.map": {
    "data": [
      { "path": "/resource/1", "body": { "test": 1 } },
      { "path": "/resource/2", "body": { "test": 2 } },
      { "path": "/resource/3", "body": { "test": 3 } },
    ],
    "iterator": {
      "$func": [
        { "$$router.get": { "path": { "$data": "/path" } } },
        { "$$router.put": { "$data": "/" } },
      ],
      "$args": ["path", "body"]
    }
  }
}
```

Using YAML for the same script makes it more readable:

```yaml
$$array.map:
  data:
    - { path: /resource/1, body: { test: 1 } }
    - { path: /resource/2, body: { test: 2 } }
    - { path: /resource/3, body: { test: 3 } }
  iterator:
    $func:
      - $$router.get: { path: { $data: /path } }
      - $$router.put: { $data: / }
    $args: [ path, body ]
```

When executed on the server, the script above iterates array of requests, retrieves resource for each path and then updates it with a new value.

See [Language](language.html).


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


## Schema

See [Schema](schema.html) for JSON-schemas for the script and for instruction definitions.


## Implementations

JSONScript interpreter for node-js: [jsonscript-js](https://github.com/epoberezkin/jsonscript-js)

Express 4 middleware/route-handler: [jsonscript-express](https://github.com/JSONScript/jsonscript-express) (it supports scripted processing of existing express app routes)

Proxy server: [jsonscript-proxy](https://github.com/JSONScript/jsonscript-proxy) (it supports scripted processing of other existing services).


## License

[MIT](license.html)

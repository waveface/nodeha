NodeHA, an high-availability reverse proxy implemented by Node.jS
==================================================================

Introduction
------------
nodeha is a high availability reverse proxy implemented by Node.js. By leveraging Node's asynchronous behavior, in theory, nodeha is a high performance reverse proxy which could hold high volume of concurrent connections at the same time. And diffrent to HAProxy, another well known async proxy, nodeha doesn't need other 3rd-party application to decrypt the SSL connection. You can directly place nodeha in front of your web sites, host the SSL certificates, and offload the SSL traffic decription from your web site.

Features
--------
Currently the initial target goal of nodeha is to complete the following features:

- High availability
- Load balancing strategies

  * Round robin
  * Least connection
  * Source

- Web site healthy checks
- Support both HTTP/HTTPS frontend
- Support both HTTP/HTTPS backends
- X-Forwarded-For
- Logging
- HTTP header based routing
- Support websocket


Current Status
--------------
It is still under heavy development, we welcome your feedbacks, but this module has not been well tested, think again before you want to use it. 
We already implemented the following features:
- routing strategies: rr, least connection, source
- backend healthy check
- http/https frontend
- http/https backend

And now we are working hard on the following features:
- X-Forwarded-For
- More detail logging
- HTTP header based routing
- Websocket


Testing
-------
nodeha is using mocha for its BDD unit testing. Follow the instructions below to perform the testing:

% npm install mocha
% npm install should

% make test


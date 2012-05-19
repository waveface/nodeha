/*
nodeha.js

Copyright (c) 2012 Steven Shen

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

*/


var events = require('events'),
    http = require('http'),
    https = require('https'),
    LBProxy = require('./lbProxy').LoadBalancingProxy;

var NodeHA = exports.NodeHA = function() {
    var frontend = null,
        lbproxy = null;

    var self = this;

    var healthyCheck = function(options) {
        if (!options.httpChk || (options.hasOwnProperty('enable') && !options.enable)
            || !options.backends || options.backends.length==0) {
            return;
        }

        var interval = options.httpChk.interval || 5,
            method = options.httpChk.method || 'GET',
            headers = options.httpChk.headers || [],
            path = options.httpChk.path || '/';

        setInterval(function() {
            for (idx in lbproxy.proxies) {
                var proxy = lbproxy.proxies[idx],
                    outgoing = {};
            
                outgoing.host = proxy.target.host;
                outgoing.port = proxy.target.port;
                outgoing.method = method;
                outgoing.path = path;
                outgoing.headers = headers;
                
                console.log('check healthy: ' + outgoing.host + ' with port:' + outgoing.port);
                var check = proxy.target.protocol.request(outgoing, function(res) {
                    console.log('check success');
                    if (!proxy.available) {
                        proxy.enable();
                    }
                });
                check.once('error', function(err) {
                    // stop forwarding request to this server
                    console.log('disable proxy for server:' + proxy.target.host);
                    proxy.disable();
                });
                check.end();
            }
        }, interval * 1000);
    }

    var createServer = function(options) {
        self.options = options || self.options;

        if (self.options.frontend && self.options.frontend.port) {
            self.port = self.options.frontend.port;
        }

        lbproxy = new LBProxy(self.options);
        if (self.options.frontend && self.options.frontend.https) {
            frontend = https.createServer(self.options, function(req, res) {
                lbproxy.proxyRequest(req, res, self.options);
            });
        } else {
            frontend = http.createServer(function(req, res) {
                lbproxy.proxyRequest(req, res, self.options);
            });
        }
        healthyCheck (options);
    }

    var listen = function(port) {
        var p = port || self.port;
        frontend.listen(p);
    }

    var close = function() {
        if (lbproxy !== null) {
            lbproxy.close();
        }

        if (frontend !== null) {
            frontend.close();
        }
    }

    return {
        createServer: createServer,
        listen: listen,
        close: close
    };
}



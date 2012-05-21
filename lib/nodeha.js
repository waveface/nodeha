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
    log4js = require('log4js'),
    LBProxy = require('./lbProxy').LoadBalancingProxy;

log4js.restoreConsole();

var NodeHA = exports.NodeHA = function(options) {
    var self = this;

    self.frontend = null;
    self.lbproxy = null;

    self.access_logger = log4js.getLogger();
    self.debug_logger = log4js.getLogger();

    self.options = options;

    var setLogger = function(options) {
        if (!options || !options.log) 
            return;

        if (options.log.appenders)
            log4js.configure(options.log);

        if (options.log.accesslog) 
            self.access_logger = log4js.getLogger(options.log.accesslog);

        if (options.log.debuglog) 
            self.debug_logger = log4js.getLogger(options.log.debuglog);

        if (options.log.level) 
            self.debug_logger.setLevel(options.log.level);
        else
            self.debug_logger.setLevel('INFO');
    }

    setLogger(self.options);

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
                
                var check = proxy.target.protocol.request(outgoing, function(res) {
                    self.debug_logger.debug('successfully verify check of ' + outgoing.host + ':' + outgoing.port + ' healthy');
                    if (!proxy.available) {
                        proxy.enable();
                    }
                });
                check.once('error', function(err) {
                    // stop forwarding request to this server
                    self.debug_logger.erorr('failed to verify ' + outgoing.host + ':' + outgoing.port + ' healthy, stop forwarding traffic to this server.');
                    proxy.disable();
                });
                check.end();
            }
        }, interval * 1000);
    }
    var createServer = function(options) {
        options = options || self.options;

        if (!options || !options.frontend) {
            throw new Error('No frontend setting is provided');
        }

        setLogger(options);

        if (options.frontend && options.frontend.port) {
            self.port = options.frontend.port;
        }

        self.lbproxy = new LBProxy(options);
        if (options.frontend && options.frontend.https) {
            frontend = https.createServer(options, function(req, res) {
                lbproxy.proxyRequest(req, res, options);
            });
        } else {
            frontend = http.createServer(function(req, res) {
                lbproxy.proxyRequest(req, res, options);
            });
        }
        healthyCheck (options);

        self.lbproxy.on('forwarded', function(entry) {
            var d = new Date();
            self.access_logger.info(entry.clientAddr + ':' + entry.clientPort + ' [' + d + '] ' + entry.targetHost + ':' + entry.targetPort + ' ' + entry.status + ' ' + entry.method + ' '  + entry.url + ' ' + entry.protocol);
        });

        self.lbproxy.on('error', function(err) {
            self.debug_log.error(err);
        });
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
        setLogger: setLogger,
        close: close
    };
}



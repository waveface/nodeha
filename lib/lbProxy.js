/*
lbProxy.js

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
    util = require('util'),
    HttpProxy = require('http-proxy').HttpProxy,
    strategies = require('./strategies'),
    RRStrategy = strategies.RoundRobinStrategy,
    LCStrategy = strategies.LeastConnectionStrategy;

var ExtHttpProxy = function(options) {
    HttpProxy.call(this, options);
    this.available = true; 
}

util.inherits(ExtHttpProxy, HttpProxy);

ExtHttpProxy.prototype.enable = function() {
    this.available = true;
    this.emit('enable')
}

ExtHttpProxy.prototype.disable = function() {
    this.available = false;
    this.emit('disable')
}

var LoadBalancingProxy = exports.LoadBalancingProxy = function(options) {

    events.EventEmitter.call(this);
    var self = this;
    this.proxies = [];

    this.target = {};
    this.target.host = options.host || '';
    this.target.port = options.port || 80;
    this.target.https = options.https || false;

    if (options.backends) {
        options.backends.forEach(function(opt) {
            self.add(opt);   
        });
    }

    if (options.loadbalance) {
        if (typeof options.loadbalance.strategy === "string") {
            if (options.loadbalance.strategy === "rr" || options.loadbalance.strategy === "round robin") {
                this.strategy = new RRStrategy(this.proxies, options.loadbalance);
            } else if (options.loadbalance.strategy === "least") {
                this.strategy = new LCStrategy(this.proxies, options.loadbalance);
            } else {
                throw new Error('Invalid load balancing strategy');
            }
        } else {
            this.strategy = options.loadbalance.strategy;
        }
    } else {
        this.strategy = new RRStrategy(this.proxies, options.loadbalance);
    }
}

util.inherits(LoadBalancingProxy, events.EventEmitter);

LoadBalancingProxy.prototype.add = function(opts) {
    var dst = {};
    dst.target = {};
    dst.target.host = opts.host || this.target.host; 
    dst.target.port = opts.port || this.target.port;
    dst.target.https = opts.https || this.target.https;

    var proxy = new ExtHttpProxy(dst);
    proxy.on('proxyError', this.emit.bind(this, 'proxyError'));
    proxy.on('webSocketError', this.emit.bind(this, 'webSocketError'));

    this.proxies.push(proxy);
}

LoadBalancingProxy.prototype.remove = function(options) {
}

LoadBalancingProxy.prototype.proxyRequest = function (req, res, options) {
    this.strategy(req, res, function(err, proxy) {
        if (err) {
            res.writeHead(404);
            res.end();
        } else {
            proxy.proxyRequest(req, res, options.buffer);
        }
    });
}



/*
leastconnect.js

copyright (c) 2012 steven shen

permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "software"), to deal
in the software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the software, and to permit persons to whom the software is
furnished to do so, subject to the following conditions:

the above copyright notice and this permission notice shall be included in
all copies or substantial portions of the software.

the software is provided "as is", without warranty of any kind, express or
implied, including but not limited to the warranties of merchantability,
fitness for a particular purpose and noninfringement. in no event shall the
authors or copyright holders be liable for any claim, damages or other
liability, whether in an action of contract, tort or otherwise, arising from,
out of or in connection with the software or the use or other dealings in
the software.

*/


var strategy = require('../strategy'),
    util = require('util');


var LeastConnectionStrategy = exports.LeastConnectionStrategy = function(proxies, options) {
    this.proxies = proxies || [];
};


util.inherits(LeastConnectionStrategy, strategy.LoadBalancingStrategy);

LeastConnectionStrategy.prototype.next = function(req) {
    var proxy_len = this.proxies.length;
    if (proxy_len === 0) 
        return null;

    // find the least concurrent connections among all available backend servers
    var proxy = null,
        curr = 0;

    this.proxies.forEach(function(p) {
        if (!p.available) 
            return;

        if (proxy === null || !p.count || p.count < curr) {
            proxy = p;
            curr = p.count || 0;
        }
    });

    if (proxy !== null)
        proxy.count = proxy.count ? proxy.count + 1 : 0;
    return proxy;
}

LeastConnectionStrategy.prototype.end = function(proxy) {
    proxy.count--;
    if (proxy.count < 0)
        proxy.count = 0;
}



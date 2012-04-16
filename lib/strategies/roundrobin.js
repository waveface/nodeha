/*
roundrobin.js

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


var RoundRobinStrategy = exports.RoundRobinStrategy = function(proxies, options) {
    this.proxies = proxies || [];
    this.current_proxy_idx = 0;
};


util.inherits(RoundRobinStrategy, strategy.LoadBalancingStrategy);

RoundRobinStrategy.prototype.next = function(req) {
    var proxy_num = this.proxies.length,
        availables = proxy_num,
        proxy;

    if (proxy_num === 0) 
        return null;

    while (availables > 0) {
        proxy = this.proxies[this.current_proxy_idx];
        this.current_proxy_idx = (this.current_proxy_idx === proxy_num-1) ? 0 : this.current_proxy_idx + 1;
        if (proxy.available) 
            break;
        availables --;
    }
    if (availables === 0) 
        return null;
    return proxy;
}


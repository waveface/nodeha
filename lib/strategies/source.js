/*
source.js

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


var SourceStrategy = exports.SourceStrategy = function(proxies, options) {
    this.proxies = proxies || [];
};

util.inherits(SourceStrategy, strategy.LoadBalancingStrategy);

SourceStrategy.prototype._ip2long = function(ip) {
    var ipl=0;
    ip.split('.').forEach(function( octet ) {
        ipl<<=8;
        ipl+=parseInt(octet);
    });
    return(ipl >>>0);
}


SourceStrategy.prototype._remoteAddr = function(req) {
    var straddr;
    if (req.connection) {
        straddr = req.connection.remoteAddress;
    } else {
        straddr = req.client.hasOwnProperty('remoteAddress') ? req.client.remoteAddress : req.client.socket.remoteAddress;
    }

    return this._ip2long(straddr);
}

SourceStrategy.prototype.next = function(req) {
    var availables = 0, 
        addr,
        mod = 0, 
        proxy = null;

    this.proxies.forEach(function(p) {
        if (p.available)
            availables ++;
    });
    if (availables === 0)
        return null;

    addr = this._remoteAddr(req);
    mod = addr % availables;

    for (idx in this.proxies) {
        var p = this.proxies[idx];
        if (!p.available)
            return;

        if (mod === 0) { 
            proxy = p;
            break;
        }
        mod --;
    }

    return proxy;
}



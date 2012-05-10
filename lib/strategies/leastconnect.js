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


var LeastConnectionStrategy = exports.LeastConnectionStrategy = function(proxies, options) {
    var self = this;
    this.proxies = proxies || [];

    return function(req, res, cb) {
        var proxy_len = self.proxies.length;
        if (proxy_len === 0) 
            return cb('No proxy available');

        res.on('end', function() {
            if (req.proxy) {
                req.proxy.count --;
                if (req.proxy.count < 0)
                    req.proxy.count = 0;
            }
        });

        // find the least concurrent connections among all available backend servers
        var proxy = null,
            curr = 0;

        self.proxies.forEach(function(p) {
            if (!p.available) 
                return cb('No proxy available');

            if (proxy === null || !p.count || p.count < curr) {
                proxy = p;
                curr = p.count || 0;
            }
        });

        if (proxy !== null)
            proxy.count = proxy.count ? proxy.count + 1 : 0;
        req.proxy = proxy;
        return cb(null, proxy);
    }
};



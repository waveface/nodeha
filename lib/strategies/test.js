var source = require('./source');
var lbProxy = require('../lbProxy');

var basic_options = {};
basic_options["backends"] = [
                    {
                        host: "127.0.0.1",
                        port: 8001,
                        https: false
                    },
                    {
                        host: "127.0.0.2",
                        port: 8002,
                        https: false
                    }
];

var proxy = new lbProxy.LoadBalancingProxy(basic_options);
var s = new source.SourceStrategy(proxy.proxies, basic_options);

var req = { connection: { remoteAddress: "10.1.1.0" } };
var p = s.next(req);
console.log(p.target.host);

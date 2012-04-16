var vows = require('vows'),
    assert = require('assert'),
    strategies = require('../lib/strategies'),
    lbProxy = require('../lib/lbProxy');

var basic_options = {
};

vows.describe('Strategies test').addBatch({
    'Round robin': {
        "without proxy setting": {
            topic: function() {
                var proxy = new lbProxy.LoadBalancingProxy(basic_options);
                return new strategies.RoundRobinStrategy(proxy.proxies, basic_options);
            },
            "should return null": function(strategy) {
                assert(strategy.next() === null);
                assert(strategy.next() === null);
                assert(strategy.next() === null);
            }
        },
        "with one proxy setting": {
            topic: function() {
                basic_options["backends"] = [
                    {
                        host: "127.0.0.1",
                        port: 8001,
                        https: false
                    }
                ];
                var proxy = new lbProxy.LoadBalancingProxy(basic_options);
                return new strategies.RoundRobinStrategy(proxy.proxies, basic_options);
            },
            "should always return the first one": function(strategy) {
                var p = strategy.next();
                assert(p.target.host === '127.0.0.1');
                assert(p.target.port === 8001);

                var p = strategy.next();
                assert(p.target.host === '127.0.0.1');
                assert(p.target.port === 8001);
            }
        },
        "Multiple proxies setting": {
            topic: function() {
                basic_options["backends"] = [
                    {
                        host: "127.0.0.1",
                        port: 8001,
                        https: false
                    },
                    {
                        host: "192.168.1.1",
                        port: 8001,
                        https: false
                    },
                    {
                        host: "192.168.1.2",
                        port: 8001,
                        https: false
                    }
                ];
                var proxy = new lbProxy.LoadBalancingProxy(basic_options);
                return new strategies.RoundRobinStrategy(proxy.proxies, basic_options);
            },

            "should return the first one": function(strategy) {
                var p = strategy.next();
                assert(p.target.host === '127.0.0.1');
            },

            "should return the second one": function(strategy) {
                var p = strategy.next();
                assert(p.target.host === '192.168.1.1');
            },

            "should return the third one": function(strategy) {
                var p = strategy.next();
                assert(p.target.host === '192.168.1.2');
            },

            "should return the first one": function(strategy) {
                var p = strategy.next();
                assert(p.target.host === '127.0.0.1');
            }
        }
    }
}).addBatch({
    'Source': {
        "without proxy setting": {
            topic: function() {
                basic_options['backends'] = [];
                var proxy = new lbProxy.LoadBalancingProxy(basic_options);
                return new strategies.LeastConnectionStrategy(proxy.proxies, basic_options);
            },
            "should return null": function(strategy) {
                assert(strategy.next() === null);
                assert(strategy.next() === null);
                assert(strategy.next() === null);
            }
        },

        "with one proxy setting": {
            topic: function() {
                basic_options["backends"] = [
                    {
                        host: "127.0.0.1",
                        port: 8001,
                        https: false
                    }
                ];
                var proxy = new lbProxy.LoadBalancingProxy(basic_options);
                return new strategies.LeastConnectionStrategy(proxy.proxies, basic_options);
            },
            "should always return the first one": function(strategy) {
                var p = strategy.next();
                assert(p.target.host === '127.0.0.1');
                assert(p.target.port === 8001);

                var p = strategy.next();
                assert(p.target.host === '127.0.0.1');
                assert(p.target.port === 8001);
            }
        },

        "with two proxy setting": {
            topic: function() {
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
                return new strategies.SourceStrategy(proxy.proxies, basic_options);
            },

            "should return the first one": function(strategy) {
                var req = { connection: { remoteAddress: "10.1.1.0" } };
                var p = strategy.next(req);
                assert(p.target.host === '127.0.0.1');
            },

            "should return the second one": function(strategy) {
                var req = { connection: { remoteAddress: "10.1.1.1" } };
                var p = strategy.next(req);
                assert(p.target.host === '127.0.0.2');
            },

            "should return the third one": function(strategy) {
                var req = { connection: { remoteAddress: "10.1.1.1" } };
                var p = strategy.next(req);
                assert(p.target.host === '127.0.0.1');
            }
        }
        
    }
}).addBatch({
    'LeastConnection': {
    }   
}).export(module);


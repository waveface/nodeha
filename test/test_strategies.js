var strategies = require('../lib/strategies'),
    lbProxy = require('../lib/lbProxy'),
    should = require('should');

var basic_options = {
};

var req = {},
    res = {};

describe('Strategy in round robin', function() {
    describe("without proxy setting", function() {
        var proxy = new lbProxy.LoadBalancingProxy(basic_options);
        var strategy = new strategies.RoundRobinStrategy(proxy.proxies, basic_options);

        it("should return null", function(done) {
            strategy(req, res, function(err, p) {
                should.exist(err);
                done();
            });
        });

        it("should return null", function(done) {
            strategy(req, res, function(err, p) {
                should.exist(err);
                done();
            });
        });
    });

    describe("with one proxy setting", function() {
        basic_options["backends"] = [
            {
                host: "127.0.0.1",
                port: 8001,
                https: false
            }
        ];
        var proxy = new lbProxy.LoadBalancingProxy(basic_options);
        var strategy = new strategies.RoundRobinStrategy(proxy.proxies, basic_options);

        it("should always return the first one", function(done) {
            strategy(req, res, function(err, p) {
                should.not.exist(err);
                p.target.host.should.equal('127.0.0.1');
                p.target.port.should.equal(8001);
                done();
            });
        });

        
        it("should always return the first one", function(done) {
            strategy(req, res, function(err, p) {
                should.not.exist(err);
                p.target.host.should.equal('127.0.0.1');
                p.target.port.should.equal(8001);
                done();
            });
        });
    });

    describe("Multiple proxies setting", function() {
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
        var strategy = new strategies.RoundRobinStrategy(proxy.proxies, basic_options);

        it("should return the first one", function(done) {
            strategy(req, res, function(err, p) {
                should.not.exist(err);
                p.target.host.should.equal('127.0.0.1');
                done();
            });
        });

        it("should return the second one", function(done) {
            strategy(req, res, function(err, p) {
                should.not.exist(err);
                p.target.host.should.equal('192.168.1.1');
                done();
            });
        });

        it("should return the third one", function(done) {
            strategy(req, res, function(err, p) {
                should.not.exist(err);
                p.target.host.should.equal('192.168.1.2');
                done();
            });
        });

        it("should return the first one", function(done) {
            strategy(req, res, function(err, p) {
                should.not.exist(err);
                p.target.host.should.equal('127.0.0.1');
                done();
            });
        });
    });
});

describe('Strategy in source', function() {
    describe("without proxy setting", function() {
        basic_options['backends'] = [];
        var proxy = new lbProxy.LoadBalancingProxy(basic_options);
        var strategy = new strategies.SourceStrategy(proxy.proxies, basic_options);

        it("should return null", function(done) {
            strategy(req, res, function(err, p) {
                should.exist(err);
                done();
            });
        });

        it("should return null", function(done) {
            strategy(req, res, function(err, p) {
                should.exist(err);
                done();
            });
        });

    });

    describe("with one proxy setting", function() {
        basic_options["backends"] = [
            {
                host: "127.0.0.1",
                port: 8001,
                https: false
            }
        ];
        var proxy = new lbProxy.LoadBalancingProxy(basic_options);
        var strategy = new strategies.SourceStrategy(proxy.proxies, basic_options);
    
        it("should always return the first one", function(done) {
            var req = { connection: { remoteAddress: "10.1.1.0" } };
            strategy(req, res, function(err, p) {
                p.target.host.should.equal('127.0.0.1');
                p.target.port.should.equal(8001);
                done();
            });
        });

        it("should always return the first one", function(done) {
            var req = { connection: { remoteAddress: "10.1.1.1" } };
            strategy(req, res, function(err, p) {
                p.target.host.should.equal('127.0.0.1');
                p.target.port.should.equal(8001);
                done();
            });
        });
    });

    describe("with two proxy setting", function() {
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
        var strategy = new strategies.SourceStrategy(proxy.proxies, basic_options);

        it("should return the first one", function(done) {
            var req = { connection: { remoteAddress: "10.1.1.0" } };
            strategy(req, res, function(err, p) {
                p.target.host.should.equal('127.0.0.1');
                done();
            });
        });

        it("should return the second one", function(done) {
            var req = { connection: { remoteAddress: "10.1.1.1" } };
            strategy(req, res, function(err, p) {
                p.target.host.should.equal('127.0.0.2');
                done();
            });
        });

        it("should return the first one", function(done) {
            var req = { connection: { remoteAddress: "10.1.1.2" } };
            strategy(req, res, function(err, p) {
                p.target.host.should.equal('127.0.0.1');
                done();
            });
        });
    });
});


describe('Strategy in least connection', function() {
    describe("without proxy setting", function() {
        basic_options['backends'] = [];
        var proxy = new lbProxy.LoadBalancingProxy(basic_options);
        var strategy = new strategies.LeastConnectionStrategy(proxy.proxies, basic_options);

        it("should return null", function(done) {
            strategy(req, res, function(err, p) {
                should.exist(err);
                done();
            });
        });

        it("should return null", function(done) {
            strategy(req, res, function(err, p) {
                should.exist(err);
                done();
            });
        });

    });

    describe("with two proxy setting", function() {
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
        var res = {
            'on': function(event, handler) {}
        };

        var proxy = new lbProxy.LoadBalancingProxy(basic_options);
        var strategy = new strategies.LeastConnectionStrategy(proxy.proxies, basic_options);

        it("should return the first one", function(done) {
            var req = { connection: { remoteAddress: "10.1.1.0" } };
            strategy(req, res, function(err, p) {
                p.target.host.should.equal('127.0.0.2');
                done();
            });
        });

    });
});

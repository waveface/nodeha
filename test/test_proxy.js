var http = require('http'),
    should = require('should'),
    NodeHA = require('../lib/nodeha').NodeHA;

var haoptions = {
    loadbalance: {
        strategy: "rr"
    },

    httpChk: {
        enable: false,
        interval: 5
    },

    frontend: {
        port: 8000,
        https: false
    },

    log: {
        accesslog: 'none-exist',
        debuglog: 'none-exist',
        level: 'FATAL'
    },

    backends: [
        {
            host: "127.0.0.1",
            port: 8001,
            https: false,
            httpChk: 'http://127.0.0.1/'
        },
        {
            host: "127.0.0.1",
            port: 8002,
            https: false,
            httpChk: 'http://127.0.0.1/'
        },
        {
            host: '127.0.0.1',
            port: 8003,
            https: false,
            httpChk: 'http://127.0.0.1/'
        }
    ]
};


var servers = [];
function start_servers() {
    var idx = 0;
    haoptions.backends.forEach(function(s) {
        var server = http.createServer(function(req, res) {
            res.writeHead(200);
            res.end('{ "port" : ' + s.port + ', "client_addr": "' + req.headers['x-forwarded-for'] + '", "client_proto": "' + req.headers['x-forwarded-proto'] +'" }'); 
        }).listen(s.port);
        idx ++;
        servers[idx] = server;
    });
}

function stop_servers() {
    servers.forEach(function(s) {
        s.close();
    });
}

describe("Test proxy with round robin strategy", function() {
    it("should route to the first server.", function(done) {
        var ha = NodeHA();
        start_servers();
        ha.createServer(haoptions);
        ha.listen(8000);
 
        var cli_opts = {
            host: '127.0.0.1',
            port: 8000,
            path: '/',
            method: 'GET'
        };

        var req = http.request(cli_opts, function(res) {
            res.on('data', function(chunk) {
                var retObj = JSON.parse(chunk.toString());
                retObj.port.should.equal(8001);
                retObj.client_addr.should.equal('127.0.0.1');
                retObj.client_proto.should.equal('http');

                var req2 = http.request(cli_opts, function(res) {
                    res.on('data', function(chunk) {
                        var retObj2 = JSON.parse(chunk.toString());
                        retObj2.port.should.equal(8002);
                        retObj2.client_addr.should.equal('127.0.0.1');
                        retObj2.client_proto.should.equal('http');
                        ha.close();
                        stop_servers();
                        done();
                    });
                });

                req2.end();
            });
        });       
        req.addListener('error',function(res) {
            should.not.be.ok();
            done();
        });
        req.end();
    });
});


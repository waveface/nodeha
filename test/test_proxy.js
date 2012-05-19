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
            res.end("server port: " + s.port); 
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
                chunk.toString().should.equal('server port: 8001');           

                var req2 = http.request(cli_opts, function(res) {
                    res.on('data', function(chunk) {
                        chunk.toString().should.equal('server port: 8002');           
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


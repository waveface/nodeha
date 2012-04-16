var http = require('http');
var NodeHA = require('./nodeha').NodeHA;

var options = {
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


var server1 = http.createServer(function (req, res) {
    console.log('server 1');
    res.writeHead(200);
    res.end('This is server 1');
}).listen(8001);

var server2 = http.createServer(function (req, res) {
    console.log('server 2');
    res.writeHead(200);
    res.end('This is server 2');
}).listen(8002);

var server3 = http.createServer(function (req, res) {
    console.log('server 3');
    res.writeHead(200);
    res.end('This is server 3');
}).listen(8003);

var ha = NodeHA();

ha.createServer(options);
ha.listen(8000);


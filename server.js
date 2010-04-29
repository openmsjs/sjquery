var sys = require('sys'),
    http = require('http');

var parseUrl = require('url').parse;

http.createServer( function (request, response) {
    response.writeHead(200, {'Content-Type': 'text/plain'});
    response.write(JSON.stringify(parseUrl(request.url)) +'\n');
    response.end('Hello World\n');
}).listen(8000);

sys.puts('node-jquery server running at http://127.0.0.1:8000/');

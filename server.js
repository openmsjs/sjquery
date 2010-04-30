var sys = require('sys'),
    http = require('http');

var parseUrl = require('url').parse;
require.paths.unshift("./lib");

var sjquery = require("sjquery");
http.createServer( function (request, response) {

    var pathname = parseUrl(request.url).pathname;
    var lib = pathname.substring(1);

    var stream = sjquery.run(pathname, response);

    response.end('\n');
}).listen(8000);

sys.puts('sjquery server running at http://127.0.0.1:8000/');

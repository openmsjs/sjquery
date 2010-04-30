var fs = require('fs'),
    sys = require("sys"),
    Script = process.binding('evals').Script;

var doc = require("./document");
var jquery = require("./jquery/server");

var extend = function(scope){
    var fn = function(){};
    fn.prototype = scope;
    return new fn();
};


exports.run = function(app, response){
    var scope = doc.fillScope({});
    var newScope = jquery.runInScope(scope);

    var fileName = "./lib/demo/test.js";
    var scriptSource = fs.readFileSync(fileName, encoding='utf8')

    var script = new Script(scriptSource, fileName);
    script.runInNewContext(scope);

    response.writeHead(200, {
        'Content-Type': 'text/html',
    });

    doc.render(response, scope.document);
}

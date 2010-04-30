var fs = require('fs'),
    sys = require("sys"),
    Script = process.binding('evals').Script;

var doc = require("./document");
exports.run = function(app, response){
    var scope = {
        document : doc.makeDocument(),
        jquery : {}
    };

    var fileName = "./lib/demo/test.js";
    var scriptSource = fs.readFileSync(fileName, encoding='utf8')

    var script = new Script(scriptSource, fileName);
    script.runInNewContext(scope);

    response.writeHead(200, {
        'Content-Type': 'text/html',
    });

    doc.render(response, scope.document);
}

var fs = require('fs'),
    sys = require("sys"),
    Script = process.binding('evals').Script,
    fileName = "./lib/jquery/index.js",
    scriptSource = fs.readFileSync(fileName, encoding='utf8'),
    jqScript = new Script(scriptSource, fileName);

exports.runInScope = function(scope){
    jqScript.runInNewContext(scope);
    return scope;
}

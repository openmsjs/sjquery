var fs = require('fs'),
    sys = require("sys"),
    Script = process.binding('evals').Script,
    fileName = "./lib/jquery/index.js",
    scriptSource = fs.readFileSync(fileName, encoding='utf8'),
    jqScript = new Script(scriptSource, fileName);

var extend = function(scope){
    var fn = function(){};
    fn.prototype = scope;
    return new fn();
};

exports.xxx = function(scope){
    jqScript.runInNewContext(scope);//extend(scope));
    return scope.jquery;
}

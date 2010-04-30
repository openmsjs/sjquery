var fs = require('fs'),
    sys = require("sys"),
    Script = process.binding('evals').Script,
    fileName = "./lib/jquery/index.js",
    scriptSource = fs.readFileSync(fileName, encoding='utf8'),
    jqScript = new Script(scriptSource, fileName);

sys.puts(scriptSource);

var extend = function(scope){
    var fn = function(){};
    fn.prototype = scope;
    return new fn();
};

exports.xxx = function(scope){
    sys.puts('before');
    jqScript.runInNewContext(scope);//extend(scope));
    sys.puts('after');
    return scope.jquery;
}

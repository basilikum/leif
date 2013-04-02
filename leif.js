var repo = require("./leif.repositories.js");
var parser = require("./leif.parse.js");
var interpreter = require("./leif.interpret.js");

module.exports.parseTemplate = parser.parseTemplate;
module.exports.produceHTML = interpreter.produceHTML;
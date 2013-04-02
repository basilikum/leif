var repo = require("./leif.repositories.js");
var parser = require("./leif.parse.js");
var interpreter = require("./leif.interpret.js");

var fs = require("fs");

var context = {
	my: "huhu",
	name: "bastian"
};

var leif = {
	
};

fs.readFile("C:\\Users\\Bastian\\dev\\node\\mvc\\Views\\intro.nhtml", function(error, data) {
	if (error) {
		
	} else {
		var arr = parser.parseTemplate(data.toString());

		console.log(arr);

		var html = interpreter.produceHTML(arr, context);
		
		console.log(html);
	}
});	
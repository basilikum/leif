
var repo = require("./leif.repositories.js");
var bench = require("C:/Users/Bastian/dev/javascript/benchmarks/js/benchmarks.js");

var stringLiteralInHTMLExp = /=("f:(?:[^"\\]|\\.)*"|'f:(?:[^'\\]|\\.)*')/g,
	stringLiteralExp = /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g,
	identifierExp = /^[a-zA-Z_$][0-9a-zA-Z_$.]*/,
	xmlElementExp = /(<[^\/>]*(>|\/>)|<\/[a-zA-Z0-9 ]*>)/g;

var getFunction = function (name) {

	if (typeof repo.controlRepo[name] === "function") {
		return {
			type: "control",
			func: repo.controlRepo[name]
		};
	} else {
		var idents = name.split("."),
			func1 = repo.funcRepo,
			func2 = repo.ifuncRepo;

		for (var i = 0, max_i = idents.length; i < max_i; i++) {
			if (func1) func1 = func1[idents[i]];
			if (func2) func2 = func2[idents[i]];
		}

		if (typeof func1 === "function") {
			return {
				type: "function",
				func: func1
			};
		} else if (typeof func2 === "function") {
			return {
				type: "inline",
				func: func2
			};
		} else {
			return {
				type: "unknown",
				func: null
			};
		}
	}
};


var parseArgument = function (text) {
	text = text.trim();

	var ch1 = text.charAt(0),
		ch2 = text.charAt(text.length - 1);

	if (ch1 === "\"" && ch2 === "\"") {
		var ind = Number(text.substring(1, text.length - 1));
		var ori = parseStorage[ind];
		return {
			type: "text",
			value: ori.substring(1, ori.length - 1),
			evaluate: true
		};
	} else if (text.indexOf("f:") === 0) {
		var funcResult = parseFunction(text.substring(2));
		if (funcResult.type === "function") {
			//error: not inline function
		} else {
			funcResult.value = funcResult.value[0];
			return funcResult;
		}
		
	} else {
		return {
			type: "variable",
			value: {
				type: "variable",
				value: text,
				up: 0
			},
			evaluate: false
		};
	}
};

var parseFunction = function (text) {
	text = text.trim();

	var remainingText = "";

	var matchIdentifier = text.match(identifierExp);


	if (matchIdentifier && matchIdentifier.length > 0) {
		var name = matchIdentifier[0],
			funcResult = getFunction(name);


		if (funcResult.type !== "unknown") {

			var	remain = text.substring(name.length).trim();

			var argsOpenIndex = remain.indexOf("("),
				argsCloseIndex = (function(){
					var arr = [];
					var count = 0;
					var expr = /([(]|[)])/g;
					while ((arr = expr.exec(remain)) !== null) {
						if (arr[0] === "(") {
							count++;
						} else {
							count--;
						}
						if (count === 0) {
							return arr.index;
						}
					}
					return 0;
				}());


			if (argsOpenIndex === 0 && argsCloseIndex > 0) {
				var argsString = remain.substring(argsOpenIndex + 1, argsCloseIndex),
					args = argsString.split(","),
					evaluate = true;

				for (var i = 0, max_i = args.length; i < max_i; i++) {
					var argsResult = parseArgument(args[i]);
					args[i] = argsResult.value;
					evaluate = evaluate && argsResult.evaluate;
				}

				if (funcResult.type === "inline") {

					if (evaluate) {
						return {
							type: "text",
							value: [funcResult.func(args)],
							remain: remain.substring(argsCloseIndex + 1),
							evaluate: true
						};
					} else {
						return {
							type: "inline",
							value: [{
								"type": "inline",
								"func": funcResult.func,
								"args": args
							}],
							remain: remain.substring(argsCloseIndex + 1),
							evaluate: false
						};
					}	
				} else if (funcResult.type === "function") {
					var body = remain.substring(argsCloseIndex + 1).trim(),
						bodyOpenIndex = body.indexOf("{"),
						bodyCloseIndex = (function(){
							var arr = [];
							var count = 0;
							var expr = /([{]|[}])/g;
							while ((arr = expr.exec(body)) !== null) {
								if (arr[0] === "{") {
									count++;
								} else {
									count--;
								}
								if (count === 0) {
									return arr.index;
								}
							}
							return 0;
						}());

					if (bodyOpenIndex === 0 && bodyCloseIndex > 0) {
						var innerBody = body.substring(bodyOpenIndex + 1, bodyCloseIndex);
						var blockResult = parseBlock(innerBody);
						
						if (evaluate) {
							var rslt = [];
							var funcHTML = funcResult.func(args).split("<<body>>");
							for (var k = 0, max_k = funcHTML.length; k < max_k; k++) {
								var part = funcHTML[k];
								rslt.push(part);
								if (k < max_k - 1) rslt = rslt.concat(blockResult);
							}
							rslt = compressArray(rslt);
							return {
								type: "function",
								value: rslt,
								remain: body.substring(bodyCloseIndex + 1),
								evaluate: rslt.length === 1
							};

						} else {
							return {
								type: "function",
								value: [{
									"type": "func",
									"func": funcResult.func,
									"args": args,
									"body": blockResult
								}],
								remain: body.substring(bodyCloseIndex + 1),
								evaluate: false
							};
						}

					} else {
						//error: missing body
						return {
							type: "error",
							value: ["MISSING BODY"],
							remain: body.substring(bodyCloseIndex + 1),
							evaluate: true
						};
					}
				}

			} else {
				//error: invalid arguments
				return {
					type: "error",
					value: ["invalid arguments"],
					remain: "",
					evaluate: true
				};
			}
			

		} else {
			//error: unknown function
			return {
				type: "error",
				value: ["unknown function"],
				remain: "",
				evaluate: true
			};
		}
	} else {
		//error: no valid function name
		return {
			type: "error",
			value: ["no valid function name"],
			remain: "",
			evaluate: true
		};
	}

};


var compressArray = function (arr) {
	var rslt = [],
		obj = true;
	for (var i = 0, max_i = arr.length; i < max_i; i++) {
		var part = arr[i];
		if (typeof part === "string") {
			if (obj) {
				rslt.push(part);
			} else {
				rslt[rslt.length - 1] += part;
			}
			obj = false;
		} else {
			rslt.push(part);
			obj = true;
		}
	}
	return rslt;	
};


var parseHTMLElement = function (text) {
	text = text.trim();

	var index = 0,
		storage = [];

	text = text.replace(stringLiteralInHTMLExp, function ($0, $1) {
		var funcText = $0.substring(4, $0.length - 1);
		var funcResult = parseFunction(funcText);
		if (funcResult.type === "function") {
			//error: not inline function
		} else {
			if (funcResult.evaluate) {
				return "=\"" + funcResult.value[0] + "\"";
			} else {
				storage[index] = funcResult.value[0];
				return "=\"<>@" + (index++) + "<>\"";
			}
		}
	});	

	var parts = text.split("<>");
	for (var i = 0, max_i = parts.length; i < max_i; i++) {
		var part = parts[i];

		if (part.indexOf("@") === 0) {
			var ind = Number(part.substring(1));
			parts[i] = storage[ind];
		}
	}

	return {
		type: "html",
		value: parts,
		evaluate: parts.length === 1
	};
};


var parseBlock = function (text) {

	text = text.trim();

	var arr,
		remain = text,
		lastIndex = 0,
		rslt = [];

	while ((match = remain.match(/(^|\s)f:/)) !== null && match.length > 0) {
		var m = remain.substring(match.index);

		if (remain.indexOf(m) + m.indexOf("f:") > 0) {
			rslt = rslt.concat(unescapeString(remain.substring(0, remain.indexOf(m) + m.indexOf("f:"))));
		}
		var funcString = m.substring(m.indexOf("f:") + 2);
		var funcResult = parseFunction(funcString);
		rslt = rslt.concat(funcResult.value);
		remain = funcResult.remain;
	}

	rslt = rslt.concat(unescapeString(remain));	

	return compressArray(rslt);
};

var unescapeString = function (text) {

	text = text.replace(/"[0-9]+"/g, function ($0, $1) {
		var ind = Number($0.substring(1, $0.length - 1));
		return parseStorage[ind];
	});

	text = text.replace(/<[0-9]+>/g, function ($0, $1) {
		var ind = Number($0.substring(1, $0.length - 1));
		return parseStorage[ind];
	});

	var parts = text.split("<>");
	for (var i = 0, max_i = parts.length; i < max_i; i++) {
		var part = parts[i];

		if (part.indexOf("@") === 0) {
			var ind = Number(part.substring(1));
			parts[i] = parseStorage[ind];
		}
	}

	return parts;
};

var parseIndex = 0,
	parseStorage = [];

var parseTemplate = function (text) {
	text = text.trim();

	parseIndex = 0;
	parseStorage = [];

	text = text.replace(xmlElementExp, function ($0, $1) {
		var htmlResult = parseHTMLElement($0);
		var rslt = "";
		for (var i = 0, max_i = htmlResult.value.length; i < max_i; i++) {
			parseStorage[parseIndex] = htmlResult.value[i];
			if (typeof htmlResult.value[i] === "string") {
				rslt += "<" + (parseIndex++) + ">";
			} else {
				rslt += "<>@" + (parseIndex++) + "<>";
			}
		}
		return rslt;
	});

	text = text.replace(stringLiteralExp, function ($0, $1) {
		parseStorage[parseIndex] = $0;
		return "\"" + (parseIndex++) + "\"";
	});	

	var blockResult = parseBlock(text);

	return blockResult;	
};

module.exports.parseTemplate = parseTemplate;





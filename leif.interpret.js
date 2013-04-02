var fs = require("fs");



var enhanceObject = function(obj, parent, grand) {
	var res = Array.isArray(obj) ? [] : {};
	if (typeof obj === "object") {
		for (var i in obj) {
			if (obj.hasOwnProperty(i)) {
				res[i] = enhanceObject(obj[i], res, parent);
			}
		}
		res.parent = Array.isArray(parent) ? grand : parent;
	} else {
		res.value = obj;
		res.type = "enhanced";
		res.parent = Array.isArray(parent) ? grand : parent;
	}
	return res;
};

var iterpretEquation = function(equation, context) {
	var equ = equation.replace("@","context");

};

var parseVariable = function(obj, context) {
	var value = obj.value,
		up = obj.up || 0,
		res;
	if (typeof value !== "undefined") {

		while (up > 0) {
			context = context.parent;
			up--;
		}

		if (value === ".") {
			return context.toString();
		} else if (typeof (res = context[value]) !== "undefined") {
			if (res.type === "enhanced") {
				return res.value.toString();
			} else {
				return res.toString();
			}
		} else {
			return null;
		}
	} else {
		return null;
	}
};

var parseFunction = function(obj, context) {
	var func = obj.func,
		args = obj.args;
	if (typeof func === "function") {
		args = parseArray(args, context);
		var res = func(args);
		var body = obj.body;
		if (typeof body === "object") {
			var parseBody = parseArray(body, context);
			res = res.replace("<<body>>", parseBody);
		}
		return res;
	} else {
		return "<<function not defined>>";
	}
};

var parseInline = function(obj, context) {
	var func = obj.func,
		args = obj.args;
	if (typeof func === "function") {
		args = parseArray(args, context);
		var res = func(args);
		return res;
	} else {
		return "<<function not defined>>";
	}
};


var parseForEach = function(obj, context) {
	var item = obj.item,
		up = obj.up || 0,
		res;

	if (typeof item !== "undefined") {

		while (up > 0) {
			context = context.parent;
			up--;
		}

		if (typeof (res = context[item]) !== "undefined") {
			var out = [];
			for (var i = 0, max_i = res.length; i < max_i; i++) {
				out.push(parseArray(obj.body, res[i]).join(""));
			}
			return out.join("");
		} else {
			return null;
		}
	} else {
		return null;
	}
};

var parseObject = {
	variable: parseVariable,
	func: parseFunction,
	inline: parseInline,
	foreach: parseForEach
};

var parseArray = function(arr, context) {
	var res = [];
	for (var i = 0, max_i = arr.length; i < max_i; i++) {
		var obj = arr[i];
		if (typeof obj === "string") {
			res.push(obj);
		} else {
			var type = obj.type;
			if (typeof type !== "undefined") {
				var func = parseObject[type];
				if (typeof func === "function") {
					res.push(parseObject[type](obj, context));
				} else {
					return "<<type not defined>>";
				}
			} else {
				return "<<type undefined>>";
			}
		}
	}
	return res;
};

var produceHTML = function(arr, context) {
	var res = parseArray(arr, enhanceObject(context)).join("");
	return res;
};

module.exports.produceHTML = produceHTML;

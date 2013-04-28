module.exports = (function (that) {

	var helper = require("./leif.helper.js");
	var functionRepository = require("./leif.repo.js");
	var leifEval = require("./leif.eval.js");
	var fullFunctionRepository = functionRepository;

	that.setUserRepository = function (repo) {
		fullFunctionRepository = helper.deepMergeObjects(functionRepository, repo);
	};

	that.showInlineParsingErrors = true;

	var interpretFunctionArguments = function (args, context, vmcontext) {
		var evaluatedArgs = [],
			arg,
			evalResult,
			i, max_i;

		for (i = 0, max_i = args.length; i < max_i; i++) {
			arg = args[i];
			if (typeof arg === "object" && arg.type === "eval") {
				evaluatedArgs.push(tryEvaluate(arg.content, context, vmcontext).result);
			} else {
				evaluatedArgs.push(arg);
			}
		}

		return evaluatedArgs;
	};

	var interpretErrorMessage = function (error) {
		if (that.showInlineParsingErrors) {
			return "(" + error.message + " -->)";
		} else {
			return "";
		}
	};


	var interpretFunction = function (obj, context, vmcontext) {
		var args,
			funcResult,
			body;

		args = interpretFunctionArguments(obj.args, context, vmcontext);
		body = interpretArray(obj.body, context, vmcontext).join("");
		funcResult = obj.func.apply(this, args).replace("<<body>>", body);
		return funcResult;
	};

	var interpretEvalStatement = function (obj, context, vmcontext) {

		var evalResult = tryEvaluate(obj.content, context, vmcontext);
		return evalResult.evaluated ? evalResult.result : "";
	};

	var interpretIfStatement = function (obj, context, vmcontext) {
		var evalResult;

		evalResult = tryEvaluate(obj.condition, context, vmcontext);
		if (evalResult.evaluated && evalResult.result) {
			return interpretArray(obj.body, context, vmcontext).join("");
		} else {
			return "";
		}
	};


	var interpretForeachStatement = function (obj, context, vmcontext) {
		var evalResult, key, subKey, item, subItem,
			resultArray = [],
			newContext;

		evalResult = tryEvaluate(obj.value, context, vmcontext);
		if (evalResult.evaluated) {
			for (key in evalResult.result) {
				if (evalResult.result.hasOwnProperty(key)) {
					newContext = {};
					item = evalResult.result[key];
					if (typeof item === "object") {
						for (subKey in item) {
							if (item.hasOwnProperty(subKey)) {
								newContext[subKey] = item[subKey];
							}
						}
					}
					newContext.$this = item;
					newContext.$p = context;
					resultArray = resultArray.concat(interpretArray(obj.body, newContext, leifEval.createContext(helper.mergeObjects(newContext, fullFunctionRepository))));
				}
			}
			return resultArray.join("");
		} else {
			return "";
		}
	};

	var tryEvaluate = function (content, context, vmcontext) {
		var evalResult;

		try
		{
			evalResult = vmcontext.evaluate(content);
			return {
				evaluated: true,
				result: evalResult
			};
		}
		catch (e)
		{
			return {
				evaluated: false,
				result: null
			};
		}
	};

	var interpreter = {
		"eval": interpretEvalStatement,
		"func": interpretFunction,
		"foreach": interpretForeachStatement,
		"if":  interpretIfStatement
	};

	var interpretArray = function (arr, context, vmcontext) {
		var result = [],
			obj, i, max_i;

		for (i = 0, max_i = arr.length; i < max_i; i++) {
			obj = arr[i];
			if (typeof obj === "string") {
				result.push(obj);
			} else if (obj instanceof Error) {
				result.push(interpretErrorMessage(obj));
			} else {
				result.push(interpreter[obj.type](obj, context, vmcontext));
			}
		}
		return result;
	};


	that.produceHTML = function (arr, context) {
		context = context || {};
		context.$this = context;
		var res = interpretArray(arr, context, leifEval.createContext(helper.mergeObjects(context, fullFunctionRepository))).join("");
		return res;
	};

	return that;

}({}));




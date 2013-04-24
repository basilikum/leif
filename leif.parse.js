module.exports = (function (that) {

	var helper = require("./leif.helper.js");
	var functionRepository = require("./leif.repo.js");
	var leifEval = require("./leif.eval.js");

	var functionalExp = /\$:/;
	var bodyStartExp = /^\s*\{/;
	var functionEndExp = /^\s*;/;
	var validIdentifierExp = /^([a-zA-Z_$][0-9a-zA-Z_$.]*)?$/;

	var context = leifEval.createContext(functionRepository);
	var fullFunctionRepository = functionRepository;

	that.setUserRepository = function (repo) {
		fullFunctionRepository = helper.deepMergeObjects(functionRepository, repo);
		context = leifEval.createContext(fullFunctionRepository);
	};

	var tryEvaluate = function (content) {
		var evalResult;
		try
		{
			evalResult = context.evaluate(content);
			return {
				evaluated: true,
				result: evalResult
			};
		}
		catch (e)
		{
			return {
				evaluated: false,
				result: {
					type: "eval",
					content: content
				}
			};
		}
	};


	var parseIfStatement = function (condition, body) {
		var evalResult;

		evalResult = tryEvaluate(condition);
		if (evalResult.evaluated) {
			if (evalResult.result) {
				return parseCodeBlock(body);
			} else {
				return [];
			}
		} else {
			return {
				type: "if",
				condition: condition,
				body: parseCodeBlock(body)
			};
		}
	};

	var parseForeachStatement = function (value, body) {
		var parsedBody;

		parsedBody = parseCodeBlock(body);

		return {
			type: "foreach",
			value: value,
			body: parsedBody
		};
		
	};

	var parseFunctionArguments = function (args) {
		var evaluatedArgs = [],
			splittedArgs,
			canBeEvaluated = true,
			evalResult,
			i, max_i;

		splittedArgs = helper.split(args, ",");
		for (i = 0, max_i = splittedArgs.length; i < max_i; i++) {
			evalResult = tryEvaluate(splittedArgs[i]);
			canBeEvaluated = canBeEvaluated && evalResult.evaluated;
			evaluatedArgs.push(evalResult.result);
		}

		return {
			evaluated: canBeEvaluated,
			args: evaluatedArgs
		};
	};

	var parseEvalStatement = function (content) {
		return tryEvaluate(content).result;
	};


	var parseFunction = function (func, args, body) {
		var evaluatedArgs,
			parsedBody,
			funcResult,
			funcResultArray;

		parsedBody = parseCodeBlock(body);
		evaluatedArgs = parseFunctionArguments(args);
		if (evaluatedArgs.evaluated) {
			funcResult = func.apply(this, evaluatedArgs.args).toString();
			funcResultArray = funcResult.split("<<body>>");
			return helper.insertArrayInAnother(parsedBody, funcResultArray);
		} else {
			return {
				type: "func",
				func: func,
				args: evaluatedArgs.args,
				body: parsedBody
			};
		}
	};

	var parseTextFunction = function (func, args) {
		var evaluatedArgs,
			funcResult,
			funcResultArray;

		evaluatedArgs = parseFunctionArguments(args);
		if (evaluatedArgs.evaluated) {
			return func.apply(this, evaluatedArgs.args);
		} else {
			return {
				type: "text",
				func: func,
				args: evaluatedArgs.args
			};
		}
	};

	var getFunctionByName = function (nameOfFunction) {
		var parts, key, func;

		func = fullFunctionRepository;
		parts = nameOfFunction.split(".");
		for (key in parts) {
			if (parts.hasOwnProperty(key)) {
				if (typeof func !== "object") {
					return null;
				}
				func = func[parts[key]];
			}
		}
		return func;
	};

	var parseStatement = function (nameOfFunction, args, body) {
		var func;

		if (nameOfFunction === "") {
			return parseEvalStatement(args);
		} else if (nameOfFunction === "if") {
			return parseIfStatement(args, body);
		} else if (nameOfFunction === "foreach") {
			return parseForeachStatement(args, body);
		} else {
			func = getFunctionByName(nameOfFunction);
			if (typeof func === "function") {
				return parseFunction(func, args, body);
			} else {
				return new Error("could not find function with name " + nameOfFunction);
			}
		}
	};


	var parseCodeBlock = function (htmlString) {
		var matches, match, matchIndex, afterMatch, beforeMatch,
			openingParenthesesIndex,
			closingParenthesesIndex,
			openingBracketIndex,
			closingBracketIndex,
			nameOfFunction, args, body,
			parseFunctionResult,
			resultArray = [],
			i, max_i;

		while ((matches = htmlString.match(functionalExp)) !== null) {
			matchIndex = matches.index;
			beforeMatch = htmlString.substring(0, matchIndex);
			match = htmlString.substring(matchIndex);
			openingParenthesesIndex = match.indexOf("(");
			closingParenthesesIndex = helper.findClosingIndex(match, ["(", ")"], openingParenthesesIndex);

			if (beforeMatch.length > 0) {
				resultArray.push(beforeMatch);
			}

			nameOfFunction = match.substring(2, openingParenthesesIndex);

			if (validIdentifierExp.test(nameOfFunction)) {

				if (closingParenthesesIndex > 0) {
					args = match.substring(openingParenthesesIndex + 1, closingParenthesesIndex).trim();
					afterMatch = match.substring(closingParenthesesIndex + 1);
					
					if (bodyStartExp.test(afterMatch)) {
						openingBracketIndex = afterMatch.indexOf("{");
						closingBracketIndex = helper.findClosingIndex(afterMatch, ["{", "}"], openingBracketIndex);
						if (closingBracketIndex > 0) {
							body = afterMatch.substring(openingBracketIndex + 1, closingBracketIndex);
							htmlString = afterMatch.substring(closingBracketIndex + 1);
						} else {
							body = "";
							htmlString = afterMatch;
						}

					} else if (functionEndExp.test(afterMatch)) {
						body = "";
						htmlString = afterMatch.substring(afterMatch.indexOf(";") + 1);
					} else {
						body = "";
						htmlString = afterMatch;
					}
					parseFunctionResult = parseStatement(nameOfFunction, args, body);
					if (parseFunctionResult instanceof Error) {
						resultArray.push({
							type: "error",
							text: match.substring(0, 2),
							message: parseFunctionResult.message
							
						});
						htmlString = match.substring(2);
					} else if (Array.isArray(parseFunctionResult)) {
						resultArray = resultArray.concat(parseFunctionResult);
					} else {
						resultArray.push(parseFunctionResult);
					}
				} else {
					resultArray.push({
						type: "error",
						text: match.substring(0, 2),
						message: "no closing parentheses found"
						
					});
					htmlString = match.substring(2);
				}
			} else {
				resultArray.push({
					type: "error",
					text: match.substring(0, 2),
					message: "not a valid expression"
					
				});
				htmlString = match.substring(2);
			}
		
		}

		if (htmlString.length > 0) {
			resultArray.push(htmlString);
		}

		return helper.compressArray(resultArray);
	};

	that.parse = function (text) {
		return parseCodeBlock(text);
	};
	return that;
}({}));


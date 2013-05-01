module.exports = (function (that) {

	var helper = require("./leif.helper.js");
	var functionRepository = require("./leif.repo.js");
	var leifEval = require("./leif.eval.js");

	var functionalExp = /\$:/;
	var bodyStartExp = /^\s*\{/;
	var functionEndExp = /^\s*;/;
	var validIdentifierExp = /^([a-zA-Z_$][0-9a-zA-Z_$.]*)?$/;
	var identifierExp = /^([a-zA-Z_$][0-9a-zA-Z_$.]*)?(\(|\{|\s|$)/;

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

		if (condition === null) {
			return new Error("missing argument(s) in if/else statement");
		}	

		evalResult = tryEvaluate(condition);
		if (evalResult.evaluated && condition.indexOf("typeof ") === -1) {
			if (evalResult.result) {
				return {
					evaluated: true,
					result: parseCodeBlock(body)
				};
			} else {
				return {
					evaluated: false,
					result: []
				};
			}
		} else {
			return {
				evaluated: undefined,
				result: {
					type: "if",
					condition: condition,
					body: parseCodeBlock(body)
				}
			};			
		}
	};

	var parseElseStatement = function (body) {
		return parseCodeBlock(body);
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
		if (content === null) {
			return new Error("not a valid expression");
		} else {
			return tryEvaluate(content).result;
		}		
	};


	var parseFunction = function (func, args, body) {
		var evaluatedArgs,
			parsedBody,
			funcResult,
			funcResultArray;

		if (args === null) {
			return new Error("missing argument in function call");
		}

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


	var parseIfElseMultiConstruct = function (statementArray) {
		var i, max_i,
			name,
			evaluated = true,
			resultArray = [],
			parseFunctionResult,
			statement;

		for (i = 0, max_i = statementArray.length; i < max_i; i++) {
			statement = statementArray[i];
			name = statement.name;
			if (name === "if" || name === "elseif") {
				parseFunctionResult = parseIfStatement(statement.args, statement.body);
				if (parseFunctionResult instanceof Error) {
					return parseFunctionResult;
				} if (parseFunctionResult.evaluated === true) {
					if (evaluated === true) {
						return parseFunctionResult.result;
					} else {
						resultArray.push(parseFunctionResult.result);
						break;
					}
				} else if (parseFunctionResult.evaluated === false) {

				} else {
					evaluated = false;
					resultArray.push(parseFunctionResult.result);
				}
			} else {
				if (evaluated === true) {
					return parseElseStatement(statement.body);
				} else {
					resultArray.push(parseElseStatement(statement.body));
				}
			}
		}

		if (evaluated === true) {
			return [];
		} else {
			return {
				type: "if",
				blocks: resultArray
			};
		}

	};


	var multiConstructs = {
		"if" : /^if(,elseif)*(,else)?$/
	};

	var parseConstruct = function (htmltext) {
		var text,
			closingParenthesesIndex,
			openingBracketIndex,
			closingBracketIndex,
			nameOfFunction, args = "", body = "",
			identifierResult,
			expressionText,
			identifierMatch;

		text = htmltext.substring(2);
		identifierResult = text.match(identifierExp);
		if (identifierResult && identifierResult.length > 0) {
			identifierMatch = identifierResult[0];
			nameOfFunction = identifierMatch.substring(0, identifierMatch.length - 1);
			text = text.substring(identifierMatch.length - 1);
			if (text.indexOf("(") === 0) {
				closingParenthesesIndex = helper.findClosingIndex(text, ["(", ")"], 0);
				if (closingParenthesesIndex > 0) {
					args = text.substring(1, closingParenthesesIndex).trim();
					text = text.substring(closingParenthesesIndex + 1);
				} else {
					return {
						expression: new Error("no closing parentheses found"),
						remains: htmltext
					};
				}			
			} else {
				args = null;
			}
			if (bodyStartExp.test(text)) {
				openingBracketIndex = text.indexOf("{");
				closingBracketIndex = helper.findClosingIndex(text, ["{", "}"], openingBracketIndex);
				if (closingBracketIndex > 0) {
					body = text.substring(openingBracketIndex + 1, closingBracketIndex);
					text = text.substring(closingBracketIndex + 1);
				}
			} else if (functionEndExp.test(text)) {
				body = "";
				text = text.substring(text.indexOf(";") + 1);
			}


			return {
				expression: {
					name: nameOfFunction,
					body: body,
					args: args,
					text: htmltext.substring(0, htmltext.length - text.length)
				},
				remains: text
			};
		} else {
			return {
				expression: new Error("not a valid expression"),
				remains: htmltext
			};
		}
	};


	var parseCodeBlock = function (htmlString) {
		var matches, match, matchIndex, afterMatch, beforeMatch,
			contructResult,
			i, max_i,
			resultArray = [],
			resultItem;

		while ((matches = htmlString.match(functionalExp)) !== null) {
			matchIndex = matches.index;
			beforeMatch = htmlString.substring(0, matchIndex);
			match = htmlString.substring(matchIndex);
		
			if (beforeMatch.length > 0) {
				resultArray.push(beforeMatch);
			}

			contructResult = parseConstruct(match);
			resultArray.push(contructResult.expression);
			if (contructResult.expression instanceof Error) {
				resultArray.push(match.substring(0, 2));
				htmlString = match.substring(2);
			} else {
				htmlString = contructResult.remains;
			}
		}
		if (htmlString.length > 0) {
			resultArray.push(htmlString);
		}
		//console.log(resultArray);
		//console.log(findMultiConstructs(helper.compressArray(resultArray)));
		//console.log(preEvaluate(findMultiConstructs(helper.compressArray(resultArray))));
		return preEvaluate(findMultiConstructs(helper.compressArray(resultArray)));
	};


	var findMultiConstructs = function (resultArray) {
		var newResult = [],
			resultItem,
			i, max_i,
			multiRegex, multiName, multiId, multiArray = [], multiTextArray = [],
			tempWhiteSpaces = "",
			finishMultiConstruct;

		finishMultiConstruct = function () {
			newResult.push({
				type: "multi",
				name: multiId,
				multi: multiArray,
				text: multiTextArray.join("").trim()
			});
			multiArray = [];
			multiTextArray = [];
			if (tempWhiteSpaces.length > 0) {
				newResult.push(tempWhiteSpaces);
				tempWhiteSpaces = "";
			}
		};

		for (i = 0, max_i = resultArray.length; i < max_i; i++) {
			resultItem = resultArray[i];
			if (typeof resultItem === "object" && !(resultItem instanceof Error)) {
				if (multiConstructs[resultItem.name] !== undefined) {
					if (multiArray.length > 0) {
						finishMultiConstruct();
					}	
					multiRegex = multiConstructs[resultItem.name];
					multiName = resultItem.name;
					multiId = resultItem.name;
					multiArray = [resultItem];
					multiTextArray = [resultItem.text];
				} else if (multiArray.length > 0) {
					if (multiRegex.test(multiName + "," + resultItem.name)) {
						multiName = multiName + "," + resultItem.name;
						multiArray.push(resultItem);
						multiTextArray.push(resultItem.text);
						tempWhiteSpaces = "";
					} else {
						finishMultiConstruct();
						newResult.push(resultItem);
					}
				} else {
					newResult.push(resultItem);
				}
			} else if (resultItem instanceof Error) {
				if (multiArray.length > 0) {
					finishMultiConstruct();
				}
				newResult.push(resultItem);
			} else {
				if (multiArray.length > 0) {
					if (resultItem.trim().length === 0) {
						tempWhiteSpaces = resultItem;
						multiTextArray.push(resultItem);
					} else {
						finishMultiConstruct();
						newResult.push(resultItem);
					}
				} else {
					newResult.push(resultItem);
				}
			}
		}
		if (multiArray.length > 0) {
			finishMultiConstruct();
		}	
		return  newResult;
	};

	var preEvaluate = function (resultArray) {
		var newResult = [],
			i, max_i,
			parseFunctionResult,
			parseMultiResult,
			resultItem;

		for (i = 0, max_i = resultArray.length; i < max_i; i++) {
			resultItem = resultArray[i];
			if (typeof resultItem === "object" && !(resultItem instanceof Error)) {
				if (resultItem.type === "multi") {
					if (resultItem.name === "if") {
						parseMultiResult = parseIfElseMultiConstruct(resultItem.multi);
						if (parseMultiResult instanceof Error) {
							newResult.push(parseMultiResult);
							newResult.push(resultItem.text);
						} else if (Array.isArray(parseMultiResult)) {
							newResult = newResult.concat(parseMultiResult);
						} else {
							newResult.push(parseMultiResult);
						}
					}
				} else {
					parseFunctionResult = parseStatement(resultItem.name, resultItem.args, resultItem.body);
					if (parseFunctionResult instanceof Error) {
						newResult.push(parseFunctionResult);
						newResult.push(resultItem.text);
					} else if (Array.isArray(parseFunctionResult)) {
						newResult = newResult.concat(parseFunctionResult);
					} else {
						newResult.push(parseFunctionResult);
					}
				}
			} else {
				newResult.push(resultItem);
			}
		}
		return  helper.compressArray(newResult);
	};

	that.parse = function (text) {
		return parseCodeBlock(text);
	};
	return that;
}({}));


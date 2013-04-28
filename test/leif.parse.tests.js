var assert = require("assert"),
	parser = require("../leif.parse.js");

var testFunction = function (arg) {
	return arg + "<<body>>" + arg;
};

suite("when parsing", function () {
	before(function () {
		parser.setUserRepository({
			test: testFunction
		});
	});
	suite("valid statements", function () {
		suite("evaluation", function () {
			test("can directly evaluate", function () {
				var actual, expected; 

				actual = parser.parse("before$:('mid' + 'dle')after");
				expected = ["beforemiddleafter"];
				assert.deepEqual(actual, expected);
			});
			test("can create object of type 'eval' when not evaluable", function () {
				var actual, expected;

				actual = parser.parse("before$:('mid' + variableName)after");
				expected = ["before",{type:"eval",content:"'mid' + variableName"},"after"];
				assert.deepEqual(actual, expected);
			});	
		});
		suite("if statement", function () {
			test("can directly evaluate a true statement", function () {
				var actual, expected;

				actual = parser.parse("before$:if(true){middle}after");
				expected = ["beforemiddleafter"];
				assert.deepEqual(actual, expected);
			});
			test("can directly evaluate a false statement", function () {
				var actual, expected;

				actual = parser.parse("before$:if(false){middle}after");
				expected = ["beforeafter"];
				assert.deepEqual(actual, expected);
			});			
			test("can create object of type 'if' when not evaluable", function () {
				var actual, expected;

				actual = parser.parse("before$:if(variableName){middle}after");
				expected = ["before",{type:"if",condition:"variableName",body:["middle"]},"after"];
				assert.deepEqual(actual, expected);
			});	
			test("does not directly evaluate expression with typeof operator", function () {
				var actual, expected;

				actual = parser.parse("before$:if(typeof 'fg' === 'string'){middle}after");
				expected = ["before",{type:"if",condition:"typeof 'fg' === 'string'",body:["middle"]},"after"];
				assert.deepEqual(actual, expected);
			});					
		});
		suite("foreach statement", function () {
			test("creates object of type 'foreach' even if evaluable", function () {
				var actual, expected;

				actual = parser.parse("before$:foreach([1,2,3]){middle}after");
				expected = ["before",{type:"foreach",value:"[1,2,3]",body:["middle"]},"after"];
				assert.deepEqual(actual, expected);
			});
		});
		suite("function", function () {
			test("can directly evaluate", function () {
				var actual, expected;

				actual = parser.parse("before$:test('!')after");
				expected = ["before!!after"];
				assert.deepEqual(actual, expected);
			});
			test("can create object of type 'func' when not evaluable", function () {
				var actual, expected;

				actual = parser.parse("before$:test(variableName){middle}after");
				expected = ["before", {type: "func", func: testFunction, args: [{type:"eval", content:"variableName"}], body: ["middle"]},"after"];
				assert.deepEqual(actual, expected);
			});	
			test("can handle body with opening and closing curly brace", function () {
				var actual, expected;

				actual = parser.parse("before$:test('!'){middle}after");
				expected = ["before!middle!after"];
				assert.deepEqual(actual, expected);
			});					
			test("ignores body on missing closing curly brace", function () {
				var actual, expected;

				actual = parser.parse("before$:test('!'){middleafter");
				expected = ["before!!{middleafter"];
				assert.deepEqual(actual, expected);
			});					
			test("can handle semicolon and ignores body after that", function () {
				var actual, expected;

				actual = parser.parse("before$:test('!');{middle}after");
				expected = ["before!!{middle}after"];
				assert.deepEqual(actual, expected);
			});
		});
	});
	suite("non-valid statements", function () {
		test("can handle missing opening parentheses.", function () {
			var actual, expected;

			actual = parser.parse("before$:test");
			expected = ["before", new Error("not a valid expression"), "$:test"];
			assert.deepEqual(actual, expected);
		});
		test("can handle missing closing parentheses.", function () {
			var actual, expected;

			actual = parser.parse("before$:('mid' + 'dle'after");
			expected = ["before", new Error("no closing parentheses found") ,"$:('mid' + 'dle'after"];
			assert.deepEqual(actual, expected);
		});	
		test("can handle unknown function.", function () {
			var actual, expected;

			actual = parser.parse("before$:dgfj3t('mid', 'dle')after");
			expected = ["before", new Error("could not find function with name dgfj3t") ,"$:dgfj3t('mid', 'dle')after"];
			assert.deepEqual(actual, expected);
		});		
		test("can handle misplaced space in evaluation.", function () {
			var actual, expected;

			actual = parser.parse("before$: ('mid' + 'dle')after");
			expected = ["before", new Error("not a valid expression") ,"$: ('mid' + 'dle')after"];
			assert.deepEqual(actual, expected);
		});		
		test("can handle misplaced space in function.", function () {
			var actual, expected;

			actual = parser.parse("before$:test ('mid' + 'dle')after");
			expected = ["before", new Error("not a valid expression") ,"$:test ('mid' + 'dle')after"];
			assert.deepEqual(actual, expected);
		});					
	});	
});
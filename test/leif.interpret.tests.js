var assert, interpreter;

assert = require("assert");
interpreter = require("../leif.interpret.js");

var testFunction = function (arg) {
	return arg + "<<body>>" + arg;
};

var context = {
	item: "!",
	arr: [{val:"v1"},{val:"v2"},{val:"v3"}],
	arr2: ["v1","v2","v3"],
	obj: {v1: "v1", v2: "v2", v3: "v3"}
};

suite("When interpreting", function () {
	before(function () {
		interpreter.setUserRepository({
			test: testFunction
		});
	});
	suite("function statement", function () {
		test("can call function with arguments and body", function () {
			var actual, expected;

			actual = interpreter.produceHTML(["before", {type: "func", func: testFunction, args: [{type: "eval", content: "item"}], body: ["middle"]}, "after"], context);
			expected = "before!middle!after";
			assert.strictEqual(actual, expected);
		});	
		test("can handle unknown argument", function () {
			var actual, expected;

			actual = interpreter.produceHTML(["before", {type: "func", func: testFunction, args: [{type: "eval", content: "nothing"}], body: ["middle"]}, "after"], context);
			expected = "beforenullmiddlenullafter";
			assert.strictEqual(actual, expected);
		});			
	});
	suite("if statement", function () {
		test("can handle true statement", function () {
			var actual, expected;

			actual = interpreter.produceHTML(["before", {type: "if", condition: "item === '!'", body: ["middle"]}, "after"], context);
			expected = "beforemiddleafter";
			assert.strictEqual(actual, expected);
		});	
		test("can handle false statement", function () {
			var actual, expected;

			actual = interpreter.produceHTML(["before", {type: "if", condition: "item === '?'", body: ["middle"]}, "after"], context);
			expected = "beforeafter";
			assert.strictEqual(actual, expected);
		});	
		test("can handle not evaluable statement", function () {
			var actual, expected;

			actual = interpreter.produceHTML(["before", {type: "if", condition: "item ==!= '!'", body: ["middle"]}, "after"], context);
			expected = "beforeafter";
			assert.strictEqual(actual, expected);
		});	
	});
	suite("foreach statement", function () {
		test("can iterate over objects in array", function () {
			var actual, expected;

			actual = interpreter.produceHTML(["before", {type: "foreach", value: "arr", body: [{type: "eval", content: "val"}]}, "after"], context);
			expected = "beforev1v2v3after";
			assert.strictEqual(actual, expected);
		});	
		test("can iterate over strings in array", function () {
			var actual, expected;

			actual = interpreter.produceHTML(["before", {type: "foreach", value: "arr2", body: [{type: "eval", content: "$this"}]}, "after"], context);
			expected = "beforev1v2v3after";
			assert.strictEqual(actual, expected);
		});	
		test("can iterate over object items", function () {
			var actual, expected;

			actual = interpreter.produceHTML(["before", {type: "foreach", value: "obj", body: [{type: "eval", content: "$this"}]}, "after"], context);
			expected = "beforev1v2v3after";
			assert.strictEqual(actual, expected);
		});				
		test("can handle $p to access parent", function () {
			var actual, expected;

			actual = interpreter.produceHTML(["before", {type: "foreach", value: "arr", body: [{type: "eval", content: "$p.item"}]}, "after"], context);
			expected = "before!!!after";
			assert.strictEqual(actual, expected);
		});				
		test("can handle non-object and non-array argument", function () {
			var actual, expected;

			actual = interpreter.produceHTML(["before", {type: "foreach", value: "item", body: [{type: "eval", content: "item"}]}, "after"], context);
			expected = "beforeafter";
			assert.strictEqual(actual, expected);
		});	
		test("can handle not evaluable argument", function () {
			var actual, expected;

			actual = interpreter.produceHTML(["before", {type: "foreach", value: "nothing", body: [{type: "eval", content: "item"}]}, "after"], context);
			expected = "beforeafter";
			assert.strictEqual(actual, expected);
		});		
	});	
	suite("evaluation statement", function () {
		test("can access context object", function () {
			var actual, expected;

			actual = interpreter.produceHTML(["before", {type: "eval", content: "item"}, "after"], context);
			expected = "before!after";
			assert.strictEqual(actual, expected);
		});	
		test("can access function repo", function () {
			var actual, expected;

			actual = interpreter.produceHTML(["before", {type: "eval", content: "test('!')"}, "after"], context);
			expected = "before!<<body>>!after";
			assert.strictEqual(actual, expected);
		});
		test("can handle syntax error", function () {
			var actual, expected;

			actual = interpreter.produceHTML(["before", {type: "eval", content: "sdg+!"}, "after"], context);
			expected = "beforeafter";
			assert.strictEqual(actual, expected);
		});
		test("can handle unknown function", function () {
			var actual, expected;

			actual = interpreter.produceHTML(["before", {type: "eval", content: "nothing()"}, "after"], context);
			expected = "beforeafter";
			assert.strictEqual(actual, expected);
		});			
	});	
	suite("parsing error", function () {
		test("can show error message when showInlineParsingErrors enabled", function () {
			var actual, expected;

			interpreter.showInlineParsingErrors = true;
			actual = interpreter.produceHTML(["before", new Error("middle"), "after"], context);
			expected = "before(middle -->)after";
			assert.strictEqual(actual, expected);
		});		
		test("can hide error message when showInlineParsingErrors disabled", function () {
			var actual, expected;
			
			interpreter.showInlineParsingErrors = false;
			actual = interpreter.produceHTML(["before", new Error("middle"), "after"], context);
			expected = "beforeafter";
			assert.strictEqual(actual, expected);
		});		
	});	
});	
var assert = require("assert"),
	leifEval = require("../leif.eval.js");

suite("creating evaluation context", function () {
	test("can access context content", function () {
		var context, obj, actual, expected;

		obj = {
			a: 1,
			b: "ok"
		};
		context = leifEval.createContext(obj);
		actual = context.evaluate("a + b");
		expected = "1ok";
		assert.strictEqual(actual, expected);
	});
	test("can not access stuff outside context content", function () {
		var context, obj, c;

		obj = {
			a: 1,
			b: "ok"
		};
		c = 2;
		context = leifEval.createContext(obj);
		assert.throws(function () {
			context.evaluate("a + b + c");
		});
	});	
});	
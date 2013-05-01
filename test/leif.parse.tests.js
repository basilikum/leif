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
				expected = ["before",{type:"if", blocks: [{type:"if",condition:"variableName",body:["middle"]}]},"after"];
				assert.deepEqual(actual, expected);
			});	
			test("does not directly evaluate expression with typeof operator", function () {
				var actual, expected;

				actual = parser.parse("before$:if(typeof 'fg' === 'string'){middle}after");
				expected = ["before",{type:"if", blocks: [{type:"if",condition:"typeof 'fg' === 'string'",body:["middle"]}]},"after"];
				assert.deepEqual(actual, expected);
			});	
			test("can create object of type 'if/else' when not evaluable", function () {
				var actual, expected;

				actual = parser.parse("before$:if(variableName){middle} $:else{!}after");
				expected = ["before",{type:"if", blocks: [{type:"if",condition:"variableName",body:["middle"]},["!"]]},"after"];
				assert.deepEqual(actual, expected);
			});				
			test("can create object of type 'if/elseif/else' when elseif is evaluable", function () {
				var actual, expected;

				actual = parser.parse("before$:if(variableName){middle} $:elseif(true){yes} $:else{!}after");
				expected = ["before",{type:"if", blocks: [{type:"if",condition:"variableName",body:["middle"]}, ["yes"]]},"after"];
				assert.deepEqual(actual, expected);
			});	
			test("can create object of type 'if/elseif/else' when elseif is not evaluable", function () {
				var actual, expected;

				actual = parser.parse("before$:if(variableName){middle} $:elseif(otherVariable){yes} $:else{!}after");
				expected = ["before",{type:"if", blocks: [{type:"if",condition:"variableName",body:["middle"]}, {type:"if",condition:"otherVariable",body:["yes"]}, ["!"]]},"after"];
				assert.deepEqual(actual, expected);
			});	
			test("can create object of type 'if/elseif/else' when if is false", function () {
				var actual, expected;

				actual = parser.parse("before$:if(false){middle} $:elseif(otherVariable){yes} $:else{!}after");
				expected = ["before",{type:"if", blocks: [{type:"if",condition:"otherVariable",body:["yes"]}, ["!"]]},"after"];
				assert.deepEqual(actual, expected);
			});							
			test("can directly evaluate 'if/elseif/else' statement", function () {
				var actual, expected;

				actual = parser.parse("before$:if(false){middle} $:elseif(true){yes} $:else{!}after");
				expected = ["beforeyesafter"];
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
		test("can handle missing arguments in function", function () {
			var actual, expected;

			actual = parser.parse("before$:test");
			expected = ["before", new Error(), "$:test"];
			assert.deepEqual(actual, expected);
		});
		test("can handle missing arguments in if statement", function () {
			var actual, expected;

			actual = parser.parse("before$:if{test}");
			expected = ["before", new Error(), "$:if{test}"];
			assert.deepEqual(actual, expected);
		});	
		test("can handle missing arguments in elseif statement with non evaluable if", function () {
			var actual, expected;

			actual = parser.parse("before$:if(variableName){test}$:elseif{that}after");
			expected = ["before", new Error(), "$:if(variableName){test}$:elseif{that}after"];
			assert.deepEqual(actual, expected);
		});
		test("can handle missing arguments in elseif statement with true if", function () {
			var actual, expected;

			actual = parser.parse("before$:if(true){test}$:elseif{that}after");
			expected = ["beforetestafter"];
			assert.deepEqual(actual, expected);
		});	
		test("can handle missing arguments in elseif statement with false if", function () {
			var actual, expected;

			actual = parser.parse("before$:if(false){test}$:elseif{that}after");
			expected = ["before", new Error(), "$:if(false){test}$:elseif{that}after"];
			assert.deepEqual(actual, expected);
		});									
		test("can handle missing closing parentheses.", function () {
			var actual, expected;

			actual = parser.parse("before$:('mid' + 'dle'after");
			expected = ["before", new Error() ,"$:('mid' + 'dle'after"];
			assert.deepEqual(actual, expected);
		});	
		test("can handle unknown function.", function () {
			var actual, expected;

			actual = parser.parse("before$:dgfj3t('mid', 'dle')after");
			expected = ["before", new Error() ,"$:dgfj3t('mid', 'dle')after"];
			assert.deepEqual(actual, expected);
		});		
		test("can handle misplaced space in evaluation.", function () {
			var actual, expected;

			actual = parser.parse("before$: ('mid' + 'dle')after");
			expected = ["before", new Error() ,"$: ('mid' + 'dle')after"];
			assert.deepEqual(actual, expected);
		});		
		test("can handle misplaced space in function.", function () {
			var actual, expected;

			actual = parser.parse("before$:test ('mid' + 'dle')after");
			expected = ["before", new Error() ,"$:test ('mid' + 'dle')after"];
			assert.deepEqual(actual, expected);
		});		
		test("can handle wrongly placed 'elseif' statement in evaluable if statement", function () {
			var actual, expected;

			actual = parser.parse("before$:if(false){middle} $:else{!} $:elseif(true){yes}after");
			expected = ["before! ", new Error(), "$:elseif(true){yes}after"];
			assert.deepEqual(actual, expected);
		});
		test("can handle wrongly placed 'elseif' statement in non-evaluable if statement", function () {
			var actual, expected;

			actual = parser.parse("before$:if(variableName){middle} $:else{!} $:elseif(true){yes}after");
			expected = ["before", {type:"if", blocks: [{type:"if",condition:"variableName",body:["middle"]}, ["!"]]}, " ", new Error(), "$:elseif(true){yes}after"];
			assert.deepEqual(actual, expected);
		});							
	});	
});
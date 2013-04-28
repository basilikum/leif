var assert = require("assert"),
	helper = require("../leif.helper.js");



suite("Helper functions:", function () {

	test("mergeObjects", function () {
		var actual, expected, obj1, obj2;

		obj1 = {
			v1: "v1",
			v2: "v2",
			o1: {
				o1v1: "o1v1"
			}
		};
		obj2 = {
			v1: "v1b",
			v3: "v3",
			o1: {
				o2: {}
			}
		};
		actual = helper.mergeObjects(obj1, obj2);
		expected = {
			v1: "v1",
			v2: "v2",
			v3: "v3",
			o1: {
				o1v1: "o1v1"
			}
		};
		assert.deepEqual(actual, expected);
	});	

	test("deepMergeObjects", function () {
		var actual, expected, obj1, obj2;

		obj1 = {
			v1: "v1",
			v2: "v2",
			o1: {
				o1v1: "o1v1",
				o2: {
					o2v1: "o2v1"
				}
			}
		};
		obj2 = {
			v1: "v1b",
			v3: "v3",
			o1: {
				o1v2: "o1v2",
				o2: {
					o2v2: "o2v2"
				}
			}
		};
		actual = helper.deepMergeObjects(obj1, obj2);
		expected = {
			v1: "v1",
			v2: "v2",
			v3: "v3",
			o1: {
				o1v1: "o1v1",
				o1v2: "o1v2",
				o2: {
					o2v1: "o2v1",
					o2v2: "o2v2"
				}
			}
		};
		assert.deepEqual(actual, expected);
	});	

	test("findClosingIndex", function () {
		var actual, expected, str;

		str = "a(dkf()(( sd')'sf) sds')'f)sdf)sdff)()";
		actual = helper.findClosingIndex(str, ["(", ")"], 1);
		expected = 30;
		assert.strictEqual(actual, expected);
	});			

	test("split", function () {
		var actual, expected, str;

		str = "abcd,ef'g,'hi(jk,lmn),op";
		actual = helper.split(str, ",");
		expected = ["abcd", "ef'g,'hi(jk,lmn)", "op"];
		assert.deepEqual(actual, expected);
	});

	test("insertArrayInAnother", function () {
		var actual, expected, arr1, arr2;

		arr1 = [1,2,3];
		arr2 = [4,5,6,7];
		actual = helper.insertArrayInAnother(arr1, arr2);
		expected = [4,1,2,3,5,1,2,3,6,1,2,3,7];
		assert.deepEqual(actual, expected);
	});	

	test("compressArray", function () {
		var actual, expected, arr;

		arr = ["1","2","3", {v1: "v1"}, "4", "5", {v2: "v2"}, {v3: "v3"}];
		actual = helper.compressArray(arr);
		expected = ["123", {v1: "v1"}, "45", {v2: "v2"}, {v3: "v3"}];
		assert.deepEqual(actual, expected);
	});	

	test("getObjectLength", function () {
		var actual, expected, obj;

		obj = {
			a: "b",
			c: {

			},
			f: function (x) {
				return x;
			},
			g: [1,2,3],
			h: {
				u: 21
			}
		};
		actual = helper.getObjectLength(obj);
		expected = 5;
		assert.strictEqual(actual, expected);
	});		

	test("deepCopy", function () {
		var actual, expected;

		expected = {
			a: "b",
			c: {
				f: function (x) {
					return x;
				},
				g: [1,2,3],
				h: {
					u: 21
				}
			}
		};
		actual = helper.deepCopy(expected);
		assert.deepEqual(actual, expected);
	});			
});	
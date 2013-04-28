var assert = require("assert"),
	fs = require("fs"),
	tc = require("../leif.template.js"),
	leif = require("../leif.js");


suite("When registering", function () {
	setup(function () {
		leif.clearRegister();
	});	
	suite("single templates", function () {
		suite("synchronous", function () {
			suite("with custom name", function () {
				test("can register html file", function () {
					var templates, expected, err;

					err = leif.registerTemplateWithNameSync(__dirname + "/fs/d1/d4/f5.html", "cname");
					templates = leif.__returnTemplates();
					expected = {};
					expected["cname"] = tc.createTemplate(__dirname + "/fs/d1/d4/f5.html", "cname"); 
					assert.deepEqual(templates, expected);
					assert.strictEqual(err, null);
				});	
				test("can register file with a non 'html' file extension", function () {
					var templates, expected, err;

					err = leif.registerTemplateWithNameSync(__dirname + "/fs/f2.lmth", "cname");
					templates = leif.__returnTemplates();
					expected = {};
					expected["cname"] = tc.createTemplate(__dirname + "/fs/f2.lmth", "cname"); 
					assert.deepEqual(templates, expected);
					assert.strictEqual(err, null);
				});	
				test("can handle non existing file", function () {
					var err, expected, templates;

					err = leif.registerTemplateWithNameSync(__dirname + "/fs/f2.hmtl", "cname");
					templates = leif.__returnTemplates();
					expected = {};
					assert.deepEqual(templates, expected);
					assert(err instanceof Error);
				});		
			});	
			suite("without custom name", function () {
				test("can register html file", function () {
					var templates, expected, err;

					err = leif.registerTemplateSync(__dirname + "/fs/d1/d4/f5.html");
					templates = leif.__returnTemplates();
					expected = {};
					expected["f5"] = tc.createTemplate(__dirname + "/fs/d1/d4/f5.html", "f5"); 
					assert.deepEqual(templates, expected);
					assert.strictEqual(err, null);
				});	
				test("can register file with a non 'html' file extension", function () {
					var templates, expected, err;

					err = leif.registerTemplateSync(__dirname + "/fs/f2.lmth");
					templates = leif.__returnTemplates();
					expected = {};
					expected["f2"] = tc.createTemplate(__dirname + "/fs/f2.lmth", "f2"); 
					assert.deepEqual(templates, expected);
					assert.strictEqual(err, null);
				});		
			});	
			suite("overriding", function () {
				test("overrides template (when enabled)", function () {
					var err1, err2, templates, expected;
					
					leif.overrideExistingTemplates = true;
					err1 = leif.registerTemplateWithNameSync(__dirname + "/fs/d1/d4/f5.html", "cname");
					err2 = leif.registerTemplateWithNameSync(__dirname + "/fs/d1/d3/f4.html", "cname");
					templates = leif.__returnTemplates();
					expected = {};
					expected["cname"] = tc.createTemplate(__dirname + "/fs/d1/d3/f4.html", "cname"); 
					assert.deepEqual(templates, expected);
					assert.strictEqual(err1, null);
					assert.strictEqual(err2, null);
				});	
				test("doesn't override template (when disabled) returns error (when enabled)", function () {
					var err1, err2, templates, expected;

					leif.overrideExistingTemplates = false;
					leif.throwErrorOnOverrideExistingTemplates = true;
					err1 = leif.registerTemplateWithNameSync(__dirname + "/fs/d1/d4/f5.html", "cname");
					err2 = leif.registerTemplateWithNameSync(__dirname + "/fs/d1/d3/f4.html", "cname");
					templates = leif.__returnTemplates();
					expected = {};
					expected["cname"] = tc.createTemplate(__dirname + "/fs/d1/d4/f5.html", "cname"); 
					assert.deepEqual(templates, expected);
					assert.strictEqual(err1, null);
					assert(err2 instanceof Error);
				});	
				test("doesn't override template (when disabled) doesn't return error (when disabled)", function () {
					var err1, err2, templates, expected;

					leif.overrideExistingTemplates = false;
					leif.throwErrorOnOverrideExistingTemplates = false;
					err1 = leif.registerTemplateWithNameSync(__dirname + "/fs/d1/d4/f5.html", "cname");
					err2 = leif.registerTemplateWithNameSync(__dirname + "/fs/d1/d3/f4.html", "cname");
					templates = leif.__returnTemplates();
					expected = {};
					expected["cname"] = tc.createTemplate(__dirname + "/fs/d1/d4/f5.html", "cname"); 
					assert.deepEqual(templates, expected);
					assert.strictEqual(err1, null);
					assert.strictEqual(err2, null);
				});			
			});																		
		});
		suite("asynchronous", function () {
			suite("with custom name", function () {
				test("can register html file", function (done){
					var templates, expected;
					leif.registerTemplateWithName(__dirname + "/fs/d1/d4/f5.html", "cname", function (err) {
						templates = leif.__returnTemplates();
						expected = {};
						expected["cname"] = tc.createTemplate(__dirname + "/fs/d1/d4/f5.html", "cname"); 
						assert.deepEqual(templates, expected);
						assert.strictEqual(err, null);
						done();
					});
				});		
			});	
			suite("overriding", function () {
				test("overrides template when overriding is enabled", function (done){
					var templates, expected;
					leif.overrideExistingTemplates = true;
					leif.registerTemplateWithName(__dirname + "/fs/d1/d4/f5.html", "cname", function (err1) {
						leif.registerTemplateWithName(__dirname + "/fs/d1/d3/f4.html", "cname", function (err2) {
							templates = leif.__returnTemplates();
							expected = {};
							expected["cname"] = tc.createTemplate(__dirname + "/fs/d1/d3/f4.html", "cname"); 
							assert.deepEqual(templates, expected);
							assert.strictEqual(err1, null);
							assert.strictEqual(err2, null);	
							done();
						});
					});
				});	
				test("doesn't override template (when disabled) returns error (when enabled)", function (done) {
					var templates, expected;

					leif.overrideExistingTemplates = false;
					leif.throwErrorOnOverrideExistingTemplates = true;
					leif.registerTemplateWithName(__dirname + "/fs/d1/d4/f5.html", "cname", function (err1) {
						leif.registerTemplateWithName(__dirname + "/fs/d1/d3/f4.html", "cname", function (err2) {
							templates = leif.__returnTemplates();
							expected = {};
							expected["cname"] = tc.createTemplate(__dirname + "/fs/d1/d4/f5.html", "cname"); 
							assert.deepEqual(templates, expected);
							assert.strictEqual(err1, null);
							assert(err2 instanceof Error);	
							done();
						});
					});
				});	
				test("doesn't override template (when disabled) doesn't return error (when disabled)", function (done) {
					var templates, expected;

					leif.overrideExistingTemplates = false;
					leif.throwErrorOnOverrideExistingTemplates = false;
					leif.registerTemplateWithName(__dirname + "/fs/d1/d4/f5.html", "cname", function (err1) {
						leif.registerTemplateWithName(__dirname + "/fs/d1/d3/f4.html", "cname", function (err2) {
							templates = leif.__returnTemplates();
							expected = {};
							expected["cname"] = tc.createTemplate(__dirname + "/fs/d1/d4/f5.html", "cname"); 
							assert.deepEqual(templates, expected);
							assert.strictEqual(err1, null);
							assert.strictEqual(err2, null);	
							done();
						});
					});
				});			
			});					
		});	

	});
	suite("full directory", function () {
		suite("synchronous", function () {
			test("can register directory", function () {
				var err, templates, expected;

				err = leif.registerDirectorySync(__dirname + "/fs");
				templates = leif.__returnTemplates();
				expected = {};
				expected["fs/f1"] = tc.createTemplate(__dirname + "/fs/f1.html", "f1");
				expected["fs/d1/d3/f4"] = tc.createTemplate(__dirname + "/fs/d1/d3/f4.html", "f4");
				expected["fs/d1/d4/f5"] = tc.createTemplate(__dirname + "/fs/d1/d4/f5.html", "f5");
				expected["fs/d2/f3"] = tc.createTemplate(__dirname + "/fs/d2/f3.html", "f3");
				expected["fs/d2/d3/f4"] = tc.createTemplate(__dirname + "/fs/d2/d3/f4.html", "f4");
				assert.deepEqual(templates, expected);
				assert.strictEqual(err, null);
			});	
			test("overrides templates when overriding is enabled", function () {
				var err1, err2, templates, expected;

				leif.overrideExistingTemplates = true;
				err1 = leif.registerDirectorySync(__dirname + "/fs/d1/d3");
				err2 = leif.registerDirectorySync(__dirname + "/fs/d2/d3");
				templates = leif.__returnTemplates();
				expected = {};
				expected["d3/f4"] = tc.createTemplate(__dirname + "/fs/d2/d3/f4.html", "f4");
				assert.deepEqual(templates, expected);
				assert.strictEqual(err1, null);
				assert.strictEqual(err2, null);
			});	
			test("doesn't override template (when disabled) returns error (when enabled)", function () {
				var err1, err2, templates, expected;

				leif.overrideExistingTemplates = false;
				leif.throwErrorOnOverrideExistingTemplates = true;
				err1 = leif.registerDirectorySync(__dirname + "/fs/d1/d3");
				err2 = leif.registerDirectorySync(__dirname + "/fs/d2/d3");
				templates = leif.__returnTemplates();
				expected = {};
				expected["d3/f4"] = tc.createTemplate(__dirname + "/fs/d1/d3/f4.html", "f4");
				assert.deepEqual(templates, expected);
				assert.strictEqual(err1, null);
				assert(err2 instanceof Error);
			});	
			test("doesn't override template (when disabled) doesn't return error (when disabled)", function () {
				var err1, err2, templates, expected;

				leif.overrideExistingTemplates = false;
				leif.throwErrorOnOverrideExistingTemplates = false;
				err1 = leif.registerDirectorySync(__dirname + "/fs/d1/d3");
				err2 = leif.registerDirectorySync(__dirname + "/fs/d2/d3");
				templates = leif.__returnTemplates();
				expected = {};
				expected["d3/f4"] = tc.createTemplate(__dirname + "/fs/d1/d3/f4.html", "f4");
				assert.deepEqual(templates, expected);
				assert.strictEqual(err1, null);
				assert.strictEqual(err2, null);
			});	
		});
		suite("asynchronous", function () {
			test("can register directory", function (done) {
				var templates, expected;

				leif.registerDirectory(__dirname + "/fs", function (err) {
					templates = leif.__returnTemplates();
					expected = {};
					expected["fs/f1"] = tc.createTemplate(__dirname + "/fs/f1.html", "f1");
					expected["fs/d1/d3/f4"] = tc.createTemplate(__dirname + "/fs/d1/d3/f4.html", "f4");
					expected["fs/d1/d4/f5"] = tc.createTemplate(__dirname + "/fs/d1/d4/f5.html", "f5");
					expected["fs/d2/f3"] = tc.createTemplate(__dirname + "/fs/d2/f3.html", "f3");
					expected["fs/d2/d3/f4"] = tc.createTemplate(__dirname + "/fs/d2/d3/f4.html", "f4");
					assert.deepEqual(templates, expected);
					assert.strictEqual(err, null);
					done();
				});

			});	
			test("overrides templates when overriding is enabled", function (done) {
				var templates, expected;

				leif.overrideExistingTemplates = true;
				leif.registerDirectory(__dirname + "/fs/d1/d3", function (err1) {
					leif.registerDirectory(__dirname + "/fs/d2/d3", function (err2) {
						templates = leif.__returnTemplates();
						expected = {};
						expected["d3/f4"] = tc.createTemplate(__dirname + "/fs/d2/d3/f4.html", "f4");
						assert.deepEqual(templates, expected);
						assert.strictEqual(err1, null);
						assert.strictEqual(err2, null);
						done();
					});
				});

			});	
			test("doesn't override template (when disabled) returns error (when enabled)", function (done) {
				var templates, expected;

				leif.overrideExistingTemplates = false;
				leif.throwErrorOnOverrideExistingTemplates = true;
				leif.registerDirectory(__dirname + "/fs/d1/d3", function (err1) {
					leif.registerDirectory(__dirname + "/fs/d2/d3", function (err2) {
						templates = leif.__returnTemplates();
						expected = {};
						expected["d3/f4"] = tc.createTemplate(__dirname + "/fs/d1/d3/f4.html", "f4");
						assert.deepEqual(templates, expected);
						assert.strictEqual(err1, null);
						assert(err2 instanceof Error);
						done();
					});
				});
			});	
			test("doesn't override template (when disabled) doesn't return error (when disabled)", function (done) {
				var templates, expected;

				leif.overrideExistingTemplates = false;
				leif.throwErrorOnOverrideExistingTemplates = false;
				leif.registerDirectory(__dirname + "/fs/d1/d3", function (err1) {
					leif.registerDirectory(__dirname + "/fs/d2/d3", function (err2) {
						templates = leif.__returnTemplates();
						expected = {};
						expected["d3/f4"] = tc.createTemplate(__dirname + "/fs/d1/d3/f4.html", "f4");
						assert.deepEqual(templates, expected);
						assert.strictEqual(err1, null);
						assert.strictEqual(err2, null);
						done();
					});
				});
			});	
		});				
	});	
});

suite("When caching", function () {
	setup(function () {
		leif.clearRegister();
		leif.registerDirectorySync(__dirname + "/fs");
	});	
	suite("single template", function () {
		suite("synchronous", function () {
			suite("by path", function () {
				test("can cache template if one match was found", function () {
					var err, template, expected;

					err = leif.cacheTemplateByPathSync("fs/d2/f3");
					template = leif.__returnTemplates()["fs/d2/f3"];
					expected = tc.createTemplate(__dirname + "/fs/d2/f3.html", "f3");
					expected.cache = ["f3"];
					assert.deepEqual(template, expected);
					assert.strictEqual(err, null);
				});
				test("can handle no match", function () {
					var err, templates1, templates2;
					
					templates1 = leif.__returnTemplates();
					err = leif.cacheTemplateByPathSync("fs/d2/f4");
					templates2 = leif.__returnTemplates();
					assert.deepEqual(templates1, templates2);
					assert(err instanceof Error);
				});
			});
			suite("by name", function () {
				test("can cache template if one match was found", function () {
					var err, template, expected;

					err = leif.cacheTemplateByNameSync("f3");
					template = leif.__returnTemplates()["fs/d2/f3"];
					expected = tc.createTemplate(__dirname + "/fs/d2/f3.html", "f3");
					expected.cache = ["f3"];
					assert.deepEqual(template, expected);
					assert.strictEqual(err, null);
				});				
				test("can cache template if multiple matches were found and return-first-match is enabled", function () {
					var err, template, expected;

					leif.returnFirstTemplateOnMultipleMatches = true;
					err = leif.cacheTemplateByNameSync("f4");
					template = leif.__returnTemplates()["fs/d1/d3/f4"];
					expected = tc.createTemplate(__dirname + "/fs/d1/d3/f4.html", "f4");
					expected.cache = ["f4"];
					assert.deepEqual(template, expected);
					assert.strictEqual(err, null);
				});	
				test("can handle multiple matches when return-first-match is disabled", function () {
					var err, templates1, templates2;

					leif.returnFirstTemplateOnMultipleMatches = false;
					templates1 = leif.__returnTemplates();
					err = leif.cacheTemplateByNameSync("f4");
					templates2 = leif.__returnTemplates();
					assert.deepEqual(templates1, templates2);
					assert(err instanceof Error);
				});								

				test("can handle no match", function () {
					var err, templates1, templates2;

					templates1 = leif.__returnTemplates();
					err = leif.cacheTemplateByNameSync("f6");
					templates2 = leif.__returnTemplates();
					assert.deepEqual(templates1, templates2);
					assert(err instanceof Error);
				});
			});			
		});
		suite("asynchronous", function () {
			suite("by path", function () {
				test("can cache template if one match was found", function (done) {
					var template, expected;

					leif.cacheTemplateByPath("fs/d2/f3", function (err) {
						template = leif.__returnTemplates()["fs/d2/f3"];
						expected = tc.createTemplate(__dirname + "/fs/d2/f3.html", "f3");
						expected.cache = ["f3"];
						assert.deepEqual(template, expected);
						assert.strictEqual(err, null);
						done();
					});
				});
				test("can handle no match", function (done) {
					var templates1, templates2;
					
					templates1 = leif.__returnTemplates();
					leif.cacheTemplateByPath("fs/d2/f4", function (err) {
						templates2 = leif.__returnTemplates();
						assert.deepEqual(templates1, templates2);
						assert(err instanceof Error);
						done();
					});
				});
			});
			suite("by name", function () {
				test("can cache template if one match was found", function (done) {
					var template, expected;

					leif.cacheTemplateByName("f3", function (err) {
						template = leif.__returnTemplates()["fs/d2/f3"];
						expected = tc.createTemplate(__dirname + "/fs/d2/f3.html", "f3");
						expected.cache = ["f3"];
						assert.deepEqual(template, expected);
						assert.strictEqual(err, null);
						done();
					});
				});				
				test("can cache template if multiple matches were found and return-first-match is enabled", function (done) {
					var template, expected;

					leif.returnFirstTemplateOnMultipleMatches = true;
					leif.cacheTemplateByName("f4", function (err) {
						template = leif.__returnTemplates()["fs/d1/d3/f4"];
						expected = tc.createTemplate(__dirname + "/fs/d1/d3/f4.html", "f4");
						expected.cache = ["f4"];
						assert.deepEqual(template, expected);
						assert.strictEqual(err, null);
						done();
					});
				});	
				test("can handle multiple matches when return-first-match is disabled", function (done) {
					var templates1, templates2;

					leif.returnFirstTemplateOnMultipleMatches = false;
					templates1 = leif.__returnTemplates();
					leif.cacheTemplateByName("f4", function (err) {
						templates2 = leif.__returnTemplates();
						assert.deepEqual(templates1, templates2);
						assert(err instanceof Error);
						done();
					});
				});								

				test("can handle no match", function (done) {
					var templates1, templates2;

					templates1 = leif.__returnTemplates();
					leif.cacheTemplateByName("f6", function (err) {
						templates2 = leif.__returnTemplates();
						assert.deepEqual(templates1, templates2);
						assert(err instanceof Error);
						done();
					});
				});
			});	
		});	
	});
	suite("all templates", function () {
		test("can cache synchronously", function () {
			var err, templates, expected;

			err = leif.cacheAllTemplatesSync();
			templates = leif.__returnTemplates();
			expected = {};
			expected["fs/f1"] = tc.createTemplate(__dirname + "/fs/f1.html", "f1");
			expected["fs/d1/d3/f4"] = tc.createTemplate(__dirname + "/fs/d1/d3/f4.html", "f4");
			expected["fs/d1/d4/f5"] = tc.createTemplate(__dirname + "/fs/d1/d4/f5.html", "f5");
			expected["fs/d2/f3"] = tc.createTemplate(__dirname + "/fs/d2/f3.html", "f3");
			expected["fs/d2/d3/f4"] = tc.createTemplate(__dirname + "/fs/d2/d3/f4.html", "f4");		
			expected["fs/f1"].cache = ["f1"];
			expected["fs/d1/d3/f4"].cache = ["f4"];
			expected["fs/d1/d4/f5"].cache = ["f5"];
			expected["fs/d2/f3"].cache = ["f3"];
			expected["fs/d2/d3/f4"].cache = ["f4b"];
			assert.deepEqual(templates, expected);
			assert.strictEqual(err, null);		

		});
		test("can cache asynchronously", function (done) {
			var templates, expected;

			leif.cacheAllTemplates(function (err) {
				templates = leif.__returnTemplates();
				expected = {};
				expected["fs/f1"] = tc.createTemplate(__dirname + "/fs/f1.html", "f1");
				expected["fs/d1/d3/f4"] = tc.createTemplate(__dirname + "/fs/d1/d3/f4.html", "f4");
				expected["fs/d1/d4/f5"] = tc.createTemplate(__dirname + "/fs/d1/d4/f5.html", "f5");
				expected["fs/d2/f3"] = tc.createTemplate(__dirname + "/fs/d2/f3.html", "f3");
				expected["fs/d2/d3/f4"] = tc.createTemplate(__dirname + "/fs/d2/d3/f4.html", "f4");		
				expected["fs/f1"].cache = ["f1"];
				expected["fs/d1/d3/f4"].cache = ["f4"];
				expected["fs/d1/d4/f5"].cache = ["f5"];
				expected["fs/d2/f3"].cache = ["f3"];
				expected["fs/d2/d3/f4"].cache = ["f4b"];
				assert.deepEqual(templates, expected);
				assert.strictEqual(err, null);	
				done();
			});
		});		
	});
});

suite("When requesting", function () {
	setup(function () {
		leif.clearRegister();
		leif.registerDirectorySync(__dirname + "/fs");
	});	
	suite("without caching", function () {
		suite("by path", function () {
			test("can return template if one match was found", function () {
				var result, expected;

				result = leif.requestTemplateByPath("fs/d2/f3");
				expected = "f3";
				assert.strictEqual(result, expected);
			});
			test("can handle no match", function () {
				var result;

				result = leif.requestTemplateByPath("fs/d2/f6");
				assert(result instanceof Error);
			});
		});
		suite("by name", function () {
			test("can return template if one match was found", function () {
				var result, expected;

				result = leif.requestTemplateByName("f3");
				expected = "f3";
				assert.strictEqual(result, expected);
			});			
			test("can return template if multiple matches were found and return-first-match is enabled", function () {
				var result, expected;

				leif.returnFirstTemplateOnMultipleMatches = true;
				result = leif.requestTemplateByName("f4");
				expected = "f4";
				assert.strictEqual(result, expected);
			});	
			test("can handle multiple matches when return-first-match is disabled", function () {
				var result;

				leif.returnFirstTemplateOnMultipleMatches = false;
				result = leif.requestTemplateByName("f4");
				assert(result instanceof Error);
			});								
			test("can handle no match", function () {
				var result;

				result = leif.requestTemplateByName("f7");
				assert(result instanceof Error);
			});
		});
	});
	suite("with caching", function () {
		test("can cache template on first request (when enabled)", function () {
			var result, template, expected;

			leif.cacheTemplatesOnFirstLoad = true;
			leif.requestTemplateByName("f5");
			template = leif.__returnTemplates()["fs/d1/d4/f5"];
			expected = tc.createTemplate(__dirname + "/fs/d1/d4/f5.html", "f5");
			expected.cache = ["f5"];
			assert.deepEqual(template, expected);
		});	
		test("doesn't cache template on first request (when disabled)", function () {
			var result, template, expected;

			leif.cacheTemplatesOnFirstLoad = false;
			leif.requestTemplateByName("f5");
			template = leif.__returnTemplates()["fs/d1/d4/f5"];
			expected = tc.createTemplate(__dirname + "/fs/d1/d4/f5.html", "f5");
			assert.deepEqual(template, expected);
		});		
		test("always uses cache when available", function () {
			var result, template, expected;

			leif.cacheTemplateByNameSync("f5");
			fs.writeFileSync(__dirname + "/fs/d1/d4/f5.html", "f6");
			result = leif.requestTemplateByName("f5");
			expected = "f5";
			fs.writeFileSync(__dirname + "/fs/d1/d4/f5.html", "f5");
			assert.strictEqual(result, expected);
		});				
	});
});	
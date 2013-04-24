var leif = (function(that){

	var fs = require("fs"),
		path = require("path"),
		parser = require("./leif.parse.js"),
		interpreter = require("./leif.interpret.js"),
		helper = require("./leif.helper.js"),

		Template,
		createTemplate,
		registerDirectory,
		registerDirectorySync,
		registerTemplate,
		registerTemplateSync,
		getTemplatesByName,
		getTemplateByPath,
		parseTemplate,
		parseTemplateSync,
		cacheTemplate,
		cacheTemplateSync,
		cacheTemplateByName,
		cacheTemplateByNameSync,
		cacheTemplateByPath,
		cacheTemplateByPathSync,
		cacheAllTemplates,
		cacheAllTemplatesSync,
		interpretTemplate,
		requestTemplateByName,
		requestTemplateByPath,
		clearCache,

		views = {};


	//API

	that.overrideExistingTemplates = false;
	that.throwErrorOnOverrideExistingTemplates = true;
	that.returnFirstTemplateOnMultipleMatches = false;
	that.cacheTemplatesOnFirstLoad = true;

	that.registerDirectory = function (dir, callback) {
		registerDirectory(dir, views, function (err) {
			callback(err);
		});
	};

	that.registerDirectorySync = function (dir) {
		return registerDirectorySync(dir, views);
	};

	that.registerTemplate = function (file, callback) {
		registerTemplate(file, path.basename(file, path.extname(file)), function (err) {
			callback(err);
		});
	};

	that.registerTemplateSync = function (file) {
		return registerTemplateSync(file, path.basename(file, path.extname(file)));
	};	

	that.registerTemplateWithName = function (file, name, callback) {
		registerTemplate(file, name, function (err) {
			callback(err);
		});
	};

	that.registerTemplateWithNameSync = function (file, name) {
		return registerTemplateSync(file, name);
	};

	that.cacheTemplateByName = function (name, callback) {
		cacheTemplateByName(name, function (err) {
			callback(err);
		});
	};

	that.cacheTemplateByNameSync = function (name) {
		return cacheTemplateByNameSync(name);
	};

	that.cacheTemplateByPath = function (path, callback) {
		cacheTemplateByPath(path, function (err) {
			callback(err);
		});
	};

	that.cacheTemplateByPathSync = function (path) {
		return cacheTemplateByPathSync(path);
	};

	that.cacheAllTemplates = function (callback) {
		cacheAllTemplates(views, function (err) {
			callback(err);
		});
	};

	that.cacheAllTemplatesSync = function () {
		return cacheAllTemplatesSync(views);
	};

	that.requestTemplateByName = function (name, context) {
		return requestTemplateByName(name, context);
	};	

	that.requestTemplateByPath = function (path, context) {
		return requestTemplateByPath(path, context);
	};

	that.clearCache = function () {
		clearCache(views);
	};

	that.setUserRepository = function (repo) {
		parser.setUserRepository(repo);
		interpreter.setUserRepository(repo);
	};


	//Template class

	Template = function (){};

	Template.prototype = {
		file: null,
		cache: null,
		watched: false,
		init: function (file) {
			this.file = file;
			return this;
		},
		watch: function () {

		}
	};

	createTemplate = function (file) {
		var t = new Template();
		return t.init(file);
	};


	//Functions

	registerDirectory = function (dir, obj, callback) {
		fs.stat(dir, function (err, stats) {
			var folderName;
			if (err) {
				callback(err);
			} else if (stats.isDirectory()) {
				folderName = path.basename(dir);
				if (!obj[folderName]) {
					obj[folderName] = {};
				}
				fs.readdir(dir, function (err, files) {
					var file, i, max_i = files.length,
						totalError = "",
						counter = 0, incrementCounter;

					incrementCounter = function (error) {
						counter += 1;
						if (error instanceof Error) {
							error = error.message;
						}
						totalError += error ? error + "\r\n" : "";
						if (counter == max_i) {
							callback(totalError === "" ? null : new Error(totalError));
						}
					};
					for (i = 0; i < max_i; i++) {
						file = dir + "/" + files[i];
						(function (file) {
							fs.stat(file, function (err, stats) {
								var viewName;
								if (err) {
									incrementCounter(err);
								} else if (stats.isDirectory()) {
									registerDirectory(file, function (err) {
										incrementCounter(err);
									}, obj[folderName]);
								} else if (stats.isFile()) {
									if (path.extname(file) === ".html") {
										viewName = path.basename(file, '.html');
										if (that.overrideExistingTemplates || !obj[folderName][viewName]) {
											obj[folderName][viewName] = createTemplate(file);
											incrementCounter();
										} else if (that.throwErrorOnOverrideExistingTemplates) {
											incrementCounter("template " + dir + "/" + viewName + " is already registered");
										} else {
											incrementCounter();
										}						
									} else {
										incrementCounter();
									}
								} else {
									incrementCounter();
								}
							});
						}(file));
					}
				});
			} else {
				callback(new Error(dir + " is not a directory"));
			}
		});
	};

	registerDirectorySync = function (dir, obj) {
		var dirStat,
			fileStat,
			folderName,
			files, file,
			subDirResult,
			data,
			viewName,
			error = "",
			i, max_i;

		dirStat = fs.statSync(dir);

		if (dirStat.isDirectory()) {
			folderName = path.basename(dir);

			if (!obj[folderName]) {
				obj[folderName] = {};
			}
			obj = obj[folderName];
			files = fs.readdirSync(dir);
			for (i = 0, max_i = files.length; i < max_i; i++) {
				file = dir + "/" + files[i];
				fileStat = fs.statSync(file);
				if (fileStat.isDirectory()) {
					subDirResult = registerDirectorySync(file, obj);
					error += (subDirResult instanceof Error) ? subDirResult.message : "";
				} else if (fileStat.isFile()) {
					if (path.extname(file) === ".html") {
						viewName = path.basename(file, '.html');
						if (that.overrideExistingTemplates || !obj[viewName]) {
							obj[viewName] = createTemplate(file);
						} else if (that.throwErrorOnOverrideExistingTemplates) {
							error += "template " + dir + "/" + viewName + " is already registered\r\n";
						}
					}
				}
			}
		} else {
			error += dir + " is not a directory\r\n";
		}
		return error === "" ? null : new Error(error);
	};	

	registerTemplate = function (file, name, callback) {
		fs.exists(file, function (exists) {
			if (exists) {
				views[name] = createTemplate(file);
				callback();
			} else {
				callback(new Error("file " + file + " does not exist!"));
			}
		});	
	};

	registerTemplateSync = function (file, name) {
		var exists;

		exists = fs.existsSync(file);
		if (exists) {
			views[name] = createTemplate(file);
			return null;
		} else {
			return new Error("file " + file + " does not exist!");
		}					
	};		

	getTemplatesByName = function (obj, searchKey) {
		var result = [],
			key, item;

		for (key in obj) {
			if (obj.hasOwnProperty(key)) {
				item = obj[key];
				if (item instanceof Template) {
					if (searchKey === key) {
						result.push(item);
					}
				} else if (typeof item === "object") {
					result = result.concat(getTemplatesByName(item, searchKey));
				}
			}
		}
		return result;
	};		

	getTemplateByPath = function (path) {
		var parts, i, max_i, part, obj;

		obj = views;
		parts = path.split("/");
		for (i = 0, max_i = parts.length; i < max_i; i++) {
			part = parts[i];
			obj = (typeof obj === "object") ? obj[part] : undefined;
		}
		if (obj instanceof Template) {
			return obj;
		} else {
			return new Error("there is no template with the path " + path + " registered!");
		}	
	};

	parseTemplate = function (template, callback) {
		fs.readFile(template.file, function (error, data) {
			if (error) {
				callback(error);
			} else {
				callback(null, parser.parse(data.toString()));				
			}
		});
	};

	parseTemplateSync = function (template) {
		var data;

		data = fs.readFileSync(template.file);
		return parser.parse(data.toString());	
	};

	cacheTemplate = function (template, callback) {
		parseTemplate(template, function (error, cache) {
			if (error) {
				callback(error);
			} else {
				template.cache = cache;	
				callback(null);				
			}
		});
	};

	cacheTemplateSync = function (template) {
		template.cache = parseTemplateSync(template);	
		return null;	
	};		

	cacheTemplateByName = function (name, callback) {
		var foundTemplates, template;

		foundTemplates = getTemplatesByName(views, name);
		if (foundTemplates.length === 0) {
			callback(new Error("no template with the name " + name + " found!"));
		} else if (foundTemplates.length > 1 && !that.returnFirstTemplateOnMultipleMatches) {
			callback(new Error("too many templates with the name " + name + " found!"));
		} else {
			template = foundTemplates[0];
			fs.readFile(template.file, function (error, data) {
				if (error) {
					callback(error);
				} else {
					template.cache = parser.parse(data.toString());	
					callback();				
				}
			});
		}
	};	

	cacheTemplateByNameSync = function (name) {
		var foundTemplates, template, data;

		foundTemplates = getTemplatesByName(views, name);
		if (foundViews.length === 0) {
			return new Error("no template with the name " + name + " found!");
		} else if (foundViews.length > 1 && !that.returnFirstTemplateOnMultipleMatches) {
			return new Error("too many templates with the name " + name + " found!");
		} else {
			template = foundTemplates[0];
			data = fs.readFileSync(template.file);
			template.cache = parser.parse(data.toString());	
			return null;
		}
	};		

	cacheTemplateByPath = function (path, callback) {
		var template;

		template = getTemplateByPath(path);
		if (template instanceof Error) {
			return template;
		} else {
			cacheTemplate(template, function (error) {
				callback(error);
			});
		}
	};	

	cacheTemplateByPathSync = function (path) {
		var template, data;

		template = getTemplateByPath(path);
		if (template instanceof Error) {
			return template;
		} else {
			return cacheTemplateSync(template);	
		}
	};	

	cacheAllTemplates = function (obj, callback) {
		var key, item, counter, decrementCounter, errors = [];

		counter = helper.getObjectLength(obj);
		decrementCounter = function (err) {
			if (err instanceof Error) {
				errors.push(err.message);
			}
			counter -= 1;
			if (counter === 0) {
				callback(errors.length > 0 ? errors.join("\r\n") : null);
			}
		};
		for (key in obj) {
			if (obj.hasOwnProperty(key)) {
				item = obj[key];
				if (item instanceof Template) {
					cacheTemplate(item, decrementCounter);
				} else if (typeof item === "object") {
					cacheAllTemplates(item, decrementCounter);
				}
			}
		}
	};

	cacheAllTemplatesSync = function (obj) {
		var key, item, result, errors = [];

		for (key in obj) {
			if (obj.hasOwnProperty(key)) {
				item = obj[key];
				result = null;
				if (item instanceof Template) {
					result = cacheTemplateSync(item);
				} else if (typeof item === "object") {
					result = cacheAllTemplatesSync(item);
				}
				if (result instanceof Error) {
					error.push(result.message);
				}
			}
		}

		return errors.length > 0 ? errors.join("\r\n") : null;
	};	

	interpretTemplate = function (template, context) {
		var cache;

		cache = template.cache;
		if (cache === null) {
			cache = parseTemplateSync(template);
			if (that.cacheTemplatesOnFirstLoad) {
				template.cache = cache;
			}
		}
		return interpreter.produceHTML(cache, context);	
	};

	requestTemplateByName = function (name, context) {
		var foundTemplates, template;

		foundTemplates = getTemplatesByName(views, name);
		if (foundTemplates.length === 0) {
			return new Error("no template with the name " + name + " found!");
		} else if (foundTemplates.length > 1 && !that.returnFirstTemplateOnMultipleMatches) {
			return new Error("too many templates with the name " + name + " found!");
		} else {
			template = foundTemplates[0];
			return interpretTemplate(template, context);
		}
	};	

	requestTemplateByPath = function (path, context) {
		var template, cache;

		template = getTemplateByPath(path);
		if (template instanceof Error) {
			return template;
		} else {
			return interpretTemplate(template, context);
		}
	};

	clearCache = function (obj) {
		var key, item;

		for (key in obj) {
			if (obj.hasOwnProperty(key)) {
				item = obj[key];
				if (item instanceof Template) {
					item.cache = null;
				} else if (typeof item === "object") {
					clearCache(item);
				}
			}
		}
	};	

	return that;
}({}));

module.exports = leif;
var leif = (function(that){

	var fs = require("fs"),
		path = require("path"),
		parser = require("./leif.parse.js"),
		interpreter = require("./leif.interpret.js"),
		views = {};


	that.overrideExistingViews = false;
	that.throwErrorOnOverrideExistingViews = true;
	that.returnFirstViewOnMultipleMatches = false;
	that.standardViewPathDelimiter = ".";

	var searchObject = function (obj, searchKey) {
		var result = [],
			key, item;
		for (key in obj) {
			if (obj.hasOwnProperty(key)) {
				item = obj[key];
				if (Array.isArray(item)) {
					if (searchKey === key) {
						result.push(item);
					}
				} else if (typeof item === "object") {
					result = result.concat(searchObject(item, searchKey));
				}
			}
		}
		return result;
	};

	that.setUserRepository = function (repo) {
		parser.setUserRepository(repo);
		interpreter.setUserRepository(repo);
	};

	that.requestViewByName = function (name, context) {
		var foundViews = searchObject(views, name);
		if (foundViews.length === 0 || (foundViews.length > 1 && !that.returnFirstViewOnMultipleMatches)) {
			return null;
		} else {
			return interpreter.produceHTML(foundViews[0], context);
		}
	};

	that.requestViewByFile = function (file, context, callback) {
		fs.readFile(file, function(error, data) {
			var arr;
			if (error) {
				callback(error, null);
			} else {
				arr = parser.parse(data.toString());
				callback(null, interpreter.produceHTML(arr, context));
			}
		});
	};

	that.requestViewByFileSync = function (file, context) {
		var data,
			arr;

		data = fs.readFileSync(file);
		arr = parser.parse(data.toString());
		return interpreter.produceHTML(arr, context);
	};	

	that.requestViewByPath = function (path, context, delimiter) {
		var parts, i, i_max, part, obj;

		obj = views;
		delimiter = (typeof delimiter === "string") ? delimiter : that.standardViewPathDelimiter;
		parts = path.split(delimiter);
		for (i = 0, max_i = parts.length; i < max_i; i++) {
			part = parts[i];
			obj = (typeof obj === "object") ? obj[part] : undefined;
		}
		if (Array.isArray(obj)) {
			return interpreter.produceHTML(obj, context);
		} else {
			return null;
		}
	};

	that.cacheFolderSync = function (dir, obj) {
		var dirStat,
			fileStat,
			folderName,
			files, file,
			data,
			viewName,
			error = "",
			i, max_i;

		obj = obj || views;

		dirStat = fs.statSync(dir);

		if (dirStat.isDirectory()) {
			folderName = path.basename(dir);
			if (!obj[folderName]) {
				obj[folderName] = {};
			}
			files = fs.readdirSync(dir);
			for (i = 0, max_i = files.length; i < max_i; i++) {
				file = dir + "/" + files[i];
				fileStat = fs.statSync(file);
				if (fileStat.isDirectory()) {
					error += that.cacheFolderSync(file, obj[folderName]) || "";
				} else if (fileStat.isFile()) {
					if (path.extname(file) === ".html") {
						data = fs.readFileSync(file);
						viewName = path.basename(file, '.html');
						if (that.overrideExistingViews || !obj[folderName][viewName]) {
							obj[folderName][viewName] = parser.parse(data.toString());
						} else if (that.throwErrorOnOverrideExistingViews) {
							error += "view " + dir + "/" + viewName + " is already defined\r\n";
						}
					}
				}
			}
		} else {
			error += dir + " is not a directory\r\n";
		}
		return error === "" ? null : error;
	};

	that.cacheFolder = function (dir, callback, obj) {
		obj = obj || views;
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
						totalError += error || "";
						if (counter == max_i) {
							callback(totalError === "" ? null : totalError);
						}
					};
					for (i = 0; i < max_i; i++) {
						file = dir + "/" + files[i];
						(function (file) {
							fs.stat(file, function (err, stats) {
								if (err) {
									incrementCounter(err);
								} else if (stats.isDirectory()) {
									that.cacheFolder(file, function (err) {
										incrementCounter(err);
									}, obj[folderName]);
								} else if (stats.isFile()) {
									if (path.extname(file) === ".html") {
										fs.readFile(file, function (error, data) {
											var viewName;
											if (error) {
												incrementCounter(error);
											} else {
												viewName = path.basename(file, '.html');
												if (that.overrideExistingViews || !obj[folderName][viewName]) {
													obj[folderName][viewName] = parser.parse(data.toString());
													incrementCounter();
												} else if (that.throwErrorOnOverrideExistingViews) {
													incrementCounter("view " + dir + "/" + viewName + " is already defined\r\n");
												} else {
													incrementCounter();
												}						
											}
										});
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
				callback(dir + " is not a directory");
			}
		});
	};

	that.showAllViews = function () {
		console.log(views);
	};

	var cacheView = function (file, name, callback) {
		fs.readFile(file, function (error, data) {
			if (error) {
				callback(error);
			} else {
				if (that.overrideExistingViews || !views[name]) {
					views[name] = parser.parse(data.toString());
					callback();
				} else if (that.throwErrorOnOverrideExistingViews) {
					callback("view " +file + " is already defined\r\n");
				} else {
					callback();
				}						
			}
		});	
	};

	var cacheViewSync = function (file, name) {
		var data;

		data = fs.readFileSync(file);
		if (that.overrideExistingViews || !views[name]) {
			views[name] = parser.parse(data.toString());
		} else if (that.throwErrorOnOverrideExistingViews) {
			return "view " + file + " is already defined\r\n";
		} 

		return null;					
	};	

	that.cacheViewWithName = function (file, name, callback) {
		cacheView(file, name, function (err) {
			callback(err);
		});
	};

	that.cacheView = function (file, callback) {
		cacheView(file, path.basename(file, '.html'), function (err) {
			callback(err);
		});
	};

	that.cacheViewWithNameSync = function (file, name) {
		return cacheViewSync(file, name);
	};	

	that.cacheViewSync = function (file) {
		return cacheViewSync(file, path.basename(file, '.html'));
	};


	return that;
}({}));

module.exports = leif;
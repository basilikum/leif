var mergeObjects = function (object1, object2) {
	var result = {},
		property;
	for (property in object1) {
		if (object1.hasOwnProperty(property)) {
			result[property] = object1[property];
		}
	}
	for (property in object2) {
		if (object2.hasOwnProperty(property)) {
			result[property] = object2[property];
		}
	}	
	return result;
};

var deepMergeObjects = function (object1, object2) {
	var result = {}, key,
		property;

	for (key in object1) {
		if (object1.hasOwnProperty(key)) {
			result[key] = object1[key];
		}
	}		
	for (key in object2) {
		if (object2.hasOwnProperty(key)) {
			property =  object2[key];
			if (result[key]) {
				if (typeof result[key] === "object" && typeof property === "object") {
					result[key] = deepMergeObjects(result[key], property);
				} else {

				}
			} else {
				result[key] = object2[key];
			}
		}
	}
	return result;
};

var findClosingIndex = function (text, symbols, startIndex) {
	var count = 0,
		i, max_i, inString = false, escape = false,
		openingSymbol = symbols[0],
		closingSymbol = symbols[1],
		ch;
		
	for (i = startIndex, max_i = text.length; i < max_i; i++) {
		ch = text.charAt(i);
		if (ch === "\\" && inString) {
			escape = !escape;
		} else if ((ch === "\"" || ch === "'") && !escape) {
			if (!inString) {
				inString = ch;
			} else if (inString === ch) {
				inString = false;
			} else {

			}
		}
		if (!inString) {
			if (ch === openingSymbol) {
				count += 1;
			} else if (ch === closingSymbol){
				count -= 1;
			}
		}
		if (count === 0) {
			return i;
		}
	}
	return 0;
};

var split = function (text, delimiter) {
	var i, max_i, inString = false, inParentheses = false, escape = false,
		ch, arr = [];
		
	for (i = 0, max_i = text.length; i < max_i; i++) {
		ch = text.charAt(i);
		if (ch === "\\" && inString) {
			escape = !escape;
		} else if ((ch === "\"" || ch === "'") && !escape) {
			if (!inString) {
				inString = ch;
			} else if (inString === ch) {
				inString = false;
			} else {

			}
		} else if (!inString) {
			if (ch === "(" && !inParentheses) {
				inParentheses = true;
			} else if (ch === ")" && inParentheses) {
				inParentheses = false;
			} else if (ch === delimiter && !inParentheses) {
				arr.push(text.substring(0, i));
				text = text.substring(i + 1);
				i = 0;
				max_i = text.length;
			}
		}
	}
	if (text.length > 0) {
		arr.push(text);
	}
	return arr;
};

var insertArrayInAnother = function (array1, array2) {
	var result = [],
		i, max_i;
	if (array2.length === 0) {
		return array1;
	} else if (array1.length === 0) {
		return array2;
	}
	result.push(array2[0]);
	for (i = 1, max_i = array2.length; i < max_i; i++) {
		result = result.concat(array1);
		result.push(array2[i]);
	}
	return result;
};

var compressArray = function (arr) {
	var rslt = [],
		obj = true;
	for (var i = 0, max_i = arr.length; i < max_i; i++) {
		var part = arr[i];
		if (typeof part === "string") {
			if (obj) {
				rslt.push(part);
			} else {
				rslt[rslt.length - 1] += part;
			}
			obj = false;
		} else {
			rslt.push(part);
			obj = true;
		}
	}
	return rslt;	
};

var getObjectLength = function (obj) {
	var key, counter = 0;

	for (key in obj) {
		if (obj.hasOwnProperty(key)) {
			counter += 1;
		}
	}
	return counter;
};

module.exports = {
	compressArray: compressArray,
	insertArrayInAnother: insertArrayInAnother,
	split: split,
	findClosingIndex: findClosingIndex,
	mergeObjects: mergeObjects,
	deepMergeObjects: deepMergeObjects,
	getObjectLength: getObjectLength
};
//Template class

Template = function (){};

Template.prototype = {
	file: null,
	name: null,
	cache: null,
	watched: false,
	init: function (file, name) {
		this.file = file;
		this.name = name;
		return this;
	},
	watch: function () {

	}
};

createTemplate = function (file, name) {
	var t = new Template();
	return t.init(file, name);
};

module.exports.createTemplate = createTemplate;
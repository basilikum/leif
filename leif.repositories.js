var repo = {
	funcRepo : {
		htmlHelper: {
			span: function (args) {
				return "<span name=\"" + args[0] + "\"><<body>></span>";
			}
		}
	},
	ifuncRepo : {
		get: function (args) {
			return args[0];
		},	
		stringHelper: {
			concat: function (args) {
				return args.join("");
			}
		}
	},
	controlRepo : {
		"foreach": function () {

		},
		"if": function () {

		}
	}
};


module.exports = repo;


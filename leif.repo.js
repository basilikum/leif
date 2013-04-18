module.exports = {
	text: {
		format: function (text) {
			return text.trim();
		}
	},
	html: {
		span: function (name) {
			return "<span name=\"" + name + "\"><<body>></span>";
		},
		t: {
			f: function (name) {
				return "<span ret=\"" + name + "\"><<body>></span>";
			}
		}
	}
};
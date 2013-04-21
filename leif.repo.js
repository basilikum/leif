module.exports = {
	text: {
		trim: function (text) {
			return text.trim();
		}
	},
	html: {
		span: function (name) {
			return "<span name=\"" + name + "\"><<body>></span>";
		}
	}
};
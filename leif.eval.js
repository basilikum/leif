var $ruvhdisj345u5djkfu284 = function (context) {

	var $ixlf03295hgba034h;
	for ($ixlf03295hgba034h in context) {
		if (context.hasOwnProperty($ixlf03295hgba034h) && !/^[0-9]/.test($ixlf03295hgba034h)) {
			eval("var " + $ixlf03295hgba034h + " = context[$ixlf03295hgba034h];");
		}
	}
	return {
		evaluate: function (expression) {
			return eval(expression);
		}
	};
};

module.exports.createContext = $ruvhdisj345u5djkfu284;
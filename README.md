#leif#

This is a template engine for node.js. It compiles written html template files to an array of strings and objects. Every piece of the template that can be interpreted at compile time will be interpreted at compile time. When a certain template is needed to build an actual page, the engine just filles in the voids with a context data object.

This project is still in very early development and so far it only supports a couple of functions for demonstration purposes.

##Usage##

    <html>
    	<head>
    	</head>
    	<body>
    		<div>
    			f:htmlHelper.span(name) {
    				<a href="f:get(link)"></a>
    			}           
    		</div>           
    	</body>   
    </html>

After compiling:

    [
    	"<html>\n\t<head>\n\t</head>\n\t<body>\n\t\t<div>\n\t\t\t",
    	{
    		type: "func",
    		func: span,
    		args: [{
    			type: "var",
    			value: "name",
    			up: 0
    		}],
    		body: [
    			"\n\t\t\t\t<a href=\"",
    			{
    				type: "inline",
    				func: get,
    				args: [{
    					type: "var",
    					value: "link",
    					up: 0
    				}]
    			},
    			"\"></a>"
    		]
    	},
    	"\n\t\t</div>\n\t</body>\n</html>"
    ]

With context = {name: "hello", link: "http://world.com"}:

    <html>
    	<head>
    	</head>
    	<body>
    		<div>
    			<span name="hello">
    				<a href="http://world.com"></a>
    			</span>           
    		</div>           
    	</body>   
    </html>

And this is how you would use it in node:

    var leif = require("leif");
    var fs = require("fs");
    
    fs.readFile("C:\\...\\intro.html", function(error, data) {
    	if (error) {
    		// no file error
    	} else {
    		var arr = leif.parseTemplate(data.toString());
    		var context = {name: "hello", link: "http://world.com"};
    		var html = leif.produceHTML(arr, context);
    	}
    });

Of course you would normally call the parseTemplate function only on startup or when the template has changed. Then you can produce the actual page, anytime it is needed and with different contents.




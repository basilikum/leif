#leif#

This is a template engine for node.js. It compiles written html template files to an array of strings and objects. Every piece of the template that can be interpreted at compile time will be interpreted at compile time. When a certain template is needed to build an actual page, the engine just filles in the voids with a context data object.

This project is still in very early development and so far it only supports a couple of functions for demonstration purposes.

##Usage##

    <html>
    	<head>
    	</head>
    	<body>
    		<div>
    			$:html.span(name) {
    				<a href="$:(link)"></a>
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
    			type: "eval",
    			content: "name"
    		}],
    		body: [
    			"\n\t\t\t\t<a href=\"",
    			{
    				type: "eval",
    				content: "link"
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
    
    leif.cacheView("C:\\...\\intro.html", function (err) {
        var html, context;
        if (err) {
            //error
        } else {
            ....
            context = {name: "hello", link: "http://world.com"};
            html = leif.requestViewByPath("intro", context);

        }
    })






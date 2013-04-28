#leif#

This is a fast and customizable template engine for node.js. It parses html template files to an intermediate form (caching) and interprets this form within a given context.

##Example##

Consider the following template file (intro.html):

    <html>
        <head>
            <title>$:(title)</title>
        </head>
        <body>
            <div>
                $:html.span(name) {
                    <a href="$:(link)"></a>
                }           
            </div> 
            $:foreach(arr) {
                <div value="$:text.trim(text)" p="$:($p.xy + '_suffix')"/>
            }          
        </body>   
    </html>


To evaluate the template you have to pass a context object, which contains the data you want to provide for your page.

    
    var context = {
        title: "this is my title",
        name: "hello",
        link: "http://www.somerandomurl.com",
        xy: "XY",
        arr: [{
            text: "obj1 "
        },{
            text: "obj2 "
        },{
            text: "obj3 "
        }]
    };
    
Then you can parse and translate the template with leif in the following way:

    var leif = require("leif"),
        result;

    leif.registerTemplateSync("C:\\...\\intro.html");
    result = leif.requestTemplateByPath("intro", context);

As a result you get the finished html document string:

    <html>
        <head>
            <title>this is my title</title>
        </head>
        <body>
            <div>
                <span name="hello">
                    <a href="http://www.somerandomurl.com"></a>
                </span>        
            </div> 
                <div value="obj1" p="XY_suffix"/>
                <div value="obj2" p="XY_suffix"/>   
                <div value="obj3" p="XY_suffix"/>         
        </body>   
    </html>

##Syntax##

Anywhere in your template you can access leif functionalities by using the leif access operator (dollar sign followed by a colon).

    $:

There are three different kinds of expressions that you can use in leif.

*   functions
*   evaluations
*   control constructs

###functions###

A function call is expressed in the same way as in javascript, with the only difference that you can provide your function with an additional body, enclosed in curly braces.

So, this is valid:

    $:html.span("some argument")

An so is this:

    $:html.span("some argument") {
        <a href="http://xyz.com"/>
    }

Functions are saved in a function repository. Every function in there is expected to return a string value. If you provide a body in your function call, every occurance of the string `<<body>>` in the result string, will be replaced with whatever you put inside the body. If you don't provide a body, every `<<body>>` will be replaced with an empty string.
In the rare cases that you actually want the result of your function to be followed by an open curly brace, you can mark the end of your function by an optional semicolon:

    $:text.trim("look at my curly braces ");{beautiful}

This will produce:

    look at my curly braces{beautiful}

###evaluations###

Evaluations are expressed by the access operator followed by an expression inside of parentheses:

    $:(Math.round(num + 1))

Everything inside the parentheses will be evaluated. You can put there any build in javascript function, anything from within your context object and anything from within the leif function repository. So if you pass the context object `{ num: 2.346 }`, the result will be `3`.

When you access leif functions within an evaluation, you do this without the access operator:

    $:(html.span("some argument"))

This simple example would only produce nearly the same result as the example in the "functions" block. The difference is, that it is not possible to add an optional body to your function call, when you access a function from inside an evaluation. And since inside the evaluation a function will just be evaluated, without any further checking, any `<<body>>` inside the return value will not be replaced but will remain in the result. So, to produce actually the same result as in the example above, you could manually replace the `<<body>>` parts:

    $:(html.span("some argument").replace("<<body>>", ""))

Technically, every argument that you pass to a leif function or to a control construct, is an evaluation statement.

You can use evaluation to print text that would otherwise be interpreted as leif syntax:

    $:("$:")

This will produce an actual dollar sign followed by a colon.

###control construct###

The syntax of control constructs is the same as of function. There are two different kinds of control construct in leif:

*   if
*   foreach

The if statement requires one boolean argument. Whether or not this argument evaluates to true, the body of the if statement will be printed or not. Any expression, that would evaluate to true in javascript, does the same in leif:

    if ("hello") {
        it works
    }

The result would be:

    it works

The foreach statement requires a single argument, that should be either an array of objects or an array of strings. The body of the foreach statement will be printed as many times as there are items in the passed array:

    foreach([{val:"v1"},{val:"v2"}]) {
        <span>$:(val)</span>
    }

This will produce:

    <span>v1</span>
    <span>v2</span>

##Function Repository##

The functions you can use in leif are defined in a function repository. The built-in function repository contains just two sample functions:

    {
        text: {
            trim: function(...){...}
        },
        html: {
            span: function(...){...}
        }
    }

You can add your own repository with

    var leif = require("leif");
    leif.setUserRepository({
            html: {
                button: function(caption, img) {
                    return "<div class='button-container'><img class='button-image' src='" + img + "'/><div class='button-text'>" + caption + "</div></div>"
                },
                display: function() {
                    return "<div class='display-container'><<body>></div>";
                }
            }
        });

The user repository will then be merged with the built-in repository:

    {
        text: {
            trim: function(...){...}
        },
        html: {
            span: function(...){...},
            button: function(...){...},
            display: function(...){...}
        }
    }

The functions in the built-in repository are divided into functions that produce HTML strings (html) and functions that produce non-HTML strings (text). You don't have to stick to this convention. You can structure and organize your repository the way you want.

Custom functions can be very useful. The following example shows how to implement nested templates with a simple custom function (to fully understand this example you probably have to read the other chapters first):

    //index.html
    <html>
        <head>
        </head>
        <body>
            <div class="header">
            </div>
            <div class="main-section">
                $:insert("list", $this)
            </div>
        </body>
    </html>

    //list.html
    <div class="list-container">
        $:foreach(arr) {
            <div class="list-item">$this</div>
        }
    </div>

    var leif = require("leif"),
        context = {
            arr: ["item1", "item2", "item3"]
        };

    leif.registerTemplateSync("index.html");
    leif.registerTemplateSync("list.html");

    leif.setUserRepository({
        insert: function (templateName, context) {
            return leif.requestTemplateByName(templateName, context);
        }
    });

    var res = leif.requestTemplateByName("index", context);

    //result
    <html>
        <head>
        </head>
        <body>
            <div class="header">
            </div>
            <div class="main-section">
                <div class="list-container">
                    <div class="list-item">item1</div>
                    <div class="list-item">item2</div>
                    <div class="list-item">item3</div>
                </div>
            </div>
        </body>
    </html>


##Context##

The context object, that you use to provide the actual data for your template, is supposed to be a javascript object. Inside that object you can provide any data you want. When leif evaluates an expression, it merges your context object with the complete function repository to produce the actual evaluation context. Therefore it is necessary in your context object not to use the same identifiers that you have used in the function repository.

The evaluation context can be different at different places in your template. So far, the only statement the changes the context, is the foreach statement.

    foreach([{val:"v1"},{val:"v2"}]) {
        <span>$:(val)</span>
    }

The evaluation context for the first iteration is {val:"v1"}, merged with the function repositiory. For the second iteration it is {val:"v2"}, merged with the function repository.

There are two special properties, that leif attaches to context objects:

*   `$p`
*   `$this`

The property `$p` will only be attached to context objects, that are created by the foreach statement. By using `$p` you can access the next higher context object, which is the context object that was used just before the foreach statement:

    //context
    {
        name: "hello",
        arr: [{
            text: "text1 "
        },{
            text: "text2 "
        }]
    };

    //template
    foreach(arr) {
        <span name="$:($p.name)">$:(text)</span>
    }

This will produce:

    <span name="hello">text1</span>
    <span name="hello">text2</span>

The `$this` property will be attached to every context object. It points to the current context itself. This is useful when you have an actual string value as context. By using `$this` and a slightly different context object, the example above can be rewritten as:

    //context
    {
        name: "hello",
        arr: ["text1", "text2"]
    };

    //template
    foreach(arr) {
        <span name="$:($p.name)">$:($this)</span>
    }

The result remains the same as it was before.

##Registering templates##

Before you can translate a template, you need to register it. You can register single templates or complete directories of templates.

    var leif = require("leif");

    //single template
    var err = leif.registerTemplateSync("C:\\...\\intro.html");

    //directory
    var err = leif.registerDirectorySync("C:\\...\\myTemplateDirectory");

Registered templates will be stored internally with a "path" and a "name" identifier. 
Consider the following folder structure in the myTemplateDirectory folder:

    myTemplateDirectory
        |
        +-- DirA
        |     |
        |     +-- myView1.html
        |     |
        |     +-- myView2.html
        |
        |
        +-- DirB
        |     |
        |     +-- myView3.html
        |
        |
        +-- index.html

After registering this directory, the internal template storage will look like this:

    {
        "myTemplateDirectory/DirA/myView1" : {
            file: "C:\\...\\myTemplateDirectory\\DirA\\myView1.html",
            name: myView1,
            cache: []
        },
        "myTemplateDirectory/DirA/myView2" : {
            file: "C:\\...\\myTemplateDirectory\\DirA\\myView2.html",
            name: myView2,
            cache: []
        },
        "myTemplateDirectory/DirB/myView3" : {
            file: "C:\\...\\myTemplateDirectory\\DirB\\myView3.html",
            name: myView3,
            cache: []
        }    
    }

The "path" identifier ("myTemplateDirectory/DirA/myView1") is always unique in the storage, while the same "name" identifier (name) can occur in multiple registered templates.

If you register a single template, the "path" and the "name" identifier will be the same.

    {
        "myTemplateDirectory/DirA/myView1" : {
            file: "C:\\...\\myTemplateDirectory\\DirA\\myView1.html",
            name: myView1,
            cache: []
        },
        "myTemplateDirectory/DirA/myView2" : {
            file: "C:\\...\\myTemplateDirectory\\DirA\\myView2.html",
            name: myView2,
            cache: []
        },
        "myTemplateDirectory/DirB/myView3" : {
            file: "C:\\...\\myTemplateDirectory\\DirB\\myView3.html",
            name: myView3,
            cache: []
        },  
        "mySingleTemplate" : {
            file: "C:\\...\\mySingleTemplate.html",
            name: mySingleTemplate,
            cache: []
        }    
    }

The "name" identifier will normally be the filename without its extension. When registering a single template you can provide an own identifier, using for instance the function `registerTemplateWithNameSync`.
You can access your registered templates with both identifiers, using accordant functions:

    var leif = require("leif");
    var context = {...};
    var result1 = leif.requestTemplateByName("myView2", context);
    var result2 = leif.requestTemplateByPath("myTemplateDirectory/DirB/myView3", context);

##Caching##

Instead of directly requesting a template after registering it, leif can cache your templates in an intermediate form, so that the time for all following requestes can be minimized.

###intermediate form###

To produce a page from a template and a context object, leif takes two separate steps:

1.   parsing the file
2.   interpret leif expressions in a certain context

In step 1 leif create an hierarchically intermediate object, that contains the html string separated by function objects

    //template
    <html>
        <head>
            <title>$:(title)</title>
        </head>
        <body>
            <div>
                $:html.span(name) {
                    <a href="$:(link)"></a>
                }           
            </div> 
            $:foreach(arr) {
                <div value="$:text.trim(text)" p="$:($p.xy + '_suffix')"/>
            }          
        </body>   
    </html>

    //intermediate form
    [
        "<html>\n\t<head>\n\t\t<title>",
        {
            type: "eval",
            content: "title"
        },
        "</title>\n\t</head>\n\t<body>\n\t\t<div>\n\t\t\t",
        {
            type: "func",
            func: function,
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
                "\"></a>\n\t\t\t"
            ]
        },
        "\n\t\t</div>\n\t\t",
        {
            type: "foreach",
            value: "arr",
            body: [
                "\n\t\t\t<div value=\"",
                {
                    type: "func",
                    func: function,
                    args: [{
                        type: "eval",
                        content: "text"
                    }],
                    body: ""
                },
                "\" p=\"",
                {
                    type: "eval",
                    content: "$p.xy + '_suffix'"
                },
                "\"/>\n\t\t"
            ]
        },
        "\n\t</body>\n</html>"
    ]

When leif can evaluate an expression within the first step (without a context object), it will evaluate it. So, if we change the following part from the example above:

    $:html.span(name) {
        <a href="$:(link)"></a>
    }

to this:

    $:html.span("my name") {
        <a href="$:('http://' + 'www.somerandomurl.com')"></a>
    }     

the part in the intermediate form will be change to this:

    "</title>\n\t</head>\n\t<body>\n\t\t<div>\n\t\t\t<span name=\"my name\">\n\t\t\t\t<a href="http://www.somerandomurl.com"></a>\n\t\t\t</span>\n\t\t</div>\n\t\t"

###using caching###

Leif normally caches a template on its first request. You can change that behaviour by using the property `cacheTemplatesOnFirstRequest`. You can also manually cache a template by using for instance the function cacheTemplateByPathSync:

    var leif = require("leif");

    //registering
    leif.registerTemplateSync("C:\\...\\intro.html");
    //caching
    leif.cacheTemplateByPathSync("intro");

    .
    .
    .

    //requesting
    leif.requestTemplateByPath("intro", context);

Keep in mind that a cached template will not take notice of any changes in the original file. If you change the file of a cached template you have to recache it in order to transfer these changes.

##API##

    var leif = require("leif");

###leif.registerDirectory(dir, callback)###

Registers all the templates within the directory `dir` and all subdirectories. The name of each template is the filename without the extension ".html". The `callback` gets one argument `(error)`, which is `null` on success.

###leif.registerDirectorySync(dir)###

Synchronous version of `registerDirectory`. Return value is `error`, which is `null` on success.

###leif.registerTemplate(file, callback)###

Registers the template in `file`. The name of the template is the filename without the extension ".html". The `callback` gets one argument `(error)`, which is `null` on success.

###leif.registerTemplateSync(file)###

Synchronous version of `registerTemplate`. Return value is `error`, which is `null` on success.

###leif.registerTemplateWithName(file, name, callback)###

Registers the template in `file`. The name of the template is the argument `name`. The `callback` gets one argument `(error)`, which is `null` on success.

###leif.registerTemplateWithNameSync(file, name)###

Synchronous version of `registerTemplateWithName`. Return value is `error`, which is `null` on success.

###leif.cacheTemplateByName(name, callback)###

Searches the register for a template with the name `name` and caches the templates by parsing the template file and creating the intermediate form. If the template was already cached, the old cache will be overridden. The `callback` gets one argument `(error)`, which is `null` on success.

###leif.cacheTemplateByNameSync(name)###

Synchronous version of `cacheTemplateByName`. Return value is `error`, which is `null` on success.

###leif.cacheTemplateByPath(path, callback)###

Caches the template with the path `path` by parsing the template file and creating the intermediate form. If the template was already cached, the old cache will be overridden. The `callback` gets one argument `(error)`, which is `null` on success.

###leif.cacheTemplateByPathSync(path)###

Synchronous version of `cacheTemplateByPath`. Return value is `error`, which is `null` on success.

###leif.cacheAllTemplates(callback)###

Caches all registered templates. If a template was already cached, the old cache will be overridden. The `callback` gets one argument `(error)`, which is `null` on success.

###leif.cacheAllTemplatesSync()###

Synchronous version of `cacheAllTemplates`. Return value is `error`, which is `null` on success.

###leif.requestTemplateByName(name, context)###

Synchronous function, that searches the register for a template with the name `name` and translates it using the `context` object. If the found template is cached, it will interpret the cache, otherwise it will parse the original file. How this function will react on multiple occurances with the same name is handled by the property `returnFirstTemplateOnMultipleMatches`. Return value is the translated html string or `null` on errors.

###leif.requestTemplateByPath(path, context)###

Synchronous function, that translates the template with the path `path` using the `context` object. The `path` is a "/" separated string that contains all the folder names und the template file name up from the directory that was registered ("dirA/dirA/index"). Return value is the translated html string or `null` on errors.

###leif.clearCache()###

Clears the cache for all registered templates. This function has no return value.

###leif.clearRegister()###

Clears the register. This function has no return value.

###leif.setUserRepository(repo)###

Synchronous function, that sets the user function repository. The argument `repo` is any javascript object, that can contain subobjects and functions. The functions should return string values, that contain optional `<<body>>` tags, to declare where to put the body.

    {
        stringFunctions: {
            trim: function(...){...},
            reverse: function(...){...}
        },
        myTopFunction: function(...){...}
    }

###leif.overrideExistingTemplates###

Boolean property. Defines the behaviour on registering a template with the same path as an template that is already registered. If `true`, the previous template will be overridden. If `false`, the existing template remains and depending on the property `throwErrorOnOverrideExistingTemplates` an error will be returned. Default value is `false`.

###leif.throwErrorOnOverrideExistingTemplates###

Boolean property. Defines if an error will be returned, when trying to register a template with the same path as an template that is already registered. This will only have an effect if the property `overrideExistingTemplates` is set to `false`. Default value is `true`.

###leif.returnFirstTemplateOnMultipleMatches###

Boolean property. Defines the behaviour when searching a registered template by its name and finding multiple occurances. If `true`, the first occurance will be returned. If `false`, an error will be returned. Default value is `false`. Be aware that if you use the asynchronous function `registerDirectory`, there is no guarantee in which order the templates will be saved in the template storage.

###leif.cacheTemplatesOnFirstRequest###

Boolean property. Defines if leif should automatically cache a template when it is first requested. Default value is `true`.







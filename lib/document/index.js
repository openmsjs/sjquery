/*
 * Copyright (c) 2010 Sharegrove Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

var sys = require("sys");

var domElementConstructor = function(){};
var domelement = domElementConstructor.prototype;

domelement.parentNode = null;

/*
domelement._init = function(pDom){
    var all = domelement._all;
    this._elId = all.length;
    all[this._elId] = this;

    if (pDom == null) throw("missing dom information");

    //not XML coerced to string, or a text xml node
    if ( !(pDom instanceof XML) || pDom.name() == null){
        this.nodeValue = pDom.toString();
        this.nodeName = "#text";
    } else {
        //only element nodes get ids
        this.nodeName = pDom.name().localName.toUpperCase();

        //attributes
        var attributes = pDom.attributes();
        for (var i=0; i< attributes.length(); i++){
            var attrName  = attributes[i].name();
            var attrValue  = attributes[i].toString();
            if (attrName == "style"){
                attrValue = this.parseStyle(attrValue);
            } else if (attrName == "class"){
                attrName = "className";
            }

            this[attrName] = attrValue;
        }
        //every elementNode has a style
        if (!this.style) this.style = {};

        //children
        this.childNodes = [];
        var childNodes = pDom.children();
        for (var i=0; i< childNodes.length(); i++){
            var child = childNodes[i];
            //skip whitespace
            if (!child.name() && child.toXMLString().match(this._whitespaceMatcher)) continue;
            this.appendChild(child);
        }
    }
}
*/

domelement._whitespaceMatcher = /^\s*$/g;
domelement._styleMatcher = /.*?:.*?;/g;
domelement._stylePropertyMatcher = /\s*(\S*)\s*:\s*(.*?)\s*;/;
//This is public so it can be used as a utility function (statically) elsewhere
domelement.parseStyle = function(styleString){
    var style = {};
    if (styleString.charAt(styleString.length-1) != ";"){
        styleString += ";";
    }
    var matches = styleString.match(this._styleMatcher);
    for (var i =0; matches && i<matches.length; i++){
        var parsed = matches[i].match(this._stylePropertyMatcher);
        var k = parsed[1];
        k = reverseStyleConversion[k] || k;
        style[k] = parsed[2];
    }
    return style;
}

domelement.appendChild = function(child){
    //jQuery does this with a comment node for testing
    if (child == null) return null;

    this.childNodes.push(child);
    child.parentNode = this;
    return child;
}

domelement._removed = false;
domelement.removeChild = function(child){
    for (var i=0; i < this.childNodes.length; i++){
        if (this.childNodes[i] == child){
            this.childNodes.splice(i, 1);
            child.parentNode = null;
            return child;
        }
    }
    return null;
}

domelement.replaceChild = function(newChild, oldChild){
    if (oldChild.parentNode != this){
    }

    this.insertBefore(newChild, oldChild);
    var removed = this.removeChild(oldChild);
    if (!removed) {
        throw "Couldn't find child " + oldChild.generateId() + " in " + this.generateId();
    }
    return removed;
}


domelement.insertBefore = function(newChild, refChild){
    //although some browers allow this, IE doesn't, so this is an error
    if (refChild == null) throw "No node specified for insertBefore";

    for (var i=0; i < this.childNodes.length; i++){
        if (this.childNodes[i] == refChild){
            newChild.parentNode = this;
            this.childNodes.splice(i , 0, newChild);
            return newChild;
        }
    }

    throw("Couldn't find " + refChild + " in " + this);
}

domelement.getElementsByTagName = function(name){
    var all = this.ownerDocument._all;
    var r = [];
    var uName = name.toUpperCase();
    for (var i=0; i<all.length; i++){
        var el = all[i];
        if (el.nodeName == "#text") continue;
        if (name != "*" && el.nodeName != uName) continue;

        var isChild = false;
        var p = el;
        while(p && !isChild){
            isChild = p.parentNode == this;
            p = p.parentNode;
        }

        if (isChild) r.push(el);
    }

    return r;
}

domelement.getAttribute = function(name){
    return this[name];
}

domelement.setAttribute = function(name, val){
    return this[name] = val;
}

domelement.focus = function(){
    document._initialfocus = this.generateId();
}

domelement.generateId = function(){
    if (!this.id) this.id = "_msjs_de-" + this._elId;
    return this.id;
}

domelement._getDebugName = function(){
    var name = "dom:"+this.nodeName;
    if (this.id) name += "#" + this.id;
    return name;
}

var scrollTops = null;
domelement.__defineSetter__("scrollTop",  function(val){
    if (!scrollTops) scrollTops = {};
    scrollTops[this.generateId()] = val;
    this._scrollTop = val;
});

domelement.__defineGetter__("scrollTop",  function(val){
    return this._scrollTop;
});

domelement.innerHTML = null;
domelement.toJDOM = function(){
    if (this.nodeName == "#text") return new Packages.org.jdom.Text( this.nodeValue );

    var el = new Packages.org.jdom.Element(this.nodeName.toLowerCase(), this.xhtmlNs);
    
    //now handle children
    var doChildren = true;
    if (this.nodeName == "SCRIPT"){
        el.setAttribute("type", "text/javascript"); //what else?
        if (this.childNodes && this.childNodes.length){
            el.addContent("//");
            var scriptString = "void 0;\n";
            msjs.each(this.childNodes, function(child){
                scriptString += child.nodeValue + "\n";
            });
            el.addContent( new Packages.org.jdom.CDATA( scriptString + "\n//") );
        }
        return el;
    }


    if (this.nodeName == "FORM"){
        el.setAttribute("method", "post");
        if (!this.action){
            el.setAttribute("action", "#form-" + this.id || "anon");
        }
        if (!this.onsubmit){
            el.setAttribute("onsubmit", "return false");
        }
    }

    msjs.each(this.childNodes, function(child){
        el.addContent(child.toJDOM());
    });

    return el;
}

assembleStyle = function(styleObj){
    var style = "";
    for (var sK in styleObj){
        var sV= styleObj[sK];
        if (sV == null) continue;
        var sK = styleConversion[sK] || sK;
        style += sK + ":" + sV + ";";
    }

    return style;
}



var styleConversion = require("./styleconversion");
var reverseStyleConversion = {};
for (var k in styleConversion){
    reverseStyleConversion[styleConversion[k]] = k;
}

domelement._isPacked = false;

domelement._unpackF = function(domId){
    return document.getElementById(domId);
}

domelement.cloneNode = function(deep) {
    if (this.nodeName == "#text"){
        return document.createTextNode(this.nodeValue);
    }

    var clone = document.createElement(this.nodeName);

    for (var k in this){
        if (this._isAttribute(k)) {
            //clone copies ids
            var attr = k == "_id" ? "id" : k;
            clone[attr] = msjs.copy(this[attr]);
        }
    }

    if (deep) {
        msjs.map(this.childNodes, function(el){
            clone.appendChild(el.cloneNode(deep));
        });
    }
    return clone;
};


var isAttribute = function(el, attr) {
    if (!el.hasOwnProperty(attr)) return false;
    if (el[attr] instanceof Function) return false;

    //TODO: This should be whitelist
    switch (attr){
        //not attributes
        case "ownerDocument":
        case "parentNode":
        case "childNodes":
        case "_elId":
        case "cssRules":
        case "nodeName":
        case "head":
        case "body":
        case "msj":
        case "_focusable":
        case "_debugRef":
        case "_packageName":
        case "$packageName":
        case "_idcache":
        case "_removed":
        case "_listeners":
        case "_isPacked":
        case "_scrollTop":
        //jquery adds these
        case "height": 
        case "width":
        case "marginTop":
        case "paddingTop":
        case "marginBottom":
        case "paddingBottom":
            return false;
    }

    return true;
};

domelement.addEventListener = function(type, callback, useCapture){
    document._listeners.push( {
        type : type,
        element : this,
        callback : callback,
        useCapture : useCapture
    });
}

domelement.removeEventListener = function(type, listener, useCapture){
    throw "TODO";
}

var documentConstructor = function(){};
var document = documentConstructor.prototype;
exports.make = function(){
    var newDocument = new documentConstructor();
    newDocument._init();
    return newDocument;
}

document.createElement = function(tag){
    var d = this._makeNode(tag.toUpperCase());
    d.childNodes = [];
    return d;
}

document._makeNode = function(nodeName){
    var d = new domElementConstructor();
    d.ownerDocument = this;
    d.nodeName = nodeName;
    d.style = {};
    return d;
}

document.createTextNode = function(text){
    var d = this._makeNode("#text");
    d.nodeValue = text;
    return d;
}

document._init = function(){
    this._all = [];
    this._listeners = [];
    this._cookiesIncoming = [];
    this._cookiesAdded = [];
    var html = this.createElement("html");
    html.lang = "en";

    var head = html.appendChild(this.createElement("head"));
    var meta = head.appendChild(this.createElement("meta"));

    meta.content="text/html;charset=utf-8";
    meta["http-equiv"] ="Content-Type";

    var body = html.appendChild(this.createElement("body"));

    this.documentElement = html;
    this.head = head;
    this.body = body;

}

document.getElementsByTagName = function(name){
    return document.documentElement.getElementsByTagName(name);
}

/* jquery compatibility */
document.createComment = function(){};

var documentFragment = function(){
    this.childNodes = [];
}

document.createDocumentFragment = function(){
    var frag = new documentFragment();
    return frag;
}

documentFragment.prototype = new domElementConstructor();
documentFragment.prototype.cloneNode = function(){
    var frag = new documentFragment();

    msjs.each(this.childNodes, function(el){
        frag.childNodes.push(el.cloneNode(true));
    });

    return frag;
}

documentFragment.prototype.toJDOM = function(){
    return new Packages.org.jdom.Text( "fraggit" );
}

domelement.createDocumentFragment = document.createDocumentFragment;


/*end jquery stuff */

document._initialfocus = null;

document._focusable = {
    INPUT  : true,
    BUTTON : true,
    SELECT : true,
    A      : true,
    TEXTAREA : true 
}

exports.render = function(stream, document){
    return render(stream, document.documentElement);
}

var each = function(obj, f){
    if (!isNaN(obj.length) && (typeof obj != "string")){
        for (var i=0; i<obj.length; i++){
            if (f(obj[i], i) == false) return;
        }
    } else if (obj){
        f(obj, 0);
    }
}

var ENCODING = "utf-8";
var render = function(stream, el){
    if (el.nodeType == 3){
        //escaping!
        stream.write(xmlEscape(el.nodeValue), ENCODING);
    } else {
        var tagName =el.nodeName.toLowerCase();

        stream.write("<" + tagName , ENCODING);

        for (var k in el){
            if (!isAttribute(el, k)) continue;

            var name = k;
            var value = el[k];
            var skip =false;

            switch (k){
                case "_id":
                    name = "id";
                    break;

                case "style":
                    value = assembleStyle(value);
                    if (value == "") skip = true;
                    break;
                    
                case "className":
                    name = "class";
                    break;

                case "checked":
                case "readOnly":
                case "disabled":
                    if (!value) skip = true;
                    else name = k.toLowerCase();
                    break;

                default:
                    if (value == null || value === "") skip = true;
                    break;
            }

            if (!skip){
                stream.write(" " + name + '=\"' + xmlEscape(value) + '"', ENCODING);
            }
        }

        //TODO: self closing?
        stream.write(">");

        if (el.childNodes.length){
            each( el.childNodes, function(child){
                render(stream, child);
            });
        } else {
        }

        stream.write("</" + tagName + ">");
    }
}
var RE_QUOTE = /\"/g;
var RE_APOS = /\'/g;
var RE_LT = /</g;
var RE_GT = />/g;
var RE_AMP = /&/g;
var xmlEscape = function(text){
    //do this first
    text = text.replace(RE_AMP, "&amp;");

    text = text.replace(RE_QUOTE, "&quot;");
    text = text.replace(RE_APOS, "&apos;");
    text = text.replace(RE_LT, "&lt;");
    text = text.replace(RE_GT, "&gt;");

    return text;

}

document.renderAsXHTML = function(script){
    var head = this.head;
    var title = this.title;
    delete this.title;

    //head.appendChild(<title>{title}</title>);
    msjs.each(this._getScriptResources(msjs.clientPackages), function(node){
        head.appendChild(node);
    });

    // place all unattached nodes in hidden div
    var unattachedEl = null;
    var all = this._all;
    for (var i=0; i < all.length; i++){
        var el = all[i];
        /*
        if (el.parentNode == null && el._isPacked && el != this.documentElement && !el._removed){
            if (!unattachedEl) {
                unattachedEl = this.body.appendChild(<div id="_msjs_unattached" style="display: none"/>);
            }
            unattachedEl.appendChild(el);
        }
        */
    }


    if (scrollTops){
        var scrollScript = "(" + function(scrollTops){
            for (var id in scrollTops){
                document.getElementById(id).scrollTop = scrollTops[id];
            }
        } + ")";
        scrollScript += "(" + msjs.toJSON(scrollTops) + ")";
        //this.body.appendChild( <script>{scrollScript}</script>);
    }

    if (script){
        //this.body.appendChild( <script>{script}</script>);
    }

    if (this._initialfocus){
        var focusScript = 
        /*
        this.body.appendChild(
            <script>{
            "$(function(){document.getElementById('" + this._initialfocus + "').focus();})"
            }</script>
        );
        */
        this._initialfocus = null;
    }


    return this.documentElement.toJDOM();
}


document.getEventHandlers = function(){
    return msjs.map(this._listeners, function(listener){
        return {
            type: listener.type,
            useCapture : listener.useCapture,
            element : msjs.pack(listener.element),
            callback :  msjs.pack(listener.callback)
        };
    });
}

document.isElement = function(value){
    return value && value instanceof domelement;
}

document._msjs_getUnpacker = function() {
    return [function(){return document}, []];
}

document._getDebugName = function(){
    return "document";
}
document.nodeType = 9;

document.__defineSetter__("cookie", function(s){
    if (!s) return;
    var pairs = s.split(";");

    //TODO: make sure we don't already have this cookie


    var cookie;
    msjs.each(pairs, function(pair, n){
        var parts = pair.split("=");
        var k = new java.lang.String(parts.shift()).trim().toString();
        var v = new java.lang.String(parts.join("=")).trim().toString();
        if (n == 0){
            cookie = new javax.servlet.http.Cookie(k, v)
        } else switch(k){
            case "expires":
                var df = new java.text.SimpleDateFormat("EEE, dd MMM yyyy HH:mm:ss z");
                var now = new Date();
                cookie.setMaxAge(now.getTime() - df.parse(v).getTime());
                break;
            case "path":
                cookie.setPath(v);
                break;
            case "domain":
                cookie.setDomain(v);
                break;
            case "secure":
                cookie.setSecure(true);
                break;
        }

    });
    this._cookiesAdded.push(cookie);


});

document.__defineGetter__("cookie", function(){
    var s = "";

    function appendCookie(cookie){
        if (s) s += "; ";
        s += cookie.name + (cookie.value ? "=" + cookie.value : "");
    }

    msjs.each(this._cookiesAdded, appendCookie);
    msjs.each(this._cookiesIncoming, appendCookie);

    return s;
});

document.setIncomingCookies = function(cookies){
    this._cookiesIncoming = cookies;
}

document.getUpdatedCookies = function(){
    var c = this._cookiesAdded;
    this._cookiesAdded = [];
    return c;
}


//Since elements that aren't part of the document aren't
//returned by this function, this is a list of lists
document._idcache = {};
document.getElementById = function(id){
    var list = this._idcache[id];
    for (var i=0; list && i< list.length; i++){
        var el = list[i];
        if (this._isInDocument(el)) return el;
    }
    return null;
}

document._isInDocument = function(el){
    var p = el;
    while (p.parentNode != null){
        p = p.parentNode
    }
    return p == this.documentElement;
}

domelement.__defineSetter__("id", function(id){
    if (this._id){
        var index = document._idcache.indexOf(this._id);
        document._idcache.splice(index, 1);
    }
    if (!document._idcache[id]) document._idcache[id] = [];
    document._idcache[id].push(this);
    this._id = id;
});

domelement.__defineSetter__("innerHTML", function(html){
    /*
    var name = this.nodeName.toLowerCase(); 
    var xml = "<" + name + ">" + html + "</" + name + ">";
    var made = document.createElement(new XML(xml));
    while (this.childNodes.length){
        this.removeChild(this.childNodes[0]);
    }
    while (made.childNodes.length){
        this.appendChild(
            made.removeChild(made.childNodes[0])
        );
    }
    //make sure this node doesn't get sent to client
    made._removed = true;
    */
});

domelement.__defineGetter__("id", function(){
    return this._id;
});

domelement.__defineGetter__("nextSibling", function(){
    return this._findSibling(1);
});

domelement.__defineGetter__("firstChild", function(){
    return this.childNodes[0];
});

domelement.__defineGetter__("lastChild", function(){
    return this.childNodes[this.childNodes.length - 1];
});

domelement.__defineGetter__("previousSibling", function(){
    return this._findSibling(-1);
});

domelement._findSibling = function(direction){
    if (!this.parentNode) return null;
    var children = this.parentNode.childNodes;

    for (var i=0; i<children.length; i++){
        if (this == children[i]){
            return children[i+direction];
        }
    }

    return null;
}


exports.fillScope = function(scope){
    //not my idea
    scope.window = scope;

    scope.document = exports.make();
    scope.location = {href:""}; //This is set in dom.pack
    scope.navigator = {
        cookieEnabled : true,
        mimeTypes : [],
        plugins : [],
        userAgent : "msjs fake window", 
        javaEnabled : false //ironic, no?
    }

    return scope;
}


domelement.__defineGetter__("nodeType", function(){
    return nameToType[this.nodeName] || 1;
});

var nameToType = {
    "#text" : 3,
    "html" : 9,
    "#document-fragment" : 11
}
/*
1	ELEMENT_NODE
2	ATTRIBUTE_NODE
3	TEXT_NODE
4	CDATA_SECTION_NODE
5	ENTITY_REFERENCE_NODE
6	ENTITY_NODE
7	PROCESSING_INSTRUCTION_NODE
8	COMMENT_NODE
9	DOCUMENT_NODE
10	DOCUMENT_TYPE_NODE
11	DOCUMENT_FRAGMENT_NODE
12	NOTATION_NODE
*/

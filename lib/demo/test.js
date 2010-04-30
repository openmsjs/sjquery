var h1 = document.body.appendChild(document.createElement("h1"));
h1.appendChild(document.createTextNode("hello sjquery"));

var hidiv = document.body.appendChild(document.createElement("div"));
var encodeMe = "本<x'x&s> hi 本<x'x&s>";
hidiv.appendChild(document.createTextNode(encodeMe));

var img =  document.body.appendChild(document.createElement("img"))
img.src ="http://www.appsheriff.com/wp-content/uploads/2010/01/node-js.jpg";
img.width = 20;
img.alt = encodeMe;
img.title = encodeMe;

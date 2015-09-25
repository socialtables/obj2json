# obj-to-json

Convert Wavefront .obj files to Three.js JSON format, using
[Blender](http://www.blender.org) and its Python API. Bundles the
[Three.js exporter](https://github.com/mrdoob/three.js/tree/master/utils/exporters/blender/)
along with a custom script to drive the import / export.

Example:
```javascript
var path = require("path");
var obj2json = require("obj-to-json");
// NOTE: The module can detect standard install locations for Blender on Linux
// and OS X, but also accepts a `blenderPath` option to provide a non-standard path
var opts = {
	inputFile: path.join(__dirname, "circle.obj"),
	outputFile: path.join(__dirname, "circle2.json")
};
obj2json(opts, function(err, outputFilePath) {
	if (err) {
		console.error("ERROR:", err);
	}
	else {
		console.log("Output file at:", outputFilePath);
	}
});
```

A promise-based interface is also available, based on Node 0.12+ native Promises:
```javascript
var path = require("path");
var obj2json = require("obj-to-json/as-promised");
var opts = {
	inputFile: path.join(__dirname, "circle.obj"),
	outputFile: path.join(__dirname, "circle2.json")
};
obj2json(opts)
	.then(function(outputFilePath) {
		console.log("Output file at:", outputFilePath);
	})
	.catch(function (err) {
		console.error("ERROR:", err);
	});
```

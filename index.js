/* eslint-env node */
/**
	Convert Wavefront .obj files (including any accompanying .mtl files) to the
	Three.js JSON format, using Blender (http://blender.org) to do the heavy
	lifting.

	Provides both a classic Node and a Promise-based interface (through the
	`obj-to-json/as-promised` path)
 */
var os = require("os");
var fs = require("fs");
var path = require("path");
var childProcess = require("child_process");
// var debug = require("debug")("obj-to-json:index");

/**
	Locate the Blender binary. Depending on the platform this is expected
	to be in `/usr/bin` or in `/Applications`. If the expected binary path
	is found, it is returned to the callback; otherwise the default value
	of `blender` is returned, in case it's in the caller's PATH.
*/
function findBlenderBinary(callback) {
	var expectedPath = "blender";
	switch(os.platform()) {
		case "linux":
			expectedPath = "/usr/bin/blender";
			break;
		case "darwin":
			expectedPath = "/Applications/Blender.app/Contents/MacOS/blender";
			break;
		default:
			break;
	}
	fs.access(expectedPath, fs.X_OK, function(err) {
		if (err) {
			callback(null, "blender");
		}
		else {
			callback(null, expectedPath);
		}
	});
}

/**
	Call the Blender binary to perform the conversion from .obj to JSON.

	@param binPath Path to the Blender binary
	@param inputFile Full path to the input .obj file. Any .mtl files referenced
		must be in the same directory as the .obj
	@param outputFile Full path to the output .json file -- will be created if it
		does not exist, and overwritten if it does.
	@param callback Function to be called when the conversion is complete. Must
		take (error, result) parameters. On success, the `result` parameter will be
		the full path to the output file as returned by the Blender script
*/
function callBlenderScript(binPath, inputFile, outputFile, callback) {
	var pythonScript = path.join(__dirname, "script", "obj_to_json.py");
	var cmdParts = [
		binPath,
		"--factory-startup", // Don't load user preferences -- we don't need them
		"--addons io_three", // Use the Three.js exporter we bundle
		"--background", // Don't try and open a GUI
		"--python " + pythonScript, // Execute the bundled script
		"--", // Pass the following arguments to the script
		"-i " + inputFile,
		"-o " + outputFile
	];
	var cmd = cmdParts.join(" ");
	var processOpts = {
		env: {
			BLENDER_USER_SCRIPTS: path.join(__dirname, "vendor", "three", "blender-exporter"),
			PATH: process.env.PATH // Ensure this is inherited
		}
		// timeout?
		// cwd?
	};
	childProcess.exec(cmd, processOpts, function(err, stdout, stderr) {
		if (err) {
			return callback(err);
		}
		// If there's any output in stderr, it's come from our script or
		// from the `io_three` plugin (since that has logging set to "error")
		// -- we can assume something's gone wrong
		var stderrString = stderr.toString();
		if (stderrString) {
			return callback(stderrString);
		}
		var stdoutString = stdout.toString();
		// We have to parse stdout for the line beginning `-- OBJ-TO-JSON --:`
		// as that's the output from our script
		var output;
		if (stdoutString) {
			var scriptOutputRgx = /-- OBJ-TO-JSON --:(.*)/;
			var match = stdoutString.match(scriptOutputRgx);
			output = (match) ? match[1] : null;
		}
		return callback(null, output);
	});
}

/**
	High-level interface -- check arguments and then call the conversion
	routines.

	@param opts Object containing:
		inputFile: relative path to the input `.obj` file. Any `.mtl` files
			that are referenced need to be in the same directory as the `.obj`
		outputFile: relative path to the output JSON file
		blenderPath: (optional) full path to the Blender binary. If not provided,
			it'll try and detect common paths and fall back to just the string
			`blender`, hoping it's in the PATH.
	@param callback Standard Node callback taking an error argument (for any
		errors encountered during conversion) and a result argument (the full
		path to the output file).
*/
function convert(opts, callback) {
	if (!opts.inputFile) {
		return callback(new Error("No input file provided!"));
	}
	if (!opts.outputFile) {
		return callback(new Error("No output file provided!"));
	}
	if (opts.blenderPath) {
		return fs.access(opts.blenderPath, fs.X_OK, function(err) {
			if (err) {
				return callback(err);
			}
			return callBlenderScript(opts.blenderPath, opts.inputFile, opts.outputFile, callback);
		});
	}
	else {
		return findBlenderBinary(function(err, blenderPath) {
			if (err) {
				return callback(err);
			}
			return callBlenderScript(blenderPath, opts.inputFile, opts.outputFile, callback);
		});
	}
}

// Add the other scripts onto the exported function as properties, so that they can
// be used / tested separately
convert.findBlenderBinary = findBlenderBinary;
convert.callBlenderScript = callBlenderScript;

module.exports = convert;

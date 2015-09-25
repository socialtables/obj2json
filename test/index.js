/* eslint-env node, mocha */
var mockery = require("mockery");
var assert = require("assert");
var path = require("path");
// var debug = require("debug")("obj-to-json:test");

/**
	Take a relative path from this file and turn it into an absolute path
*/
function relativePath(p) {
	return path.join(__dirname, p);
}

describe("obj-to-json", function() {
	describe("findBlenderBinary", function() {
		beforeEach(function() {
			mockery.enable({useCleanCache: true});
			mockery.registerAllowables([
				"util", "tty", "path", "child_process",
				"debug", "./debug", "ms", "../index"]);
		});
		afterEach(function() {
			mockery.deregisterAll();
			mockery.disable();
		});
		it("should detect Linux", function(done) {
			// Pretend that we are Linux and /usr/bin/blender is executable
			mockery.registerMock("os", {
				platform: function() {
					return "linux";
				}
			});
			mockery.registerMock("fs", {
				"access": function(path, mode, callback) {
					if (path === "/usr/bin/blender") {
						callback();
					}
					else {
						callback(new Error("Unrecognized path in test"));
					}
				}
			});
			var obj2json = require("../index");
			obj2json.findBlenderBinary(function(err, result) {
				assert.equal(err, undefined);
				assert.equal(result, "/usr/bin/blender");
				done();
			});
		});
		it("should detect OS X", function(done) {
			// Pretend that we are OS X and /Applications/Blender.app/Contents/MacOS/blender
			mockery.registerMock("os", {
				platform: function() {
					return "darwin";
				}
			});
			mockery.registerMock("fs", {
				"access": function(path, mode, callback) {
					if (path === "/Applications/Blender.app/Contents/MacOS/blender") {
						callback();
					}
					else {
						callback(new Error("Unrecognized path in test"));
					}
				}
			});
			var obj2json = require("../index");
			obj2json.findBlenderBinary(function(err, result) {
				assert.equal(err, undefined);
				assert.equal(result, "/Applications/Blender.app/Contents/MacOS/blender");
				done();
			});
		});
		it("should fall back to `blender`", function(done) {
			// Pretend that we are something else
			mockery.registerMock("os", {
				platform: function() {
					return "win32";
				}
			});
			mockery.registerMock("fs", {
				"access": function(path, mode, callback) {
					callback(new Error("Unrecognized path in test"));
				}
			});
			var obj2json = require("../index");
			obj2json.findBlenderBinary(function(err, result) {
				assert.equal(err, undefined);
				assert.equal(result, "blender");
				done();
			});
		});
	});
	describe("callBlenderScript", function() {
		// In order to test that we're calling an external script correctly
		// we call a test script that provides the information we need, i.e.
		// the calling environment and arguments
		var obj2json = require("../index");
		var opts = {
			blenderPath: relativePath("test_script.sh"),
			inputFile: relativePath("circle.obj"),
			outputFile: relativePath("circle2.json")
		};

		it("should set up the environment", function(done) {
			obj2json(opts, function(err, result) {
				assert.equal(err, null);
				assert.notEqual(result, null);
				var userScriptPath = relativePath("../vendor/three/blender-exporter");
				var envVar = new RegExp("BLENDER_USER_SCRIPTS=" + userScriptPath);
				assert.ok(result.match(envVar));
				done();
			});
		});
		it("should use the right arguments", function(done) {
			obj2json(opts, function(err, result) {
				assert.equal(err, null);
				assert.notEqual(result, null);
				assert.ok(result.match(/--factory-startup/), "No --factory-startup");
				assert.ok(result.match(/--addons io_three/), "No --addons");
				assert.ok(result.match(/--background/), "No --background");
				var pythonScriptPath = new RegExp(
					"--python " + relativePath("../script/obj_to_json.py"));
				assert.ok(result.match(pythonScriptPath),
									"Did not match Python script path");
				var inputFilePath = new RegExp("-i " + opts.inputFile);
				assert.ok(result.match(inputFilePath),
									"Did not match input file path: " + inputFilePath);
				var outputFilePath = new RegExp("-o " + opts.outputFile);
				assert.ok(result.match(outputFilePath),
									"Did not match output file path: " + outputFilePath);
				done();
			});
		});
	});
	describe("interface", function() {
		var obj2json = require("../index");
		it("should require inputFile", function(done) {
			obj2json({outputFile: "foo"}, function(err, result) {
				assert.notEqual(err, undefined);
				assert.equal(result, undefined);
				assert.equal(err.message, "No input file provided!");
				done();
			});
		});
		it("should require outputFile", function(done) {
			obj2json({inputFile: "foo"}, function(err, result) {
				assert.notEqual(err, undefined);
				assert.equal(result, undefined);
				assert.equal(err.message, "No output file provided!");
				done();
			});
		});
		it("should recognize blenderPath", function(done) {
			var opts = {
				inputFile: "foo",
				outputFile: "bar",
				blenderPath: "baz"
			};
			obj2json(opts, function(err, result) {
				assert.notEqual(err, undefined);
				assert.equal(result, undefined);
				assert.equal(
					err.message,
					"ENOENT: no such file or directory, access 'baz'");
				done();
			});
		});
	});
	describe("promise interface", function() {
		// Since we are only testing that the promise interface appropriately
		// wraps the callback interface, a simple test for error-handling should
		// be plenty.
		var obj2json = require("../as-promised");
		it("should catch errors", function(done) {
			obj2json({})
				.catch(function(err) {
					assert.equal(err.message, "No input file provided!");
					done();
				});
		});
	});
	describe("conversion", function() {
		// NOTE: This assumes you have Blender installed at one of the expected
		// locations: /usr/bin/blender on Linux, /Applications/Blender.app on OS X
		var obj2json = require("../index");
		it("should work", function(done) {
			var opts = {
				inputFile: relativePath("circle.obj"),
				outputFile: relativePath("circle2.json")
			};
			obj2json(opts, function(err, result) {
				done(err);
			});

		});
	});
});

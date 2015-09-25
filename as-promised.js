/* eslint-env node */
/**
	Node native Promise interface to converting OBJ to JSON
*/
var convert = require("./index");

/**
	Call the `convert` functions and return a promise resolving to its results.
*/
function promiseConvert(opts) {
	return new Promise(function(resolve, reject) {
		convert(opts, function(err, result) {
			if (err) {
				return reject(err);
			}
			else {
				return resolve(result);
			}
		});
	});
}

module.exports = promiseConvert;

var path = require("path");
/**
	Take a relative path from the calling file and turn it into an absolute path
*/
function relativePath(p) {
	return path.join(__dirname, p);
}

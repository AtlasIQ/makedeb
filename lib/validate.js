var fs = require('fs');
var path = require('path');

// Expects a string with a non-zero length.
function isValidString(str) {
    return (typeof str === 'string' && str.length > 0);
}

// Expects that a version is a number or a non-zero length string.
function isValidVersion(version) {
    return (isValidString(version) || typeof version === 'number');
}

// Expects that a path points to a real directory.
function isRealDirectory(p) {
    var stats;
    try {
        stats = fs.statSync(p);
    } catch (error) {
        // Not a valid path if stat fails.
        return false;
    }
    
    return (stats.isDirectory());
}

// Expects that a path is absolute (starts with a /).
function isValidAbsolutePath(p) {
    var parsedPath;
    try {
        parsedPath = path.parse(p);
    } catch (error) {
        // Not a valid path if it can't be parsed.
        return false;
    }

    return (parsedPath.root === '/');
}

module.exports = {
    isValidString: isValidString,
    isValidVersion: isValidVersion,
    isRealDirectory: isRealDirectory,
    isValidAbsolutePath: isValidAbsolutePath
};


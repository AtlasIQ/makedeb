var _ = require('underscore');
var exec = require('child_process').execFile;
var fse = require('fs-extra');
var path = require('path');
var Promise = require('bluebird');
var temp = require('temp');
var validate = require('./lib/validate');

exec = Promise.promisify(exec);
fse = Promise.promisifyAll(fse);
temp = Promise.promisifyAll(temp);

// Track temporary directories so they can be cleaned up.
temp.track();

var TEMPLATE_FILES_DIR = path.join(__dirname, 'template-files');

function makeDeb(options) {
    // Validate options.
    if (!validate.isValidString(options.packageName)) {
        return Promise.reject(new Error('packageName must be a string with non-zero length'));
    }

    if (!validate.isValidVersion(options.version)) {
        return Promise.reject(new Error('version must be a number or a string with non-zero length'));
    }

    if (!validate.isRealDirectory(options.buildDir)) {
        return Promise.reject(new Error('buildDir must be a real directory'));
    }

    if (!validate.isValidAbsolutePath(options.installPath)) {
        return Promise.reject(new Error('installPath must be a valid absolute path'));
    }

    // Set up defaults
    options = _(options).defaults({
        architecture: 'all',
        essential: 'no',
        overwrite: true,
        packageDescription: '',
        priority: 'optional',
        section: 'main'
    });

    // Build DEB package.
    return getTempBuildDir(options.packageName, options.version)
    .bind({})
    .finally(function() {
        // Clean up the temp directory at the end.
        return temp.cleanupAsync();
    })
    .then(function(tempBuildDir) {
        this.tempBuildDir = tempBuildDir;

        // Create directory structure.
        return fse.mkdirsAsync(path.join(this.tempBuildDir, path.dirname(options.installPath)));
    })
    .then(function() {
        // Copy files into directory structure.
        return fse.copyAsync(options.buildDir, path.join(this.tempBuildDir, options.installPath));
    })
    .then(function() {
        // Use tar to create an xz archive.
        return tarDir(this.tempBuildDir);
    })
    .then(function() {
        // Set up DEBIAN dir.
        return writeDebianFiles(this.tempBuildDir, options);
    })
    .then(function() {
        // Build package.
        return dpkg(this.tempBuildDir);
    })
    .then(function() {
        // Move built package to outDir.
        var debFile = this.tempBuildDir + '.deb';
        this.finalPackage = path.join(options.outDir, path.basename(debFile));
        return fse.moveAsync(debFile, this.finalPackage, { clobber: options.overwrite });
    })
    .then(function() {
        return this.finalPackage;
    })
    .catch(function(error) {
        throw new Error('Unable to create package: '+ error.message);
    });
}

// Returns a temporary directory in the required "packageName-version" format.
function getTempBuildDir(packageName, version) {
    return temp.mkdirAsync('makdeb')
    .then(function(tempDir) {
        return path.join(tempDir, packageName +'-'+ version);
    });
}

// Uses tar to create an xz archive of a directory and writes it to its
// parent dir.
function tarDir(dir) {
    var archiveName = path.basename(dir) +'.orig.tar.xz';
    var archivePath = path.join(path.dirname(dir), archiveName);
    return exec('tar', ['cfJ', archivePath, dir]);
}

// Write the required files into the DEBIAN directory.
function writeDebianFiles(tempBuildDir, options) {
    var debianDir = path.join(tempBuildDir, 'DEBIAN');

    return fse.ensureDirAsync(debianDir)
    .then(function() {
        // Read the control file template.
        return fse.readFileAsync(path.join(TEMPLATE_FILES_DIR, 'control.tmpl'), 'utf8');
    })
    .then(function(controlFileTemplate) {
        controlFileTemplate = _(controlFileTemplate).template();

        var controlFileContents = controlFileTemplate(options);
        return fse.writeFileAsync(path.join(debianDir, 'control'), controlFileContents);
    });
}

// Run dpkg to make the .deb file.
function dpkg(tempBuildDir) {
    var cmd = 'dpkg -b '+ tempBuildDir;
    cmd = cmd.split(' ');
    return exec(cmd[0], cmd.slice(1));
}

module.exports = makeDeb;


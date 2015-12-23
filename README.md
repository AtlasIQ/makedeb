# makedeb

makedeb creates DEB files that can be installed using dpkg or uploaded to an
apt repository and installed using apt-get.

## Installation

```bash
$ npm install makedeb
```

## Usage

makedeb is a function that returns a promise with the path to the built package.

```js
var makedeb = require('makedeb');

makedeb(options)
.then(function(debFilePath) {
	// Package successfully created.
})
.catch(function(error) {
	// An error occurred creating the package.
});
```

## Options

```js
makedeb({
	packageName: 'sample',
	version: '1.2.3',
	buildDir: path.join(__dirname, 'dist'),
	outDir: path.join(__dirname, 'artifacts'),
	installPath: '/opt/example/sample',
	overwrite: false,

	// debian control file options
	maintainer: 'admin@example.com',
	section: 'main',
	priority: 'optional',
	architecture: 'all',
	essential: 'no',
	packageDescription: ''
});
```

### Required Options

#### packageName

The name of the package.

#### version

The version of the package. Must be a string or number.

#### buildDir

The directory to package into a DEB file.

#### outDir

The directory to write the DEB file into. Must be a valid directory.

#### installPath

The directory dpkg or apt-get should install the package into.

#### maintainer

The maintainer of the package.


### Optional Options

#### overwite
`Default: true`

If a DEB package with the same name already exists, whether or not to
overwrite it.

#### section
`Default: 'main'`

"Section" parameter in the control file.

#### priority
`Default: 'optional'`

"Priority" parameter in the control file.

#### architecture
`Default: 'all'`

"Architecture" parameter in the control file.

#### essential
`Default: 'no'`

"Essential" parameter in the control file.

#### packageDescription
`Default: ''`

"Description" parameter in the control file.


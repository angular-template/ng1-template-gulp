'use strict';

let folders = require('./core.folders');

//TODO: Temporary or refactor
//TODO: Have separate structures for fonts and images, instead of one big mixed structure.

module.exports = (cssFolder, cssParentFolder) => [
    {
        src: `${folders.bower}bootstrap/dist/fonts/**/*.*`,
        dest: cssParentFolder + 'fonts/',
        areImages: false
    },
    {
        src: `${folders.bower}font-awesome/fonts/**/*.*`,
        dest: cssParentFolder + 'fonts/',
        areImages: false
    },
    {
        src: `${folders.assets}images/**/*.*`,
        dest: cssParentFolder + 'images/',
        areImages: true
    },
    {
        src: `${folders.assets}fonts/*`,
        dest: cssParentFolder + 'fonts/',
        areImages: false
    }
];

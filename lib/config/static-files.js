'use strict';

let folders = require('./folders');
let modules = require('./modules');

let images = {
    'default': (rootFolder, cssFolder) => ({
        src: [
            `${folders.assets}images/**/*.png`,
            `${folders.assets}images/**/*.jpg`,
            `${folders.assets}images/**/*.svg`,
            `${folders.assets}images/**/*.gif`
        ],
        dest: `${rootFolder}images/`
    })
};

for (let m = 0; m < modules.length; m++) {
    images[`module-${modules[m].name}`] = (rootFoloder, cssFolder) => ({
        src: [
            `${modules[m].folder}**/*.png`,
            `${modules[m].folder}**/*.jpg`,
            `${modules[m].folder}**/*.svg`,
            `${modules[m].folder}**/*.gif`
        ],
        dest: `${rootFolder}images/${modules[m].name}/`
    })
};

let fonts = {
    'default': (rootFolder, cssFolder) => ({
        src: [
            `${folders.assets}fonts/**/*.eot`,
            `${folders.assets}fonts/**/*.svg`,
            `${folders.assets}fonts/**/*.ttf`,
            `${folders.assets}fonts/**/*.woff`,
            `${folders.assets}fonts/**/*.woff2`,
            `${folders.assets}fonts/**/*.otf`
        ],
        dest: `${rootFolder}fonts/`
    })
};

module.exports = {
    images: images,
    fonts: fonts,
    scripts: []
};

//TODO: Temporary or refactor
//TODO: Have separate structures for fonts and images, instead of one big mixed structure.

// module.exports = (cssFolder, cssParentFolder) => [
//     {
//         src: `${folders.bower}bootstrap/dist/fonts/**/*.*`,
//         dest: cssParentFolder + 'fonts/',
//         areImages: false
//     },
//     {
//         src: `${folders.bower}font-awesome/fonts/**/*.*`,
//         dest: cssParentFolder + 'fonts/',
//         areImages: false
//     },
//     {
//         src: `${folders.assets}images/**/*.*`,
//         dest: cssParentFolder + 'images/',
//         areImages: true
//     },
//     {
//         src: `${folders.assets}fonts/*`,
//         dest: cssParentFolder + 'fonts/',
//         areImages: false
//     }
// ];

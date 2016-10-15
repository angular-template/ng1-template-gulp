'use strict';

let config = require('./index');
let folders = require('./folders');

let options = {};

//Wiredep options for injecting Bower scripts.
//See https://www.npmjs.com/package/wiredep for docs.
options.wiredep = {
    ignorePath: '..',
    exclude: []
};

//Typescript compiler options during the dev build.
//See https://www.npmjs.com/package/typescript for docs.
options.typescriptBuild = {
    target: 'ES5',
    declarationFiles: false,
    noResolve: false,
    experimentalDecorators: true,
    noImplicitAny: true,
    suppressImplicitAnyIndexErrors: true
};

//Typescript compiler options during the vet stage.
//See https://www.npmjs.com/package/typescript for docs.
options.typescriptVet = undefined;

options.htmlMin = {
    removeComments: true,
    collapseWhitespace: true
};

options.autoPrefixer = {
    browsers: ['last 2 versions']
};

module.exports = options;

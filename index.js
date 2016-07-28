'use strict';

let config = require('./lib/config');

let utils = {
    createModule: require('./lib/utils/create-module')
};

// let requireDir = require('require-dir');
// requireDir('./lib/tasks', { recurse: true } );

module.exports = {
    config: config,
    utils: utils
};

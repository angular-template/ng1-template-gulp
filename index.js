'use strict';

let requireDir = require('require-dir');
requireDir('./lib/tasks', { recurse: true } );

module.exports = {
    config: require('./lib/config'),
    utils: require('./lib/utils')
};

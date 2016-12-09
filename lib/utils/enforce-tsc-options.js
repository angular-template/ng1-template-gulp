'use strict';

module.exports = function(options) {
    options.noImplicitAny = true;
    options.noUnusedLocals = true;
    options.noUnusedParameters = true;
    options.allowUnreachableCode = false;
};

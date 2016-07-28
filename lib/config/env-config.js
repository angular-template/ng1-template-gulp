'use strict';

let folders = require('./core.folders');

module.exports = {
    //Path to the environment-specific config data.
    src: `${folders.client}config.json`,

    //Path to generated script file for the config.
    defaultOutput: `${folders.devBuildScripts}config.js`,

    //Environment-specific config is generated as an AngularJS constants service.
    //<moduleName> specifies the name of the module under which to create the service.
    //Typically, this will be the main module.
    moduleName: 'common',

    //Environment to use to generate the config script file if one is not specified.
    defaultEnv: 'local',

    //List of additional environments to create config scripts for during a dist build.
    //These additional config files will be named 'config.<env>.js'.
    //Useful for when we want to redeploy the app without having to run the Gulp tasks each time.
    generateEnvs: ['dev', 'qa', 'uat', 'prod'],

    //Path to the additional config files.
    generatedFiles: `${folders.devBuildScripts}/config*.js`
};

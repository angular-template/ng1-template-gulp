
Contains Gulp tasks and the default configurations needed by the Angular 1.5 template.

*Note: This package is specifically meant for use with the [Angular 1.5 template](https://github.com/angular-template/ng1-template)*

## Installation
The ng1-template-gulp package is already specified in the Angular 1.5 template's dev dependencies.

However, if for any reason, it is not specified, install it using the following command

```shell
npm install --save-dev ng1-template-gulp
```

## Basic Usage
```js
// Load the package
var ng1TemplateGulp = require('ng1-template-gulp');

// Retrieve the default configuration
var config = ng1TemplateGulp.config;

// Customize configuration for your project
// Example
config.styles.injections.unshift(
    config.folders.bower + 'bootstrap/dist/css/bootstrap.css');
```

## Configuration Reference
Coming soon...

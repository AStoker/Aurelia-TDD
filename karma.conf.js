"use strict";
const path = require('path');
const project = require('./aurelia_project/aurelia.json');
const externalFiles = require('./test/karma-vendor-files.json');
const CLIOptions = require('aurelia-cli').CLIOptions;

let tdd = CLIOptions.hasFlag('source');

let testSrc = [];
let files = [];
let exclude = [];
let preprocessors = {};
let proxies = {};

if (tdd) {
  // Note: When serving up the node_modules, the amount of files in folder will affect how long it takes for Karma to start up.
  // If you want better startup times, find some way to create a tree of only the node_modules that are used and use that list instead of a blanket include of all node_modules
  testSrc = [
    //{ pattern: 'node_modules/**/*', included: false, watched: false }, //Specifically set watched to false to stop Karma from listening to node files (intensive task)

    { pattern: project.markupProcessor.source, included: false },
    { pattern: project.transpiler.source, included: false },

    { pattern: project.unitTestRunner.source, included: false },

    // This file is automatically generated from the `test.js` task. It is the compiled loader config used for the application
    'test/karma-require-config.js',
    'test/aurelia-karma.js',
  ];

  files = ['scripts/require.js'].concat(externalFiles).concat(testSrc);
  exclude =  ['node_modules/**/*{test,Test,spec,Spec}.js']; // Node modules sometimes publish their test files, we want to exclude any test file that might be caught up in our tests
  preprocessors = {
    [project.unitTestRunner.source]: [project.transpiler.id],     
    [project.transpiler.source]: [project.transpiler.id] //Since we are now including source code, we need babel to transpile our source files on the fly
  };
  // If you need to reference sibling files from your source code, or node modules, include these proxies.
  // By including these proxies you're making sure that any reference to a base level directory includes the karma served `/base/` path
  // proxies = {
  //   '/src/': '/base/src/',
  //   '/node_modules/': '/base/node_modules/'
  // };
} else {

  testSrc = [
    { pattern: project.unitTestRunner.source, included: false },
    'test/aurelia-karma.js'
  ];

  let output = project.platform.output;
  let appSrc = project.build.bundles.map(x => path.join(output, x.name));
  let entryIndex = appSrc.indexOf(path.join(output, project.build.loader.configTarget));
  let entryBundle = appSrc.splice(entryIndex, 1)[0];
  files = [entryBundle].concat(testSrc).concat(appSrc);
 
  preprocessors = {
    [project.unitTestRunner.source]: [project.transpiler.id]
  };
}
module.exports = function(config) {
  config.set({
    basePath: '',
    frameworks: [project.testFramework.id],
    files: files,
    exclude: exclude,
    preprocessors: preprocessors,
    'babelPreprocessor': { options: project.transpiler.options },
    proxies: proxies,
    reporters: ['progress'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    browsers: ['Chrome'],
    singleRun: false,
    // client.args must be a array of string.
    // Leave 'aurelia-root', project.paths.root in this order so we can find
    // the root of the aurelia project.
    client: {
      args: ['aurelia-root', project.paths.root]
    }
  });
};

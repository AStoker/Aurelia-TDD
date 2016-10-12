import gulp from 'gulp';
import fs from 'fs';

import {Server as Karma} from 'karma';
import {CLIOptions, build} from 'aurelia-cli';

import project from '../aurelia.json';

//These are the tasks that are run in the `build.js` file
import transpile from './transpile';
import processMarkup from './process-markup';
import processCSS from './process-css';

let unit;

if (CLIOptions.hasFlag('source')) {
  unit = gulp.series(
    readProjectConfiguration,
    gulp.parallel(
      transpile,
      processMarkup,
      processCSS
    ),
    createLoaderConfig,
    function (done) {
      runTests(done);
    }
  );
} else {
  unit = runTests;
}


function runTests(done) {
  new Karma({
    configFile: __dirname + '/../../karma.conf.js',
    singleRun: !CLIOptions.hasFlag('watch')
  }, done).start();
}

function readProjectConfiguration() {
    return build.src(project);
}

function createLoaderConfig() {
    let proj = project;
    proj.build.loader.includeBundleMetadataInConfig = false; //Don't create bundle config
    return build.createLoaderConfig(proj).then(config => {       
        //Do any modifications to the config here.
        //In this case, we're increasing the `waitSeconds` due to the amount of node modules Karma will be looking at
        config.waitSeconds = 200;
        //Write out karma config for tests to use
        return fs.writeFile('test/karma-require-config.js', 'requirejs.config('+JSON.stringify(config)+')');
    });
}

export default unit;

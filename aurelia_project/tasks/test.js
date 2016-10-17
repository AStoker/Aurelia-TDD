import gulp from 'gulp';
import fs from 'fs';
import path from 'path';

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
        
        return new Promise((resolve, reject) => {
          fs.writeFile('test/karma-require-config.js', 'requirejs.config('+JSON.stringify(config)+')',()=>{
            writeKarmaVendorSourceFiles(config, resolve);
          })
        });
    });
}

function writeKarmaVendorSourceFiles(config, done){
  //Get the vendor source files that Karma needs
  var sources = [];
  var unique = [];
  for(var key in config.paths){
    sources.push(config.paths[key])
  } 
  for(var value of config.packages){
    sources.push(value.location);
  }
  sources = sources.map(loc => {
        //Don't reference the file by rather the directory used (in case of imports)        
        return path.normalize(loc.replace(/^\.\.\//g, '') + '/..').replace(/\\/g, '/');
    })
    .filter(loc => {
        //Don't pull in files that are part of the compiled output        
        return !loc.match('^' + path.posix.normalize(project.platform.output).replace(/\\/g, '/'))
    });
  unique = Array.from(new Set(sources));//Make sources unique
  unique = unique.map(loc => {
      //Configure the array to tell Karma how to process the files
      return {pattern: loc + "/**/*", included: false, watched: false}
  });
  //TODO: See if there's a way to not have to write out files for the Karma config to have to read.
  return fs.writeFile('test/karma-vendor-files.json', JSON.stringify(unique), done);
}

export default unit;

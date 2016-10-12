# Tests are important!

If somebody tells you otherwise, they're selling something (usually the destruction of a project).  

The [Aurelia CLI](https://github.com/aurelia/cli) makes many steps very easy to implement, including setting up and running tests. 
Unfortuantely, the tests that are configured by default run against the bundled code, meaning every time you want to run tests, you must bundle your code.
This is very helpful when wanting to test a production setup (and is recommended for such situations).
However, when wanting to code with [test driven development](https://en.wikipedia.org/wiki/Test-driven_development) (a.k.a. TDD), the time intensive process of bundling code prohibits the quick feedback needed to be effective.

To accomplish TDD in a time effective manner, we need to run tests off of our source code, instead of the compiled/bundled output of the build command.
This means that we need to configure Karma (our test runner) to do a few things for us, and we also need to provide it with a few additional configurations.

## Run-down of configuration steps
- Configure the `test.js` task
  - We need to allow the `test` task to accept a flag that indicates whether the user is wanting to test from source (TDD) or from the regular bundled code. 
  This process also requires you to get the loader configuration and write it to a file for Karma to use later. 
  In order for you to get that config, you must compile your application similar to how you compile it in the `build` task, except instead of writing the files out, you create the loader config and then start your tests.
- Configure the `karma.conf.js` file
  - This file needs the most changes to support running tests via TDD or through bundling with simply a flag.
  For the most part, you need to define all the variables (but not set them) that will change depending on whether you're running TDD or not above the actual karma config. 
  - Via the `--source` flag, we need to configure Karma to look at a few files:
    - The `node_modules` (since they won't be compiled and bundled)
    - The source code (markup and source)
    - The test files
    - And the newly created `karma-require-config.js` file that was generated in the `test` task.
  - We then need to concatenate the above list to an array that contains our instance of `require.js`. 
  `require.js` may exist in the `scripts` folder (as it does on initial configuration at this moment), or it may be in the `node_modules` if that's where you have it installed.
  The important piece is to have `require.js` loaded up before any of your other files.
  - In addition to defining what we have in the `files` property (described above), we need to tell Karma to exclude any test files in the `node_modules` folder.
  Sometimes node modules are published with their tests, and if they're included in our test runner, they'll try to execute (and ultimately fail). 
  So to keep node moduels from runnign tests we set the `exclude` property to exclude any test files in the `node_modules` folder.
  - Lastly we also want to congigure our Karma `preprocessors` to preprocess any source code, so that ES6 code doesn't get served to the browser.
- Patch `test/aurelia-karma.js` 
  - Because we are using source files now, the way modules load up are different. This means that when you try and ask RequireJS for a sibling file instead of a module path, it doesn't append the `.js` extension,
  causing the request to fail. In order to remedy this, we do a little extra work in our normalization function where we check to see if the normalized file name has an extension, and if it does not, we add the `.js` extension to it.

_**This was a basic explanation of what's going on.**_  
Please look at the code and any added comments to better understand the individual steps.
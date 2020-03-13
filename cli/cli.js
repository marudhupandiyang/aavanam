#!/usr/bin/env node
'use strict';

const pacakge = require('../package.json');
const program = require('commander');

const options = {};

program
  .arguments('<glob-pattern>')
  .option('-r, --recursive', 'Process recursively')
  .option('-R, --readme', 'Readme file path')
  .version(pacakge.version)
  .description(pacakge.description)
  .action(function(pattern, cmdObj) {
    options.globPattern = pattern;
    debugger;
    options.isRecursive = cmdObj.recursive;
    options.readme = cmdObj.readme;
    console.dir(cmdObj);
  });

program.parse(process.argv);

if (!options.globPattern) {
  console.error('No Source mentioned');
  process.exit();
}

const aavanam = require('../index.js');
aavanam(options);

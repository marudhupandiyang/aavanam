#!/usr/bin/env node
'use strict';

const path = require('path');
const program = require('commander');

const pacakge = require('../package.json');

const options = {};

program
  .command('build')
  .arguments('<glob-pattern>')
  .option('-r, --recursive', 'Process recursively')
  .option('-R, --readme [value]', 'Readme file path')
  .version(pacakge.version)
  .description(pacakge.description)
  .action(function(pattern, cmdObj) {
    options.globPattern = pattern;
    options.isRecursive = cmdObj.recursive;
    options.readme = path.resolve(cmdObj.readme);
  });


program.parse(process.argv);

if (!options.globPattern) {
  console.error('No Source mentioned');
  process.exit();
}

const aavanam = require('../index.js');
aavanam(options);

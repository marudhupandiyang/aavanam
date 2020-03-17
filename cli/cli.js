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
  .option('-M, --manuals [value]', 'Manuals(.md files) dir path')
  .option('-O, --output [value]', 'Output dir path')
  .option('-S, --source [value]', 'Input glob pattern')
  .version(pacakge.version)
  .description(pacakge.description)
  .action(function(pattern, cmdObj) {
    options.globPattern = path.resolve(pattern || cmdObj.source);
    options.isRecursive = cmdObj.recursive;
    options.readme = path.resolve(cmdObj.readme);
    options.manualPath = path.resolve(cmdObj.manuals);
    // options.manuals = path.resolve(cmdObj.manuals, './**/*.md');
    options.outputPath = path.resolve(cmdObj.output || './output');
  });


program.parse(process.argv);
options.basePath = path.resolve('.');

if (!options.globPattern) {
  console.error('No Source mentioned');
  process.exit();
}


const aavanam = require('../index.js');
aavanam(options);

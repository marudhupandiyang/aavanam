#!/usr/bin/env node
'use strict';

const pacakge = require('../package.json');
const program = require('commander');

let globPattern = '';
let isRecursive = false;

program
  .arguments('<glob-pattern>')
  .option('-r, --recursive', 'Process recursively')
  .version(pacakge.version)
  .description(pacakge.description)
  .action(function(pattern, cmdObj) {
    globPattern = pattern;
    isRecursive = cmdObj.recursive;
  });

program.parse(process.argv);

if (!globPattern) {
  console.error('No Source mentioned');
  process.exit();
}

const aavanam = require('../index.js');
aavanam(globPattern, isRecursive);

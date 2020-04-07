#!/usr/bin/env node
'use strict';

const path = require('path');
const program = require('commander');

const packageJson = require(path.resolve('./package.json'));

const options = {};

program
  .command('build')
  .arguments('[glob-pattern]')
  .option('-r, --recursive', 'Process recursively')
  .option('-R, --readme [value]', 'Readme file path')
  .option('-M, --manuals [value]', 'Manuals(.md files) dir path')
  .option('-O, --output [value]', 'Output dir path')
  .option('-S, --source [value]', 'Input glob pattern')
  .option('-D, --rootdirectory [value]', 'Root directory for source. If ignored, current directory is defaulted')
  .option('-G, --git [value]', 'Input glob pattern', packageJson.repository && packageJson.repository.url)
  .version(packageJson.version)
  .description(packageJson.description)
  .action(function(pattern, cmdObj) {
    options.rootDirectory = path.resolve(cmdObj.rootdirectory || './src');
    options.globPattern = path.resolve(pattern || cmdObj.source || 'src/**/*.js');
    options.isRecursive = cmdObj.recursive;
    options.readme = path.resolve(cmdObj.readme || 'README.md');
    options.manualPath = path.resolve(cmdObj.manuals || 'manual');
    options.outputPath = path.resolve(cmdObj.output || './output');
    options.gitRepoLink = cmdObj.git;
  });


program.parse(process.argv);
options.basePath = path.resolve('.');

if (!options.globPattern) {
  console.error('No Source mentioned');
  process.exit();
}


const aavanam = require('../index.js');
aavanam(options);

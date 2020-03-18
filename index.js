require('./patch');

const path = require('path');
const fs = require('fs');
const glob = require("glob");
const log = require('debug')('aavanam');

require('./viewMethods');
const DocGenerator = require('./docGenerator');
const { parseFile } = require('./parser');

async function aavanam(options) {
  const allFiles = glob.sync(options.globPattern);

  const result = {
    title: 'Test',
    files: {},
    templatePath: options.templatePath,
    outputPath: options.outputPath,
    homeFilePath: options.readme,
    manualPath: options.manualPath,
    manuals: glob.sync(path.resolve(options.manualPath, './**/*.md')),
  };

  for(let sourceLoopIndex = 0; sourceLoopIndex < allFiles.length; sourceLoopIndex += 1) {
    const currentFile = allFiles[sourceLoopIndex];
    if (!currentFile.endsWith('.jsx') && !currentFile.endsWith('.js')) {
      log('Skipping file', currentFile);
      continue;
    }
    log('Starting with', currentFile);

    try {
      const res = await parseFile(currentFile);
      const fileParent = path.dirname(path.relative(options.rootDirectory, currentFile));
      result.files[fileParent] = result.files[fileParent] || { classes: [] };

      result.files[fileParent].classes = [
        ...result.files[fileParent].classes,
        ...res.classes,
      ];

      // should take in others ??
    } catch (ex) {
      log('File errored out', currentFile, ex);
    }
  }

  log('Generating final output');
  const myDoc = new DocGenerator(result);
  myDoc.generate();
}

module.exports = aavanam;

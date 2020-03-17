const path = require('path');
const fs = require('fs');
const marked = require('marked');
const ejs = require('ejs');

const log = require('debug')('aavanam:fileHelper');

function removeDirectory(filePath) {
  let directoryExists = false;
  try {
    fs.statSync(filePath);
    directoryExists = true;
  } catch (ex) { /* ignore */ }

  if (directoryExists) {
    fs.unlinkSync(filePath);
  }
}

function makeDirectoryForFilePath(filePath, removeIfExisting = false) {
  log('making directory file', filePath, removeIfExisting);
  if (removeIfExisting) {
    removeDirectory(filePath);
  }
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function readFile(filePath) {
  log('Reading file', filePath);
  if (!filePath) {
    throw 'No filePath provided';
  }
  return (
    new Promise(async (resolve, reject) => {
      try {
        resolve(await fs.readFileSync(filePath, 'utf-8'));
      } catch (ex) {
        reject(ex);
      }
    })
  );
}

async function readMarkdownAsHtml(markdownContent) {
  log('Processing markdown to html');
  return new Promise(async (resolve, reject) => {
    marked(markdownContent, {}, (err, htmlContent) => {
      if (err) {
        log('Error in markdown to html', err);
        reject(err);
      } else {
        resolve(htmlContent);
      }
    });
  });
}

async function readMarkdownFileAsHtml(filePath) {
  log('Reading markdownfile as html');
  const markdownContent = await readFile(filePath);
  return (await readMarkdownAsHtml(markdownContent));
}

async function saveFile(filePath, content) {
  log('Saving file', filePath);
  fs.writeFileSync(filePath, content);
}

async function renderTemplate(options) {
  log('Rendering template', options.outputPath);
  return new Promise(async (resolve, reject) => {
    log('Making directory', options.outputPath);
    makeDirectoryForFilePath(options.outputPath);
    let content = options.data.content;

    if (options.sourceFilePath) {
      if (options.sourceFileType === 'markdown') {
        log('Processing source file as markdown', options.sourceFilePath);
        content = await readFile(options.sourceFilePath);
      } else {
        log('Processing source file as html', options.sourceFilePath);
        content = await readMarkdownFileAsHtml(options.sourceFilePath);
      }
    }

    delete options.sourceFilePath;
    delete options.sourceFileType;

    log('Invoking ejs', options.templatePath);
    ejs.renderFile(
      options.templatePath,
      {
        ...viewVariables,
        ...options.data,
        content,
      },
      {},
      (err, renderedHtml) => {
        if (err) {
          log('Error in rendering ejs', options.outputPath);
          reject(err);
          return;
        }

        log('Done rendering ejs', options.outputPath);
        saveFile(options.outputPath, renderedHtml);
        resolve();
      },
    );
  });
}


module.exports = {
  readFile,
  saveFile,
  removeDirectory,
  makeDirectoryForFilePath,
  renderTemplate,
  readMarkdownAsHtml,
  readMarkdownFileAsHtml,
};

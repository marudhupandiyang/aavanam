const path = require('path');
const fs = require('fs');
const marked = require('marked');
const ejs = require('ejs');

const { log } = require('./lib');

function makeDirectory(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function readFile(filepath) {
  return (
    new Promise(async (resolve, reject) => {
      log('Reading file', filepath);
      try {
        resolve(await fs.readFileSync(filepath, 'utf-8'));
      } catch (ex) {
        reject(ex);
      }
    })
  );
}

async function readMarkdownAsHtml(markdownContent) {
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

async function readMarkdownFileAsHtml(filepath) {
  const markdownContent = await readFile(filepath);
  return (await readMarkdownAsHtml(markdownContent));
}

async function saveFile(filepath, content) {
  log('Saving file', filepath);
  fs.writeFileSync(filepath, content);
}

async function renderTemplate(options) {
  return new Promise(async (resolve, reject) => {
    log('Rendering template', options.templatePath, ' to ' , options.outputPath);
    makeDirectory(options.outputPath);
    ejs.renderFile(
      options.templatePath,
      {
        ...viewVariables,
        ...options.data,
      },
      {},
      (err, renderedHtml) => {
        if (err) {
          reject(err);
          return;
        }

        saveFile(options.outputPath, renderedHtml);
        resolve();
      },
    );

  });
}


module.exports = {
  readFile,
  saveFile,
  makeDirectory,
  renderTemplate,
  readMarkdownAsHtml,
  readMarkdownFileAsHtml,
};

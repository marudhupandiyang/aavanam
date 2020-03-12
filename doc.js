const fs = require('fs');
const path = require('path');
const ejs = require('ejs');
const copyfiles = require('copyfiles');

let templatePath = '';
let templateData = {};
let outputPath = path.resolve(__dirname, 'output');

const ejsOptions = {
  async: true,
};

function getTemplatePath (template = 'default') {
  return path.resolve(__dirname, 'templates/default');
}

async function generateFiles(data, template) {
  templatePath = getTemplatePath(template);
  templateData = data;

  // Copy
  const paths = [path.resolve(templatePath, 'public/**')];
  paths.push(outputPath);
  copyfiles(paths, {}, async () => {
    await generateRoot();
  });
}

async function generateRoot() {
  const fileName = '/index.html.ejs';

  const renderedHtml = await ejs.renderFile(`${templatePath}${fileName}`, templateData, ejsOptions);
  fs.writeFileSync(`${outputPath.replace('ejs', '')}${fileName}`, renderedHtml);
}

module.exports = generateFiles;

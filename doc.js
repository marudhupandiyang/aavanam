const fs = require('fs');
const path = require('path');
const ejs = require('ejs');

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

  await generateRoot();
}

async function generateRoot() {
  const fileName = '/index.html';

  const renderedHtml = await ejs.renderFile(`${templatePath}${fileName}`, templateData, ejsOptions);
  fs.writeFileSync(`${outputPath}${fileName}`, renderedHtml);
}

module.exports = generateFiles;

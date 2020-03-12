const fs = require('fs');
const path = require('path');
const ejs = require('ejs');
const copyfiles = require('copyfiles');

let templatePath = '';
let templateData = {};
let outputPath = path.resolve(__dirname, 'output');

String.prototype.count = function(c) {
  var result = 0, i = 0;
  for(i;i<this.length;i++)if(this[i]==c)result++;
  return result;
};

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
  copyfiles(paths, { up: templatePath.count('/') + 1 }, async () => {
    await generateRoot();
  });
}

async function generateRoot() {
  const fileName = '/index.html.ejs';

  const renderedHtml = await ejs.renderFile(`${templatePath}${fileName}`, templateData, ejsOptions);
  fs.writeFileSync(`${outputPath}${fileName.replace('.ejs', '')}`, renderedHtml);
}

module.exports = generateFiles;

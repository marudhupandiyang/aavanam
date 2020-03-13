const fs = require('fs');
const path = require('path');
const ejs = require('ejs');
const copyfiles = require('copyfiles');
const marked = require('marked');

const { log } = require('./lib');

let templatePath = '';
let templateData = {};
let outputPath = null;

String.prototype.count = function(c) {
  var result = 0, i = 0;
  for(i;i<this.length;i++)if(this[i]==c)result++;
  return result;
};

const ejsOptions = {};

function getTemplatePath (template = 'default') {
  return path.resolve(__dirname, 'templates/default');
}

function generateMarkdownToHtml(content) {
  return new Promise((resolve, reject) => {
    marked(content, {}, (err, result) => {
      if (err) { log('Error in markdown to html', err); }
      resolve(result);
    });
  });
}

async function generateFiles(data, template) {
  templatePath = getTemplatePath(template);
  templateData = data;
  outputPath = path.resolve(__dirname, 'output');
  try {
    fs.rmdirSync(outputPath, { recursive: true });
  } catch (ex) { console.log(ex); }
  fs.mkdirSync(outputPath);

  // Copy
  const paths = [path.resolve(templatePath, 'public/**')];
  paths.push(outputPath);
  copyfiles(paths, { up: templatePath.count('/') + 1 }, async () => {
    await generateRoot();
    await generateClasses();
    await generateManuals();
  });
}

async function generateRoot() {
  const fileName = '/index.ejs';

  const data = {
    title: templateData.title,
    classes: templateData.classes,
    content: await generateMarkdownToHtml(templateData.standardFiles.readme || ''),
    manuals: templateData.manuals,
  };

  ejs.renderFile(`${templatePath}${fileName}`, data, ejsOptions, (err, renderedHtml) => {
    if (err) {
      log('Rendering error out', fileName, err);
      return;
    }
    fs.writeFileSync(`${outputPath}${fileName.replace('.ejs', '.html')}`, renderedHtml);
  });
}

async function generateManuals() {
  const manuals = templateData.manuals;

  if (manuals) {
    const manualOutputPath = path.resolve(outputPath, 'manuals');
    fs.mkdirSync(manualOutputPath, { recursive: true });

    return (new Promise(async (resolve, reject) => {
      for(let i = 0; i < manuals.length; i += 1) {
        const data = {
          title: templateData.title,
          classes: templateData.classes,
          content: await generateMarkdownToHtml(manuals[i].content),
          manuals: templateData.manuals,
        };

        ejs.renderFile(`${templatePath}/manual.ejs`, data, ejsOptions, (err, renderedHtml) => {
          if (err) {
            log('Rendering error out', manuals[i].name, err);
            return;
          }
          fs.writeFileSync(path.resolve(manualOutputPath, manuals[i].outputfileName), renderedHtml);
          resolve();
        });
      }
    }));
  }
}

async function generateClasses() {
  const classes = templateData.classes;

  if (classes) {
    const classesOutputPath = path.resolve(outputPath, 'classes');
    fs.mkdirSync(classesOutputPath, { recursive: true });

    return (new Promise(async (resolve, reject) => {
      for(let i = 0; i < classes.length; i += 1) {
        const data = {
          title: templateData.title,
          classes: templateData.classes,
          manuals: templateData.manuals,
          currentClass: templateData.classes[i],
        };

        console.log(data);
        ejs.renderFile(`${templatePath}/class.ejs`, data, ejsOptions, (err, renderedHtml) => {
          if (err) {
            log('Rendering error out', classes[i].name, err);
            return;
          }
          fs.writeFileSync(path.resolve(classesOutputPath, classes[i].outputfileName), renderedHtml);
          resolve();
        });
      }
    }));
  }
}

module.exports = generateFiles;

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
  let result = 0;
  for(let i = 0; i < this.length; i += 1) {
    if ( this[i] == c) {
      result += 1;
    }
  }
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
  outputPath = data.outputPath;

  try {
    fs.rmdirSync(outputPath, { recursive: true });
  } catch (ex) { console.log(ex); }
  fs.mkdirSync(outputPath);

  // Copy
  const paths = [path.resolve(templatePath, 'public/**')];
  paths.push(outputPath);
  console.dir(templateData.classes);
  copyfiles(paths, { up: templatePath.count('/') + 1 }, async () => {
    await generateRoot();
    await generateClasses();
    await generateManuals();
  });
}

async function renderFile(source, output, data, options = ejsOptions) {
  return (new Promise(async (resolve, reject) => {
    ejs.renderFile(source, data, ejsOptions, (err, renderedHtml) => {
      if (err) {
        log('Rendering error out', source, err);
      } else {
        fs.writeFileSync(output, renderedHtml);
      }
      resolve();
    });
  }));
}

async function generateRoot() {
  const fileName = '/index.ejs';

  const data = {
    title: templateData.title,
    classes: templateData.classes,
    content: await generateMarkdownToHtml(templateData.standardFiles.readme || ''),
    manuals: templateData.manuals,
  };

  await renderFile(`${templatePath}${fileName}`, `${outputPath}${fileName.replace('.ejs', '.html')}`, data);
}

async function generateManuals() {
  const manuals = templateData.manuals;

  if (manuals) {
    log('Generating manuals');
    const manualOutputPath = path.resolve(outputPath, 'manuals');
    fs.mkdirSync(manualOutputPath, { recursive: true });

    return (new Promise(async (resolve, reject) => {
      for(let i = 0; i < manuals.length; i += 1) {
        log('Generating manual ', manuals[i].name);
        const data = {
          title: templateData.title,
          classes: templateData.classes,
          content: await generateMarkdownToHtml(manuals[i].content),
          manuals: templateData.manuals,
        };

        await renderFile(`${templatePath}/manual.ejs`, path.resolve(manualOutputPath, manuals[i].outputfileName), data);
      }
      resolve();
    }));
  }
}

async function generateClasses() {
  const classes = templateData.classes;

  if (classes) {
    log('Generating classes');

    return (new Promise(async (resolve, reject) => {
      const folders = Object.keys(classes);
      for(let j = 0; j < folders.length; j +=1 ) {
        const subClasses = classes[folders[j]];

        const classesOutputPath = path.resolve(outputPath, `classes/${folders[j]}`);
        fs.mkdirSync(classesOutputPath, { recursive: true });

        for(let i = 0; i < subClasses.length; i += 1) {
          log('Generating class', subClasses[i].name);

          const data = {
            title: templateData.title,
            classes: templateData.classes,
            manuals: templateData.manuals,
            currentClass: subClasses[i],
          };

          ejs.renderFile(`${templatePath}/class.ejs`, data, ejsOptions, (err, renderedHtml) => {
            if (err) {
              log('Rendering error out', subClasses[i].name, err);
              return;
            }

            fs.writeFileSync(path.resolve(classesOutputPath, subClasses[i].outputfileName), renderedHtml);
          });
        }
      }
      resolve();
    }));
  }
}

module.exports = generateFiles;

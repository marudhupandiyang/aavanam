const path = require('path');
const copyfiles = require('copyfiles');
// const log = require('debug')('aavanam:docGenerator');

const FileHelper = require('./fileHelper');

const DEFAULT_TEMPLATE_PATH = path.resolve(__dirname, './templates/default');
const MANUAL_OUTPUT_PATH = 'manual';

class DocGenerator {
  constructor(result) {
    if (!result) {
      throw 'Data is required to initialize doc generator';
    }

    Object.keys(result).map((k) => {
      this[k] = result[k];
    });

    this.templatePath = this.templatePath || DEFAULT_TEMPLATE_PATH;
  }

  getOutputPath(filePath, extension = '.html') {
    return path.resolve(this.outputPath, `${filePath}${extension}`);
  }

  getTemplatePath(template, extension = '.ejs') {
    return path.resolve(this.templatePath, `${template}${extension}`);
  }

  getRelativePath(filePath) {
    return path.relative(this.outputPath, filePath);
  }

  async generateHomePage() {
    return new Promise(async (resolve, reject) => {
      const fileContent = await FileHelper.readMarkdownFileAsHtml(this.homeFilePath);
      await FileHelper.renderTemplate({
        outputPath: this.getOutputPath('index'),
        templatePath: this.getTemplatePath('index'),
        data: {
          content: fileContent,
        },
      });
      resolve();
    });
  }

  async prepare() {
    const files = { ...this.files };
    const folders = Object.keys(files);
    for (let folderI = 0; folderI < folders.length; folderI += 1) {
      const currentClasses = files[folders[folderI]].classes;
      for (let currentClassI = 0; currentClassI < currentClasses.length; currentClassI += 1) {
        const currentClass = {
          ...currentClasses[currentClassI],
        };
        currentClass.pageTitle = `${currentClass.name} Class | ${this.title}`;
        currentClass.outputPath = this.getOutputPath(`${folders[folderI]}/classes/${currentClass.name}`);
        currentClass.relativePath = this.getRelativePath(currentClass.outputPath);
        currentClasses[currentClassI] = currentClass;
      }
    }

    return {
      files,
      manuals: await this.prepareManuals(),
    };
  }

  async prepareManuals() {
    const manuals = [];
    let hasIndex = false;

    for(let i = 0; i < this.manuals.length; i += 1) {
      const newManual = {
        name: path.basename(this.manuals[i], '.md'),
        sourceFilePath: this.manuals[i],
        sourceFileType: 'markdown',
      };

      newManual.pageTitle = `${newManual.name} Manual | ${this.title}`,
      newManual.outputPath = this.getOutputPath(`${MANUAL_OUTPUT_PATH}/${newManual.name}`);
      newManual.relativePath = this.getRelativePath(newManual.outputPath);
      manuals.push(newManual);

        hasIndex = true;
      }

    if (manuals.length && !hasIndex) {
      const manualIndex = {
        name: 'index',
        sourceFilePath: this.homeFilePath,
        sourceFileType: 'markdown',
        pageTitle: `Manuals | ${this.title}`,
      };
      manualIndex.outputPath = this.getOutputPath(`${MANUAL_OUTPUT_PATH}/${manualIndex.name}`);
      manualIndex.relativePath = this.getRelativePath(manualIndex.outputPath);
      manuals.push(manuals);
    }

    return manuals;
  }

  async generateManuals() {
    const manuals = viewVariables.manuals;
    return new Promise(async (resolve, reject) => {
      for (let i = 0; i < manuals.length; i += 1) {
        console.log('Generating manual', manuals[i].name);
        const currentManual = manuals[i];
        await FileHelper.renderTemplate({
          ...currentManual,
          templatePath: this.getTemplatePath('manual'),
          data: {
            manuals,
            currentManual,
          },
        });
      }

      if (manuals.length) {
        console.log('copying assets for manuals');
        const sourcePath = path.resolve(this.manualPath, 'asset/**/*');
        const destinationPath = this.getOutputPath('manual', '');
        copyfiles([sourcePath, destinationPath], { up: this.manualPath.count('/') + 1}, async (err) => {
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  async generateClasses() {
    const files = viewVariables.files;
    return new Promise(async (resolve, reject) => {
      const folders = Object.keys(files);

      for (let folderI = 0; folderI < folders.length; folderI += 1) {
        const currentClasses = files[folders[folderI]].classes;
        for (let currentClassI = 0; currentClassI < currentClasses.length; currentClassI += 1) {
          const currentClass = currentClasses[currentClassI];
          await FileHelper.renderTemplate({
            ...currentClass,
            templatePath: this.getTemplatePath('class'),
            data: {
              currentClass
            },
          });
        }
      }
    });
  }

  async generate() {
    if (!this.outputPath) {
      throw new Error('Output path is not set');
    }

    if (!this.homeFilePath) {
      console.warn('HomeFile path not set');
    }

    FileHelper.makeDirectoryForFilePath(this.outputPath);

    const data = await this.prepare();
    global.viewVariables = {
      pageTitle: this.title,
      classes: this.classes,
      gitRepoLink: this.gitRepoLink,
      content: '',
      ...data,
    };

    const publicPath = `${this.templatePath}/public/**`;
    copyfiles([publicPath, this.outputPath], { up: this.templatePath.count('/') + 1 }, async () => {

      await this.generateHomePage();
      await this.generateManuals();
      await this.generateClasses();
    });
  }
}

DocGenerator.REFRENCE_LINKS = {
  'object': 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object',
  'object[]': 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object',
  'string': 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String',
  'string[]': 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String',
  'function': 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function',
  'boolean': 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean',
  'boolean[]': 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean',
  'symbol': 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol',
  'number': 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number',
  'number[]': 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number',
  'bigint': 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt',
  'math': 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math',
  'date': 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date',
  'regexp': 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp',
  'array': 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array',
  'map': 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map',
  'set': 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set',
  'json': 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON',
  'promise': 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise',
  'asyncfunction': 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/AsyncFunction',
  'arguments': 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/arguments',
};

module.exports = DocGenerator;

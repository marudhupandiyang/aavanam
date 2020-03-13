const path = require('path');
const copyfiles = require('copyfiles');

const FileHelper = require('./fileHelper');

const DEFAULT_OUTPUT_PATH = path.resolve(__dirname, './templates/default');

class DocGenerator {
  constructor() {
    this.templatePath = DEFAULT_OUTPUT_PATH;
    this.options = {};
    this.classes = {};
    this.manuals = [];

    this.addClass = this.addClass.bind(this);
    this.addManuals = this.addManuals.bind(this);
    this.setHomeFile = this.setHomeFile.bind(this);
    this.setOutputPath = this.setOutputPath.bind(this);
    this.getOutputPath = this.getOutputPath.bind(this);
    this.setTemplatePath = this.setTemplatePath.bind(this);
    this.getTemplatePath = this.getTemplatePath.bind(this);
    this.generateHomePage = this.generateHomePage.bind(this);
    this.generate = this.generate.bind(this);
    this.getRelativePath = this.getRelativePath.bind(this);
  }

  addClass(classObj) {
    this.classes[classObj.parent] = this.classes[classObj.parent] || [];
    this.classes[classObj.parent].push(classObj);
  }

  addManuals(manuals) {
    let newManuals = [];
    if (manuals instanceof Array) {
      newManuals = manuals;
    } else {
      newManuals = [manuals];
    }

    this.manuals = [
      ...this.manuals,
      ...newManuals,
    ];
  }

  setConfig(options) {
    this.options = options;
  }

  setHomeFile(filePath) {
    this.homeFilePath = filePath;
  }

  setOutputPath(filePath) {
    this.outputPath = filePath;
  }

  getOutputPath(filePath) {
    return `${this.outputPath}/${filePath}.html`;
  }

  setTemplatePath(filePath) {
    this.templatePath = filePath || DEFAULT_OUTPUT_PATH;
  }

  getTemplatePath(template) {
    return `${this.templatePath}/${template}.ejs`;
  }

  getRelativePath(filePath) {
    return filePath.replace(`${this.outputPath}`, '');
  }

  async generateHomePage() {
    const fileContent = await FileHelper.readMarkdownFileAsHtml(this.homeFilePath);
    await FileHelper.renderTemplate({
      outputPath: this.getOutputPath('index'),
      templatePath: this.getTemplatePath('index'),
      data: {
        content: fileContent,
      },
    });
  }

  async prepare() {
    const manuals = [];
    for(let i = 0; i < this.manuals.length; i += 1) {
      const newManual = {
        name: path.basename(this.manuals[i], '.md'),
        content: await FileHelper.readFile(this.manuals[i]),
        pageTitle: `${this.manuals[i].name} Manual | ${this.options.title}`,
      };
      newManual.outputPath = this.getOutputPath(`manuals/${newManual.name}`);
      newManual.relativePath = this.getRelativePath(newManual.outputPath);
      manuals.push(newManual);
    }

    const classes = { ...this.classes };
    const folders = Object.keys(classes);
    for (let folderI = 0; folderI < folders.length; folderI += 1) {
      const currentClasses = classes[folders[folderI]];
      for (let currentClassI = 0; currentClassI < currentClasses.length; currentClassI += 1) {
        const currentClass = {
          ...currentClasses[currentClassI],
          pageTitle: `${currentClasses.name} Manual | ${this.options.title}`,
        };

        currentClass.outputPath = this.getOutputPath(`${folders[folderI]}/classes/${currentClass.name}`);
        currentClass.relativePath = this.getRelativePath(currentClass.outputPath);
        currentClasses[currentClassI] = currentClass;
      }
    }

    return {
      manuals,
      classes,
    };
  }

  async generateManuals() {
    const manuals = viewVariables.manuals;
    return new Promise(async (resolve, reject) => {
      for (let i = 0; i < manuals.length; i += 1) {
        const currentManual = manuals[i];
        const fileContent = await FileHelper.readMarkdownAsHtml(currentManual.content);
        await FileHelper.renderTemplate({
          ...currentManual,
          templatePath: this.getTemplatePath('manual'),
          data: {
            content: fileContent,
          },
        });
      }
    });
  }

  async generateClasses() {
    const classes = viewVariables.classes;
    return new Promise(async (resolve, reject) => {
      const folders = Object.keys(classes);

      for (let folderI = 0; folderI < folders.length; folderI += 1) {
        const currentClasses = classes[folders[folderI]];
        for (let currentClassI = 0; currentClassI < currentClasses.length; currentClassI += 1) {
          const currentClass = currentClasses[currentClassI];
          await FileHelper.renderTemplate({
            outputPath: currentClass.outputPath,
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

    const data = this.prepare();
    global.viewVariables = {
      pageTitle: this.options.title,
      classes: this.classes,
      content: '',
      ...(await data),
    };

    const publicPath = `${this.templatePath}/public/**`;
    copyfiles([publicPath, this.outputPath], { up: this.templatePath.count('/') + 1 }, async () => {

      this.generateManuals();
      this.generateHomePage();
      this.generateClasses();
    });
  }
}

DocGenerator.REFRENCE_LINKS = {
  'object': 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object',
};

global.DocGenerator = DocGenerator;

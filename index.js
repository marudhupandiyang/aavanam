// const path = require('path');
const fs = require('fs');
const glob = require("glob");
const parser = require("@babel/parser");
const commentParser = require('comment-parser');

require('./docGenerator');
require('./viewMethods');

const { log } = require('./lib');
const Doc = require('./doc');

const myDoc = new DocGenerator();

const docData = {
  standardFiles: {},
  classes: {},
  manuals: [],
};

function addClass(classDetails, parent) {
  parent = parent || '/';
  docData.classes[parent] = docData.classes[parent] || [];
  docData.classes[parent].push(classDetails);
}

global.REFRENCE_LINKS = {
  'object': 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object',
};

const Constants = {
  ClassDeclaration: 'ClassDeclaration',
  CommentBlock: 'CommentBlock',
  Tag: {
    desc: 'desc',
    param: 'param',
  },
  Node: {
    Constructor: 'constructor',
  }
};

const parseOptions = {
  sourceType: 'module',
  plugins: [
    'jsx',
    'classProperties',
  ],
};

async function aavanam(options) {
  const finalSourcesList = glob.sync(options.globPattern);

  options.manuals = glob.sync(options.manuals);

  myDoc.setTemplatePath(options.templatePath);
  myDoc.setOutputPath(options.outputPath);
  myDoc.setHomeFile(options.readme);
  myDoc.addManuals(options.manuals);

  docData.outputPath = options.outputPath;

  log('manuals', docData.manuals);
  docData.title = 'Test App';

  for(let sourceLoopIndex = 0; sourceLoopIndex < finalSourcesList.length; sourceLoopIndex += 1) {
    const currentFile = finalSourcesList[sourceLoopIndex];
    if (!currentFile.endsWith('.jsx') && !currentFile.endsWith('.js')) {
      log('Skipping file', currentFile);
      continue;
    }
    log('Starting with', currentFile);

    try {
      log('Reading file');
      const fileContent = fs.readFileSync(currentFile, 'utf-8');

      log('Parsing to tokens');
      const tokens = parser.parse(fileContent, parseOptions);

      log('Found tokens');
      const classes = await parseTokens(tokens);

      classes.forEach(c => {
        const fileName = currentFile.substr(currentFile.lastIndexOf('/') + 1);
        let filePath = currentFile.replace(`/${fileName}`, '').replace(options.basePath, '');
        if (filePath[0] === '/') {
          filePath = filePath.substr(1);
        }
        c.parent = filePath;

        // myDoc(c);
        addClass(c, filePath);
      });

    } catch (ex) {
      log('File errored out', currentFile, ex);
    }
  }

  // await parseStandardFiles(options);
  // await parseManuals(options);

  log('Final output');
  myDoc.generate();
  // await Doc(docData);
}

function parseStandardFiles(options) {
  if (options.readme) {
    log('Started parsing standard files');
    return (new Promise(async (resolve, reject) => {
      log('Parsing readme');
      const content = await fs.readFileSync(options.readme, 'utf-8');
      docData.standardFiles.readme = content;
      myDoc.setHomeContentAsMarkdown(options.readme);
      resolve();
    }));
  }
}

function parseManuals(options) {
  if (options.manuals) {
    log('Started parsing manuals');
    return (new Promise(async (resolve, reject) => {
      for(let i = 0; i < options.manuals.length; i += 1) {
        const fileName = options.manuals[i].substr(options.manuals[i].lastIndexOf('/') + 1);
        log('Parsing manual', fileName);
        const content = await fs.readFileSync(options.manuals[i], 'utf-8');
        const cls = {
          name: fileName.replace('.md', ''),
          outputfileName: fileName.replace('.md', '.html'),
          content,
        };
        myDoc.addManual(cls);
        docData.manuals.push(cls);
      }
      resolve();
    }));
  }
}

function parseTokens(tokens) {
  log('Parsing found tokens');
  return parseProgram(tokens.program);
}

function parseProgram(programNode) {
  log('Parsing program node');
  return parseProgramBody(programNode.body);
}

function parseProgramBody(programBody) {
  log('Parsing body');

  const classes = [];

  programBody.forEach(node => {
    log('Dealing with node', node.type);
    if (node.type === Constants.ClassDeclaration) {
      log('Dealing with Class ', node.id.name);

      const newClass = {
        name: node.id.name,
        outputfileName: `${node.id.name}.html`,
        ...parseLeadingComments(node.leadingComments),
        ...parseExtends(node),
        ...parseMemebers(node),
      };
      classes.push(newClass);
    }
  });

  return classes;
}

function parseMemebers(node) {
  const classBodyNodes = node.body.body
  const value = [];

  classBodyNodes.forEach(n => {
    const nValue = {
      name: n.key.name,
      params: (n.params || []).map(p => p.name),
      ...parseLeadingComments(n.leadingComments),
    };
    value.push(nValue);
  });
  return { methods: value };
}

function parseExtends(node) {
  const value = [];

  if (node.superClass) {
    if (node.superClass.object) {
      value.push(node.superClass.object.name);
    }
    if (node.superClass.property) {
      value.push(node.superClass.property.name);
    }
    return { extends: value };
  }
}

function parseLeadingComments(comments = []) {
  log('Staring with leading comments');
  const values = {
    subHeading: '',
    description: '',
    params: {},
    others: {},
  };

  comments.forEach(comment => {
    log('Parsing comment ', comment.type);
    let commentValue = comment.value;
    if (comment.type === Constants.CommentBlock) {
      commentValue = `/*${commentValue}*/`;
    } else {
      log('Unknown comment block ', comment.type);
    }

    let parsedComment = commentParser(commentValue, {
      trim: true,
    });
    parsedComment = parsedComment[0];

    values.subHeading = parsedComment.description;

    parsedComment.tags.forEach(t => {
      switch (t.tag) {
        case Constants.Tag.desc:
          values.description = `${t.name} ${t.description}`;
          break;

        case Constants.Tag.param:
          values.params[t.name] = {
            type: t.type,
            desc: t.description,
          };
          break;

        default:
          values.others[t.type] = t.description;
          break;
      }
    });
  });

  log('Done with leading comments');
  return { tags: values };
}


module.exports = aavanam;

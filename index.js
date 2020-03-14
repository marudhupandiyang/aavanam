// const path = require('path');
const fs = require('fs');
const glob = require("glob");
const parser = require("@babel/parser");
const commentParser = require('comment-parser');

String.prototype.count = function(c) {
  let result = 0;
  for(let i = 0; i < this.length; i += 1) {
    if ( this[i] == c) {
      result += 1;
    }
  }
  return result;
};


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

const Constants = {
  ClassDeclaration: 'ClassDeclaration',
  CommentBlock: 'CommentBlock',
  ClassMethod: 'ClassMethod',
  ClassProperty: 'ClassProperty',
  ArrowFunctionExpression: 'ArrowFunctionExpression',
  GetterMethod: 'get',
  SetterMethod: 'set',
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

  myDoc.setConfig({
    title: 'Test',
  });
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

        myDoc.addClass(c);
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
        ...parseMembers(node),
      };
      classes.push(newClass);
    } else {
      // if (node.declaration) {
      //   console.dir(node.declaration);
      // }
    }
  });

  return classes;
}

function parseMembers(node) {
  const classBodyNodes = node.body.body
  const methods = [];
  const properties = [];
  const staticProperties = [];
  const staticMethods = [];
  const getterMethods = [];
  const setterMethods = [];

  classBodyNodes.forEach(n => {
    // console.log(n);
    const nValue = {
      name: n.key.name,
      params: (n.params || []).map(p => p.name),
      ...parseLeadingComments(n.leadingComments),
    };

    if (n.type === Constants.ClassMethod) {
      if (n.static) {
        staticMethods.push(nValue);
      } else if (n.kind === Constants.GetterMethod) {
        getterMethods.push(nValue);
      } else if (n.kind === Constants.SetterMethod) {
        setterMethods.push(nValue);
      } else {
        methods.push(nValue);
      }
    } else if (n.type === Constants.ClassProperty) {
      if (n.value && n.value.type === Constants.ArrowFunctionExpression) {
        methods.push(nValue);
      } else if (n.static) {
        staticProperties.push(nValue);
      } else {
        properties.push(nValue);
      }
    }
  });
  return { methods, properties, staticMethods, getterMethods, setterMethods, staticProperties };
}

function parseExtends(node) {
  const value = [];
  log('Staring with extends');
  // console.dir(node);
  if (node.superClass) {
    if (node.superClass.object) {
      value.push(node.superClass.object.name);
    } else if (node.superClass.property) {
      value.push(node.superClass.property.name);
    } else if (node.superClass.name) {
      value.push(node.superClass.name);
    }
    log('Done with extends');
    return { extends: value };
  }
  log('Done with extends');
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

    if (parsedComment.length > 0) {
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
    }
  });

  log('Done with leading comments');
  return { tags: values };
}


module.exports = aavanam;

const path = require('path');
const fs = require('fs');
const glob = require("glob");
const parser = require("@babel/parser");

const babylon = require("babylon");
const traverse = require("babel-traverse");
const t = require("babel-types");

const commentParser = require('comment-parser');

const FileHelper = require('./fileHelper');

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

const log = require('debug')('aavanam');
// const Doc = require('./doc');

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

async function parseFile(filePath) {
  log('Reading file');
  const fileContent = await FileHelper.readFile(filePath);

  const result = {
    classes: [],
    methods: [],
    staticMethods: [],
    properties: [],
    staticProperties: [],
  };

  log('Parse file to ast');
  const ast = babylon.parse(fileContent, parseOptions);


  traverse.default(ast, {
    enter(path) {
      // console.dir(path.node.type);
    },
    FunctionDeclaration: function(path) {
       // path.node.id.name = "x";
    },
    ClassDeclaration: function(path) {
      var currentClass = {
        path: filePath,
        name: path.node.id.name,
        staticMethods: [],
        methods: [],
        properties: [],
        staticProperties: [],
        constructor: null,
        leadingComments: path.node.leadingComments || [],
        tags: {},
      };

      // result.classes[] =
      // push the current class to the final result.
      result.classes.push(currentClass);

      path.traverse({
        enter(path) {
          // console.log('c', path.node.type, path.node.name);
          // console.dir(path.node);
        },
        ClassMethod: function(path) {
          const currentMethod = {
            name: path.node.key.name,
            params: path.node.params.map(p => ({ name: p.name })),
            tags: {},
            leadingComments: path.node.leadingComments || [],
          };

          if (path.node.kind === 'constructor') {
            currentClass.constructor = currentMethod;
          } else if (path.node.static) {
            currentClass.staticMethods.push(currentMethod);
          } else {
           currentClass.methods.push(currentMethod);
          }
        },
        ClassProperty: function(path) {
          console.log('processing class property');
          const currentProperty = {
            name: path.node.id.name,
            tags: {},
            leadingComments: path.node.leadingComments || [],
          };

          if (path.node.static) {
            currentClass.staticProperties.push(currentProperty);
          } else {
           currentClass.properties.push(currentProperty);
          }
        }
      });
    },
  });
  return result;
}

async function aavanam(options) {
  const allFiles = glob.sync(options.globPattern);

  const result = {
    title: 'Test',
    files: {},
    templatePath: options.templatePath,
    outputPath: options.outputPath,
    homeFilePath: options.readme,
    manualPath: options.manualPath,
    manuals: glob.sync(path.resolve(options.manualPath, './**/*.md')),
  };

  for(let sourceLoopIndex = 0; sourceLoopIndex < allFiles.length; sourceLoopIndex += 1) {
    const currentFile = allFiles[sourceLoopIndex];
    if (!currentFile.endsWith('.jsx') && !currentFile.endsWith('.js')) {
      log('Skipping file', currentFile);
      continue;
    }
    log('Starting with', currentFile);

    try {
      const res = await parseFile(currentFile);
      result.files[path.dirname(path.relative(options.rootDirectory, currentFile))] = res;
    } catch (ex) {
      log('File errored out', currentFile, ex);
    }
  }

  log('Generating final output');
  const myDoc = new DocGenerator(result);
  myDoc.generate();
}

// function parseLeadingComments(comments = []) {
//   log('Staring with leading comments');
//   const values = {
//     subHeading: '',
//     description: '',
//     params: {},
//     others: {},
//   };
//
//   comments.forEach(comment => {
//     log('Parsing comment ', comment.type);
//     let commentValue = comment.value;
//     if (comment.type === Constants.CommentBlock) {
//       commentValue = `/*${commentValue}*/`;
//     } else {
//       log('Unknown comment block ', comment.type);
//     }
//
//     let parsedComment = commentParser(commentValue, {
//       trim: true,
//     });
//
//     if (parsedComment.length > 0) {
//       parsedComment = parsedComment[0];
//
//       values.subHeading = parsedComment.description;
//
//       parsedComment.tags.forEach(t => {
//         switch (t.tag) {
//           case Constants.Tag.desc:
//             values.description = `${t.name} ${t.description}`;
//             break;
//
//           case Constants.Tag.param:
//             values.params[t.name] = {
//               type: t.type,
//               desc: t.description,
//             };
//             break;
//
//           default:
//             values.others[t.type] = t.description;
//             break;
//         }
//       });
//     }
//   });
//
//   log('Done with leading comments');
//   return { tags: values };
// }


module.exports = aavanam;

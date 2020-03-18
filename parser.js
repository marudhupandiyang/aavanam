const babylon = require("babylon");
const traverse = require("babel-traverse");
const t = require("babel-types");
const commentParser = require('comment-parser');
const log = require('debug')('aavanam:parser');

const FileHelper = require('./fileHelper');

const parseOptions = {
  sourceType: 'module',
  plugins: [
    'jsx',
    'classProperties',
  ],
};

async function parseFile(filePath) {
  log('Reading file for parsing');
  const fileContent = await FileHelper.readFile(filePath);
  return parseContent(fileContent);
}

async function parseContent(fileContent) {
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
        // path: filePath,
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

module.exports = {
  parseFile,
  parseContent,
};

const babylon = require("babylon");
const traverse = require("babel-traverse");
const t = require("babel-types");
const marked = require('marked');
const commentParser = require('comment-parser');
const log = require('debug')('aavanam:parser');

const FileHelper = require('./fileHelper');
const Constants = require('./constants');

const parseOptions = {
  sourceType: 'module',
  plugins: [
    'jsx',
    'classProperties',
  ],
};

const markedOptions = {
  gfm: true,

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
        getterMethods: [],
        setterMethods: [],
        properties: [],
        staticProperties: [],
        constructor: null,
        // leadingComments: path.node.leadingComments || [],
        tags: parseLeadingComments(path.container.leadingComments || path.node.leadingComments),
      };

      if (path.node.superClass) {
        currentClass.extends = {
          name: path.node.superClass.name,
        }
      }

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
            tags: parseLeadingComments(path.node.leadingComments),
            // leadingComments: path.node.leadingComments || [],
          };

          if (path.node.kind === 'constructor') {
            currentClass.constructor = currentMethod;
          } else if (path.node.kind === 'get') {
            currentClass.getterMethods.push(currentMethod);

          } else if (path.node.kind === 'set') {
            currentClass.setterMethods.push(currentMethod);
          } else if (path.node.static) {
            currentClass.staticMethods.push(currentMethod);
          } else {
           currentClass.methods.push(currentMethod);
          }
        },
        ClassProperty: function(path) {
          const currentProperty = {
            name: path.node.id.name,
            tags: parseLeadingComments(path.node.leadingComments),
            // leadingComments: path.node.leadingComments || [],
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

function parseLeadingComments(comments = []) {
  commentLog = log.extend('comments');
  commentLog('Staring with leading comments');

  if (!comments) {
    return;
  }

  const values = {
    subHeading: '',
    description: '',
    params: {},
    others: {},
  };

  comments.forEach(comment => {
    commentLog('Parsing comment ', comment.type);
    let commentValue = comment.value;
    if (comment.type === Constants.CommentBlock) {
      commentValue = `/*${commentValue}*/`;
    } else {
      commentLog('Unknown comment block ', comment.type);
    }

    let parsedComment = commentParser(commentValue, {
      trim: true,
    });

    if (parsedComment.length > 0) {
      parsedComment = parsedComment[0];

      values.subHeading = marked(parsedComment.description.trim(), markedOptions);

      parsedComment.tags.forEach(t => {
        switch (t.tag) {
          case Constants.Tag.todo:
            values.todo = marked(`${t.name} ${t.description}`.trim(), markedOptions);
            break;

          case Constants.Tag.desc:
            values.description = marked(`${t.name} ${t.description}`.trim(), markedOptions);
            break;

          case Constants.Tag.param:
            values.params[t.name] = {
              type: t.type,
              desc: marked(t.description.trim(), markedOptions),
            };
            break;

          default:
            values.others[t.type] = marked(t.description.trim(), markedOptions);
            break;
        }
      });
    }
  });

  commentLog('Done with leading comments');
  return values;
}

module.exports = {
  parseFile,
  parseContent,
};

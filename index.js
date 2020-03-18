const path = require('path');
const fs = require('fs');
const glob = require("glob");
const log = require('debug')('aavanam');

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
const { parseFile } = require('./parser');

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

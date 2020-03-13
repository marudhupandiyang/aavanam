const fs = require('fs');
const glob = require("glob");
const parser = require("@babel/parser");
const commentParser = require('comment-parser');

const { log } = require('./lib');
const Doc = require('./doc');

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
};

const parseOptions = {
  sourceType: 'module',
  plugins: [
    'jsx',
    'classProperties',
  ],
};


async function aavanam(options) {
  // log(options);

  const finalSourcesList = glob.sync(options.globPattern);
  // log('Found source list', finalSourcesList);

  options.manuals = glob.sync(options.manuals);
  docData.outputPath = options.outputPath;

  if (!docData.outputPath) {
    log('No Output path defined');
    return;
  }

  log('manuals', docData.manuals);
  docData.title = 'Test App';

  for(let sourceLoopIndex = 0; sourceLoopIndex < finalSourcesList.length; sourceLoopIndex += 1) {
    const currentFile = finalSourcesList[sourceLoopIndex];
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

        addClass(c, filePath);
      });

    } catch (ex) {
      log('File errored out', currentFile, ex);
    }
  }

  await parseStandardFiles(options);
  await parseManuals(options);

  log('Final output');
  await Doc(docData);
}

function parseStandardFiles(options) {
  if (options.readme) {
    log('Started parsing standard files');
    return (new Promise(async (resolve, reject) => {
      log('Parsing readme');
      const content = await fs.readFileSync(options.readme, 'utf-8');
      docData.standardFiles.readme = content;
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
        docData.manuals.push({
          name: fileName.replace('.md', ''),
          outputfileName: fileName.replace('.md', '.html'),
          content,
        });
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
      };
      classes.push(newClass);
    }
  });

  return classes;
}

function parseLeadingComments(comments = []) {
  log('Staring with leading comments');
  const values = {
    tags: {},
  };

  comments.forEach(comment => {
    log('Parsing comment ', comment.type);
    let commentValue = comment.value;
    if (comment.type === Constants.CommentBlock) {
      commentValue = `/*${commentValue}*/`;
    } else {
      log('Unknown comment block ', comment.type);
    }

    const parsedComment = commentParser(commentValue, {
      trim: true,
    });

    values.subHeading = parsedComment.description;

    parsedComment.forEach(pComment => {
      pComment.tags.forEach(t => {
        values.tags[pComment.type] = pComment.description;
      });
    });
  });

  log('Done with leading comments');
  return values;
}


module.exports = aavanam;

const fs = require('fs');
const glob = require("glob");
const parser = require("@babel/parser");
const commentParser = require('comment-parser');

const Doc = require('./doc');

const docData = {
  standardFiles: {},
  classes: [],
};

function addClass(classDetails) {
  docData.classes = docData.classes || [];
  docData.classes.push(classDetails);
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

function log(...msg) {
  console.log(new Date(), 'Parser', ...msg);
}

async function aavanam(globPattern, isRecursive) {
  const finalSourcesList = glob.sync(globPattern);
  log('Found source list', finalSourcesList);

  docData.title = 'Test App';

  for(let sourceLoopIndex = 0; sourceLoopIndex < finalSourcesList.length; sourceLoopIndex += 1) {
    const currentFile = finalSourcesList[sourceLoopIndex];
    log('Starting with', currentFile);

    log('Reading file');
    const fileContent = fs.readFileSync(currentFile, 'utf-8');

    log('Parsing to tokens');
    const tokens = parser.parse(fileContent, parseOptions);

    log('Found tokens');
    parseTokens(tokens);

    await parseStandardFiles();

    log('Final output');
    await Doc(docData);
  }
}

function parseStandardFiles() {
  return (new Promise(async (resolve, reject) => {
    const content = await fs.readFileSync('README.md', 'utf-8');
    docData.standardFiles.readme = content;
    resolve();
  }));
}

function parseTokens(tokens) {
  log('Parsing found tokens');
  parseProgram(tokens.program);
}

function parseProgram(programNode) {
  log('Parsing program node');
  parseProgramBody(programNode.body);
}

function parseProgramBody(programBody) {
  log('Parsing body');

  programBody.forEach(node => {
    log('Dealing with node', node.type);
    if (node.type === Constants.ClassDeclaration) {
      log('Dealing with Class ', node.id.name);

      const newClass = {
        name: node.id.name,
        ...parseLeadingComments(node.leadingComments),
      };

      addClass(newClass);
    }
  });
}

function parseLeadingComments(comments) {
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

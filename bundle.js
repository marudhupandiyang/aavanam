// const path = require('path');
// const fs = require('fs');
// const glob = require('glob');
//
// const fileNames = glob.sync('./.js');
//
// const finalOutput = [];
//
// const currentDir = path.resolve('.');
//
//
// for(let i = 0; i < fileNames.length; i += 1) {
//   const relativePath = fileNames[i].replace(currentDir);
//   const fileContent = fs.readFileSync(fileNames[i], 'utf-8');
//   const ouput = `
//     const parent = module.parent;
//     const _module = new Module('${relativePath}', parent);
//     _module.compile('${fileContent.replace('\'', '\\\'')}', '${relativePath}');
//   `;
// }

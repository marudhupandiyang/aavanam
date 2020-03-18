const DocGenerator = require('./docGenerator');

function getTypeWithReferenceLink(type = '') {
  const link = DocGenerator.REFRENCE_LINKS[type.toLowerCase()];

  let linkTag = type;
  if (link) {
    linkTag = `<a target="_blank" href="${link}">${type}</a>`;
  }

  return `<span class="type">${linkTag}</span>`;
}

global.view = {
  getTypeWithReferenceLink,
};

module.exports = function splitMarkdown(markdown, sectionRegExp) {
  var sections = [], section
  sectionRegExp = sectionRegExp || /^\s*#[^#]/;
  function add () {
    if(section)
      sections.push(section.join('\n'))
  }
  markdown.split('\n').forEach(function (line) {
    if(sectionRegExp.test(line)) { // new section
      add()
      section = []
    }
    (section = section || []).push(line)
  })

  //add the last section
  add()

  return sections
}

var url = require('url')
  , GithubApi = require('github')
  , debug = require('debug')('strider-github-status')
  , path = require('path')

var GITHUB_DOMAIN = process.env.PLUGIN_GITHUB_API_DOMAIN
  , GITHUB_API_ENDPOINT = process.env.PLUGIN_GITHUB_API_ENDPOINT;

var config = {
  version: '3.0.0'
};

if (GITHUB_DOMAIN) {
  config.host = url.parse(GITHUB_DOMAIN).host;
}

if (GITHUB_API_ENDPOINT) {
  config.pathPrefix = url.parse(GITHUB_API_ENDPOINT).path;
}

function splitReport(report, sectionRegExp) {
  var sections = [], section
  sectionRegExp = sectionRegExp || /^\s*#[^#]/;
  function add () {
    if(section)
      sections.push(section.join('\n'))
  }
  report.split('\n').forEach(function (line) {
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

module.exports = function (token, url, data, status, description, report) {
  debug('Setting status', token, url, data, status, description)
  var github = new GithubApi(config);
  github.authenticate({
    type: 'oauth',
    token: token
  })
  github.statuses.create({
    target_url: url,
    user: data.user,
    repo: data.repo,
    state: status,
    sha: data.sha,
    description: description
  }, function (err) {
    if (err) console.error('failed to set github status', url, data, err.message)
  })
  if (report) {
    //   report = report.replace(/(.*^```js[\n\w]*```$)/gm, '');
    //   var mdSections = splitReport(report);
    //   mdSections.forEach(function(reportSection) {
    // var trimmedReport = report.replace(/(.*^```js[\n\w]*```$)/gm, '');
      github.issues.createComment({
          tager_url: url,
          user: data.user,
          repo: data.repo,
          number: 33631, // pr number,. shouldn't be hardcoded but for testing now its ok
          body: report
      }, function (err, res) {
          if (err) console.error('failed to post comment on pr', url, data, report, err.message)
          debug('Sent comment [err]', err)
          debug('Sent comment [res]', res)
      });
    })
  }
}

var url = require('url')
  , GithubApi = require('github')
  , debug = require('debug')('strider-github-status')
  , path = require('path');

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

module.exports.setStatus = function (token, url, data, status, description, report) {
  debug('Setting status', token, url, data, status, description)
  debugger;
  var github = new GithubApi(config)
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
  github.issues.createComment({
      tager_url: url,
      user: data.user,
      repo: data.repo,
      sha: data.sha,
      body: report
  }, (err) {
      if (err) console.error('failed to post comment on pr', url, data, report)
  })
}

module.exports.createComment = function (token, url, data, status, report) {
  debug('Reporting test results', token, url, data, status, report)
  debugger;
  var github = new GithubApi(config)
  github.authenticate({
    type: 'oauth',
    token: token
  })
  github.issues.createComment({
      tager_url: url,
      user: data.user,
      repo: data.repo,
      number: 33628, // pr number,. shouldn't be hardcoded but for testing now its ok
      body: report
  }, function (err) {
      if (err) console.error('failed to post comment on pr', url, data, report)
  })
}

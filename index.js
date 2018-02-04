var main = require('./lib/main.js')
var config = require('./jsreport.config.js')

module.exports = function (options) {
  config = Object.assign({}, config)
  config.options = Object.assign({}, options)
  config.options.forceProviderUsage = true
  config.main = main
  config.directory = __dirname
  return config
}

module.exports.MongoProvider = require('./lib/provider')
module.exports.GridFSBlobStorage = require('./lib/gridFSBlobStorage')

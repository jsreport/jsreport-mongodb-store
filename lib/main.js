var connection = require('./connection')
var q = require('q')

module.exports = function (reporter, definition) {
  var promise = q()
  var db

  if (reporter.options.connectionString.name.toLowerCase() === 'mongodb') {
    promise = connection(reporter.options.connectionString, reporter.logger).then(function (db) {
      reporter.documentStore.provider = new (require('./provider'))(reporter.documentStore.model, reporter.logger, db)
    })
  }

  if (reporter.options.blobStorage === 'gridFS') {
    promise = promise.then(function () {
      reporter.blobStorage = new (require('./gridFSBlobStorage'))(db)
    })
  }

  return promise
}

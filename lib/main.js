var connection = require('./connection')

module.exports = function (reporter, definition) {
  if (reporter.options.connectionString.name.toLowerCase() === 'mongodb') {
    return connection(reporter.options.connectionString, reporter.logger).then(function (db) {
      reporter.documentStore.provider = new (require('./provider'))(reporter.documentStore.model, reporter.logger, db)

      if (reporter.options.blobStorage === 'gridFS') {
        reporter.blobStorage = new (require('./gridFSBlobStorage'))(db)
      }
    })
  }
}

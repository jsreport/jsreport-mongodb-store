var connection = require('./connection')

module.exports = function (reporter, definition) {
  var shouldCreateConnection = false
  var needsDocumentStore = false
  var needsStorage = false
  var connectionOpts

  if (reporter.options.connectionString.name.toLowerCase() === 'mongodb') {
    shouldCreateConnection = true
    needsDocumentStore = true

    connectionOpts = reporter.options.connectionString
  }

  if (reporter.options.blobStorage === 'gridFS') {
    shouldCreateConnection = true
    needsStorage = true

    if (!connectionOpts) {
      // read connection settings from config
      connectionOpts = definition.options
    }
  }

  if (!shouldCreateConnection) {
    return
  }

  return connection(connectionOpts, reporter.logger).then(function (db) {
    if (needsDocumentStore) {
      reporter.documentStore.provider = new (require('./provider'))(reporter.documentStore.model, reporter.logger, db)
    }

    if (needsStorage) {
      reporter.blobStorage = new (require('./gridFSBlobStorage'))(db)
    }
  })
}

const connection = require('./connection')

module.exports = async function (reporter, definition) {
  if (!definition.options.forceProviderUsage && reporter.options.connectionString && reporter.options.connectionString.name.toLowerCase() !== 'mongodb') {
    return
  }

  const options = Object.assign({}, definition.options, reporter.options.connectionString)

  const db = await connection(options, reporter.logger)
  reporter.documentStore.provider = require('./provider')(reporter.documentStore.model, reporter.logger, db)

  if (reporter.options.blobStorage === 'gridFS') {
    reporter.blobStorage = require('./gridFSBlobStorage')(db)
  }
}

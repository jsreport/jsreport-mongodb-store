const connection = require('./connection')

module.exports = async function (reporter, definition) {
  if (reporter.options.store.provider !== 'mongodb') {
    return
  }

  const db = await connection(definition.options, reporter.logger)
  const exactDb = definition.options.uri ? db : db.db(definition.options.databaseName)

  reporter.closeListeners.add('mongo', this, () => db.close())
  reporter.documentStore.registerProvider(require('./provider')(reporter.documentStore.model, exactDb))

  if (reporter.options.blobStorage && reporter.options.blobStorage.provider === 'gridFS') {
    reporter.blobStorage.registerProvider(require('./gridFSBlobStorage')(exactDb))
  }
}

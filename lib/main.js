const connection = require('./connection')

module.exports = async function (reporter, definition) {
  if (reporter.options.store.provider !== 'mongodb') {
    return
  }

  const options = Object.assign({}, reporter.options.store, definition.options)

  const db = await connection(options, reporter.logger)
  const exactDb = options.uri ? db : db.db(options.databaseName)

  reporter.closeListeners.add('mongo', this, () => db.close())
  reporter.documentStore.registerProvider(require('./provider')(reporter.documentStore.model, exactDb))

  if (reporter.options.blobStorage.provider === 'gridFS') {
    reporter.blobStorage.registerProvider(require('./gridFSBlobStorage')(exactDb))
  }
}

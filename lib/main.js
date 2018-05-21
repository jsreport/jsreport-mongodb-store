const connection = require('./connection')

module.exports = async function (reporter, definition) {
  const versionSupported = /^2/

  if (!versionSupported.test(reporter.version)) {
    throw new Error(`${definition.name} extension version currently installed can only be used in jsreport v2, your current jsreport installation (${
      reporter.version
    }) is incompatible with this extension. please downgrade ${definition.name} extension to a version which works with jsreport ${
      reporter.version
    } or update jsreport to v2`)
  }

  if (reporter.options.store.provider !== 'mongodb') {
    return
  }

  const db = await connection(definition.options, reporter.logger)
  const exactDb = definition.options.uri ? db.db() : db.db(definition.options.databaseName)

  reporter.closeListeners.add('mongo', this, () => db.close())
  reporter.documentStore.registerProvider(require('./provider')(reporter.documentStore.model, exactDb))

  if (reporter.options.blobStorage && reporter.options.blobStorage.provider === 'gridFS') {
    reporter.blobStorage.registerProvider(require('./gridFSBlobStorage')(exactDb))
  }
}

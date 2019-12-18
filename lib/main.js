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

  if (
    reporter.options.store.provider !== 'mongodb' &&
    reporter.options.blobStorage.provider !== 'gridFS'
  ) {
    return
  }

  const client = await connection(definition.options, reporter.logger)
  const exactDb = definition.options.uri ? client.db() : client.db(definition.options.databaseName)

  if (reporter.options.store.provider === 'mongodb') {
    reporter.documentStore.registerProvider(require('./provider')(client, definition.options, exactDb))

    reporter.documentStore.on('after-init', () => {
      if (reporter.documentStore.provider.supportsTransactions === false) {
        reporter.logger.warn(`Transactions are not supported in this mongodb server instance, store is falling back to transactionless support. Transactions are supported on mongodb > 4.x and when the server is part of a replica set or sharded cluster, visit mongodb docs for information about how to enable transactions in your mongodb instance`)
      }
    })
  }

  if (reporter.options.blobStorage.provider === 'gridFS') {
    reporter.blobStorage.registerProvider(require('./gridFSBlobStorage')(client, exactDb))
  }

  // avoid exposing connection string through /api/extensions
  definition.options = {}
}

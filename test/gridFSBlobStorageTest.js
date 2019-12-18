require('should')
const jsreport = require('jsreport-core')

describe('grid FS', () => {
  let reporter

  beforeEach(async () => {
    reporter = jsreport({
      store: {
        provider: 'mongodb'
      },
      blobStorage: {
        provider: 'gridFS'
      }
    })

    const localOpts = {
      address: '127.0.0.1',
      port: 27017,
      databaseName: 'test'
    }

    const replicaOpts = {
      address: ['127.0.0.1', '127.0.0.1', '127.0.0.1'],
      port: [27017, 27018, 27019],
      databaseName: 'test',
      replicaSet: 'rs'
    }

    const extOptions = process.env.USE_REPLICA != null ? replicaOpts : localOpts

    reporter.use(require('../')(extOptions))

    await reporter.init()
    return reporter.documentStore.drop()
  })

  afterEach(() => reporter.close())

  jsreport.tests.blobStorage()(() => reporter.blobStorage)
})

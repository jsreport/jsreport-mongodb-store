require('should')
const jsreport = require('jsreport-core')

describe('grid FS', () => {
  let reporter

  beforeEach(async () => {
    reporter = jsreport({
      store: {
        provider: 'mongodb',
        address: '127.0.0.1',
        port: 27017,
        databaseName: 'test'
      },
      blobStorage: {
        provider: 'gridFS'
      }
    })
    reporter.use(require('../')())

    await reporter.init()
    return reporter.documentStore.drop()
  })

  afterEach(() => reporter.close())

  jsreport.tests.blobStorage()(() => reporter.blobStorage)
})

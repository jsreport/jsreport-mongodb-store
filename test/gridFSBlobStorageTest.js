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
    reporter.use(require('../')({
      address: '127.0.0.1',
      port: 27017,
      databaseName: 'test'
    }))

    await reporter.init()
    return reporter.documentStore.drop()
  })

  afterEach(() => reporter.close())

  jsreport.tests.blobStorage()(() => reporter.blobStorage)
})

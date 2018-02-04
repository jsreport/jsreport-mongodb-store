require('should')
const jsreport = require('jsreport-core')

describe('grid FS', function () {
  let reporter

  beforeEach(async () => {
    reporter = jsreport({
      connectionString: {
        'name': 'mongodb',
        'address': '127.0.0.1',
        'port': 27017,
        'databaseName': 'test'
      },
      blobStorage: 'gridFS'
    })
    reporter.use(require('../')())

    await reporter.init()
    return reporter.documentStore.drop()
  })

  jsreport.tests.blobStorage(() => reporter.blobStorage)
})

require('should')
const jsreport = require('jsreport-core')

describe.only('mongodb store', () => {
  let reporter

  beforeEach(async () => {
    reporter = jsreport()
    reporter.use(require('../')({ 'address': '127.0.0.1', 'port': 27017, 'databaseName': 'test' }))

    await reporter.init()
  })

  jsreport.tests.documentStore()(() => reporter.documentStore)
})

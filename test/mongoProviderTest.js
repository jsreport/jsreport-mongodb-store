require('should')
const jsreport = require('jsreport-core')

describe('mongodb store', () => {
  let reporter

  beforeEach(async () => {
    reporter = jsreport({ store: { provider: 'mongodb' } })
    reporter.use(require('../')({ 'address': '127.0.0.1', 'port': 27017, 'databaseName': 'test' }))

    await reporter.init()
  })

  afterEach(() => reporter.close())

  jsreport.tests.documentStore()(() => reporter.documentStore)
})

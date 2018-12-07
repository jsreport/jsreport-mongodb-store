const should = require('should')
const jsreport = require('jsreport-core')

describe('mongodb store', () => {
  let reporter

  beforeEach(async () => {
    reporter = jsreport({ store: { provider: 'mongodb' } })
    reporter.use(require('../')({ 'address': '127.0.0.1', 'port': 27017, 'databaseName': 'test' }))

    reporter.use(() => {
      reporter.documentStore.registerEntityType('TestType', {
        _id: { type: 'Edm.String', key: true },
        name: { type: 'Edm.String', key: true, publicKey: true },
        content: { type: 'Edm.Binary', document: { extension: 'html', content: true } }
      })
      reporter.documentStore.registerEntitySet('testing', { entityType: 'jsreport.TestType' })
    })
    await reporter.init()
  })

  afterEach(() => reporter.close())

  it('should return true node buffers', async () => {
    await reporter.documentStore.collection('testing').insert({
      name: 'foo',
      content: Buffer.from('foo')
    })

    const doc = await reporter.documentStore.collection('testing').findOne({ name: 'foo' })
    Buffer.isBuffer(doc.content).should.be.true()
  })

  it('should return string instead of ObjectId from insert', async () => {
    const doc = await reporter.documentStore.collection('testing').insert({
      name: 'foo',
      content: Buffer.from('foo')
    })

    doc._id.should.have.type('string')
  })

  it('should remove entity by _id', async () => {
    const doc = await reporter.documentStore.collection('testing').insert({
      name: 'foo'
    })

    await reporter.documentStore.collection('testing').remove({ _id: doc._id })
    const loadedDoc = await reporter.documentStore.collection('testing').findOne({ name: 'foo' })
    should(loadedDoc).not.be.ok()
  })

  jsreport.tests.documentStore()(() => reporter.documentStore)
})

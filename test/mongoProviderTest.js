const should = require('should')
const jsreport = require('jsreport-core')

describe('mongodb store', () => {
  common()
})

describe('mongodb store prefix', () => {
  common(true)
})

function common (prefix) {
  let reporter

  beforeEach(async () => {
    reporter = jsreport({ store: { provider: 'mongodb' } })

    const extOptions = {
      'address': '127.0.0.1',
      'port': 27017,
      'databaseName': 'test'
    }

    if (prefix) {
      extOptions.prefix = 'jsreport_'
    }

    reporter.use(require('../')(extOptions))

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

  if (prefix) {
    it('collections should have prefix', async () => {
      await reporter.documentStore.collection('testing').insert({
        name: 'foo'
      })

      const collections = await reporter.documentStore.provider.db.collections()
      const found = collections.find((c) => c.collectionName.startsWith('jsreport_testing'))

      should(found != null).be.eql(true)
    })
  } else {
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
  }
}

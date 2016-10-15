require('should')
var MongoProvider = require('../lib/provider')
var connection = require('../lib/connection')
var q = require('q')

var model = {
  namespace: 'jsreport',
  entityTypes: {
    'UserType': {
      '_id': { 'type': 'Edm.String', key: true },
      'name': { 'type': 'Edm.String' }
    }
  },
  entitySets: {
    'users': {
      entityType: 'jsreport.UserType'
    }
  }
}

var connectionString = { 'name': 'mongodb', 'address': '127.0.0.1', 'port': 27017, 'databaseName': 'test' }
var logger = { info: function () {}, error: function () {}, warn: function () {}, debug: function () {} }

describe('mongoProvider', function () {
  var mongoProvider

  beforeEach(function () {
    return connection(connectionString, logger).then(function (db) {
      mongoProvider = new MongoProvider(model, logger, db)
      return mongoProvider.init().then(function () {
        return q.ninvoke(mongoProvider.db, 'dropDatabase')
      })
    })
  })

  it('insert and query', function (done) {
    mongoProvider.collection('users').insert({ name: 'test' })
      .then(function () {
        return mongoProvider.collection('users').find({ name: 'test' }).then(function (res) {
          res.length.should.be.eql(1)
          done()
        })
      }).catch(done)
  })

  it('insert, update, query', function (done) {
    mongoProvider.collection('users').insert({ name: 'test' })
      .then(function () {
        return mongoProvider.collection('users').update({ name: 'test' }, { $set: { name: 'test2' } })
      }).then(function () {
        return mongoProvider.collection('users').find({ name: 'test2' }).then(function (res) {
          res.length.should.be.eql(1)
          done()
        })
      }).catch(done)
  })

  it('insert remove query', function (done) {
    mongoProvider.collection('users').insert({ name: 'test' })
      .then(function () {
        return mongoProvider.collection('users').remove({ name: 'test' }, { $set: { name: 'test2' } })
      }).then(function () {
        return mongoProvider.collection('users').find({ name: 'test' }).then(function (res) {
          res.length.should.be.eql(0)
          done()
        })
      }).catch(done)
  })

  it('beforeInsertListeners should be invoked', function (done) {
    mongoProvider.collection('users').beforeInsertListeners.add('test', function () {
      done()
    })

    mongoProvider.collection('users').insert({ name: 'test' })
      .then(function () {
        return mongoProvider.collection('users').find({ name: 'test' })
      }).catch(done)
  })

  it('beforeRemoveListeners should be invoked', function (done) {
    mongoProvider.collection('users').beforeRemoveListeners.add('test', function () {
      done()
    })

    mongoProvider.collection('users').remove({ name: 'test' }).catch(done)
  })

  it('beforeUpdateListeners should be invoked', function (done) {
    mongoProvider.collection('users').beforeUpdateListeners.add('test', function () {
      done()
    })

    mongoProvider.collection('users').update({ name: 'test' }, { $set: { name: 'test2' } }).catch(done)
  })
})

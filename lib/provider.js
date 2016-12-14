var ListenerCollection = require('listener-collection')
var q = require('q')
var ObjectId = require('mongodb').ObjectID

var MongoProvider = module.exports = function (model, logger, db) {
  this._model = model
  this.logger = logger
  this.collections = {}
  this.db = db
}

MongoProvider.prototype.init = function () {
  var self = this
  Object.keys(self._model.entitySets).map(function (key) {
    var entitySet = self._model.entitySets[key]
    var col = new MongoCollection(key, entitySet, self._model.entityTypes[entitySet.entityType.replace('jsreport.', '')], self.logger, self.db)
    self.collections[key] = col
  })
  return q()
}

MongoProvider.prototype.collection = function (name) {
  return this.collections[name]
}

MongoProvider.prototype.adaptOData = function (odataServer) {
  var self = this
  odataServer.model(this._model)
    .onMongo(function (cb) {
      cb(null, self.db)
    }).beforeQuery(function (col, query, req, cb) {
      self.collections[col].beforeQuery(query, req).then(function () { cb() }).catch(cb)
    }).beforeUpdate(function (col, query, update, req, cb) {
      self.collections[col].beforeUpdate(query, update, req).then(function () { cb() }).catch(cb)
    }).beforeRemove(function (col, query, req, cb) {
      self.collections[col].beforeRemove(query, req).then(function () { cb() }).catch(cb)
    }).beforeInsert(function (col, doc, req, cb) {
      self.collections[col].beforeInsert(doc, req).then(function () { cb() }).catch(cb)
    })
}

function MongoCollection (name, entitySet, entityType, logger, db) {
  this.name = name
  this.logger = logger
  this.entitySet = entitySet
  this.entityType = entityType
  this.beforeFindListeners = new ListenerCollection()
  this.beforeUpdateListeners = new ListenerCollection()
  this.beforeInsertListeners = new ListenerCollection()
  this.beforeRemoveListeners = new ListenerCollection()
  this.db = db
}

var hexTest = /^[0-9A-Fa-f]{24}$/

function _convertStringsToObjectIds (o) {
  for (var i in o) {
    if (i === '_id' && (typeof o[i] === 'string' || o[i] instanceof String) && hexTest.test(o[i])) {
      o[i] = new ObjectId(o[i])
    }

    if (o[i] !== null && typeof (o[i]) === 'object') {
      _convertStringsToObjectIds(o[i])
    }
  }
}

function _convertBsonToBuffer (o) {
  for (var i in o) {
    if (o[i] && o[i]._bsontype === 'Binary') {
      o[i] = o[i].buffer
      continue
    }

    if (o[i] !== null && typeof (o[i]) === 'object') {
      _convertBsonToBuffer(o[i])
    }
  }
}

MongoCollection.prototype.find = function (query, req) {
  var self = this

  _convertStringsToObjectIds(query)

  return self.beforeFindListeners.fire(query, req).then(function () {
    return q.ninvoke(self.db.collection(self.name).find(query), 'toArray').then(function (res) {
      _convertBsonToBuffer(res)
      return res
    })
  })
}

MongoCollection.prototype.count = function (query) {
  var self = this
  _convertStringsToObjectIds(query)

  return q.ninvoke(self.db.collection(self.name), 'count', query)
}

MongoCollection.prototype.insert = function (doc, req) {
  var self = this
  _convertStringsToObjectIds(doc)
  return self.beforeInsertListeners.fire(doc, req).then(function () {
    return q.ninvoke(self.db.collection(self.name), 'insert', doc).then(function (res) {
      if (res.ops.length !== 1) {
        throw new Error('Mongo insert should return single document')
      }

      return res.ops[0]
    })
  })
}

MongoCollection.prototype.update = function (query, update, options, req) {
  if (options && options.httpVersion) {
    req = options
    options = {}
  }

  options = options || {}
  var self = this

  _convertStringsToObjectIds(query)
  _convertStringsToObjectIds(update)

  return self.beforeUpdateListeners.fire(query, update, req).then(function () {
    return q.ninvoke(self.db.collection(self.name), 'updateMany', query, update, options).then(function (res) {
      if (!res.result.ok) {
        throw new Error('Update not successful')
      }

      return res.result.n
    })
  })
}

MongoCollection.prototype.remove = function (query, req) {
  var self = this

  _convertStringsToObjectIds(query)

  return self.beforeRemoveListeners.fire(query, req).then(function () {
    return q.ninvoke(self.db.collection(self.name), 'remove', query)
  })
}

MongoCollection.prototype.beforeQuery = function (query, req) {
  this.logger.debug('OData query on ' + this.name)
  return this.beforeFindListeners.fire(query.$filter, req)
}

MongoCollection.prototype.beforeInsert = function (doc, req) {
  this.logger.debug('OData insert into ' + this.name)
  return this.beforeInsertListeners.fire(doc, req)
}

MongoCollection.prototype.beforeUpdate = function (query, update, req) {
  this.logger.debug('OData update on ' + this.name)
  return this.beforeUpdateListeners.fire(query, update, req)
}

MongoCollection.prototype.beforeRemove = function (query, req) {
  this.logger.debug('OData remove on ' + this.name)
  return this.beforeRemoveListeners.fire(query, req)
}

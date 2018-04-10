const ObjectId = require('mongodb').ObjectID
const hexTest = /^[0-9A-Fa-f]{24}$/

function _convertStringsToObjectIds (o) {
  for (let i in o) {
    if (i === '_id' && (typeof o[i] === 'string' || o[i] instanceof String) && hexTest.test(o[i])) {
      o[i] = new ObjectId(o[i])
    }

    if (o[i] !== null && typeof (o[i]) === 'object') {
      _convertStringsToObjectIds(o[i])
    }
  }
}

module.exports = (model, db) => ({
  find (entitySet, query, fields = {}, opts) {
    _convertStringsToObjectIds(query)

    return db.collection(entitySet).find(query, { projection: fields })
  },

  async insert (entitySet, doc) {
    _convertStringsToObjectIds(doc)
    await db.collection(entitySet).insert(doc)
    return doc
  },

  async update (entitySet, q, u, opts = {}) {
    _convertStringsToObjectIds(q)
    _convertStringsToObjectIds(u)

    const res = await db.collection(entitySet).updateMany(q, u, opts)
    return res.upsertedCount || res.modifiedCount
  },

  remove (entitySet, q) {
    return db.collection(entitySet).findAndRemove(q)
  },

  drop () {
    return db.dropDatabase()
  }
})

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

function _convertBufferAndIds (obj) {
  for (const p in obj) {
    if (!obj[p] || !obj.hasOwnProperty(p)) {
      continue
    }

    if (obj[p] instanceof ObjectId) {
      obj[p] = obj[p].toString()
      continue
    }

    if (obj[p]._bsontype === 'Binary') {
      obj[p] = obj[p].buffer
      continue
    }

    if (typeof obj[p] !== 'object' || Array.isArray(obj[p])) {
      continue
    }

    _convertBufferAndIds(obj[p])
  }
}

module.exports = (model, client, db) => ({
  client,
  db,

  find (entitySet, query, fields = {}, opts) {
    _convertStringsToObjectIds(query)

    const cursor = db.collection(entitySet).find(query, { projection: fields })
    const orinalToArray = cursor.toArray.bind(cursor)
    cursor.toArray = async () => {
      const res = await orinalToArray()
      res.forEach(_convertBufferAndIds)
      return res
    }
    return cursor
  },

  async insert (entitySet, doc) {
    _convertStringsToObjectIds(doc)
    await db.collection(entitySet).insert(doc)
    _convertBufferAndIds(doc)
    return doc
  },

  async update (entitySet, q, u, opts = {}) {
    _convertStringsToObjectIds(q)
    _convertStringsToObjectIds(u)

    const res = await db.collection(entitySet).updateMany(q, u, opts)
    return res.upsertedCount || res.modifiedCount
  },

  remove (entitySet, q) {
    _convertStringsToObjectIds(q)
    return db.collection(entitySet).findAndRemove(q)
  },

  drop () {
    return db.dropDatabase()
  }
})

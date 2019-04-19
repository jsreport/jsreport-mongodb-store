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

function getCollectionName (prefix, entitySet) {
  return `${prefix || ''}${entitySet}`
}

module.exports = (client, options, db) => ({
  client,
  db,

  find (entitySet, query, fields = {}, opts) {
    _convertStringsToObjectIds(query)

    const cursor = db.collection(getCollectionName(options.prefix, entitySet)).find(query, { projection: fields })

    const originalToArray = cursor.toArray.bind(cursor)
    cursor.toArray = async () => {
      const res = await originalToArray()
      _convertBufferAndIds(query)
      res.forEach(_convertBufferAndIds)
      return res
    }
    return cursor
  },

  async insert (entitySet, doc) {
    _convertStringsToObjectIds(doc)
    await db.collection(getCollectionName(options.prefix, entitySet)).insertOne(doc)
    _convertBufferAndIds(doc)
    return doc
  },

  async update (entitySet, q, u, opts = {}) {
    _convertStringsToObjectIds(q)
    _convertStringsToObjectIds(u)

    const res = await db.collection(getCollectionName(options.prefix, entitySet)).updateMany(q, u, opts)

    _convertBufferAndIds(q)
    _convertBufferAndIds(u)

    return res.upsertedCount || res.modifiedCount
  },

  async remove (entitySet, q) {
    _convertStringsToObjectIds(q)
    const result = await db.collection(getCollectionName(options.prefix, entitySet)).deleteMany(q)
    _convertBufferAndIds(q)
    return result
  },

  drop () {
    return db.dropDatabase()
  }
})

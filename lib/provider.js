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

module.exports = (client, options, db) => {
  let transactionsSupported

  async function areTransactionsSupported () {
    let supported = false
    let session

    try {
      session = client.startSession()

      session.startTransaction()

      await db.collection(getCollectionName(options.prefix, 'templates')).findOne({}, {
        session
      })

      await session.commitTransaction()

      supported = true
    } catch (e) {
      let expectedError = false

      if (e.codeName === 'IllegalOperation') {
        expectedError = true
      }

      if (!expectedError) {
        throw e
      }
    } finally {
      if (session) {
        await session.endSession()
      }
    }

    return supported
  }

  function addSessionToOpts (opts) {
    const { transaction: session, ...restOpts } = opts
    const newOpts = { ...restOpts }

    if (transactionsSupported && session) {
      newOpts.session = session
    }

    return newOpts
  }

  return {
    client,
    db,

    get supportsTransactions () {
      return transactionsSupported
    },

    async load (model) {
      for (let entitySetName of Object.keys(model.entitySets)) {
        // the operation does not throw error when the collection already exists,
        // so it works as expected in the next starts when the collections are already there
        await db.createCollection(getCollectionName(options.prefix, entitySetName))
      }

      transactionsSupported = await areTransactionsSupported()
    },

    beginTransaction () {
      if (!transactionsSupported) {
        return {}
      }

      const session = client.startSession()

      session.startTransaction()

      return session
    },

    async commitTransaction (tran) {
      if (!transactionsSupported) {
        return
      }

      const session = tran

      await session.commitTransaction()

      await session.endSession()
    },

    async rollbackTransaction (tran) {
      if (!transactionsSupported) {
        return
      }

      const session = tran

      await session.abortTransaction()

      await session.endSession()
    },

    find (entitySet, query, fields = {}, opts = {}) {
      _convertStringsToObjectIds(query)

      const queryOpts = addSessionToOpts(opts)

      queryOpts.projection = fields

      const cursor = db.collection(getCollectionName(options.prefix, entitySet)).find(query, queryOpts)

      const originalToArray = cursor.toArray.bind(cursor)
      cursor.toArray = async () => {
        const res = await originalToArray()
        _convertBufferAndIds(query)
        res.forEach(_convertBufferAndIds)
        return res
      }
      return cursor
    },

    async insert (entitySet, doc, opts = {}) {
      _convertStringsToObjectIds(doc)

      const insertOpts = addSessionToOpts(opts)

      await db.collection(getCollectionName(options.prefix, entitySet)).insertOne(doc, insertOpts)
      _convertBufferAndIds(doc)
      return doc
    },

    async update (entitySet, q, u, opts = {}) {
      _convertStringsToObjectIds(q)
      _convertStringsToObjectIds(u)

      const updateOpts = addSessionToOpts(opts)

      const res = await db.collection(getCollectionName(options.prefix, entitySet)).updateMany(q, u, updateOpts)

      _convertBufferAndIds(q)
      _convertBufferAndIds(u)

      return res.upsertedCount || res.modifiedCount
    },

    async remove (entitySet, q, opts = {}) {
      _convertStringsToObjectIds(q)

      const removeOpts = addSessionToOpts(opts)

      const result = await db.collection(getCollectionName(options.prefix, entitySet)).deleteMany(q, removeOpts)
      _convertBufferAndIds(q)
      return result
    },

    drop (opts = {}) {
      const dropOpts = addSessionToOpts(opts)

      return db.dropDatabase(dropOpts)
    },

    close () {
      client.close()
    }
  }
}

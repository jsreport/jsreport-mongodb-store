const mongodb = require('mongodb')
const Promise = require('bluebird')

module.exports = (db) => ({
  write (blobName, buffer) {
    return new Promise((resolve, reject) => {
      const gs = new mongodb.GridFSBucket(db)
      const stream = gs.openUploadStream(blobName)
      stream.on('finish', () => resolve(blobName))
      stream.on('error', reject)
      stream.write(buffer)
      stream.end()
    })
  },

  read (blobName) {
    const gs = new mongodb.GridFSBucket(db)
    const stream = gs.openDownloadStreamByName(blobName)

    return new Promise((resolve, reject) => {
      const bufs = []
      stream.on('data', (d) => bufs.push(d))
      stream.on('end', () => resolve(Buffer.concat(bufs)))
      stream.on('error', reject)
    })
  },

  async remove (blobName) {
    const file = await db.collection('fs.files').findOne({ filename: blobName })
    const gs = new mongodb.GridFSBucket(db)
    return gs.delete(file._id)
  }
})

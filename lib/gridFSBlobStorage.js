var mongodb = require('mongodb')

var GridFSBlobStorage = module.exports = function (db) {
  this.db = db
}

GridFSBlobStorage.prototype.write = function (blobName, inputStream, cb) {
  var gs = new mongodb.GridStore(this.db, blobName, 'w', { 'chunk_size': 1024 * 4 })
  gs.open(function () {
    gs.write(inputStream, function (err, gs) {
      gs.close(function () {
        cb(err, blobName)
      })
    })
  })
}

GridFSBlobStorage.prototype.read = function (blobName, cb) {
  var gs = new mongodb.GridStore(this.db, blobName, 'r', { 'chunk_size': 1024 * 4 })
  gs.open(function () {
    try {
      cb(null, gs.stream(true))
    } catch (e) {
      cb(e)
    }
  })
}

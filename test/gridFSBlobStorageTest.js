require('should')
var GridFSBlobStorage = require('../lib/gridFSBlobStorage')
var connection = require('../lib/connection')
describe('grid FS', function () {
  var gridFSBlobStorage

  beforeEach(function () {
    return connection({
      'name': 'mongodb',
      'address': '127.0.0.1',
      'port': 27017,
      'databaseName': 'test'
    }, {
      info: function () {},
      error: function () {},
      warn: function () {},
      debug: function () {}
    }).then(function (adb) {
      gridFSBlobStorage = new GridFSBlobStorage(adb)
    })
  })

  it('write and read', function (done) {
    gridFSBlobStorage.write('foo', new Buffer('Hula'), function (err) {
      if (err) {
        return done(err)
      }

      gridFSBlobStorage.read('foo', function (err, str) {
        if (err) {
          return done(err)
        }

        var string = ''
        str.on('data', function (data) {
          if (data) {
            string += data
          }
        })

        str.on('end', function () {
          string.should.be.eql('Hula')
          done()
        })
      })
    })
  })
})

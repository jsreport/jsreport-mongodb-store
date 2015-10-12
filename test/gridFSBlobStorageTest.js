var should = require("should");
var GridFSBlobStorage = require("../lib/gridFSBlobStorage");


describe("grid FS", function () {
    var gridFSBlobStorage = new GridFSBlobStorage({ "name": "mongodb", "address": "127.0.0.1", "port": 27017, "databaseName" : "test",
        logger: { info: function(){}, error: function() {}, warn: function() {}, debug: function() {}}});

    it("write and read", function (done) {

        gridFSBlobStorage.write("foo", new Buffer("Hula"), function(err) {
            if (err) {
                return done(err);
            }

            gridFSBlobStorage.read("foo", function(err, str) {
                if (err) {
                    return done(err);
                }

                var string = '';
                str.on('data',function(data){
                    if (data) {
                        string += data;
                    }
                });

                str.on('end',function(){
                    string.should.be.eql("Hula");
                    done();
                });
            });
        })
    });
});
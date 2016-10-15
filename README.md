# jsreport-mongodb-store

[![Build Status](https://travis-ci.org/jsreport/jsreport-mongodb-store.png?branch=master)](https://travis-ci.org/jsreport/jsreport-mongodb-store)

[jsreport](http://jsreport.net/) extension adding support for storing templates and reports inside [mongodb](https://www.mongodb.org/).

##Installation

> npm install jsreport-mongodb-store

Then alter jsreport configuration with:

```js
{
   ....
   "connectionString": { 
      "name": "mongodb", 
      "address": "127.0.0.1", 
	  "databaseName" : "std" 
   },
   "blobStorage": "gridFS",
}
```

Note that using mongodb GridFS is optional, you can keep using file system storage for reports when required. In this case change `blobStorage` value to `fileSystem`.

You can also pass connection uri like this

```js
"connectionString": { 
	"uri": "mongodb://db1.example.net,db2.example.net:2500/?replicaSet=test"
}
```
var MongoClient = require('mongodb').MongoClient
var querystring = require('querystring')

var buildConnectionString = function (config) {
  var connectionString = 'mongodb://'

  if (config.username) {
    connectionString += config.username + ':' + config.password + '@'
  }

  if (!Array.isArray(config.address)) {
    config.address = [config.address]
    config.port = [config.port || 27017]
  }

  for (var i = 0; i < config.address.length; i++) {
    connectionString += config.address[i] + ':' + config.port[i] + ','
  }

  connectionString = connectionString.substring(0, connectionString.length - 1)
  connectionString += '/' + (config.authDb || config.databaseName)

  var query = {}
  if (config.replicaSet) {
    query.replicaSet = config.replicaSet
  }

  if (config.ssl === true) {
    query.ssl = true
  }

  if (Object.getOwnPropertyNames(query).length !== 0) {
    connectionString += '?' + querystring.stringify(query)
  }

  return connectionString
}

module.exports = function (config, logger) {
  const connectionString = config.uri || buildConnectionString(config)

  logger.info('Connecting mongo to ' + connectionString)

  // required for azure - firewall closes idle connections, wee need to set the lower value for timeouts
  var options = {
    server: {
      auto_reconnect: true,
      socketOptions: {
        keepAlive: 1,
        connectTimeoutMS: 10000,
        socketTimeoutMS: 60000
      }
    },
    replSet: {
      auto_reconnect: true,
      socketOptions: {
        keepAlive: 1,
        connectTimeoutMS: 10000,
        socketTimeoutMS: 60000
      }
    }
  }

  return MongoClient.connect(connectionString, options).then(function (db) {
    logger.info('Connection successful')
    return config.uri ? db : db.db(config.databaseName)
  }).catch(function (err) {
    logger.error('Connection failed ' + err.stack)
    throw err
  })
}

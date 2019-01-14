module.exports = {
  'name': 'mongodb-store',
  'main': './lib/main.js',
  'dependencies': [],
  'optionsSchema': {
    store: {
      type: 'object',
      properties: {
        provider: { type: 'string', enum: ['mongodb'] }
      }
    },
    blobStorage: {
      type: 'object',
      properties: {
        provider: { type: 'string', enum: ['gridFS'] }
      }
    },
    extensions: {
      'mongodb-store': {
        type: 'object',
        properties: {
          uri: { type: 'string' },
          authDb: { type: 'string' },
          databaseName: { type: 'string' },
          username: { type: 'string' },
          password: { type: 'string' },
          address: {
            oneOf: [
              { type: 'string' },
              { type: 'array', items: { type: 'string' } }
            ]
          },
          port: {
            oneOf: [
              { type: 'number' },
              { type: 'array', items: { type: 'number' } }
            ]
          },
          prefix: { type: 'string', default: '' },
          replicaSet: { type: 'string' },
          ssl: { type: 'boolean' }
        }
      }
    }
  },
  'skipInExeRender': true,
  'hasPublicPart': false
}

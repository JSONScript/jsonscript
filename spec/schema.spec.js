'use strict';

var jsonSchemaTest = require('json-schema-test')
  , Ajv = require('ajv');

var ajv = Ajv({ allErrors: true });
ajv.addSchema(require('../schema'));


jsonSchemaTest([ ajv ], {
  description: 'jsonscript schema and examples tests',
  suites: {
    'examples': './scripts/{**/,}*.json'
  },
  cwd: __dirname,
  hideFolder: 'scripts/',
  timeout: 20000
});

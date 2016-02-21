'use strict';

var jsonSchemaTest = require('json-schema-test')
  , Ajv = require('ajv');

var ajv = Ajv({ allErrors: true, v5: true });
ajv.addSchema(require('../schema/schema'));
ajv.addSchema(require('../schema/schema_strict'));


jsonSchemaTest([ ajv ], {
  description: 'jsonscript schema and examples tests',
  suites: { 'examples': './scripts/{**/,}*.json' },
  cwd: __dirname,
  hideFolder: 'scripts/',
  timeout: 10000
});

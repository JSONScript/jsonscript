'use strict';

var Ajv = require('ajv');

var ajv = Ajv({ allErrors: true, v5: true });


describe('evaluate schema', function() {
  it('should be valid according to evaluate_metaschema', function() {
    ajv.addMetaSchema(require('../schema/evaluate_metaschema'));
    ajv.compile(require('../schema/evaluate'));
  });
});

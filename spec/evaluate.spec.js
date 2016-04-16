'use strict';

var Ajv = require('ajv');

var ajv = Ajv({ allErrors: true, v5: true });


describe('evaluate schema', function() {
  it('should be valid and should compile', function() {
    ajv.compile(require('../schema/evaluate'));
  });
});

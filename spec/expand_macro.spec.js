'use strict';

var Ajv = require('ajv');

var ajv = Ajv({ allErrors: true, v5: true });


describe('expand_macros schema', function() {
  it('should be valid and should compile', function() {
    ajv.compile(require('../schema/expand_macros'));
  });
});

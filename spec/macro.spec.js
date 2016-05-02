'use strict';

var macros = require('../macros');
var Ajv = require('ajv');
var ajv = Ajv({ v5: true });
var validate = ajv.compile(require('../schema/macro.json'));
var assert = require('assert');


describe('macro definition validation', function() {
  macros.forEach(function (macro) {
    it(macro.name + ' should be valid according to schema', function() {
      validate(macro);
      assert.strictEqual(validate.errors, null);
    });
  });
});

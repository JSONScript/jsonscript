'use strict';

var instructions = require('../instructions');
var Ajv = require('ajv');
var ajv = Ajv({ v5: true });
var validate = ajv.compile(require('../schema/instruction.json'));
var assert = require('assert');


describe('instruction definition validation', function() {
  instructions.forEach(function (instruction) {
    it(instruction.name + ' should be valid according to schema', function() {
      validate(instruction);
      assert.strictEqual(validate.errors, null);
    });
  });
});

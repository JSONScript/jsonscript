'use strict';

var validator = require('is-my-json-valid')
    , assert = require('assert')
    , metaSchema = require('./meta_schema.json')
    , request = require('request')
    , fs = require('fs')
    , path = require('path');


describe('JSONScript schema', function() {
    describe('Meta-schema', function() {
        it('should be the same as the meta-schema at json-schema.org', function (done) {
            assert(/^http:\/\/json-schema.org/.test(metaSchema.id));
            request.get(metaSchema.id, function (err, res, body) {
                assert(!err);
                assert.deepEqual(metaSchema, JSON.parse(body));
                done();
            });
        });
    });


    describe('JSONScript syntax schemas', function() {
        var validateSchema, schemas, specs;

        loadSchemas();

        before(function() {
            validateSchema = validator(metaSchema, {
                verbose: true,
                greedy: true
            });
        });


        for (var name in schemas) testSchema(name);


        function testSchema(name) {
            describe(name + ' schema', function() {
                it('should be valid', function() {
                    assert.equal(schemas[name].$schema, metaSchema.id);
                    validateSchema(schemas[name]);
                    assert.equal(validateSchema.errors, null);
                });


                if (name != '_defs.json') {
                    it('should validate spec', function() {
                        var validate = validator(schemas[name], {
                            schemas: schemas,
                            verbose: true,
                            greedy: true
                        });

                        assert(Array.isArray(specs[name]), 'schema ' + name + ' should have spec');

                        specs[name].forEach(function (s) {
                            validate(s.spec);
                            var assertion = s.valid ? 'equal' : 'notEqual';
                            assert[assertion](validate.errors, null);
                        });
                    });
                }
            });
        }


        function loadSchemas() {
            var schemasPath = __dirname + '/../schema/';
            var files = fs.readdirSync(schemasPath);
            schemas = {};
            specs = {};
            files.forEach(function (f) {
                var parts = f.split('.');
                var name = parts[0] + '.' + parts.pop();
                var module = require(schemasPath + f);
                if (parts.length == 1)
                    schemas[name] = module;
                else if (parts.length == 2 && parts[1] == 'spec')
                    specs[name] = module;
                else
                    throw new Error('Invalid file name');
            });
        }
    });
});

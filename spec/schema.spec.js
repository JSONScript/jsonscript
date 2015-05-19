'use strict';

var validator = require('is-my-json-valid')
    , assert = require('assert')
    , metaSchema = require('./meta_schema.json')
    , request = require('request')
    , fs = require('fs')
    , path = require('path');


describe('JSONScript schema', function() {
    describe('Meta-schema', function() {
        it('should be the same as the meta-schema at json-schema.org (needs internet connection)', function (done) {
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
                var schema;
                var specFile = name.replace('.', '.spec.');

                before(function() {
                    schema = schemas[name];
                    assert.equal(typeof schema, 'object', 'file ' + name + ' should parse as an object');
                });


                it('should be valid', function() {
                    assert.equal(schema.$schema, metaSchema.id);
                    validateSchema(schema);
                    assert.equal(validateSchema.errors, null);
                });



                describe(specFile, function() {
                    var validate;

                    before(function() {
                        validate = getValidator(schema);
                    });

                    it('spec file should be array', function() {
                        assert(Array.isArray(specs[name]), specFile + ' should be array');
                    });

                    if (!Array.isArray(specs[name])) return;

                    specs[name].forEach(function (s, index) {
                        var schemaStr = s.schema ? objToString(s.schema, 24) + ' :' : '';
                        var itStr = objToString(s.it, 48);
                        var validStr = 'should' + (s.isValid ? ' ' : ' NOT ') + 'be valid';

                        it([schemaStr, itStr, validStr].join(' '), function() {
                            assert.notStrictEqual(s.it, undefined, 'item #' + index + ' should have "it" property');
                            assert.equal(typeof s.isValid, 'boolean', 'item #' + index + ' should have "isValid" property');
                            var _validate = s.schema ? getValidator(s.schema) : validate;
                            _validate(s.it);
                            var assertion = s.isValid ? 'equal' : 'notEqual';
                            assert[assertion](_validate.errors, null);
                        });
                    });
                });
            });
        }


        function getValidator(schema) {
            return validator(schema, {
                schemas: schemas,
                verbose: true,
                greedy: true
            });
        }


        function objToString(obj, maxLength) {
            var str = JSON.stringify(obj);
            if (str.length > maxLength + 3)
                str = str.slice(0, maxLength) + '...';
            return str;
        }


        function loadSchemas() {
            var schemasPath = __dirname + '/../schema/';
            var files = fs.readdirSync(schemasPath);
            schemas = {};
            specs = {};
            files.forEach(function (f) {
                var parts = f.split('.');
                var ext = parts.pop()
                if (ext != 'json') return;
                var name = parts[0] + '.' + ext;
                try { var module = require(schemasPath + f); } catch(e) {}
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

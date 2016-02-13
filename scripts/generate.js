'use strict';

var fs = require('fs');
var doT = require('dot');
var instructions = require('../instructions');


generateSchema('schema');
generateSchema('evaluate');
generateSchema('evaluate_metaschema');


function generateSchema(schemaName) {
    var template = getSchemaTemplate(schemaName);
    var schemaStr = template({ instructions: instructions });
    schemaStr = JSON.stringify(JSON.parse(schemaStr), null, '  ');
    fs.writeFileSync(getFileName(schemaName), schemaStr);
}


function getSchemaTemplate(schemaName) {
    var fileName = getFileName(schemaName) + '.dot';
    var tempalteStr = fs.readFileSync(fileName, 'utf8');
    return doT.compile(tempalteStr);
}


function getFileName(schemaName) {
    return __dirname + '/../schema/' + schemaName + '.json';
}

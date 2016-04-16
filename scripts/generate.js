'use strict';

var fs = require('fs');
var doT = require('dot');
var instructions = require('../instructions');

generateSchema('schema');
generateSchema('schema', true);
generateSchema('evaluate');


function generateSchema(schemaName, strictSchema) {
  var template = getSchemaTemplate(schemaName);
  var schemaStr = template({ instructions: instructions, strictSchema: strictSchema });
  schemaStr = JSON.stringify(JSON.parse(schemaStr), null, '  ');
  var schemaFile = getFileName(schemaName);
  if (strictSchema) schemaFile = schemaFile.replace('.json', '_strict.json');
  fs.writeFileSync(schemaFile, schemaStr);
}


function getSchemaTemplate(schemaName) {
  var fileName = getFileName(schemaName) + '.dot';
  var templateStr = fs.readFileSync(fileName, 'utf8');
  return doT.compile(templateStr);
}


function getFileName(schemaName) {
  return __dirname + '/../schema/' + schemaName + '.json';
}

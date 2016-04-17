# JSONScript Schema

JSONScript uses JSON-Schema standard both for the validation schemas and for the schema that defines evaluation process.

[JSONScript schema](http://www.json-script.com/schema/schema.json#) the schema that does not validate scalar keywords in instructions (keyword values can be scripts and have to be validated when the script is evaluated).

[JSONScript strict schema](http://www.json-script.com/schema/schema_strict.json#) the schema that validates scalar keywords in instructions.

[JSONScript evaluation schema](http://www.json-script.com/schema/evaluate.json#) this schema defines evalution process. It can be used by implementations to evaluate scripts. It contains non-standard keywords.

[Instruction definition schema](http://www.json-script.com/schema/instruction.json#) the schema for instruction defnitions. The definitions of both standard and user-defined instructions should be valid according to this schema.

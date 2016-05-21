# JSONScript Schema

JSONScript uses JSON-Schema standard both for the validation schemas and for the schemas that define macro expansion and evaluation process.

[JSONScript schema](http://www.json-script.com/schema/schema.json#) - the schema for JSONScript that does not validate scalar keywords in instructions (keyword values can be scripts and have to be validated when the script is evaluated).

[JSONScript strict schema](http://www.json-script.com/schema/schema_strict.json#) - the schema for JSONScript that validates scalar keywords in instructions.

[Macro expansion schema](http://www.json-script.com/schema/expand_macros.json#) - this schema defines macro expansion process. It can be used by implementations to expand macros in the scripts before their evaluation. It contains non-standard keyword `expandJsMacro`.

[Evaluation schema](http://www.json-script.com/schema/evaluate.json#) - this schema defines evalution process. It can be used by implementations to evaluate scripts. It contains non-standard keywords.

[Instruction definition schema](http://www.json-script.com/schema/instruction.json#) - the schema for instruction defnitions. The definitions of both standard and user-defined instructions should be valid according to this schema.

[Macro definition schema](http://www.json-script.com/schema/macro.json#) - the schema for macro definition. The definitions of both standard and user-defined macros should be valid according to this schema.

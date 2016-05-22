# JSONScript syntax

In progress - not complete, see [Language](https://github.com/JSONScript/jsonscript/blob/master/LANGUAGE.md).


## Script

If the script is the object where all property names do NOT start with "$" character then sub-scripts in all properties of the object are evaluated in parallel. The meaning of "parallel" execution depends on the platform, the only important thing is that the sub-scripts begin evaluating without waiting for other scripts to complete evaluating of for asynchronous values to become synchronous.

If the script is the array then sub-scripts in all items of this array are evaluated sequentially. It means that the script in any item can begin evaluating only after the script in the previous item has completed evaluating into a synchronous value.

If the script is an object where all properties start with "$" it can be a valid instruction. If only some of the properties start with "$" the script is invalid.

If the script is a scalar value (string, number, boolean or null) it evalutes into the same value.


## Instructions


### Instruction definitions

All core JSONScript instructions are defined using [instruction definition files](https://github.com/JSONScript/jsonscript/tree/master/instructions), that should be valid according to the [instruction schema](https://github.com/JSONScript/jsonscript/blob/master/schema/instruction.json). JSONScript interpereters can allow adding custom instructions using the same format.

Instruction definition file includes:

- name (main keyword)
- allowed keywords
- required keywords
- keywords that should be evaluated before the instruction itself is evaluated
- schemas for evaluated keyword values

See Defining instructions (TODO) for more information on the file format.


### Instruction evaluation

Instruction is evaluated in the following way:

1. Keywords that should be pre-evaluated are evaluated
2. If some of them are evaluated into asynchronous values, they should resolve to synchronous value.
3. Instruction itself is evaluated, it can evaluate to:
  - synchronous value
  - asynchronous value
  - script
  - asynchronus script

  If the instruction is evaluated into a script, this script should be evaluated. If this script is asynchronous, it should resolve before it is evaluated.


### Core instructions

#### `$exec`

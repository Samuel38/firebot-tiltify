/**
 * Enum for a variable's possible output data type.
 */
export type OutputDataType = string;
/**
 * Enum for a variable's possible output data type.
 * @readonly
 * @enum {string}
 */
export const OutputDataType: Readonly<{
    NULL: "null";
    BOOLEAN: "bool";
    NUMBER: "number";
    TEXT: "text";
    ARRAY: "array";
    OBJECT: "object";
    ALL: "ALL";
}>;
/**
 * Enum for variable categories.
 */
export type VariableCategory = string;
/**
 * Enum for variable categories.
 * @readonly
 * @enum {string}
 */
export const VariableCategory: Readonly<{
    COMMON: "common";
    TRIGGER: "trigger based";
    USER: "user based";
    TEXT: "text";
    NUMBERS: "numbers";
    ADVANCED: "advanced";
}>;
/**
 * Enum for a variable's possible output data type.
 * @readonly
 * @enum {string}
 */
export enum OutputDataType {
    NULL = "null",
    BOOLEAN = "bool",
    NUMBER = "number",
    TEXT = "text",
    ARRAY = "array",
    OBJECT = "object",
    ALL = "ALL"
}
/**
 * Enum for variable categories.
 * @readonly
 * @enum {string}
 */
export enum VariableCategory {
    COMMON = "common",
    TRIGGER = "trigger based",
    USER = "user based",
    TEXT = "text",
    NUMBERS = "numbers",
    ADVANCED = "advanced"
}

import { TSchema } from "typebox"
import { ExportToJSONSchemaFn, registerTypeRule, ValidationSchemaRefFn } from "../../orchestration"
import { BooleanJSONSchema } from "./types"

export const exportBooleanToJSONSchema: ExportToJSONSchemaFn = (): TSchema => {
  return BooleanJSONSchema
}

export const booleanValidationSchemaRef: ValidationSchemaRefFn = ({ rule }) => {
  if (rule.implicitValueYAML === true) return "boolean/without-true"
  if (rule.implicitValueYAML === false) return "boolean/without-false"
  return "boolean/base"
}

registerTypeRule("boolean", "exportToJSONSchema", exportBooleanToJSONSchema)
registerTypeRule("boolean", "validationSchemaRef", booleanValidationSchemaRef)

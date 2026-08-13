import { TSchema } from "typebox"
import { ExportToJSONSchemaFn, ValidationSchemaRefFn, definePropertyTypeRule } from "../../ruleRuntime"
import { BooleanJSONSchema } from "./types"

export const exportBooleanToJSONSchema: ExportToJSONSchemaFn = (): TSchema => {
  return BooleanJSONSchema
}

export const booleanValidationSchemaRef: ValidationSchemaRefFn = ({ rule }) => {
  if (rule.preserveExplicitDefaultXML === true) return "boolean/base"
  if (rule.implicitValueYAML === true) return "boolean/without-true"
  if (rule.implicitValueYAML === false) return "boolean/without-false"
  return "boolean/base"
}

export const metadataPropertyRule000 = definePropertyTypeRule("boolean", "exportToJSONSchema", exportBooleanToJSONSchema)
export const metadataPropertyRule001 = definePropertyTypeRule("boolean", "validationSchemaRef", booleanValidationSchemaRef)

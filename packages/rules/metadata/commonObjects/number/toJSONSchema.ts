import { TSchema, Type } from "typebox"
import { ExportToJSONSchemaFn, ValidationSchemaRefFn, definePropertyTypeRule } from "../../ruleRuntime"

export const exportNumberToJSONSchema: ExportToJSONSchemaFn = ({ rule }): TSchema =>
  Type.Number({
    ...(typeof rule.minimum === "number" ? { minimum: rule.minimum } : {}),
    ...(typeof rule.maximum === "number" ? { maximum: rule.maximum } : {}),
  })

export const numberValidationSchemaRef: ValidationSchemaRefFn = ({ rule }) => {
  const implicit = typeof rule.implicitValueYAML === "number"
    ? `without-${rule.implicitValueYAML}`
    : "base"
  if (typeof rule.minimum !== "number" && typeof rule.maximum !== "number") {
    return `number/${implicit}`
  }
  const range = `${typeof rule.minimum === "number" ? rule.minimum : "min"}..${
    typeof rule.maximum === "number" ? rule.maximum : "max"
  }`
  return `number/${range}/${implicit}`
}

export const metadataPropertyRule000 = definePropertyTypeRule("number", "exportToJSONSchema", exportNumberToJSONSchema)
export const metadataPropertyRule001 = definePropertyTypeRule("number", "validationSchemaRef", numberValidationSchemaRef)

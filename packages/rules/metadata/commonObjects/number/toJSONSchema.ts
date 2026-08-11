import { TSchema } from "typebox"
import { ExportToJSONSchemaFn, definePropertyTypeRule } from "../../ruleRuntime"
import { NumberJSONSchema } from "./types"

export const exportNumberToJSONSchema: ExportToJSONSchemaFn = (): TSchema => {
  return NumberJSONSchema
}

export const metadataPropertyRule000 = definePropertyTypeRule("number", "exportToJSONSchema", exportNumberToJSONSchema)
export const metadataPropertyRule001 = definePropertyTypeRule("number", "validationSchemaRef", ({ rule }) => {
  const implicit = rule.implicitValueYAML
  return typeof implicit === "number" ? `number/without-${implicit}` : "number/base"
})

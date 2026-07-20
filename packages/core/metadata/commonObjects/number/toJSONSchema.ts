import { TSchema } from "typebox"
import { ExportToJSONSchemaFn, registerTypeRule } from "../../orchestration"
import { NumberJSONSchema } from "./types"

export const exportNumberToJSONSchema: ExportToJSONSchemaFn = (): TSchema => {
  return NumberJSONSchema
}

registerTypeRule("number", "exportToJSONSchema", exportNumberToJSONSchema)
registerTypeRule("number", "validationSchemaRef", ({ rule }) => {
  const implicit = rule.implicitValueYAML
  return typeof implicit === "number" ? `number/without-${implicit}` : "number/base"
})

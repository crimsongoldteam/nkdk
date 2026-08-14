import { Type } from "typebox"
import type { ExportToJSONSchemaFn } from "@nkdk/runtime/rule-kit"
import { definePropertyTypeRule } from "../../ruleRuntime"

const explicitMinMaxValuePattern = "^!xml/(?:value \\S.*|type (?:-|[^\\s]+) \\S.*)$"

const exportMinMaxValueToJSONSchema: ExportToJSONSchemaFn = ({ context }) => {
  const number = Type.Number()
  if (
    context.exportToJSONSchema?.explicitXMLValues !== true &&
    context.exportToJSONSchema?.validationPropertyRefs !== true
  ) return number
  return Type.Union([number, Type.String({ pattern: explicitMinMaxValuePattern })])
}

export const metadataPropertyRule000 = definePropertyTypeRule(
  "MinMaxValue",
  "exportToJSONSchema",
  exportMinMaxValueToJSONSchema,
)

import { Type } from "typebox"
import type { ExportToJSONSchemaFn } from "@nkdk/runtime/rule-kit"
import { definePropertyTypeRule } from "../../ruleRuntime"

const finiteNumberPattern = "[+-]?(?:(?:\\d+(?:[.,]\\d*)?)|(?:[.,]\\d+))(?:[eE][+-]?\\d+)?"
const explicitMinMaxValuePattern = `^!xml (?:(?:String|Decimal) ${finiteNumberPattern}|Raw (?:-|[^\\s]+)(?: .*)?)$`

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

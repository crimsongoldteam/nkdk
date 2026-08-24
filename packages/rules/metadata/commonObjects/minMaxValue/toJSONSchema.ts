import { Type } from "typebox"
import type { ExportToJSONSchemaFn } from "@nkdk/runtime/rule-kit"
import { definePropertyTypeRule } from "../../ruleRuntime"

const exportMinMaxValueToJSONSchema: ExportToJSONSchemaFn = () => Type.Number()

export const metadataPropertyRule000 = definePropertyTypeRule(
  "MinMaxValue",
  "exportToJSONSchema",
  exportMinMaxValueToJSONSchema,
)

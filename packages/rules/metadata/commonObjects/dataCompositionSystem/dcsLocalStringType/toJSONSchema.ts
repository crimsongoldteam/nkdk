import { Type } from "typebox"
import type { ExportToJSONSchemaFn } from "@nkdk/runtime/rule-kit"
import { definePropertyTypeRule } from "../../../ruleRuntime"

const ordinaryString = Type.String()
const ordinaryValue = Type.Union([ordinaryString, Type.Record(Type.String(), Type.String())])

const exportDcsLocalStringTypeToJSONSchema: ExportToJSONSchemaFn = () => ordinaryValue

export const metadataPropertyRule000 = definePropertyTypeRule(
  "DcsLocalStringType",
  "exportToJSONSchema",
  exportDcsLocalStringTypeToJSONSchema,
)

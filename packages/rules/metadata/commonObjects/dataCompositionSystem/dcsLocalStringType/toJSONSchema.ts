import { Type, type TSchema } from "typebox"
import type { ExportToJSONSchemaFn } from "@nkdk/runtime/rule-kit"
import { definePropertyTypeRule } from "../../../ruleRuntime"

const ordinaryString = Type.Intersect([
  Type.String(),
  { not: Type.String({ pattern: "^!xml/(?:[^ ]+)(?: |$)" }) } as TSchema,
])
const ordinaryValue = Type.Union([ordinaryString, Type.Record(Type.String(), Type.String())])
const xmlString = Type.String({ pattern: "^!xml/type String(?: .*)?$" })

const exportDcsLocalStringTypeToJSONSchema: ExportToJSONSchemaFn = ({ context }) =>
  context.exportToJSONSchema?.explicitXMLValues === true ||
  context.exportToJSONSchema?.validationPropertyRefs === true
    ? Type.Union([ordinaryValue, xmlString])
    : ordinaryValue

export const metadataPropertyRule000 = definePropertyTypeRule(
  "DcsLocalStringType",
  "exportToJSONSchema",
  exportDcsLocalStringTypeToJSONSchema,
)

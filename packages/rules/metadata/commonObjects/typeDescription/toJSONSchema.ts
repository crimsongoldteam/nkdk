import { Type, TSchema } from "typebox"
import { ExportToJSONSchemaFn, definePropertyTypeRule } from "../../ruleRuntime"
import { buildTypeDescriptionJSONSchema } from "./allowedTypes"
import { TypeDescriptionJSONSchema } from "./types"

const xmlTypePrefix = Type.String({ pattern: "^!xml d[0-9]+p1:[^:]+$" })
const withoutExplicitXML = (schema: TSchema): TSchema => Type.Intersect([
  schema,
  { not: Type.String({ pattern: "^!x(?:ml)(?: |$)" }) } as TSchema,
])

export const exportTypeDescriptionToJSONSchema: ExportToJSONSchemaFn = ({ context, rule }): TSchema => {
  const ordinary = withoutExplicitXML(rule.type === "TypeDescription" && rule.allowedTypes !== undefined
    ? buildTypeDescriptionJSONSchema(rule.allowedTypes)
    : TypeDescriptionJSONSchema)
  if (
    context.exportToJSONSchema?.explicitXMLValues === true ||
    context.exportToJSONSchema?.validationPropertyRefs === true
  ) return Type.Union([ordinary, xmlTypePrefix])
  return ordinary
}

export const metadataPropertyRule000 = definePropertyTypeRule("TypeDescription", "exportToJSONSchema", exportTypeDescriptionToJSONSchema)

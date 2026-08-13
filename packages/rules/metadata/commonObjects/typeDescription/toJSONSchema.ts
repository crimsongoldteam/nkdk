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
  const base = rule.type === "TypeDescription" && rule.allowedTypes !== undefined
    ? buildTypeDescriptionJSONSchema(rule.allowedTypes)
    : TypeDescriptionJSONSchema
  const ordinary = withoutExplicitXML(base)
  if (
    context.exportToJSONSchema?.explicitXMLValues === true ||
    context.exportToJSONSchema?.validationPropertyRefs === true
  ) return Type.Union([withoutExplicitXML(withExplicitXMLCompoundItems(base)), xmlTypePrefix])
  return ordinary
}

function withExplicitXMLCompoundItems(schema: TSchema): TSchema {
  const navigable = schema as TSchema & {
    anyOf?: TSchema[]
    type?: string
    items?: TSchema
  }
  const branches = Array.isArray(navigable.anyOf) ? navigable.anyOf : undefined
  if (branches !== undefined) {
    return { ...schema, anyOf: branches.map(withExplicitXMLCompoundItems) }
  }
  if (navigable.type !== "array" || navigable.items === undefined) return schema
  return { ...schema, items: Type.Union([navigable.items, xmlTypePrefix]) }
}

export const metadataPropertyRule000 = definePropertyTypeRule("TypeDescription", "exportToJSONSchema", exportTypeDescriptionToJSONSchema)

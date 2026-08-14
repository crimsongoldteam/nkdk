import { Type, TSchema } from "typebox"
import { ExportToJSONSchemaFn, definePropertyTypeRule } from "../../ruleRuntime"
import { buildTypeDescriptionJSONSchema } from "./allowedTypes"
import { TypeDescriptionJSONSchema } from "./types"

const xmlTypePrefix = Type.String({ pattern: "^!xml/type d[0-9]+p1:[^:]+$" })
const withoutExplicitXML = (schema: TSchema): TSchema => Type.Intersect([
  schema,
  { not: Type.String({ pattern: "^!xml/(?:[^ ]+)(?: |$)" }) } as TSchema,
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

/**
 * Строит форму массива для Type/MultiState. Вызывается только контекстной
 * схемой свойства, capability которого имеет representation=multi.
 */
export function buildMultiStateTypeDescriptionJSONSchema(base: TSchema): TSchema {
  const item = scalarTypeDescriptionSchema(base)
  return Type.Array(Type.Union([
    item,
    Type.Array(Type.Never(), { maxItems: 0 }),
  ]), { minItems: 1 })
}

function scalarTypeDescriptionSchema(schema: TSchema): TSchema {
  const scalars = collectScalarSchemas(schema)
  if (scalars.length === 0) return Type.Never()
  return scalars.length === 1 ? scalars[0]! : Type.Union(scalars as [TSchema, TSchema, ...TSchema[]])
}

function collectScalarSchemas(schema: TSchema): TSchema[] {
  const raw = schema as TSchema & { type?: unknown; anyOf?: unknown; allOf?: unknown }
  if (raw.type === "string") return [schema]
  const variants = raw.anyOf
  if (Array.isArray(variants)) {
    return variants.flatMap((variant) => collectScalarSchemas(variant as TSchema))
  }

  const intersections = raw.allOf
  if (!Array.isArray(intersections)) return []
  const scalarBranchIndex = intersections.findIndex(
    (branch) => collectScalarSchemas(branch as TSchema).length > 0,
  )
  if (scalarBranchIndex < 0) return []

  const scalarBranches = collectScalarSchemas(intersections[scalarBranchIndex] as TSchema)
  const remainingBranches = intersections.filter((_, index) => index !== scalarBranchIndex) as TSchema[]
  if (remainingBranches.length === 0) return scalarBranches
  return scalarBranches.map((branch) => Type.Intersect([
    branch,
    ...remainingBranches,
  ] as [TSchema, TSchema, ...TSchema[]]))
}

export const metadataPropertyRule000 = definePropertyTypeRule("TypeDescription", "exportToJSONSchema", exportTypeDescriptionToJSONSchema)

import { TSchema, Type } from "typebox"
import { ExportToJSONSchemaFn, definePropertyTypeRule } from "../../ruleRuntime"
import { buildTypeDescriptionJSONSchema } from "./allowedTypes"
import { TypeDescriptionJSONSchema } from "./types"

export const exportTypeDescriptionToJSONSchema: ExportToJSONSchemaFn = ({ rule }): TSchema => {
  if (rule.type === "TypeDescription" && rule.allowedTypes !== undefined) {
    return buildTypeDescriptionJSONSchema(rule.allowedTypes)
  }

  return TypeDescriptionJSONSchema
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
  const raw = schema as TSchema & { type?: unknown; anyOf?: unknown }
  if (raw.type === "string") return [schema]
  const variants = raw.anyOf
  return Array.isArray(variants)
    ? variants.flatMap((variant) => collectScalarSchemas(variant as TSchema))
    : []
}

export const metadataPropertyRule000 = definePropertyTypeRule("TypeDescription", "exportToJSONSchema", exportTypeDescriptionToJSONSchema)

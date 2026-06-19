import { TObject, TProperties, TSchema, Type } from "@sinclair/typebox"
import { ConfigurationContext } from "~/metadata/context/types"
import { ExportToJSONSchemaFn, registerTypeRule } from "~/metadata/orchestration"
import { exportMetadataItemToJSONSchema } from "~/metadata/orchestration/metadataItem/toJSONSchema"
import { FormAttributeColumnRules, FormAttributeRules } from "./rules"

export const exportFormAttributesToJSONSchema: ExportToJSONSchemaFn = (params): TSchema => {
  const { context } = params
  const attributeSchema = extendFormAttributeColumnsSchema(
    requiredFormAttributeSchema(context),
    context
  )
  return Type.Record(Type.String(), attributeSchema)
}

export const exportFormColumnAttributesToJSONSchema: ExportToJSONSchemaFn = (params): TSchema => {
  const { context } = params
  return buildFormColumnAttributesJSONSchema(context)
}

function extendFormAttributeColumnsSchema(schema: TSchema, context: ConfigurationContext): TSchema {
  if (!isObjectSchema(schema)) return schema

  const columnsSchema = buildFormColumnAttributesJSONSchema(context)

  return Type.Object(
    {
      ...schema.properties,
      Колонки: Type.Optional(columnsSchema),
      ДополнительныеКолонки: Type.Optional(Type.Record(Type.String(), columnsSchema)),
      Диаграмма: Type.Optional(Type.String()),
      ДиаграммаГанта: Type.Optional(Type.String()),
      ГрафическаяСхема: Type.Optional(Type.String()),
      ТабличныйДокумент: Type.Optional(Type.String()),
      Планировщик: Type.Optional(Type.String()),
    },
    { additionalProperties: false }
  )
}

function isObjectSchema(schema: TSchema): schema is TObject<TProperties> {
  return schema.type === "object" && "properties" in schema
}

function requiredFormAttributeSchema(context: ConfigurationContext): TSchema {
  const schema = exportMetadataItemToJSONSchema({
    context,
    rule: FormAttributeRules,
  })
  if (schema === undefined) throw new Error("FormAttribute JSON Schema is not registered")
  return schema
}

function buildFormColumnAttributesJSONSchema(context: ConfigurationContext): TSchema {
  const attributeSchema = exportMetadataItemToJSONSchema({
    context,
    rule: FormAttributeColumnRules,
  })
  if (attributeSchema === undefined) throw new Error("FormAttributeColumn JSON Schema is not registered")
  return Type.Record(Type.String(), attributeSchema)
}

registerTypeRule("FormAttributes", "exportToJSONSchema", exportFormAttributesToJSONSchema)
registerTypeRule("FormAttributeColumns", "exportToJSONSchema", exportFormColumnAttributesToJSONSchema)

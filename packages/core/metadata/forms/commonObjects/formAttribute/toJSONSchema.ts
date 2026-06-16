import { TObject, TProperties, TSchema, Type } from "@sinclair/typebox"
import { ConfigurationContext } from "~/metadata/context/types"
import { ExportToJSONSchemaFn, registerTypeRule } from "~/metadata/orchestration"
import { exportMetadataItemToJSONSchema } from "~/metadata/orchestration/metadataItem/toJSONSchema"
import { FormAttributeColumnRules, FormAttributeRules } from "./rules"

export const exportFormAttributesToJSONSchema: ExportToJSONSchemaFn = (params: {
  context: ConfigurationContext
}): TSchema => {
  const { context } = params
  const attributeSchema = extendFormAttributeColumnsSchema(
    exportMetadataItemToJSONSchema({
      context,
      rule: FormAttributeRules,
    }),
    context
  )
  return Type.Record(Type.String(), attributeSchema)
}

export const exportFormColumnAttributesToJSONSchema: ExportToJSONSchemaFn = (params: {
  context: ConfigurationContext
}): TSchema => {
  const { context } = params
  const attributeSchema = exportMetadataItemToJSONSchema({
    context,
    rule: FormAttributeColumnRules,
  })
  return Type.Record(Type.String(), attributeSchema)
}

function extendFormAttributeColumnsSchema(schema: TSchema, context: ConfigurationContext): TSchema {
  if (!isObjectSchema(schema)) return schema

  const columnsSchema = exportFormColumnAttributesToJSONSchema({ context, rule: undefined, value: undefined })

  return Type.Object(
    {
      ...schema.properties,
      Колонки: Type.Optional(columnsSchema),
      ДополнительныеКолонки: Type.Optional(Type.Record(Type.String(), columnsSchema)),
      Диаграмма: Type.Optional(Type.String()),
      ДиаграммаГанта: Type.Optional(Type.String()),
      ТабличныйДокумент: Type.Optional(Type.String()),
    },
    { additionalProperties: false }
  )
}

function isObjectSchema(schema: TSchema): schema is TObject<TProperties> {
  return schema.type === "object" && "properties" in schema
}

registerTypeRule("FormAttributes", "exportToJSONSchema", exportFormAttributesToJSONSchema)
registerTypeRule("FormAttributeColumns", "exportToJSONSchema", exportFormColumnAttributesToJSONSchema)

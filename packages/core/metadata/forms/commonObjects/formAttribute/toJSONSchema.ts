import { TSchema, Type } from "@sinclair/typebox"
import { ConfigurationContext } from "~/metadata/context/types"
import { ExportToJSONSchemaFn, registerTypeRule } from "~/metadata/orchestration"
import { exportMetadataItemToJSONSchema } from "~/metadata/orchestration/metadataItem/toJSONSchema"
import { FormAttributeColumnRules, FormAttributeRules } from "./rules"

export const exportFormAttributesToJSONSchema: ExportToJSONSchemaFn = (params: {
  context: ConfigurationContext
}): TSchema => {
  const { context } = params
  const attributeSchema = exportMetadataItemToJSONSchema({
    context: context,
    rule: FormAttributeRules,
  })
  return Type.Record(Type.String(), attributeSchema)
}

export const exportFormColumnAttributesToJSONSchema: ExportToJSONSchemaFn = (params: {
  context: ConfigurationContext
}): TSchema => {
  const { context } = params
  const attributeSchema = exportMetadataItemToJSONSchema({
    context: context,
    rule: FormAttributeColumnRules,
  })
  return Type.Record(Type.String(), attributeSchema)
}

registerTypeRule("FormAttributes", "exportToJSONSchema", exportFormAttributesToJSONSchema)
registerTypeRule("FormAttributeColumns", "exportToJSONSchema", exportFormColumnAttributesToJSONSchema)

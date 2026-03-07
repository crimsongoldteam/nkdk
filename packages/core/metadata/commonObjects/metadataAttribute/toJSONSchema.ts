import { TSchema } from "@sinclair/typebox"
import { ConfigurationContext } from "~/metadata/context/types"
import { ExportToJSONSchemaFn, registerTypeRule } from "~/metadata/orchestration"
import { exportMetadataItemToJSONSchema } from "~/metadata/orchestration/metadataItem/toJSONSchema"
import { MetadataAttributeRules } from "./rules"

export const exportMetadataAttributesToJSONSchema: ExportToJSONSchemaFn = (params: {
  context: ConfigurationContext
}): TSchema => {
  const { context } = params
  return exportMetadataItemToJSONSchema({
    context: context,
    rule: MetadataAttributeRules,
  })
}

registerTypeRule("MetadataAttributes", "exportToJSONSchema", exportMetadataAttributesToJSONSchema)

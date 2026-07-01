import { TSchema } from "@sinclair/typebox"
import { ConfigurationContext } from "~/metadata/context/types"
import { exportMetadataItemToJSONSchema } from "~/metadata/orchestration/metadataItem/toJSONSchema"
import { MetadataDocumentRules } from "./rules"

export const exportMetadataDocumentToJSONSchema = (params: { context: ConfigurationContext; name?: string }): TSchema => {
  const { context, name } = params

  const schema = exportMetadataItemToJSONSchema({
    context,
    rule: MetadataDocumentRules,
    name,
  })

  return schema
}

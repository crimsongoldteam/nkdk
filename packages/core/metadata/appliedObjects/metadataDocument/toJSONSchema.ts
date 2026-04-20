import { TSchema } from "@sinclair/typebox"
import { ConfigurationContext } from "~/metadata/context/types"
import { exportMetadataItemToJSONSchema } from "~/metadata/orchestration/metadataItem/toJSONSchema"
import { MetadataDocumentRules } from "./rules"

export const exportMetadataDocumentToJSONSchema = (params: { context: ConfigurationContext }): TSchema => {
  const { context } = params

  const schema = exportMetadataItemToJSONSchema({
    context,
    rule: MetadataDocumentRules,
  })

  return schema
}

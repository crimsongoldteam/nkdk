import { TSchema } from "@sinclairtypebox"
import { ConfigurationContext } from "../../context/types"
import { exportMetadataItemToJSONSchema } from "../../orchestration/metadataItem/toJSONSchema"
import { MetadataDocumentRules } from "./rules"

export const exportMetadataDocumentToJSONSchema = (params: { context: ConfigurationContext }): TSchema => {
  const { context } = params

  return exportMetadataItemToJSONSchema({
    context,
    rule: MetadataDocumentRules,
  })
}

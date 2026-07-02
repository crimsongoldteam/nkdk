import { TSchema } from "@sinclair/typebox"
import { ConfigurationContext } from "../../context/types"
import { exportMetadataItemToJSONSchema } from "../../orchestration/metadataItem/toJSONSchema"
import { MetadataEnumerationRules } from "./rules"

export const exportMetadataEnumerationToJSONSchema = (params: { context: ConfigurationContext }): TSchema => {
  const { context } = params

  return exportMetadataItemToJSONSchema({
    context,
    rule: MetadataEnumerationRules,
  })
}

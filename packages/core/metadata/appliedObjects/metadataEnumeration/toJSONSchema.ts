import { TSchema } from "@sinclair/typebox"
import { ConfigurationContext } from "~/metadata/context/types"
import { exportMetadataItemToJSONSchema } from "~/metadata/orchestration/metadataItem/toJSONSchema"
import { MetadataEnumerationRules } from "./rules"

export const exportMetadataEnumerationToJSONSchema = (params: { context: ConfigurationContext }): TSchema => {
  const { context } = params

  const schema = exportMetadataItemToJSONSchema({
    context,
    rule: MetadataEnumerationRules,
  })

  return schema
}

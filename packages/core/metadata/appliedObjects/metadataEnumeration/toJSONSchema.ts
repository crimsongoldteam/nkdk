import { TSchema } from "@sinclair/typebox"
import { ConfigurationContext } from "~/metadata/context/types"
import { exportMetadataItemToJSONSchema } from "~/metadata/orchestration/metadataItem/toJSONSchema"
import { MetadataEnumerationRules } from "./rules"

export const exportMetadataEnumerationToJSONSchema = (params: { context: ConfigurationContext; name?: string }): TSchema => {
  const { context, name } = params

  const schema = exportMetadataItemToJSONSchema({
    context,
    rule: MetadataEnumerationRules,
    name,
  })

  return schema
}

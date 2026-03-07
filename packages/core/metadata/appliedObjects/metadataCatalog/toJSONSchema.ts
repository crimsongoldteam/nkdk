import { TSchema } from "@sinclair/typebox"
import { ConfigurationContext } from "~/metadata/context/types"
import { exportMetadataItemToJSONSchema } from "~/metadata/orchestration/metadataItem/toJSONSchema"
import { MetadataCatalogRules } from "./rules"

export const exportMetadataCatalogToJSONSchema = (params: { context: ConfigurationContext }): TSchema => {
  const { context } = params

  const schema = exportMetadataItemToJSONSchema({
    context,
    rule: MetadataCatalogRules,
  })

  return schema
}

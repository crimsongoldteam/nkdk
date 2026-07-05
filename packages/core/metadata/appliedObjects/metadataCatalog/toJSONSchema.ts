import { TSchema } from "@sinclairtypebox"
import { ConfigurationContext } from "../../context/types"
import { exportMetadataItemToJSONSchema } from "../../orchestration/metadataItem/toJSONSchema"
import { MetadataCatalogRules } from "./rules"

export const exportMetadataCatalogToJSONSchema = (params: { context: ConfigurationContext }): TSchema => {
  const { context } = params

  return exportMetadataItemToJSONSchema({
    context,
    rule: MetadataCatalogRules,
  })
}

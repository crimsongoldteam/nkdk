import { TSchema } from "typebox"
import { ConfigurationContext } from "@nkdk/runtime"
import { exportMetadataItemToJSONSchema } from "../../ruleRuntime/metadataItem/toJSONSchema"
import { MetadataCatalogRules } from "./rules"

export const exportMetadataCatalogToJSONSchema = (params: { context: ConfigurationContext }): TSchema => {
  const { context } = params

  return exportMetadataItemToJSONSchema({
    context,
    rule: MetadataCatalogRules,
  })
}

import { TSchema } from "typebox"
import { ConfigurationContext } from "@nkdk/runtime"
import { exportMetadataItemToJSONSchema } from "../../ruleRuntime/metadataItem/toJSONSchema"
import { MetadataEnumerationRules } from "./rules"
import "./valuesFromYAML"

export const exportMetadataEnumerationToJSONSchema = (params: { context: ConfigurationContext }): TSchema => {
  const { context } = params

  return exportMetadataItemToJSONSchema({
    context,
    rule: MetadataEnumerationRules,
  })
}

import { TSchema } from "typebox"
import { ConfigurationContext } from "@nkdk/runtime"
import { exportMetadataItemToJSONSchema } from "../../ruleRuntime/metadataItem/toJSONSchema"
import { MetadataEnumerationRules } from "./rules"
import "./valuesFromYAML"
import type { PropertyRuleExecution } from "@nkdk/runtime/rule-kit"

export const exportMetadataEnumerationToJSONSchema = (params: {
  context: ConfigurationContext
  execution?: PropertyRuleExecution
}): TSchema => {
  const { context } = params

  return exportMetadataItemToJSONSchema({
    context,
    rule: MetadataEnumerationRules,
    execution: params.execution,
  })
}

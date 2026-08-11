import { TSchema } from "typebox"
import { ConfigurationContext } from "@nkdk/runtime"
import { exportMetadataItemToJSONSchema } from "../../ruleRuntime/metadataItem/toJSONSchema"
import { MetadataDocumentRules } from "./rules"
import type { PropertyRuleExecution } from "@nkdk/runtime/rule-kit"

export const exportMetadataDocumentToJSONSchema = (params: {
  context: ConfigurationContext
  execution?: PropertyRuleExecution
}): TSchema => {
  const { context } = params

  return exportMetadataItemToJSONSchema({
    context,
    rule: MetadataDocumentRules,
    execution: params.execution,
  })
}

import { TSchema } from "typebox"
import { ConfigurationContext } from "../../context/types"
import { exportMetadataItemToJSONSchema } from "../../ruleRuntime/metadataItem/toJSONSchema"
import { registerTypeRule } from "../../ruleRuntime/property/typeRuleRegistry"
import "../predefinedItem/toJSONSchema"
import { PredefinedRules } from "./rules"

export const exportPredefinedToJSONSchema = (context: ConfigurationContext): TSchema =>
  exportMetadataItemToJSONSchema({
    context,
    rule: PredefinedRules,
  })

registerTypeRule("Predefined", "exportToJSONSchema", ({ context }) => exportPredefinedToJSONSchema(context))

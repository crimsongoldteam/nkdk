import { TSchema } from "@sinclairtypebox"
import { ConfigurationContext } from "../../context/types"
import { exportMetadataItemToJSONSchema } from "../../orchestration/metadataItem/toJSONSchema"
import { registerTypeRule } from "../../orchestration/property/typeRuleRegistry"
import "../predefinedItem/toJSONSchema"
import { PredefinedRules } from "./rules"

export const exportPredefinedToJSONSchema = (context: ConfigurationContext): TSchema =>
  exportMetadataItemToJSONSchema({
    context,
    rule: PredefinedRules,
  })

registerTypeRule("Predefined", "exportToJSONSchema", ({ context }) => exportPredefinedToJSONSchema(context))

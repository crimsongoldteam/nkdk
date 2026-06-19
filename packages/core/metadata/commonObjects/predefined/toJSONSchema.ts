import { TSchema } from "@sinclair/typebox"
import { ConfigurationContext } from "~/metadata/context/types"
import { exportMetadataItemToJSONSchema } from "~/metadata/orchestration/metadataItem/toJSONSchema"
import { registerTypeRule } from "~/metadata/orchestration/property/typeRuleRegistry"
import "../predefinedItem/toJSONSchema"
import { PredefinedRules } from "./rules"

export const exportPredefinedToJSONSchema = (context: ConfigurationContext): TSchema =>
  exportMetadataItemToJSONSchema({
    context,
    rule: PredefinedRules,
  })

registerTypeRule("Predefined", "exportToJSONSchema", ({ context }) => exportPredefinedToJSONSchema(context))

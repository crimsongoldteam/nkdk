import { definePropertyTypeRule } from "../../ruleRuntime/property/propertyRuleRegistrySet"
import { TSchema } from "typebox"
import { ConfigurationContext } from "../../context/types"
import { exportMetadataItemToJSONSchema } from "../../ruleRuntime/metadataItem/toJSONSchema"
import "../predefinedItem/toJSONSchema"
import { PredefinedRules } from "./rules"

export const exportPredefinedToJSONSchema = (context: ConfigurationContext): TSchema =>
  exportMetadataItemToJSONSchema({
    context,
    rule: PredefinedRules,
  })

export const metadataPropertyRule000 = definePropertyTypeRule("Predefined", "exportToJSONSchema", ({ context }) => exportPredefinedToJSONSchema(context))

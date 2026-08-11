import { defineMetadataItemRule } from "../../ruleRuntime"
import { MetadataLanguageRules } from "./rules"

export const metadataRuleLayer000 = defineMetadataItemRule({
  propertyType: "MetadataLanguage",
  itemRule: MetadataLanguageRules,
})

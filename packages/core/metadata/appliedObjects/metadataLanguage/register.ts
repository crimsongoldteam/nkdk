import { registerMetadataItemRule } from "../../ruleRuntime"
import { MetadataLanguageRules } from "./rules"

registerMetadataItemRule({
  propertyType: "MetadataLanguage",
  itemRule: MetadataLanguageRules,
})

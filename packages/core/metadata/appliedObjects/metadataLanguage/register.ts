import { registerMetadataItemRule } from "../../orchestration"
import { MetadataLanguageRules } from "./rules"

registerMetadataItemRule({
  propertyType: "MetadataLanguage",
  itemRule: MetadataLanguageRules,
})

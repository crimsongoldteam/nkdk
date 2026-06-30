import { registerMetadataItemRule } from "~/metadata/orchestration"
import { MetadataLanguageRules } from "./rules"

registerMetadataItemRule({
  propertyType: "MetadataLanguage",
  itemRule: MetadataLanguageRules,
})

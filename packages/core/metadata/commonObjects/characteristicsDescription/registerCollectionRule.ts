import { defineMetadataItemCollectionRule } from "../../ruleRuntime"
import { CharacteristicsDescriptionRules } from "./rules"

import "./explicitXMLDefaults"

export const metadataRuleLayer000 = defineMetadataItemCollectionRule({
  propertyType: "CharacteristicsDescriptions",
  itemRule: CharacteristicsDescriptionRules,
  xmlElement: "xr:Characteristic",
  yamlAsArray: true,
})

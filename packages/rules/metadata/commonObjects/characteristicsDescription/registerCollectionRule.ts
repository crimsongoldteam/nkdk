import { defineMetadataItemCollectionRule } from "../../ruleRuntime"
import { CharacteristicsDescriptionRules } from "./rules"
import { composeMetadataRules } from "../../ruleRuntime/definition"
import { characteristicsDescriptionExplicitXmlRules } from "./explicitXMLDefaults"

export const metadataRuleLayer000 = composeMetadataRules(
  defineMetadataItemCollectionRule({
  propertyType: "CharacteristicsDescriptions",
  itemRule: CharacteristicsDescriptionRules,
  xmlElement: "xr:Characteristic",
  yamlAsArray: true,
  }),
  characteristicsDescriptionExplicitXmlRules,
)

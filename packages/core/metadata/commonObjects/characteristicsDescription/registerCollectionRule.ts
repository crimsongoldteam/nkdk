import { registerMetadataItemCollectionRule } from "../../orchestration"
import { CharacteristicsDescriptionRules } from "./rules"

registerMetadataItemCollectionRule({
  propertyType: "CharacteristicsDescriptions",
  itemRule: CharacteristicsDescriptionRules,
  xmlElement: "xr:Characteristic",
  yamlAsArray: true,
})

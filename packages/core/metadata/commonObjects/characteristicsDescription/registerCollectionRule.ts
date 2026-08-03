import { registerMetadataItemCollectionRule } from "../../orchestration"
import { CharacteristicsDescriptionRules } from "./rules"

import "./explicitXMLDefaults"

registerMetadataItemCollectionRule({
  propertyType: "CharacteristicsDescriptions",
  itemRule: CharacteristicsDescriptionRules,
  xmlElement: "xr:Characteristic",
  yamlAsArray: true,
})

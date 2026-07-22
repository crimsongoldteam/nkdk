import { registerMetadataItemCollectionRule } from "../../orchestration"
import { importMetadataItemCollectionFromXML } from "../../orchestration/metadataCollection/fromXML"
import { CharacteristicsDescriptionRules } from "./rules"

export const importCharacteristicsDescriptionsFromXML = importMetadataItemCollectionFromXML(
  CharacteristicsDescriptionRules,
  "xr:Characteristic"
)

registerMetadataItemCollectionRule({
  propertyType: "CharacteristicsDescriptions",
  itemRule: CharacteristicsDescriptionRules,
  xmlElement: "xr:Characteristic",
  yamlAsArray: true,
  fromXML: importCharacteristicsDescriptionsFromXML,
})

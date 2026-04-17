import { importMetadataItemCollectionFromXML } from "~/metadata/orchestration/metadataCollection/fromXML"
import { exportMetadataCollectionToXML } from "~/metadata/orchestration/metadataCollection/toXML"
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import { CharacteristicsDescriptionRules } from "./rules"

export const importCharacteristicsDescriptionsFromXML = importMetadataItemCollectionFromXML(
  CharacteristicsDescriptionRules,
  "xr:Characteristic"
)

registerTypeRule("CharacteristicsDescriptions", "importFromXML", importCharacteristicsDescriptionsFromXML)

registerTypeRule("CharacteristicsDescriptions", "exportToXML", (p) =>
  exportMetadataCollectionToXML({
    context: p.context,
    rule: p.rule,
    data: p.value,
    itemRule: CharacteristicsDescriptionRules,
    xmlElement: "xr:Characteristic",
  })
)

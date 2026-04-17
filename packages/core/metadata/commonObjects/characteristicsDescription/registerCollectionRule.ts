import { importMetadataItemCollectionFromXML } from "~/metadata/orchestration/metadataCollection/fromXML"
import { importMetadataItemCollectionFromYAMLAsArray } from "~/metadata/orchestration/metadataCollection/fromYAML"
import { exportMetadataCollectionToXML } from "~/metadata/orchestration/metadataCollection/toXML"
import { exportMetadataCollectionToYAMLAsArray } from "~/metadata/orchestration/metadataCollection/toYAML"
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

registerTypeRule("CharacteristicsDescriptions", "importFromYAML", (context, _rule, value) =>
  importMetadataItemCollectionFromYAMLAsArray({ context, itemRule: CharacteristicsDescriptionRules, yaml: value })
)

registerTypeRule("CharacteristicsDescriptions", "exportToYAML", (context, _rule, value) =>
  exportMetadataCollectionToYAMLAsArray({ context, data: value, itemRule: CharacteristicsDescriptionRules })
)

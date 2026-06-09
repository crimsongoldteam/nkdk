import { ConfigurationContextWithExportToXML } from "~/metadata/context/types"
import { PropertyRule } from "~/metadata/orchestration"
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import { importMetadataItemCollectionFromXML } from "~/metadata/orchestration/metadataCollection/fromXML"
import { importMetadataItemCollectionFromYAMLAsArray } from "~/metadata/orchestration/metadataCollection/fromYAML"
import { exportMetadataCollectionToXML } from "~/metadata/orchestration/metadataCollection/toXML"
import { exportMetadataCollectionToYAMLAsArray } from "~/metadata/orchestration/metadataCollection/toYAML"
import type { ExportToXMLFunctionNew } from "~/metadata/orchestration/property/fn"
import { CharacteristicsDescriptionRules } from "./rules"
import { CharacteristicsDescriptions } from "./types"

export const importCharacteristicsDescriptionsFromXML = importMetadataItemCollectionFromXML(
  CharacteristicsDescriptionRules,
  "xr:Characteristic"
)

registerTypeRule("CharacteristicsDescriptions", "importFromXML", importCharacteristicsDescriptionsFromXML)

const exportCharacteristicsDescriptionsToXML: ExportToXMLFunctionNew = (p: {
  context: ConfigurationContextWithExportToXML
  rule: PropertyRule
  value: CharacteristicsDescriptions
  referenceMetadata?: CharacteristicsDescriptions
}) =>
  exportMetadataCollectionToXML({
    context: p.context,
    rule: p.rule,
    data: p.value,
    referenceData: p.referenceMetadata,
    itemRule: CharacteristicsDescriptionRules,
    xmlElement: "xr:Characteristic",
  })

registerTypeRule("CharacteristicsDescriptions", "exportToXML", exportCharacteristicsDescriptionsToXML)

registerTypeRule("CharacteristicsDescriptions", "importFromYAML", (context, _rule, value) =>
  importMetadataItemCollectionFromYAMLAsArray({ context, itemRule: CharacteristicsDescriptionRules, yaml: value })
)

registerTypeRule("CharacteristicsDescriptions", "exportToYAML", (context, _rule, value) =>
  exportMetadataCollectionToYAMLAsArray({ context, data: value, itemRule: CharacteristicsDescriptionRules })
)

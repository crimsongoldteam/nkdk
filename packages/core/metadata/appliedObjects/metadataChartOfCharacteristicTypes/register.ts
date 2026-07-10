import { registerDataPathOwnerKind } from "../../validation/dataPath/registry"
import { MetadataChartOfCharacteristicTypesRules } from "./rules"
import "./standardMembers"

registerDataPathOwnerKind({
  kind: "ПланВидовХарактеристик",
  projectDir: "ПланВидовХарактеристик",
  rule: MetadataChartOfCharacteristicTypesRules,
  typeDescriptionBases: ["ChartOfCharacteristicTypesRef"],
  metadataLinkPrefixes: ["ChartOfCharacteristicTypes"],
  aliases: ["ПланВидовХарактеристикОбъект"],
})
registerDataPathOwnerKind({
  kind: "ПланВидовХарактеристикОбъект",
  projectDir: "ПланВидовХарактеристик",
  rule: MetadataChartOfCharacteristicTypesRules,
  typeDescriptionBases: ["ChartOfCharacteristicTypesObject"],
  metadataLinkPrefixes: ["ChartOfCharacteristicTypes"],
})

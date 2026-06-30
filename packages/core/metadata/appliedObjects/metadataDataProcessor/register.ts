import { registerDataPathOwnerKind } from "~/metadata/validation/dataPath/registry"
import { MetadataDataProcessorRules } from "./rules"

registerDataPathOwnerKind({
  kind: "Обработка",
  projectDir: "Обработка",
  rule: MetadataDataProcessorRules,
  metadataLinkPrefixes: ["DataProcessor"],
  aliases: ["ОбработкаОбъект"],
})
registerDataPathOwnerKind({
  kind: "ОбработкаОбъект",
  projectDir: "Обработка",
  rule: MetadataDataProcessorRules,
  typeDescriptionBases: ["DataProcessorObject"],
  metadataLinkPrefixes: ["DataProcessor"],
})

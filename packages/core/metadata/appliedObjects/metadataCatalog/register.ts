import { registerDataPathOwnerKind } from "../../validation/dataPath/registry"
import { applyLegacyProjectReferenceContributions } from "../../validation/projectReferenceIndexRegistry"
import { MetadataCatalogRules } from "./rules"
import { metadataCatalogReferenceRules } from "./referenceRules"
import "./standardMembers"

registerDataPathOwnerKind({
  kind: "Справочник",
  projectDir: "Справочник",
  rule: MetadataCatalogRules,
  typeDescriptionBases: ["CatalogRef"],
  metadataLinkPrefixes: ["Catalog"],
  aliases: ["СправочникОбъект"],
})
registerDataPathOwnerKind({
  kind: "СправочникОбъект",
  projectDir: "Справочник",
  rule: MetadataCatalogRules,
  typeDescriptionBases: ["CatalogObject"],
  metadataLinkPrefixes: ["Catalog"],
})

applyLegacyProjectReferenceContributions(metadataCatalogReferenceRules)

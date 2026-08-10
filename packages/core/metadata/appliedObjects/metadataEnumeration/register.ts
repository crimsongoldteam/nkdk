import { registerDataPathOwnerKind } from "../../validation/dataPath/registry"
import { applyLegacyProjectReferenceContributions } from "../../validation/projectReferenceIndexRegistry"
import { MetadataEnumerationRules } from "./rules"
import { metadataEnumerationReferenceRules } from "./referenceRules"
import "./standardMembers"

registerDataPathOwnerKind({
  kind: "Перечисление",
  projectDir: "Перечисление",
  rule: MetadataEnumerationRules,
  typeDescriptionBases: ["EnumRef"],
  metadataLinkPrefixes: ["Enum"],
})

applyLegacyProjectReferenceContributions(metadataEnumerationReferenceRules)

import "./types"
import { registerDataPathOwnerKind } from "../../validation/dataPath/registry"
import { applyLegacyProjectReferenceContributions } from "../../validation/projectReferenceIndexRegistry"
import { MetadataExternalDataSourceRules } from "./rules"
import { metadataExternalDataSourceReferenceRules } from "./referenceRules"

registerDataPathOwnerKind({
  kind: "ВнешнийИсточникДанных",
  projectDir: "ВнешнийИсточникДанных",
  rule: MetadataExternalDataSourceRules,
})

applyLegacyProjectReferenceContributions(metadataExternalDataSourceReferenceRules)

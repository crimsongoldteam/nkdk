export * from "./types"
export * from "./rules"
import { applyLegacyProjectReferenceContributions } from "../../validation/projectReferenceIndexRegistry"
import { metadataSubsystemReferenceRules } from "./referenceRules"

applyLegacyProjectReferenceContributions(metadataSubsystemReferenceRules)

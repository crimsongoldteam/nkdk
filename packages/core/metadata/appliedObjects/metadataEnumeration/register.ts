import { applyLegacyProjectReferenceContributions } from "../../validation/projectReferenceIndexRegistry"
import { metadataEnumerationReferenceRules } from "./referenceRules"
import "./standardMembers"

applyLegacyProjectReferenceContributions(metadataEnumerationReferenceRules)

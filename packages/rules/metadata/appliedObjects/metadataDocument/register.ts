import { applyLegacyProjectReferenceContributions } from "../../validation/projectReferenceIndexRegistry"
import { metadataDocumentReferenceRules } from "./referenceRules"
import "./standardMembers"

applyLegacyProjectReferenceContributions(metadataDocumentReferenceRules)

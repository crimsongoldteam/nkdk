import { applyLegacyProjectReferenceContributions } from "../../validation/projectReferenceIndexRegistry"
import { metadataCatalogReferenceRules } from "./referenceRules"
import "./standardMembers"

applyLegacyProjectReferenceContributions(metadataCatalogReferenceRules)

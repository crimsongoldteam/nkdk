import "./types"
import { applyLegacyProjectReferenceContributions } from "../../validation/projectReferenceIndexRegistry"
import { metadataExternalDataSourceReferenceRules } from "./referenceRules"

applyLegacyProjectReferenceContributions(metadataExternalDataSourceReferenceRules)

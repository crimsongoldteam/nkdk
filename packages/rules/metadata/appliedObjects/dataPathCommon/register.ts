import { applyLegacyDataPathContributions } from "../../validation/dataPath/registry"
import { dataPathCommonRules } from "./rules"

export * from "./rules"

applyLegacyDataPathContributions([dataPathCommonRules])

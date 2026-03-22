import type { DcsMetadataValuePropertyRule } from "../dcsMetadataValue/types"
import type { SettingsParameterValuePropertyRule } from "./types"

export const toDcsMetadataValueRule = (
  rule: SettingsParameterValuePropertyRule
): DcsMetadataValuePropertyRule => ({
  type: "MetadataDcsMetadataValue",
  valueType: rule.valueType,
  ...(rule.typeSE !== undefined ? { typeSE: rule.typeSE } : {}),
})

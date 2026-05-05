import type { DcsMetadataValuePropertyRule } from "../dcsMetadataValue/types"
import type { SettingsParameterValuePropertyRule } from "./types"

export const toDcsMetadataValueRule = (
  rule: SettingsParameterValuePropertyRule
): DcsMetadataValuePropertyRule => {
  if (rule.valueType === "SystemEnumeration") {
    return {
      type: "MetadataDcsMetadataValue",
      valueType: "SystemEnumeration",
      typeSE: rule.typeSE!,
    }
  }

  return {
    type: "MetadataDcsMetadataValue",
    valueType: rule.valueType,
  }
}

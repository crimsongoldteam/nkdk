import { PropertyRule } from "~/metadata/orchestration/property/types"
import { registerTypeRule } from "~/metadata/orchestration/property/typeRuleRegistry"
import { ConfigurationContext } from "../../context/types"
import { UserSettingsID, UserSettingsIDXML } from "./types"

export const exportUserSettingsIDToXML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  value: UserSettingsID | undefined,
  referenceMetadata?: unknown
): UserSettingsIDXML | undefined => {
  if (value === undefined || value === false) return undefined
  if (value === true) {
    if (typeof referenceMetadata === "string" && referenceMetadata.length > 0) {
      return referenceMetadata
    }
    return undefined
  }
  return undefined
}

registerTypeRule("UserSettingsID", "exportToXML", exportUserSettingsIDToXML)

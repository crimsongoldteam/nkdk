import type { PropertyRule } from "@nkdk/runtime/rule-kit"
import { definePropertyTypeRule } from "../../ruleRuntime/property/typeRuleRegistry"
import { ConfigurationContext } from "@nkdk/runtime"
import type { UserSettingsID, UserSettingsIDXML } from "./types"

export const exportUserSettingsIDToXML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  value: UserSettingsID | undefined,
  referenceMetadata?: unknown
): UserSettingsIDXML | undefined => {
  if (value === undefined || value === false) return undefined
  if (typeof value === "string") return value
  if (value === true) {
    if (typeof referenceMetadata === "string" && referenceMetadata.length > 0) {
      return referenceMetadata
    }
    return undefined
  }
  return undefined
}

export const metadataPropertyRule000 = definePropertyTypeRule("UserSettingsID", "exportToXML", exportUserSettingsIDToXML)

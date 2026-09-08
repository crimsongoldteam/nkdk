import type { PropertyRule } from "@nkdk/runtime/rule-kit"
import { definePropertyTypeRule } from "../../ruleRuntime/property/typeRuleRegistry"
import { ConfigurationContext } from "@nkdk/runtime"
import type { UserSettingsID, UserSettingsIDXML } from "./types"

export const exportUserSettingsIDToXML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  value: UserSettingsID | undefined,
): UserSettingsIDXML | undefined => {
  return typeof value === "string" ? value : undefined
}

export const metadataPropertyRule000 = definePropertyTypeRule("UserSettingsID", "exportToXML", exportUserSettingsIDToXML)

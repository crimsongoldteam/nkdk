import { importBooleanFromYAML } from "../boolean/fromYAML"
import type { PropertyRule } from "../../ruleRuntime/property/types"
import { definePropertyTypeRule } from "../../ruleRuntime/property/typeRuleRegistry"
import { ConfigurationContext } from "../../context/types"
import type { UserSettingsID, UserSettingsIDYAML } from "./types"

export const importUserSettingsIDFromYAML = (
  context: ConfigurationContext,
  rule: PropertyRule | undefined,
  value: UserSettingsIDYAML | undefined
): UserSettingsID | undefined => {
  if (typeof value === "string" && value !== "Истина" && value !== "Ложь") return value

  return importBooleanFromYAML(context, rule, value)
}

export const metadataPropertyRule000 = definePropertyTypeRule("UserSettingsID", "importFromYAML", importUserSettingsIDFromYAML)

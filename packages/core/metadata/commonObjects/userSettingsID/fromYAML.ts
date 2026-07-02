import { importBooleanFromYAML } from "~/metadata/commonObjects/boolean/fromYAML"
import type { PropertyRule } from "~/metadata/orchestration/property/types"
import { registerTypeRule } from "~/metadata/orchestration/property/typeRuleRegistry"
import { ConfigurationContext } from "../../context/types"
import type { UserSettingsID, UserSettingsIDYAML } from "./types"

export const importUserSettingsIDFromYAML = (
  context: ConfigurationContext,
  rule: PropertyRule | undefined,
  value: UserSettingsIDYAML | undefined
): UserSettingsID | undefined => {
  return importBooleanFromYAML(context, rule, value)
}

registerTypeRule("UserSettingsID", "importFromYAML", importUserSettingsIDFromYAML)

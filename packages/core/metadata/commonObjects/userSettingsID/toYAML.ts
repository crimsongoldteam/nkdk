import { exportBooleanToYAML } from "../boolean/toYAML"
import type { PropertyRule } from "../../orchestration/property/types"
import { registerTypeRule } from "../../orchestration/property/typeRuleRegistry"
import { ConfigurationContext } from "../../context/types"
import type { UserSettingsID, UserSettingsIDYAML } from "./types"

export const exportUserSettingsIDToYAML = (
  context: ConfigurationContext,
  rule: PropertyRule | undefined,
  value: UserSettingsID | undefined
): UserSettingsIDYAML | undefined => {
  return exportBooleanToYAML(context, rule, value)
}

registerTypeRule("UserSettingsID", "exportToYAML", exportUserSettingsIDToYAML)

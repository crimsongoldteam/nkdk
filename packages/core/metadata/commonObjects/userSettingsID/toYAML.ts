import { exportBooleanToYAML } from "~/metadata/commonObjects/boolean/toYAML"
import type { PropertyRule } from "~/metadata/orchestration/property/types"
import { registerTypeRule } from "~/metadata/orchestration/property/typeRuleRegistry"
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

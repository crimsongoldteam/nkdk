import { exportBooleanToYAML } from "~/metadata/commonObjects/boolean/toYAML"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import { ConfigurationContext } from "../../context/types"
import { UserSettingsID, UserSettingsIDYAML } from "./types"

export const exportUserSettingsIDToYAML = (
  context: ConfigurationContext,
  rule: PropertyRule | undefined,
  value: UserSettingsID | undefined
): UserSettingsIDYAML | undefined => {
  return exportBooleanToYAML(context, rule, value)
}

registerTypeRule("UserSettingsID", "exportToYAML", exportUserSettingsIDToYAML)

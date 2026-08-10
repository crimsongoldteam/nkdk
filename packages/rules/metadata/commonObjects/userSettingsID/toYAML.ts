import { exportBooleanToYAML } from "../boolean/toYAML"
import type { PropertyRule } from "@nkdk/runtime/rule-kit"
import { definePropertyTypeRule } from "../../ruleRuntime/property/typeRuleRegistry"
import { ConfigurationContext } from "@nkdk/runtime"
import type { UserSettingsID, UserSettingsIDYAML } from "./types"

export const exportUserSettingsIDToYAML = (
  context: ConfigurationContext,
  rule: PropertyRule | undefined,
  value: UserSettingsID | undefined
): UserSettingsIDYAML | undefined => {
  if (typeof value === "string") return value

  return exportBooleanToYAML(context, rule, value)
}

export const metadataPropertyRule000 = definePropertyTypeRule("UserSettingsID", "exportToYAML", exportUserSettingsIDToYAML)

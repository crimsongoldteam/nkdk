import type { ConfigurationContext } from "~/metadata/context/types"
import { exportPropertiesToYAML } from "~/metadata/orchestration"
import { AppearanceFieldsRules } from "./rules"
import type { AppearanceFields, AppearanceFieldsYAML } from "./types"

export const exportAppearanceFieldsToYAML = (
  context: ConfigurationContext,
  data: AppearanceFields
): AppearanceFieldsYAML => {
  return (
    exportPropertiesToYAML({
      context,
      data,
      rule: AppearanceFieldsRules,
    }) ?? {}
  ) as AppearanceFieldsYAML
}

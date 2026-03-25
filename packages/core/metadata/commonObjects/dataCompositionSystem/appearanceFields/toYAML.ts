import { ConfigurationContext } from "~/metadata/context/types"
import { exportPropertiesToYAML, PropertyRule, registerTypeRule } from "~/metadata/orchestration"
import { AppearanceFieldsRules } from "./rules"
import type { AppearanceFields, AppearanceFieldsYAML } from "./types"

const exportAppearanceToYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: AppearanceFields | undefined
): AppearanceFieldsYAML | undefined => {
  if (!data) return undefined
  return exportPropertiesToYAML({
    context,
    data,
    rule: AppearanceFieldsRules,
  })
}

registerTypeRule("Appearance", "exportToYAML", exportAppearanceToYAML)

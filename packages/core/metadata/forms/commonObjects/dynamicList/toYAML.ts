import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import { DynamicList, DynamicListYAML } from "./types"

export const exportDynamicListToYAML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: DynamicList | undefined
): DynamicListYAML | undefined => {
  return data
}

registerTypeRule("DynamicList", "exportToYAML", exportDynamicListToYAML)

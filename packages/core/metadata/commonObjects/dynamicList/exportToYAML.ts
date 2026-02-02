import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { ConfigurationContext } from "~/metadata/context/types"
import { DynamicList, DynamicListEnterprise } from "./types"

export const exportDynamicListToYAML = (
  _context: ConfigurationContext,
  _rule: PropertyRule,
  data: DynamicList | undefined
): DynamicListEnterprise | undefined => {
  return data
}

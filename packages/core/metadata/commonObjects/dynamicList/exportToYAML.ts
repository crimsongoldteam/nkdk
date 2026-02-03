import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { DynamicList, DynamicListEnterprise } from "./types"

export const exportDynamicListToYAML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: DynamicList | undefined
): DynamicListEnterprise | undefined => {
  return data
}

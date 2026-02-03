import { ConfigurationContext } from "~/metadata/context/types"
import { DynamicList, DynamicListEnterprise } from "./types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"

export const exportDynamicListToEnterprise = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: DynamicList | undefined
): DynamicListEnterprise | undefined => {
  return data
}

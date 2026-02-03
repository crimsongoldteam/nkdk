import { ConfigurationContext } from "~/metadata/context/types"
import { DynamicList, DynamicListEnterprise } from "./types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"

export const importDynamicListFromEnterprise = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: DynamicListEnterprise | undefined
): DynamicList | undefined => {
  return data as DynamicList
}

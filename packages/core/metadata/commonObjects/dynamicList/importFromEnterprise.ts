import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { DynamicList, DynamicListEnterprise } from "./types"

export const importDynamicListFromEnterprise = (
  _context: ConfigurationContext,
  _rule: PropertyRule<any> | undefined,
  data: DynamicListEnterprise | undefined
): DynamicList | undefined => {
  return data as DynamicList
}

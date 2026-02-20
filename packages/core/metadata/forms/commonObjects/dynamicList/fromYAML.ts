import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { DynamicList, DynamicListYAML } from "./types"

export const importDynamicListFromYAML = (
  _context: ConfigurationContext,
  _rule: PropertyRule<any> | undefined,
  data: DynamicListYAML | undefined
): DynamicList | undefined => {
  return data as DynamicList
}

import { ConfigurationContext } from "~/metadata/context/types"
import { DynamicList, DynamicListXML } from "./types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"

export const exportDynamicListToXML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: DynamicList | undefined
): DynamicListXML | undefined => {
  return data
}

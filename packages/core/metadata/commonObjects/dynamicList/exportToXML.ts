import { ConfigurationContext } from "~/metadata/context/types"
import { registerTypeRule } from "~/metadata/metadataFactory/typeRulesFactory"
import { DynamicList, DynamicListXML } from "./types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"

export const exportDynamicListToXML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: DynamicList | undefined
): DynamicListXML | undefined => {
  return data
}

registerTypeRule("DynamicList", "exportToXML", exportDynamicListToXML)

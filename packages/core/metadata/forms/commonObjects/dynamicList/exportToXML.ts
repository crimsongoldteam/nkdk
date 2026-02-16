import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/metadataFactory/types/types"
import { DynamicList, DynamicListXML } from "./types"

export const exportDynamicListToXML = (
  _context: ConfigurationContext,
  _rule: PropertyRule<any> | undefined,
  data: DynamicList | undefined
): DynamicListXML | undefined => {
  return data
}

registerTypeRule("DynamicList", "exportToXML", exportDynamicListToXML)

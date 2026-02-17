import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/metadataFactory/types/factory"
import { DynamicList, DynamicListEnterprise } from "./types"

export const exportDynamicListToEnterprise = (
  _context: ConfigurationContext,
  _rule: PropertyRule<any> | undefined,
  data: DynamicList | undefined
): DynamicListEnterprise | undefined => {
  return data
}

registerTypeRule("DynamicList", "exportToEnterprise", exportDynamicListToEnterprise)

import { ConfigurationContext } from "~/metadata/context/types"
import { registerTypeRule } from "~/metadata/metadataFactory/typeRulesFactory"
import { DynamicList, DynamicListEnterprise } from "./types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"

export const exportDynamicListToEnterprise = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: DynamicList | undefined
): DynamicListEnterprise | undefined => {
  return data
}

registerTypeRule("DynamicList", "exportToEnterprise", exportDynamicListToEnterprise)

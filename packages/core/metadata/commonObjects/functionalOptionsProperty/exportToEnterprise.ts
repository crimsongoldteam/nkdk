import { ConfigurationContext } from "~/metadata/context/types"
import { FunctionalOptions, FunctionalOptionsEnterprise } from "./types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/metadataFactory/typeRulesFactory"

export const exportFunctionalOptionsToEnterprise = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: FunctionalOptions | undefined
): FunctionalOptionsEnterprise | undefined => {
  if (!data || data.length === 0) return undefined

  return data
}


registerTypeRule("FunctionalOptionsProperty", "exportToEnterprise", exportFunctionalOptionsToEnterprise)
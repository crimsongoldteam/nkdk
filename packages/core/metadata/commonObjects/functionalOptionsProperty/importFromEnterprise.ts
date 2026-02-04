import { ConfigurationContext } from "~/metadata/context/types"
import { FunctionalOptions, FunctionalOptionsEnterprise } from "./types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/metadataFactory/typeRulesFactory"

export const importFunctionalOptionsFromEnterprise = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: FunctionalOptionsEnterprise | undefined
): FunctionalOptions | undefined => {
  if (!data || !Array.isArray(data)) return undefined

  return data
}


registerTypeRule("FunctionalOptionsProperty", "importFromEnterprise", importFunctionalOptionsFromEnterprise)
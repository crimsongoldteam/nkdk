import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/metadataFactory/typeRulesFactory"
import { FunctionalOptions, FunctionalOptionsEnterprise } from "./types"

export const importFunctionalOptionsFromEnterprise = (
  _context: ConfigurationContext,
  _rule: PropertyRule<any>,
  data: FunctionalOptionsEnterprise | undefined
): FunctionalOptions | undefined => {
  if (!data || !Array.isArray(data)) return undefined

  return data
}

registerTypeRule("FunctionalOptionsProperty", "importFromEnterprise", importFunctionalOptionsFromEnterprise)

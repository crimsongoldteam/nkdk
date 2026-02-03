import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { FunctionalOptions, FunctionalOptionsEnterprise } from "./types"

export const importFunctionalOptionsFromYAML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: FunctionalOptionsEnterprise | undefined
): FunctionalOptions | undefined => {
  if (!data || !Array.isArray(data)) return undefined

  return data
}

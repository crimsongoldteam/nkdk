import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { FunctionalOptions, FunctionalOptionsEnterprise } from "./types"

export const exportFunctionalOptionsToYAML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: FunctionalOptions | undefined
): FunctionalOptionsEnterprise | undefined => {
  if (!data || data.length === 0) return undefined

  return data
}

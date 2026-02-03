import { ConfigurationContext } from "~/metadata/context/types"
import { FunctionalOptions, FunctionalOptionsEnterprise } from "./types"

export const importFunctionalOptionsFromEnterprise = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: FunctionalOptionsEnterprise | undefined
): FunctionalOptions | undefined => {
  if (!data || !Array.isArray(data)) return undefined

  return data
}

import { ConfigurationContext } from "~/metadata/context/types"
import { FunctionalOptions, FunctionalOptionsEnterprise } from "./types"

export const exportFunctionalOptionsToEnterprise = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: FunctionalOptions | undefined
): FunctionalOptionsEnterprise | undefined => {
  if (!data || data.length === 0) return undefined

  return data
}

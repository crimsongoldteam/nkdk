import { ConfigurationContext } from "~/metadata/context/types"
import { UseAlways, UseAlwaysEnterprise } from "./types"

export const exportUseAlwaysToEnterprise = (
  _context: ConfigurationContext,
  data: UseAlways | undefined
): UseAlwaysEnterprise | undefined => {
  if (!data || data.length === 0) return undefined

  return data
}

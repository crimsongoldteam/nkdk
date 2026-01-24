import { ConfigurationContext } from "~/metadata/context/types"
import { UseAlways, UseAlwaysEnterprise } from "./types"

export const importUseAlwaysFromEnterprise = (
  _context: ConfigurationContext,
  enterprise: UseAlwaysEnterprise | undefined
): UseAlways | undefined => {
  if (!enterprise || enterprise.length === 0) return undefined

  return enterprise
}

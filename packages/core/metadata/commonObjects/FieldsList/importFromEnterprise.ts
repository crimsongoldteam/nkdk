import { ConfigurationContext } from "~/metadata/context/types"
import { FieldsList, FieldsListEnterprise } from "./types"

export const importFieldsListFromEnterprise = (
  _context: ConfigurationContext,
  enterprise: FieldsListEnterprise | undefined
): FieldsList | undefined => {
  if (!enterprise || enterprise.length === 0) return undefined

  return enterprise
}

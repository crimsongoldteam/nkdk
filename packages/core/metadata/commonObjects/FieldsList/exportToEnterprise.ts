import { ConfigurationContext } from "~/metadata/context/types"
import { FieldsList, FieldsListEnterprise } from "./types"

export const exportFieldsListToEnterprise = (
  _context: ConfigurationContext,
  data: FieldsList | undefined
): FieldsListEnterprise | undefined => {
  if (!data || data.length === 0) return undefined

  return data
}

import { ConfigurationContext } from "../../context/types"
import { StringboolEnterprise } from "./types"

export const importBooleanFromEnterprise = (
  _context: ConfigurationContext,
  value: StringboolEnterprise | undefined
): boolean | undefined => {
  if (value === undefined) return undefined
  return value === "Истина"
}

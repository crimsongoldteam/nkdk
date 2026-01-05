import { ConfigurationContext } from "../../context/types"
import { StringboolEnterprise } from "./types"

export const exportBooleanToEnterprise = (
  _context: ConfigurationContext,
  value: boolean | undefined
): StringboolEnterprise | undefined => {
  if (value === undefined) return undefined
  return value ? "Истина" : "Ложь"
}

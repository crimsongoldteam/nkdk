import { Context } from "../../context/types"
import { StringboolEnterprise } from "./types"

export const importBooleanFromEnterprise = (
  _context: Context,
  value: StringboolEnterprise | undefined
): boolean | undefined => {
  if (value === undefined) return undefined
  return value === "Истина"
}

import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { ConfigurationContext } from "../../context/types"
import { StringboolEnterprise } from "./types"

export const exportBooleanToEnterprise = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  value: boolean | undefined
): StringboolEnterprise | undefined => {
  if (value === undefined) return undefined
  return value ? "Истина" : "Ложь"
}

import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { ConfigurationContext } from "../../context/types"
import { StringboolEnterprise } from "./types"

export const exportBooleanToYAML = (
  _context: ConfigurationContext,
  _rule: PropertyRule,
  value: boolean | undefined
): StringboolEnterprise | undefined => {
  if (value === undefined) return undefined
  return value ? "Истина" : "Ложь"
}

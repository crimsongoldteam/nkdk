import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { ConfigurationContext } from "../../context/types"
import { StringboolEnterprise } from "./types"

export const importBooleanFromYAML = (
  _context: ConfigurationContext,
  _rule: PropertyRule,
  value: StringboolEnterprise | undefined
): boolean | undefined => {
  if (value === undefined) return undefined
  return value === "Истина"
}

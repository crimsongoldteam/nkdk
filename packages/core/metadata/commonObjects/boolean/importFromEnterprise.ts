import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { ConfigurationContext } from "../../context/types"
import { StringboolEnterprise } from "./types"

export const importBooleanFromEnterprise = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  value: StringboolEnterprise | undefined
): boolean | undefined => {
  if (value === undefined) return undefined
  return value === "Истина"
}

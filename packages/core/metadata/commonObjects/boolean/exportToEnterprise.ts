import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/metadataFactory/types/factory"
import { ConfigurationContext } from "../../context/types"
import { StringboolEnterprise } from "./types"

export const exportBooleanToEnterprise = (
  _context: ConfigurationContext,
  _rule: PropertyRule<any> | undefined,
  value: boolean | undefined
): StringboolEnterprise | undefined => {
  if (value === undefined) return undefined
  return value ? "Истина" : "Ложь"
}

registerTypeRule("boolean", "exportToEnterprise", exportBooleanToEnterprise)

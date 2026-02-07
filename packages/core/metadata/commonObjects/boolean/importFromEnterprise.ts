import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/metadataFactory/typeRulesFactory"
import { ConfigurationContext } from "../../context/types"
import { StringboolEnterprise } from "./types"

export const importBooleanFromEnterprise = (
  _context: ConfigurationContext,
  _rule: PropertyRule<any>,
  value: StringboolEnterprise | undefined
): boolean | undefined => {
  if (value === undefined) return undefined
  return value === "Истина"
}

registerTypeRule("boolean", "importFromEnterprise", importBooleanFromEnterprise)

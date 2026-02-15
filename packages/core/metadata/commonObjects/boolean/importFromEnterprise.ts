import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/metadataFactory/types/types"
import { ConfigurationContext } from "../../context/types"
import { StringboolEnterprise } from "./types"

export const importBooleanFromEnterprise = (
  _context: ConfigurationContext,
  _rule: PropertyRule<any> | undefined,
  value: StringboolEnterprise | undefined
): boolean | undefined => {
  if (value === undefined) return undefined
  return value === "Истина"
}

registerTypeRule("boolean", "importFromEnterprise", importBooleanFromEnterprise)

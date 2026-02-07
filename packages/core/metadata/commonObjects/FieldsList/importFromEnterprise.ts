import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/metadataFactory/typeRulesFactory"
import { FieldsList, FieldsListEnterprise } from "./types"

export const importFieldsListFromEnterprise = (
  _context: ConfigurationContext,
  _rule: PropertyRule<any>,
  enterprise: FieldsListEnterprise | undefined
): FieldsList | undefined => {
  if (!enterprise || enterprise.length === 0) return undefined

  return enterprise
}

registerTypeRule("FieldsList", "importFromEnterprise", importFieldsListFromEnterprise)

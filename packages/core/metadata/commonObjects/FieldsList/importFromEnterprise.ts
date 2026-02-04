import { ConfigurationContext } from "~/metadata/context/types"
import { registerTypeRule } from "~/metadata/metadataFactory/typeRulesFactory"
import { FieldsList, FieldsListEnterprise } from "./types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"

export const importFieldsListFromEnterprise = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  enterprise: FieldsListEnterprise | undefined
): FieldsList | undefined => {
  if (!enterprise || enterprise.length === 0) return undefined

  return enterprise
}

registerTypeRule("FieldsList", "importFromEnterprise", importFieldsListFromEnterprise)

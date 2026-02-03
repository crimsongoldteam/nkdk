import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { FieldsList, FieldsListEnterprise } from "./types"

export const importFieldsListFromYAML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  enterprise: FieldsListEnterprise | undefined
): FieldsList | undefined => {
  if (!enterprise || enterprise.length === 0) return undefined

  return enterprise
}

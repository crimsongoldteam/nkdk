import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { FieldsList, FieldsListEnterprise } from "./types"

export const exportFieldsListToYAML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: FieldsList | undefined
): FieldsListEnterprise | undefined => {
  if (!data || data.length === 0) return undefined

  return data
}

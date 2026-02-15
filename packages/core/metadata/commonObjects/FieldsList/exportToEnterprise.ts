import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/metadataFactory/types/types"
import { FieldsList, FieldsListEnterprise } from "./types"

export const exportFieldsListToEnterprise = (
  _context: ConfigurationContext,
  _rule: PropertyRule<any> | undefined,
  data: FieldsList | undefined
): FieldsListEnterprise | undefined => {
  if (!data || data.length === 0) return undefined

  return data
}

registerTypeRule("FieldsList", "exportToEnterprise", exportFieldsListToEnterprise)

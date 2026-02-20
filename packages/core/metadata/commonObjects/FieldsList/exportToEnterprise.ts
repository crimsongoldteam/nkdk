import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/metadataFactory/types/factory"
import { FieldsList, FieldsListYAML } from "./types"

export const exportFieldsListToYAML = (
  _context: ConfigurationContext,
  _rule: PropertyRule<any> | undefined,
  data: FieldsList | undefined
): FieldsListYAML | undefined => {
  if (!data || data.length === 0) return undefined

  return data
}

registerTypeRule("FieldsList", "exportToYAML", exportFieldsListToYAML)

import { ConfigurationContext } from "../../context/types"
import type { PropertyRule } from "../../orchestration/property/types"
import { registerTypeRule } from "../../orchestration/property/typeRuleRegistry"
import type { FieldsList, FieldsListPropertyRule, FieldsListXML } from "./types"

export const exportFieldsListToXML = (
  _context: ConfigurationContext,
  rule: PropertyRule | undefined,
  data: FieldsList | undefined
): FieldsListXML | undefined => {
  if (!data || data.length === 0) return undefined

  const xmlItem = (rule as FieldsListPropertyRule | undefined)?.fieldsListXMLItem ?? "Field"

  return {
    [xmlItem]: data,
  }
}

registerTypeRule("FieldsList", "exportToXML", exportFieldsListToXML)

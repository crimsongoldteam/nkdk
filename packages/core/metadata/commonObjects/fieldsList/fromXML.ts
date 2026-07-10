import { ConfigurationContext } from "../../context/types"
import type { PropertyRule } from "../../orchestration/property/types"
import { registerTypeRule } from "../../orchestration/property/typeRuleRegistry"
import type { FieldsList, FieldsListPropertyRule, FieldsListXML } from "./types"

export const importFieldsListFromXML = (
  _context: ConfigurationContext,
  rule: PropertyRule | undefined,
  xml: FieldsListXML | undefined
): FieldsList | undefined => {
  if (!xml) return undefined

  const xmlItem = (rule as FieldsListPropertyRule | undefined)?.fieldsListXMLItem ?? "Field"
  const rawFields = xml[xmlItem]
  if (!rawFields) return undefined

  return Array.isArray(rawFields) ? rawFields : [rawFields]
}

registerTypeRule("FieldsList", "importFromXML", importFieldsListFromXML)

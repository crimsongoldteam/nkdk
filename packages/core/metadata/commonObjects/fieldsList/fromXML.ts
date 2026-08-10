import { ConfigurationContext } from "@nkdk/runtime"
import type { PropertyRule } from "@nkdk/runtime/rule-kit"
import { definePropertyTypeRule } from "../../ruleRuntime/property/typeRuleRegistry"
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

export const metadataPropertyRule000 = definePropertyTypeRule("FieldsList", "importFromXML", importFieldsListFromXML)

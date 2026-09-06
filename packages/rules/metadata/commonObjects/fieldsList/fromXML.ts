import { ConfigurationContext, isEmptyXmlElement, isXmlElementNode, xmlElementChildren, xmlTextValue, type XmlElementNode } from "@nkdk/runtime"
import type { PropertyRule } from "@nkdk/runtime/rule-kit"
import { definePropertyTypeRule } from "../../ruleRuntime/property/typeRuleRegistry"
import type { FieldsList, FieldsListPropertyRule, FieldsListXML } from "./types"

export const importFieldsListFromXML = (
  _context: ConfigurationContext,
  rule: PropertyRule | undefined,
  xml: FieldsListXML | XmlElementNode | undefined
): FieldsList | undefined => {
  if (!xml) return undefined

  const xmlItem = (rule as FieldsListPropertyRule | undefined)?.fieldsListXMLItem ?? "Field"
  if (isXmlElementNode(xml)) {
    const fields = xmlElementChildren(xml, xmlItem)
    if (fields.length === 0 || fields.length === 1 && isEmptyXmlElement(fields[0]!)) return undefined
    return fields.map(field => (xmlTextValue(field) || undefined)!)
  }
  const rawFields = xml[xmlItem]
  if (!rawFields) return undefined

  return Array.isArray(rawFields) ? rawFields : [rawFields]
}

export const metadataPropertyRule000 = definePropertyTypeRule("FieldsList", "importFromXML", importFieldsListFromXML)

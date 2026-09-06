import type { PropertyRule } from "@nkdk/runtime/rule-kit"
import { definePropertyTypeRule } from "../../ruleRuntime/property/typeRuleRegistry"
import { ConfigurationContextFromXML, isEmptyXmlElement, isXmlElementNode, xmlElementChildren, xmlTextValue, type XmlElementNode } from "@nkdk/runtime"
import type { IndexFields, IndexFieldsXML } from "./types"

export const importIndexFieldsFromXML = (
  _context: ConfigurationContextFromXML,
  _rule: PropertyRule | undefined,
  xml: IndexFieldsXML | XmlElementNode | undefined
): IndexFields | undefined => {
  if (!xml) return undefined
  if (isXmlElementNode(xml)) {
    if (isEmptyXmlElement(xml)) return undefined
    const fields = xmlElementChildren(xml, "Field")
    if (fields.length === 1 && isEmptyXmlElement(fields[0]!)) return []
    return fields.map(field => (xmlTextValue(field) || undefined)!)
  }
  const fields = xml.Field
  if (fields === undefined) return []
  return Array.isArray(fields) ? fields : [fields]
}

export const metadataPropertyRule000 = definePropertyTypeRule("IndexField", "importFromXML", importIndexFieldsFromXML)

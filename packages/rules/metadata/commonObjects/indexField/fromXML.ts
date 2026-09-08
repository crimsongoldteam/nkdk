import type { PropertyRule } from "@nkdk/runtime/rule-kit"
import { definePropertyTypeRule } from "../../ruleRuntime/property/typeRuleRegistry"
import { ConfigurationContextFromXML, isEmptyXmlElement, xmlElementChildren, xmlTextValue, type XmlElementNode } from "@nkdk/runtime"
import type { IndexFields } from "./types"

export const importIndexFieldsFromXML = (
  _context: ConfigurationContextFromXML,
  _rule: PropertyRule | undefined,
  xml: XmlElementNode | undefined
): IndexFields | undefined => {
  if (!xml) return undefined
  if (isEmptyXmlElement(xml)) return undefined
  const fields = xmlElementChildren(xml, "Field")
  if (fields.length === 1 && isEmptyXmlElement(fields[0]!)) return []
  return fields.map(field => (xmlTextValue(field) || undefined)!)
}

export const metadataPropertyRule000 = definePropertyTypeRule("IndexField", "importFromXML", importIndexFieldsFromXML)

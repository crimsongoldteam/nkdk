import type { PropertyRule } from "@nkdk/runtime/rule-kit"
import { definePropertyTypeRule } from "../../ruleRuntime/property/typeRuleRegistry"
import { ConfigurationContext, ConfigurationContextFromXML, isEmptyXmlElement, isXmlElementNode, xmlElementChildren, xmlTextValue, type XmlElementNode } from "@nkdk/runtime"
import type { MetadataField, MetadataFields, MetadataFieldsXML, MetadataFieldXML } from "./types"

export const importMetadataFieldFromXML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: MetadataFieldXML | string | XmlElementNode | undefined
): MetadataField | undefined => {
  if (!data) return undefined
  if (isXmlElementNode(data)) return xmlTextValue(data) || undefined

  if (typeof data === "string") return data

  return data["#text"]
}

export const importMetadataFieldsFromXML = (
  context: ConfigurationContextFromXML,
  _rule: PropertyRule | undefined,
  data: MetadataFieldsXML | XmlElementNode | undefined
): MetadataFields | undefined => {
  if (!data) return undefined
  if (isXmlElementNode(data)) {
    if (isEmptyXmlElement(data)) return undefined
    const fields = xmlElementChildren(data, "xr:Field")
    return (fields.length === 0 ? [undefined] : fields).map(value => importMetadataFieldFromXML(context, undefined, value)!)
  }

  const fields = data["xr:Field"]

  const items = Array.isArray(fields) ? fields : [fields]

  const result = items.map((value) => importMetadataFieldFromXML(context, undefined, value)!)

  return result
}

export const metadataPropertyRule000 = definePropertyTypeRule("MetadataField", "importFromXML", importMetadataFieldsFromXML)
export const metadataPropertyRule001 = definePropertyTypeRule("MetadataFields", "importFromXML", importMetadataFieldsFromXML)

import { importI8nTextFromXML } from "../../i8nText/fromXML"
import type { I8nTextXML } from "../../i8nText/types"
import { isEmptyXmlElement, isXmlElementNode, xmlAttributeValue, xmlTextValue, type ConfigurationContextFromXML, type XmlElementNode } from "@nkdk/runtime"
import { definePropertyTypeRule } from "../../../ruleRuntime"
import type { PropertyRule } from "../../../ruleRuntime"
import type { DcsLocalStringTypeXML, DcsLocalStringValue } from "./types"

export const importDcsLocalStringTypeFromXML = (
  context: ConfigurationContextFromXML,
  _rule: PropertyRule | undefined,
  xml: DcsLocalStringTypeXML | XmlElementNode,
): DcsLocalStringValue | undefined => {
  if (xml === undefined) return undefined
  if (isXmlElementNode(xml)) {
    if (isEmptyXmlElement(xml)) return undefined
    if (xmlAttributeValue(xml, "xsi:type") === "xs:string" ||
      (xml.attributes.length === 0 && xml.content.every(child => child.type === "text"))) {
      return { kind: "xmlString", text: xmlTextValue(xml) }
    }
    return importI8nTextFromXML(context, { type: "I8nText" }, xml)
  }
  if (typeof xml === "string") return { kind: "xmlString", text: xml }
  if (typeof xml !== "object" || xml === null) return undefined
  if (xml["_xsi:type"] === "xs:string") {
    return { kind: "xmlString", text: xml["#text"] === undefined ? "" : String(xml["#text"]) }
  }
  return importI8nTextFromXML(context, { type: "I8nText" } as PropertyRule, xml as I8nTextXML)
}

export const metadataPropertyRule000 = definePropertyTypeRule(
  "DcsLocalStringType",
  "importFromXML",
  importDcsLocalStringTypeFromXML,
)

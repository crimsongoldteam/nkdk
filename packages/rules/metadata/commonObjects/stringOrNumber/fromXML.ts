import { ConfigurationContextFromXML, isXmlElementNode, xmlAttributeValue, xmlTextValue, type XmlElementNode } from "@nkdk/runtime"
import { PropertyRule } from "../../ruleRuntime"
import { definePropertyTypeRule } from "../../ruleRuntime/property/typeRuleRegistry"
import { StringOrNumber } from "./types"

const NUMERIC_XSI_TYPES = new Set(["xs:decimal", "xs:integer", "xs:double", "xs:float"])

type StringOrNumberXML = string | number | XmlElementNode | undefined

export const importStringOrNumberFromXML = (
  _context: ConfigurationContextFromXML,
  _rule: PropertyRule | undefined,
  value: StringOrNumberXML
): StringOrNumber | undefined => {
  if (value === undefined) return undefined

  if (isXmlElementNode(value)) {
    const text = xmlTextValue(value)
    const xsiType = xmlAttributeValue(value, "xsi:type")
    if (text === undefined || text === "") return undefined

    return typeof xsiType === "string" && NUMERIC_XSI_TYPES.has(xsiType) ? Number(text) : String(text)
  }

  return typeof value === "number" ? value : value.toString()
}

export const metadataPropertyRule000 = definePropertyTypeRule("StringOrNumber", "importFromXML", importStringOrNumberFromXML)

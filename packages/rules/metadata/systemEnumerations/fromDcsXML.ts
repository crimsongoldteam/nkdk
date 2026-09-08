import { ConfigurationContextFromXML, isEmptyXmlElement, isXmlElementNode, xmlAttributeValue, xmlElementChildren, xmlTextValue, type XmlElementNode } from "@nkdk/runtime"
import { SystemEnumerationDcsValueRootXML } from "./dcsTypes"
import { SystemEnumerationPropertyRule } from "./types"
import { resolveSystemEnumerationXsiType } from "./toDcsXML"

const textNode = (value: string | { "#text"?: string } | undefined): string => {
  if (value === undefined) {
    throw new Error("DCS SystemEnumeration: expected text value")
  }
  if (typeof value === "string") {
    return value
  }
  const t = value["#text"]
  if (typeof t === "string") {
    return t
  }
  throw new Error("DCS SystemEnumeration: invalid text node")
}

export const importSystemEnumerationFromDcsXML = (
  context: ConfigurationContextFromXML,
  rule: SystemEnumerationPropertyRule,
  xml: SystemEnumerationDcsValueRootXML | XmlElementNode
): string => {
  const root = isXmlElementNode(xml)
    ? xml.name === "dcscor:value" ? xml : xmlElementChildren(xml, "dcscor:value")[0]
    : xml["dcscor:value"]
  return importSystemEnumerationDcsPayload(context, rule, root)
}

export const importSystemEnumerationDcsPayload = (
  _context: ConfigurationContextFromXML,
  rule: SystemEnumerationPropertyRule,
  root: SystemEnumerationDcsValueRootXML["dcscor:value"] | XmlElementNode | undefined,
): string => {
  if (root === undefined) {
    throw new Error("DCS SystemEnumeration: missing dcscor:value")
  }

  const expected = resolveSystemEnumerationXsiType(rule.typeSE)
  if (isXmlElementNode(root)) {
    const actual = xmlAttributeValue(root, "xsi:type")
    if (actual !== undefined && actual !== expected) {
      throw new Error(`DCS SystemEnumeration: expected xsi:type ${expected}, got ${actual}`)
    }
    const text = xmlTextValue(root)
    if (text !== "") return text
    if (isEmptyXmlElement(root)) throw new Error("DCS SystemEnumeration: missing dcscor:value")
    throw new Error("DCS SystemEnumeration: invalid text node")
  }
  if (typeof root === "object" && root !== null && "_xsi:type" in root) {
    const actual = root["_xsi:type"]
    if (actual !== expected) {
      throw new Error(`DCS SystemEnumeration: expected xsi:type ${expected}, got ${String(actual)}`)
    }
  }

  return textNode(root as string | { "#text"?: string })
}

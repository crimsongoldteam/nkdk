import type { PropertyRule } from "@nkdk/runtime/rule-kit"
import { ConfigurationContextFromXML, isXmlElementNode, xmlElementChildren, type XmlElementNode } from "@nkdk/runtime"
import { readDcsText } from "../dcsText"
import { MetadataField } from "../metadataField/types"
import type { TypeLink, TypeLinkDcsValueRootXML } from "./types"

const textNode = (value: unknown): string =>
  readDcsText(value, "DCS TypeLink: expected dcscor:field", "DCS TypeLink: invalid dcscor:field text")

const linkItemNumber = (value: number | string | { "#text"?: string } | XmlElementNode | undefined): number => {
  if (typeof value === "number") {
    return value
  }
  return Number(readDcsText(value, "DCS TypeLink: expected dcscor:linkItem", "DCS TypeLink: invalid dcscor:linkItem"))
}

export const importFromDcsXML = (
  _context: ConfigurationContextFromXML,
  _rule: PropertyRule | undefined,
  xml: TypeLinkDcsValueRootXML | XmlElementNode
): TypeLink => {
  const root = isXmlElementNode(xml)
    ? xml.name === "dcscor:value" ? xml : xmlElementChildren(xml, "dcscor:value")[0]
    : xml["dcscor:value"]
  if (!root) {
    throw new Error("DCS TypeLink: missing dcscor:value")
  }

  const dataPath = textNode(isXmlElementNode(root) ? xmlElementChildren(root, "dcscor:field")[0] : root["dcscor:field"]) as MetadataField
  const linkItem = linkItemNumber(isXmlElementNode(root) ? xmlElementChildren(root, "dcscor:linkItem")[0] : root["dcscor:linkItem"])

  return {
    dataPath,
    linkItem,
  }
}

import type { PropertyRule } from "@nkdk/runtime/rule-kit"
import { definePropertyTypeRule } from "../../ruleRuntime"
import { ConfigurationContext, isEmptyXmlElement, isXmlElementNode, xmlElementChildren, xmlTextValue, type XmlElementNode } from "@nkdk/runtime"
import type { MetadataItemLink, MetadataItemLinks } from "./types"

export function importMetadataItemLinkFromXML(
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: string | XmlElementNode | undefined
): MetadataItemLink | undefined {
  if (data === undefined) return undefined
  if (isXmlElementNode(data)) return xmlTextValue(data) || undefined

  return data
}

export function importMetadataItemLinksFromXML(
  context: ConfigurationContext,
  rule: PropertyRule | undefined,
  data: XmlElementNode | undefined
): MetadataItemLinks | undefined {
  if (!data) return undefined

  const itemTag = rule?.metadataItemLinksXMLItem ?? "xr:Item"
  if (isEmptyXmlElement(data)) return undefined
  for (const name of new Set([itemTag, "xr:Item", "xr:Object"])) {
    const nodes = xmlElementChildren(data, name)
    if (nodes.length === 0 || nodes.length === 1 && isEmptyXmlElement(nodes[0]!)) continue
    return nodes.map(node => isEmptyXmlElement(node) ? "" : importMetadataItemLinkFromXML(context, undefined, node)!)
  }
  return []
}

export const metadataPropertyRule000 = definePropertyTypeRule("MetadataItemLink", "importFromXML", importMetadataItemLinkFromXML)
export const metadataPropertyRule001 = definePropertyTypeRule("MetadataItemLinks", "importFromXML", importMetadataItemLinksFromXML)
export const metadataPropertyRule002 = definePropertyTypeRule("MetadataItemLinks", "xmlImportPropertyBehavior", {
  repeatedXMLNodes: true,
})

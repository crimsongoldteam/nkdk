import type { PropertyRule } from "@nkdk/runtime/rule-kit"
import { definePropertyTypeRule } from "../../ruleRuntime"
import { ConfigurationContext, isEmptyXmlElement, isXmlElementNode, xmlElementChildren, xmlTextValue, type XmlElementNode } from "@nkdk/runtime"
import type { MetadataItemLink, MetadataItemLinks, MetadataItemLinkXML } from "./types"

interface MetadataItemLinksXMLInput {
  "xr:Item"?: MetadataItemLinkXML | MetadataItemLinkXML[]
  "xr:Object"?: MetadataItemLinkXML | MetadataItemLinkXML[]
}

export function importMetadataItemLinkFromXML(
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: MetadataItemLinkXML | XmlElementNode | undefined
): MetadataItemLink | undefined {
  if (data === undefined) return undefined
  if (isXmlElementNode(data)) return xmlTextValue(data) || undefined

  if (typeof data === "string") return data

  return data["#text"]
}

export function importMetadataItemLinksFromXML(
  context: ConfigurationContext,
  rule: PropertyRule | undefined,
  data: MetadataItemLinksXMLInput | XmlElementNode | undefined
): MetadataItemLinks | undefined {
  if (!data) return undefined

  const itemTag = rule?.metadataItemLinksXMLItem ?? "xr:Item"
  if (isXmlElementNode(data)) {
    if (isEmptyXmlElement(data)) return undefined
    for (const name of new Set([itemTag, "xr:Item", "xr:Object"])) {
      const nodes = xmlElementChildren(data, name)
      if (nodes.length === 0 || nodes.length === 1 && isEmptyXmlElement(nodes[0]!)) continue
      return nodes.map(node => isEmptyXmlElement(node) ? "" : importMetadataItemLinkFromXML(context, undefined, node)!)
    }
    return []
  }
  const values = data as Record<string, MetadataItemLinkXML | MetadataItemLinkXML[] | undefined>
  const rawItems = values[itemTag] ?? data["xr:Item"] ?? data["xr:Object"]
  if (rawItems === undefined) return []

  const items = Array.isArray(rawItems) ? rawItems : [rawItems]
  return items.map((value) => (value === undefined ? "" : importMetadataItemLinkFromXML(context, undefined, value)!))
}

export const metadataPropertyRule000 = definePropertyTypeRule("MetadataItemLink", "importFromXML", importMetadataItemLinkFromXML)
export const metadataPropertyRule001 = definePropertyTypeRule("MetadataItemLinks", "importFromXML", importMetadataItemLinksFromXML)
export const metadataPropertyRule002 = definePropertyTypeRule("MetadataItemLinks", "xmlImportPropertyBehavior", {
  repeatedXMLNodes: true,
})

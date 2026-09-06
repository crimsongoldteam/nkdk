import { ConfigurationContext, isEmptyXmlElement, isXmlElementNode, xmlElementChildren, xmlTextValue, type XmlElementNode } from "@nkdk/runtime"
import { PropertyRule, definePropertyTypeRule } from "../../ruleRuntime"
import { CommonAttributeContent, CommonAttributeContentXML } from "./types"

const toArray = <T>(value: T | T[] | undefined): T[] => {
  if (value === undefined) return []
  return Array.isArray(value) ? value : [value]
}

export const importCommonAttributeContentFromXML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  xml: CommonAttributeContentXML | XmlElementNode | undefined
): CommonAttributeContent | undefined => {
  if (!xml) return undefined

  const items = isXmlElementNode(xml) ? xmlElementChildren(xml, "xr:Item") : toArray(xml["xr:Item"])
  if (items.length === 0 || items.length === 1 && isXmlElementNode(items[0]) && isEmptyXmlElement(items[0])) return undefined

  return items.map((item) => {
    if (isXmlElementNode(item)) {
      if (isEmptyXmlElement(item)) throw new Error("CommonAttributeContent: пустое вхождение xr:Item среди повторов")
      return {
        metadata: childText(item, "xr:Metadata")!,
        use: childText(item, "xr:Use") as CommonAttributeContent[number]["use"],
        conditionalSeparation: childText(item, "xr:ConditionalSeparation") ?? "",
      }
    }
    return {
      metadata: item["xr:Metadata"],
      use: item["xr:Use"],
      conditionalSeparation: item["xr:ConditionalSeparation"] ?? "",
    }
  })
}

function childText(node: XmlElementNode, name: string): string | undefined {
  const child = xmlElementChildren(node, name)[0]
  return child === undefined ? undefined : xmlTextValue(child) || undefined
}

export const metadataPropertyRule000 = definePropertyTypeRule("CommonAttributeContent", "importFromXML", importCommonAttributeContentFromXML)

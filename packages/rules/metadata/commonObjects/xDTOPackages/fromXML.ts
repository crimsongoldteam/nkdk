import { definePropertyTypeRule } from "../../ruleRuntime/property/typeRuleRegistry"
import { ImportFromXMLFunction } from "@nkdk/runtime/rule-kit"
import { XDTOPackages, XDTOPackagesXML } from "./types"
import { isEmptyXmlElement, isXmlElementNode, xmlElementChildren, xmlTextValue, type XmlElementNode } from "@nkdk/runtime"

export const importXDTOPackagesFromXML: ImportFromXMLFunction = (_context, _rule, xml: XDTOPackagesXML | XmlElementNode | undefined) => {
  if (isXmlElementNode(xml)) {
    const items = xmlElementChildren(xml, "xr:Item")
    if (items.length === 0 || items.length === 1 && isEmptyXmlElement(items[0]!)) return undefined
    return items.map(item => {
      if (isEmptyXmlElement(item)) throw new Error("XDTOPackages: пустое вхождение xr:Item среди повторов")
      const value = xmlElementChildren(item, "xr:Value")[0]
      if (value === undefined || value.attributes.length === 0 && value.content.every(node => node.type === "text")) return ""
      return xmlTextValue(value)
    })
  }
  if (!xml?.["xr:Item"]) return undefined

  const items = Array.isArray(xml["xr:Item"]) ? xml["xr:Item"] : [xml["xr:Item"]]
  const result = items.map((item) => item["xr:Value"]?.["#text"] ?? "")

  return result.length > 0 ? (result as XDTOPackages) : undefined
}

export const metadataPropertyRule000 = definePropertyTypeRule("XDTOPackages", "importFromXML", importXDTOPackagesFromXML)

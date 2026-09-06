import { ConfigurationContextFromXML, isEmptyXmlElement, isXmlElementNode, xmlElementChildren, type XmlElementNode } from "@nkdk/runtime"
import { PropertyRule, definePropertyTypeRule } from "../../ruleRuntime"
import { importMetadataValueFromXML } from "../metadataValue/fromXML"
import { MobileDeviceCommandBarContent, MobileDeviceCommandBarContentXML } from "./types"

export const importMobileDeviceCommandBarContentFromXML = (
  context: ConfigurationContextFromXML,
  _rule: PropertyRule | undefined,
  xml: MobileDeviceCommandBarContentXML | XmlElementNode | undefined
): MobileDeviceCommandBarContent | undefined => {
  if (!xml) return undefined

  const selected = isXmlElementNode(xml) ? xmlElementChildren(xml, "xr:Item") : xml["xr:Item"]
  if (!selected) return undefined
  const rawItems = Array.isArray(selected) ? selected : [selected]
  if (rawItems.length === 1 && isXmlElementNode(rawItems[0]) && isEmptyXmlElement(rawItems[0])) return undefined
  const items = rawItems
    .map((item) => {
      if (isXmlElementNode(item) && isEmptyXmlElement(item)) throw new Error("MobileDeviceCommandBarContent: пустое вхождение xr:Item среди повторов")
      return importMetadataValueFromXML({ context, rule: { type: "MetadataValue" }, value: isXmlElementNode(item) ? xmlElementChildren(item, "xr:Value")[0] : item["xr:Value"] })
    })
    .filter((item): item is MobileDeviceCommandBarContent[number] => item !== undefined)

  return items.length === 0 ? undefined : items
}

export const metadataPropertyRule000 = definePropertyTypeRule("MobileDeviceCommandBarContent", "importFromXML", importMobileDeviceCommandBarContentFromXML)

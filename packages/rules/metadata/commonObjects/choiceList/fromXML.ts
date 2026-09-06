import type { PropertyRule } from "@nkdk/runtime/rule-kit"
import { definePropertyTypeRule } from "../../ruleRuntime/property/typeRuleRegistry"
import { importFormChoiceListFromXML } from "../metadataValue/fromXML"
import type { ChoiceList, ChoiceListXML } from "./types"
import { ConfigurationContextFromXML, isEmptyXmlElement, isXmlElementNode, xmlElementChildren, type XmlElementNode } from "@nkdk/runtime"

export const importChoiceListFromXML = (
  context: ConfigurationContextFromXML,
  _rule: PropertyRule | undefined,
  xml: ChoiceListXML | XmlElementNode | undefined
): ChoiceList | undefined => {
  if (!xml) return undefined

  const xrItem = isXmlElementNode(xml) ? xmlElementChildren(xml, "xr:Item") : xml["xr:Item"]
  if (!xrItem) return undefined

  const items = Array.isArray(xrItem) ? xrItem : [xrItem]
  if (items.length === 0 || items.length === 1 && isXmlElementNode(items[0]) && isEmptyXmlElement(items[0])) return undefined

  const result = items.map((item) => {
    if (isXmlElementNode(item) && isEmptyXmlElement(item)) throw new Error("ChoiceList: пустое вхождение xr:Item среди повторов")
    return importFormChoiceListFromXML(context, isXmlElementNode(item) ? xmlElementChildren(item, "xr:Value")[0] : item["xr:Value"])!
  })

  return result
}

export const metadataPropertyRule000 = definePropertyTypeRule("ChoiceList", "importFromXML", importChoiceListFromXML)

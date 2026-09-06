import type { PropertyRule } from "@nkdk/runtime/rule-kit"
import { definePropertyTypeRule } from "../../ruleRuntime/property/typeRuleRegistry"
import { ConfigurationContext, isEmptyXmlElement, isXmlElementNode, xmlAttributeValue, xmlElementChildren, type XmlElementNode } from "@nkdk/runtime"
import { importBooleanFromXML } from "../boolean/fromXML"
import type { UserVisible, UserVisibleXML } from "./types"

export const importUserVisibleFromXML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  xml: UserVisibleXML | XmlElementNode | undefined
): UserVisible | undefined => {
  if (!xml) return undefined
  if (isXmlElementNode(xml) && isEmptyXmlElement(xml)) return undefined

  const result: UserVisible = {
    common: false,
    values: [],
  }

  const commonXML = isXmlElementNode(xml) ? xmlElementChildren(xml, "xr:Common")[0] : xml["xr:Common"]
  if (commonXML !== undefined) {
    const common = importBooleanFromXML(_context, undefined, commonXML)
    if (common !== undefined) {
      result.common = common
    }
  }

  const valuesXML = isXmlElementNode(xml) ? xmlElementChildren(xml, "xr:Value") : xml["xr:Value"]
  if (valuesXML !== undefined) {
    const xrValues = Array.isArray(valuesXML) ? valuesXML : [valuesXML]
    for (const item of xrValues) {
      if (isXmlElementNode(item) && item.attributes.length === 0 && item.content.every(node => node.type === "text")) {
        if (xrValues.length > 1 && isEmptyXmlElement(item)) throw new Error("UserVisible: пустое вхождение xr:Value среди повторов")
        continue
      }
      const value = importBooleanFromXML(_context, undefined, isXmlElementNode(item) ? item : item["#text"])
      if (value === undefined) continue
      result.values.push({
        name: isXmlElementNode(item) ? xmlAttributeValue(item, "name")! : item["_name"],
        value,
      })
    }
  }
  return result
}

export const metadataPropertyRule000 = definePropertyTypeRule("UserVisible", "importFromXML", importUserVisibleFromXML)

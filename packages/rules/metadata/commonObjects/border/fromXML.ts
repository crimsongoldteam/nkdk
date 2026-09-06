import type { PropertyRule } from "@nkdk/runtime/rule-kit"
import { definePropertyTypeRule } from "../../ruleRuntime/property/typeRuleRegistry"
import type { ControlBorderType } from "../../systemEnumerations/types"
import { ConfigurationContext, isEmptyXmlElement, isXmlElementNode, xmlAttributeValue, xmlElementChildren, xmlTextValue, type XmlElementNode } from "@nkdk/runtime"
import type { Border, BorderXML } from "./types"

export const importBorderFromXML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  xml: BorderXML | { Border: BorderXML } | XmlElementNode | undefined
): Border | undefined => {
  if (!xml) return undefined

  const node = isXmlElementNode(xml) ? xmlElementChildren(xml, "Border")[0] ?? xml : "Border" in xml ? xml.Border : xml
  if (isXmlElementNode(node) && isEmptyXmlElement(node)) return undefined

  const style = isXmlElementNode(node) ? xmlElementChildren(node, "v8ui:style")[0] : node["v8ui:style"]
  const controlBorderType: ControlBorderType | undefined =
    isXmlElementNode(style) ? (xmlTextValue(style) || undefined) as ControlBorderType | undefined : typeof style === "string"
      ? (style as ControlBorderType)
      : style && typeof style === "object"
        ? (style["#text"] as ControlBorderType | undefined)
        : undefined

  const result: Border = {}

  const ref = isXmlElementNode(node) ? xmlAttributeValue(node, "ref") : node._ref
  const width = isXmlElementNode(node) ? xmlAttributeValue(node, "width") : node._width
  if (ref !== undefined) {
    result.ref = ref.startsWith("style:") ? ref.slice("style:".length) : ref
  }
  if (width !== undefined) {
    result.width = Number(width)
  }
  if (controlBorderType !== undefined) {
    result.controlBorderType = controlBorderType
  }

  return result
}

export const metadataPropertyRule000 = definePropertyTypeRule("Border", "importFromXML", importBorderFromXML)

import type { PropertyRule } from "@nkdk/runtime/rule-kit"
import { definePropertyTypeRule } from "../../ruleRuntime/property/typeRuleRegistry"
import type { ControlBorderType } from "../../systemEnumerations/types"
import { ConfigurationContext, isEmptyXmlElement, xmlAttributeValue, xmlElementChildren, xmlTextValue, type XmlElementNode } from "@nkdk/runtime"
import type { Border } from "./types"

export const importBorderFromXML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  xml: XmlElementNode | undefined
): Border | undefined => {
  if (!xml) return undefined

  const node = xmlElementChildren(xml, "Border")[0] ?? xml
  if (isEmptyXmlElement(node)) return undefined

  const style = xmlElementChildren(node, "v8ui:style")[0]
  const controlBorderType = style === undefined ? undefined : (xmlTextValue(style) || undefined) as ControlBorderType | undefined

  const result: Border = {}

  const ref = xmlAttributeValue(node, "ref")
  const width = xmlAttributeValue(node, "width")
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

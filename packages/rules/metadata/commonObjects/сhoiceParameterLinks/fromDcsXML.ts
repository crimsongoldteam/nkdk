import type { PropertyRule } from "@nkdk/runtime/rule-kit"
import * as SE from "../../systemEnumerations/types"
import { claimCanonicalXmlImportAttribute, ConfigurationContextFromXML, isXmlElementNode, xmlElementChildren, xmlTextValue, type XmlElementNode } from "@nkdk/runtime"
import { readDcsText } from "../dcsText"
import {
  ChoiceParameterLink,
  ChoiceParameterLinkDcsItemXML,
  ChoiceParameterLinkDcsValueRootXML,
  ChoiceParameterLinks,
} from "./types"

const textNode = (value: unknown): string =>
  readDcsText(value, "DCS ChoiceParameterLink: expected text value", "DCS ChoiceParameterLink: invalid text node")

const optionalMode = (mode: ChoiceParameterLinkDcsItemXML["dcscor:mode"] | XmlElementNode): SE.LinkedValueChangeMode | undefined => {
  if (mode === undefined) {
    return undefined
  }
  if (typeof mode === "string") {
    return mode as SE.LinkedValueChangeMode
  }
  if (isXmlElementNode(mode)) {
    return mode.content.some(node => node.type === "text") || mode.content.length === 0 && mode.attributes.length === 0
      ? xmlTextValue(mode) as SE.LinkedValueChangeMode : undefined
  }
  claimCanonicalXmlImportAttribute({
    value: mode,
    name: "xsi:type",
    expectedValue: "ent:LinkedValueChangeMode",
  })
  return mode["#text"] as SE.LinkedValueChangeMode | undefined
}

const importChoiceParameterLinkDcsItem = (item: ChoiceParameterLinkDcsItemXML | XmlElementNode): ChoiceParameterLink => ({
  name: textNode(isXmlElementNode(item) ? xmlElementChildren(item, "dcscor:choiceParameter")[0] : item["dcscor:choiceParameter"]),
  dataPath: textNode(isXmlElementNode(item) ? xmlElementChildren(item, "dcscor:value")[0] : item["dcscor:value"]),
  valueChange: optionalMode(isXmlElementNode(item) ? xmlElementChildren(item, "dcscor:mode")[0] : item["dcscor:mode"]),
})

export const importChoiceParameterLinksFromDcsXML = (
  context: ConfigurationContextFromXML,
  rule: PropertyRule | undefined,
  xml: ChoiceParameterLinkDcsValueRootXML | XmlElementNode
): ChoiceParameterLinks => {
  const root = isXmlElementNode(xml)
    ? xml.name === "dcscor:value" ? xml : xmlElementChildren(xml, "dcscor:value")[0]
    : xml["dcscor:value"]
  return importChoiceParameterLinksDcsPayload(context, rule, root)
}

export const importChoiceParameterLinksDcsPayload = (
  _context: ConfigurationContextFromXML,
  _rule: PropertyRule | undefined,
  root: ChoiceParameterLinkDcsValueRootXML["dcscor:value"] | XmlElementNode | undefined,
): ChoiceParameterLinks => {
  if (!root) {
    throw new Error("DCS ChoiceParameterLinks: missing dcscor:value")
  }

  const rawItem = isXmlElementNode(root) ? xmlElementChildren(root, "dcscor:item") : root["dcscor:item"]
  const items: (ChoiceParameterLinkDcsItemXML | XmlElementNode)[] = Array.isArray(rawItem) ? rawItem : rawItem ? [rawItem] : []

  if (items.length === 0) {
    throw new Error("DCS ChoiceParameterLinks: missing dcscor:item")
  }

  return items.map(importChoiceParameterLinkDcsItem)
}

export const importChoiceParameterLinkFromDcsXML = (
  context: ConfigurationContextFromXML,
  rule: PropertyRule | undefined,
  xml: ChoiceParameterLinkDcsValueRootXML | XmlElementNode
): ChoiceParameterLink => {
  return importChoiceParameterLinksFromDcsXML(context, rule, xml)[0]
}

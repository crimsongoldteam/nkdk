import type { PropertyRule } from "~/metadata/orchestration/property/types"
import * as SE from "~/metadata/systemEnumerations/types"
import { ConfigurationContextFromXML } from "../../context/types"
import {
  ChoiceParameterLink,
  ChoiceParameterLinkDcsItemXML,
  ChoiceParameterLinkDcsValueRootXML,
  ChoiceParameterLinks,
} from "./types"

const textNode = (value: string | { "#text"?: string } | undefined): string => {
  if (value === undefined) {
    throw new Error("DCS ChoiceParameterLink: expected text value")
  }
  if (typeof value === "string") {
    return value
  }
  const t = value["#text"]
  if (typeof t === "string") {
    return t
  }
  throw new Error("DCS ChoiceParameterLink: invalid text node")
}

const optionalMode = (
  mode: ChoiceParameterLinkDcsItemXML["dcscor:mode"]
): SE.LinkedValueChangeMode | undefined => {
  if (mode === undefined) {
    return undefined
  }
  if (typeof mode === "string") {
    return mode as SE.LinkedValueChangeMode
  }
  return mode["#text"] as SE.LinkedValueChangeMode | undefined
}

const importChoiceParameterLinkDcsItem = (item: ChoiceParameterLinkDcsItemXML): ChoiceParameterLink => ({
  name: textNode(item["dcscor:choiceParameter"]),
  dataPath: textNode(item["dcscor:value"]),
  valueChange: optionalMode(item["dcscor:mode"]),
})

export const importChoiceParameterLinksFromDcsXML = (
  _context: ConfigurationContextFromXML,
  _rule: PropertyRule | undefined,
  xml: ChoiceParameterLinkDcsValueRootXML
): ChoiceParameterLinks => {
  const root = xml["dcscor:value"]
  if (!root) {
    throw new Error("DCS ChoiceParameterLinks: missing dcscor:value")
  }

  const rawItem = root["dcscor:item"]
  const items: ChoiceParameterLinkDcsItemXML[] = Array.isArray(rawItem) ? rawItem : rawItem ? [rawItem] : []

  if (items.length === 0) {
    throw new Error("DCS ChoiceParameterLinks: missing dcscor:item")
  }

  return items.map(importChoiceParameterLinkDcsItem)
}

export const importChoiceParameterLinkFromDcsXML = (
  context: ConfigurationContextFromXML,
  rule: PropertyRule | undefined,
  xml: ChoiceParameterLinkDcsValueRootXML
): ChoiceParameterLink => {
  return importChoiceParameterLinksFromDcsXML(context, rule, xml)[0]
}

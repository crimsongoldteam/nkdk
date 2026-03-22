import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import * as SE from "~/metadata/systemEnumerations/types"
import { ConfigurationContextFromXML } from "../../context/types"
import {
  ChoiceParameterLink,
  ChoiceParameterLinkDcsItemXML,
  ChoiceParameterLinkDcsValueRootXML,
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

export const importFromDcsXML = (
  _context: ConfigurationContextFromXML,
  _rule: PropertyRule | undefined,
  xml: ChoiceParameterLinkDcsValueRootXML
): ChoiceParameterLink => {
  const root = xml["dcscor:value"]
  if (!root) {
    throw new Error("DCS ChoiceParameterLink: missing dcscor:value")
  }

  const rawItem = root["dcscor:item"]
  const item: ChoiceParameterLinkDcsItemXML | undefined = Array.isArray(rawItem) ? rawItem[0] : rawItem

  if (!item) {
    throw new Error("DCS ChoiceParameterLink: missing dcscor:item")
  }

  const name = textNode(item["dcscor:choiceParameter"])
  const dataPath = textNode(item["dcscor:value"])

  return {
    name,
    dataPath,
    valueChange: optionalMode(item["dcscor:mode"]),
  }
}

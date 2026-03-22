import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { ConfigurationContextFromXML } from "../../context/types"
import { importMetadataValueFromXML } from "../metadataValue/fromXML"
import {
  ChoiceParameter,
  ChoiceParameterDcsItemXML,
  ChoiceParameterDcsValueRootXML,
} from "./types"

const textNode = (value: string | { "#text"?: string } | undefined): string => {
  if (value === undefined) {
    throw new Error("DCS ChoiceParameter: expected dcscor:choiceParameter")
  }
  if (typeof value === "string") {
    return value
  }
  const t = value["#text"]
  if (typeof t === "string") {
    return t
  }
  throw new Error("DCS ChoiceParameter: invalid choiceParameter text")
}

export const importChoiceParameterFromDcsXML = (
  context: ConfigurationContextFromXML,
  _rule: PropertyRule | undefined,
  xml: ChoiceParameterDcsValueRootXML
): ChoiceParameter => {
  const root = xml["dcscor:value"]
  if (!root) {
    throw new Error("DCS ChoiceParameter: missing dcscor:value")
  }

  const rawItem = root["dcscor:item"]
  const item: ChoiceParameterDcsItemXML | undefined = Array.isArray(rawItem) ? rawItem[0] : rawItem

  if (!item) {
    throw new Error("DCS ChoiceParameter: missing dcscor:item")
  }

  const name = textNode(item["dcscor:choiceParameter"])
  const valueXml = item["dcscor:value"]

  const value =
    valueXml !== undefined
      ? importMetadataValueFromXML({
          context,
          rule: { type: "MetadataValue", withType: true },
          value: valueXml,
        })
      : undefined

  return {
    name,
    value,
  }
}

import type { PropertyRule } from "@nkdk/runtime/rule-kit"
import { ConfigurationContextFromXML, isXmlElementNode, xmlElementChildren, type XmlElementNode } from "@nkdk/runtime"
import { readDcsText } from "../dcsText"
import { importMetadataValueFromXML } from "../metadataValue/fromXML"
import { ChoiceParameter, ChoiceParameterDcsItemXML, ChoiceParameterDcsValueRootXML } from "./types"

const textNode = (value: unknown): string =>
  readDcsText(value, "DCS ChoiceParameter: expected dcscor:choiceParameter", "DCS ChoiceParameter: invalid choiceParameter text")

export const importChoiceParameterFromDcsXML = (
  context: ConfigurationContextFromXML,
  rule: PropertyRule | undefined,
  xml: ChoiceParameterDcsValueRootXML | XmlElementNode
): ChoiceParameter => {
  const root = isXmlElementNode(xml)
    ? xml.name === "dcscor:value" ? xml : xmlElementChildren(xml, "dcscor:value")[0]
    : xml["dcscor:value"]
  return importChoiceParameterDcsPayload(context, rule, root)
}

export const importChoiceParameterDcsPayload = (
  context: ConfigurationContextFromXML,
  _rule: PropertyRule | undefined,
  root: ChoiceParameterDcsValueRootXML["dcscor:value"] | XmlElementNode | undefined,
): ChoiceParameter => {
  if (!root) {
    throw new Error("DCS ChoiceParameter: missing dcscor:value")
  }

  const rawItem = isXmlElementNode(root) ? xmlElementChildren(root, "dcscor:item") : root["dcscor:item"]
  const item: ChoiceParameterDcsItemXML | XmlElementNode | undefined = Array.isArray(rawItem) ? rawItem[0] : rawItem

  if (!item) {
    throw new Error("DCS ChoiceParameter: missing dcscor:item")
  }

  const name = textNode(isXmlElementNode(item) ? xmlElementChildren(item, "dcscor:choiceParameter")[0] : item["dcscor:choiceParameter"])
  const valueXml = isXmlElementNode(item) ? xmlElementChildren(item, "dcscor:value")[0] : item["dcscor:value"]

  const value =
    valueXml !== undefined
      ? importMetadataValueFromXML({
          context,
          rule: {
            type: "MetadataValue",
            valueType: ["string", "decimal", "boolean", "ref", "objectRef", "fixedArray", "formChoiceListDesTimeValue"],
          },
          value: valueXml,
        })
      : undefined

  return {
    name,
    value,
  }
}

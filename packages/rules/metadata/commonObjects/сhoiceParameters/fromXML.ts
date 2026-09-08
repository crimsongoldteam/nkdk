import { ConfigurationContextFromXML, isEmptyXmlElement, isXmlElementNode, xmlAttributeValue, xmlElementChildren, type XmlElementNode } from "@nkdk/runtime"
import type { PropertyRule } from "@nkdk/runtime/rule-kit"
import { definePropertyTypeRule } from "../../ruleRuntime/property/typeRuleRegistry"
import { importMetadataValueFromXML } from "../metadataValue/fromXML"
import type { ChoiceParameter, ChoiceParameters, ChoiceParametersXML, ChoiceParameterXML } from "./types"

export const importChoiceParametersFromXML = (
  context: ConfigurationContextFromXML,
  _rule: PropertyRule | undefined,
  xml: ChoiceParametersXML | XmlElementNode | undefined
): ChoiceParameters | undefined => {
  if (!xml) return undefined

  if (isXmlElementNode(xml) && isEmptyXmlElement(xml)) return undefined
  const appItems = isXmlElementNode(xml) ? xmlElementChildren(xml, "app:item") : xml["app:item"]

  const items = Array.isArray(appItems) ? appItems : [appItems]
  if (items.length === 0 || items[0] === undefined) throw new Error("Invalid ChoiceParameters structure: missing app:item")

  return items.map((item) => importChoiceParameterFromXML(context, undefined, item)!)
}

const importChoiceParameterFromXML = (
  context: ConfigurationContextFromXML,
  _rule: PropertyRule | undefined,
  xml: ChoiceParameterXML | XmlElementNode
): ChoiceParameter => {
  const value = importMetadataValueFromXML({
    context,
    rule: {
      type: "MetadataValue",
      valueType: [
        "string",
        "decimal",
        "dateTime",
        "boolean",
        "ref",
        "objectRef",
        "fixedArray",
        "formChoiceListDesTimeValue",
      ],
    },
    value: isXmlElementNode(xml) ? xmlElementChildren(xml, "app:value")[0] : xml["app:value"],
  })

  const result: ChoiceParameter = {
    name: isXmlElementNode(xml) ? xmlAttributeValue(xml, "name") as string : xml._name,
  }

  if (value !== undefined) result.value = value

  return result
}

export const metadataPropertyRule000 = definePropertyTypeRule("ChoiceParameters", "importFromXML", importChoiceParametersFromXML)

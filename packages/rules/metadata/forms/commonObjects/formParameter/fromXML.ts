import { importBooleanFromXML } from "../../../commonObjects/boolean/fromXML"
import { importTypeDescriptionFromXML } from "../../../commonObjects/typeDescription/fromXML"
import { ConfigurationContextFromXML, isXmlElementNode, xmlAttributeValue, xmlElementChildren, type XmlElementNode } from "@nkdk/runtime"
import { PropertyRule } from "../../elements/calendarField/rules"
import { definePropertyTypeRule } from "../../../ruleRuntime/property/propertyRuleRegistrySet"
import { FormParameter, FormParameters, FormParametersXML, FormParameterXML } from "./types"

export const importFormParametersFromXML = (
  context: ConfigurationContextFromXML,
  _rule: PropertyRule | undefined,
  xml: { Parameter: FormParametersXML } | XmlElementNode | undefined
): FormParameters | undefined => {
  if (xml === undefined) {
    return undefined
  }

  const items = isXmlElementNode(xml) ? xmlElementChildren(xml, "Parameter")
    : Array.isArray(xml.Parameter) ? xml.Parameter : [xml.Parameter]
  return items.map((item) => importFormParameterFromXML({ context, xml: item }))
}

const importFormParameterFromXML = (params: {
  context: ConfigurationContextFromXML
  xml: FormParameterXML | XmlElementNode
}): FormParameter => {
  const { context, xml } = params
  const result: FormParameter = {
    name: isXmlElementNode(xml) ? xmlAttributeValue(xml, "name")! : xml._name,
  }

  const type = importTypeDescriptionFromXML(context, undefined, isXmlElementNode(xml) ? xmlElementChildren(xml, "Type")[0] : xml.Type)
  if (type !== undefined) {
    result.type = type
  }

  const keyParameterXML = isXmlElementNode(xml) ? xmlElementChildren(xml, "KeyParameter")[0] : xml.KeyParameter
  if (keyParameterXML !== undefined) {
    const keyParameter = importBooleanFromXML(context, undefined, keyParameterXML)
    if (keyParameter !== undefined) {
      result.keyParameter = keyParameter
    }
  }

  return result
}

export const metadataPropertyRule000 = definePropertyTypeRule("FormParameters", "importFromXML", importFormParametersFromXML)

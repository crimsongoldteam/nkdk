import { importBooleanFromXML } from "../../../commonObjects/boolean/fromXML"
import { importTypeDescriptionFromXML } from "../../../commonObjects/typeDescription/fromXML"
import { ConfigurationContextFromXML, xmlAttributeValue, xmlElementChildren, type XmlElementNode } from "@nkdk/runtime"
import { PropertyRule } from "../../elements/calendarField/rules"
import { definePropertyTypeRule } from "../../../ruleRuntime/property/propertyRuleRegistrySet"
import { FormParameter, FormParameters } from "./types"

export const importFormParametersFromXML = (
  context: ConfigurationContextFromXML,
  _rule: PropertyRule | undefined,
  xml: XmlElementNode | undefined
): FormParameters | undefined => {
  if (xml === undefined) {
    return undefined
  }

  const items = xmlElementChildren(xml, "Parameter")
  return items.map((item) => importFormParameterFromXML({ context, xml: item }))
}

const importFormParameterFromXML = (params: {
  context: ConfigurationContextFromXML
  xml: XmlElementNode
}): FormParameter => {
  const { context, xml } = params
  const result: FormParameter = {
    name: xmlAttributeValue(xml, "name")!,
  }

  const type = importTypeDescriptionFromXML(context, undefined, xmlElementChildren(xml, "Type")[0])
  if (type !== undefined) {
    result.type = type
  }

  const keyParameterXML = xmlElementChildren(xml, "KeyParameter")[0]
  if (keyParameterXML !== undefined) {
    const keyParameter = importBooleanFromXML(context, undefined, keyParameterXML)
    if (keyParameter !== undefined) {
      result.keyParameter = keyParameter
    }
  }

  return result
}

export const metadataPropertyRule000 = definePropertyTypeRule("FormParameters", "importFromXML", importFormParametersFromXML)

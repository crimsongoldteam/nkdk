import type { PropertyRule } from "@nkdk/runtime/rule-kit"
import { definePropertyTypeRule } from "../../ruleRuntime/property/typeRuleRegistry"
import { ConfigurationContextFromXML, isEmptyXmlElement, isXmlElementNode, xmlElementChildren, xmlTextValue, type XmlElementNode } from "@nkdk/runtime"
import { importMetadataSimpleValueFromXML } from "../metadataValue/fromXML"
import { MetadataPrimitiveValueXML } from "../metadataValue/types"
import type { ChoiceParameterLinks, ChoiceParameterLinksXML } from "./types"

export const importChoiceParameterLinksFromXML = (
  context: ConfigurationContextFromXML,
  _rule: PropertyRule | undefined,
  xml: ChoiceParameterLinksXML | XmlElementNode | undefined
): ChoiceParameterLinks | undefined => {
  if (!xml) return undefined

  if (Array.isArray(xml) && xml.length === 0) return undefined

  if (isXmlElementNode(xml) && isEmptyXmlElement(xml)) return undefined
  const links = isXmlElementNode(xml) ? xmlElementChildren(xml, "xr:Link") : xml["xr:Link"]

  const items = Array.isArray(links) ? links : [links]

  if (items.length === 0 || items[0] === undefined) throw new Error("Invalid ChoiceParameterLinks structure: missing xr:Link")

  return items.map((item) => {
    if (isXmlElementNode(item)) {
      const name = xmlElementChildren(item, "xr:Name")[0]
      const change = xmlElementChildren(item, "xr:ValueChange")[0]
      return {
        name: (name === undefined ? undefined : xmlTextValue(name) || undefined) as string,
        dataPath: extractDataPath(context, xmlElementChildren(item, "xr:DataPath")[0])!,
        valueChange: change === undefined ? undefined : (xmlTextValue(change) || undefined) as ChoiceParameterLinks[number]["valueChange"],
      }
    }
    return {
      name: item["xr:Name"],
      dataPath: extractDataPath(context, item["xr:DataPath"])!,
      valueChange: item["xr:ValueChange"],
    }
  })
}

const extractDataPath = (
  context: ConfigurationContextFromXML,
  dataPath: MetadataPrimitiveValueXML | string | XmlElementNode | undefined
): string | undefined => {
  if (!dataPath) return undefined
  if (typeof dataPath === "string") return dataPath
  if (isXmlElementNode(dataPath) && dataPath.attributes.length === 0 && dataPath.content.every(node => node.type === "text")) {
    return xmlTextValue(dataPath) || undefined
  }

  return importMetadataSimpleValueFromXML(context, undefined, dataPath) as string | undefined
}

export const metadataPropertyRule000 = definePropertyTypeRule("ChoiceParameterLinks", "importFromXML", importChoiceParameterLinksFromXML)

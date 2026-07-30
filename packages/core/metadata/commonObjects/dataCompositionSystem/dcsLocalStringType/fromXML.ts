import { importI8nTextFromXML } from "../../i8nText/fromXML"
import { I8nText, I8nTextXML } from "../../i8nText/types"
import { ConfigurationContextFromXML } from "../../../context/types"
import { PropertyRule, registerTypeRule } from "../../../orchestration"
import {
  getConfigurationIndexCollectionContext,
  getConfigurationIndexPropertyValueLogicalAddress,
} from "../../../configurationIndex/collector/context"
import { DcsLocalStringTypeXML } from "./types"

const extractStringValue = (xml: DcsLocalStringTypeXML): string | undefined => {
  if (typeof xml === "string") return xml
  if (xml !== undefined && xml !== null && typeof xml === "object" && xml["_xsi:type"] === "xs:string") {
    const text = xml["#text"]
    return text !== undefined ? String(text) : ""
  }
  return undefined
}

export const importDcsLocalStringTypeFromXML = (
  context: ConfigurationContextFromXML,
  _rule: PropertyRule | undefined,
  xml: DcsLocalStringTypeXML
): I8nText | string | undefined => {
  if (xml === undefined) return undefined

  const stringValue = extractStringValue(xml)
  if (stringValue !== undefined) {
    if (context.fromXML.forReference) return stringValue
    return { items: { [context.defaultLanguage]: stringValue } }
  }

  if (typeof xml !== "object" || xml === null) return undefined
  return importI8nTextFromXML(context, { type: "I8nText" } as any, xml as I8nTextXML)
}

registerTypeRule("DcsLocalStringType", "importFromXML", importDcsLocalStringTypeFromXML as any)
registerTypeRule("DcsLocalStringType", "collectConfigurationIndexFromXML", ({ context, xml, propertyKey }) => {
  const collection = getConfigurationIndexCollectionContext(context)
  if (
    collection === undefined ||
    typeof xml !== "object" ||
    xml === null ||
    !("_xsi:type" in xml) ||
    xml["_xsi:type"] !== "xs:string"
  ) {
    return
  }
  collection.collector.setXmlValue(
    getConfigurationIndexPropertyValueLogicalAddress(collection, propertyKey),
    "xsiType",
    "xs:string"
  )
})

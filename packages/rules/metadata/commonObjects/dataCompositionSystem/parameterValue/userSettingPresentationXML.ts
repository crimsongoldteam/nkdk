import { importI8nTextFromXML } from "../../i8nText/fromXML"
import { exportI8nTextToXML } from "../../i8nText/toXML"
import type { I8nText, I8nTextXML } from "../../i8nText/types"
import type { ConfigurationContext, ConfigurationContextFromXML } from "@nkdk/runtime"
import { isEmptyXmlElement, isXmlElementNode, xmlAttributeValue, xmlTextValue, type XmlElementNode } from "@nkdk/runtime"
import type { UserSettingPresentationShortXML } from "./types"

const isShortForm = (xml: unknown): xml is UserSettingPresentationShortXML =>
  typeof xml === "object" &&
  xml !== null &&
  !Array.isArray(xml) &&
  (xml as Record<string, unknown>)["_xsi:type"] === "xs:string"

const getSingleLanguageText = (items: I8nText["items"]): string | undefined => {
  const entries = Object.entries(items)
  if (entries.length !== 1) return undefined
  return entries[0]?.[1]
}

export const importUserSettingPresentationFromXML = (
  context: ConfigurationContextFromXML,
  xml: I8nTextXML | UserSettingPresentationShortXML | XmlElementNode | string | undefined
): I8nText | undefined => {
  if (xml === undefined) return undefined
  if (isXmlElementNode(xml) && isEmptyXmlElement(xml)) return undefined

  if (isXmlElementNode(xml) && (xmlAttributeValue(xml, "xsi:type") === "xs:string"
    || xml.attributes.length === 0 && xml.content.every(node => node.type === "text"))) {
    return importShortPresentation(context, xmlTextValue(xml))
  }
  if (typeof xml === "string" || isShortForm(xml)) {
    const text = typeof xml === "string" ? xml : String(xml["#text"] ?? "")
    return importShortPresentation(context, text)
  }

  return importI8nTextFromXML(context, { type: "I8nText" }, xml)
}

function importShortPresentation(context: ConfigurationContextFromXML, text: string): I8nText {
  return { items: { [context.languages.default]: text } }
}

export const exportUserSettingPresentationToXML = (params: {
  context: ConfigurationContext
  data: I8nText | undefined
}): I8nTextXML | UserSettingPresentationShortXML | undefined => {
  const { context, data } = params
  if (data === undefined) return undefined

  const singleLanguageText = getSingleLanguageText(data.items)
  if (singleLanguageText !== undefined) {
    return { "_xsi:type": "xs:string", "#text": singleLanguageText }
  }

  const xml = exportI8nTextToXML(context, { type: "I8nText" }, data)
  if (Array.isArray(xml?.["v8:item"]) && xml["v8:item"].length === 1) {
    return { ...xml, "v8:item": xml["v8:item"][0] }
  }
  return xml
}

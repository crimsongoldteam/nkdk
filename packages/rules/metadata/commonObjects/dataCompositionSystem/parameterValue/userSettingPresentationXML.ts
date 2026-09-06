import { importI8nTextFromXML } from "../../i8nText/fromXML"
import { exportI8nTextToXML } from "../../i8nText/toXML"
import type { I8nText, I8nTextXML } from "../../i8nText/types"
import type { ConfigurationContext, ConfigurationContextFromXML } from "@nkdk/runtime"
import { isXmlElementNode, xmlAttributeValue, xmlTextValue, type XmlElementNode } from "@nkdk/runtime"
import type { UserSettingPresentationShortXML } from "./types"

const shortFormMarker = Symbol("userSettingPresentationXML.shortForm")
const shortFormOriginalText = Symbol("userSettingPresentationXML.originalText")

type UserSettingPresentationReference = I8nText & {
  [shortFormMarker]?: "xs:string"
  [shortFormOriginalText]?: string
}

const isShortForm = (xml: unknown): xml is UserSettingPresentationShortXML =>
  typeof xml === "object" &&
  xml !== null &&
  !Array.isArray(xml) &&
  (xml as Record<string, unknown>)["_xsi:type"] === "xs:string"

const markShortFormReference = (value: I8nText, originalText: string): I8nText => {
  Object.defineProperties(value, {
    [shortFormMarker]: { value: "xs:string" },
    [shortFormOriginalText]: { value: originalText },
  })
  return value
}

const itemsEqual = (left: I8nText["items"], right: I8nText["items"]): boolean => {
  const leftEntries = Object.entries(left)
  const rightEntries = Object.entries(right)
  return leftEntries.length === rightEntries.length && leftEntries.every(([lang, text]) => right[lang] === text)
}

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
  if (isXmlElementNode(xml) && xml.attributes.length === 0 && !xml.content.some(node => node.type === "element") && xmlTextValue(xml) === "") return undefined

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
  const result: I8nText = { items: { [context.languages.default]: text } }
  return context.fromXML.forReference ? markShortFormReference(result, text) : result
}

export const exportUserSettingPresentationToXML = (params: {
  context: ConfigurationContext
  data: I8nText | undefined
  referenceData?: I8nText | undefined
}): I8nTextXML | UserSettingPresentationShortXML | undefined => {
  const { context, data, referenceData } = params
  if (data === undefined) return undefined

  const reference = referenceData as UserSettingPresentationReference | undefined
  if (reference?.[shortFormMarker] === "xs:string" && itemsEqual(data.items, reference.items)) {
    return { "_xsi:type": "xs:string", "#text": reference[shortFormOriginalText] ?? "" }
  }

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

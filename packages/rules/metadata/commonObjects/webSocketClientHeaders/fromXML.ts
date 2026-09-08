import { definePropertyTypeRule } from "../../ruleRuntime/property/typeRuleRegistry"
import type { ImportFromXMLFunction } from "@nkdk/runtime/rule-kit"
import type { WebSocketClientHeaders, WebSocketClientHeadersXML } from "./types"
import { isEmptyXmlElement, isXmlElementNode, xmlElementChildren, xmlTextValue, type XmlElementNode } from "@nkdk/runtime"

export const importWebSocketClientHeadersFromXML: ImportFromXMLFunction = (
  _context,
  _rule,
  xml: WebSocketClientHeadersXML | XmlElementNode | undefined
): WebSocketClientHeaders | undefined => {
  if (!xml) return undefined
  if (isXmlElementNode(xml)) {
    if (isEmptyXmlElement(xml)) return undefined
    const items = xmlElementChildren(xml, "xr:Item")
    if (items.length === 1 && isEmptyXmlElement(items[0]!)) return []
    return items.map(item => {
      const pair = xmlElementChildren(item, "xr:Value")[0]
      const key = pair === undefined ? undefined : xmlElementChildren(pair, "v8:Key")[0]
      const value = pair === undefined ? undefined : xmlElementChildren(pair, "v8:Value")[0]
      if (key === undefined || value === undefined || isEmptyXmlElement(key) || isEmptyXmlElement(value)) {
        throw new Error("WebSocketClientHeaders: отсутствует ключ или значение заголовка")
      }
      return { Ключ: xmlTextValue(key), Значение: xmlTextValue(value) }
    })
  }
  if (!xml["xr:Item"]) return []

  const items = Array.isArray(xml["xr:Item"]) ? xml["xr:Item"] : [xml["xr:Item"]]

  return items.map((item) => ({
    Ключ: item["xr:Value"]["v8:Key"]["#text"] ?? "",
    Значение: item["xr:Value"]["v8:Value"]["#text"] ?? "",
  }))
}

export const metadataPropertyRule000 = definePropertyTypeRule("WebSocketClientHeaders", "importFromXML", importWebSocketClientHeadersFromXML)

import { definePropertyTypeRule } from "../../ruleRuntime/property/typeRuleRegistry"
import type { ImportFromXMLFunction } from "../../ruleRuntime/property/fn"
import type { WebSocketClientHeaders, WebSocketClientHeadersXML } from "./types"

export const importWebSocketClientHeadersFromXML: ImportFromXMLFunction = (
  _context,
  _rule,
  xml: WebSocketClientHeadersXML | undefined
): WebSocketClientHeaders | undefined => {
  if (!xml) return undefined
  if (!xml["xr:Item"]) return []

  const items = Array.isArray(xml["xr:Item"]) ? xml["xr:Item"] : [xml["xr:Item"]]

  return items.map((item) => ({
    Ключ: item["xr:Value"]["v8:Key"]["#text"] ?? "",
    Значение: item["xr:Value"]["v8:Value"]["#text"] ?? "",
  }))
}

export const metadataPropertyRule000 = definePropertyTypeRule("WebSocketClientHeaders", "importFromXML", importWebSocketClientHeadersFromXML)

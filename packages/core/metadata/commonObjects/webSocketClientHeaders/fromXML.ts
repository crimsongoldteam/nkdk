import { registerTypeRule } from "~/metadata/orchestration/property/typeRuleRegistry"
import type { ImportFromXMLFunction } from "~/metadata/orchestration/property/fn"
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
    key: item["xr:Value"]["v8:Key"]["#text"] ?? "",
    value: item["xr:Value"]["v8:Value"]["#text"] ?? "",
  }))
}

registerTypeRule("WebSocketClientHeaders", "importFromXML", importWebSocketClientHeadersFromXML)

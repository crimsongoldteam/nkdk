import { registerTypeRule } from "~/metadata/orchestration/property/typeRuleRegistry"
import type { importFromYAMLFunction } from "~/metadata/orchestration/property/fn"
import type { WebSocketClientHeaders, WebSocketClientHeadersYAML } from "./types"

export const importWebSocketClientHeadersFromYAML: importFromYAMLFunction = (
  _context,
  _rule,
  value: WebSocketClientHeadersYAML | undefined
): WebSocketClientHeaders | undefined => {
  if (value === undefined) return undefined
  return value.map((item) => ({ key: item.Ключ, value: item.Значение }))
}

registerTypeRule("WebSocketClientHeaders", "importFromYAML", importWebSocketClientHeadersFromYAML)

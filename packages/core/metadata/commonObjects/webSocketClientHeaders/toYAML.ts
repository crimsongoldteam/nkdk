import { registerTypeRule } from "../../orchestration/property/typeRuleRegistry"
import type { ExportToYAMLFunction } from "../../orchestration/property/fn"
import type { WebSocketClientHeaders, WebSocketClientHeadersYAML } from "./types"

export const exportWebSocketClientHeadersToYAML: ExportToYAMLFunction = (
  _context,
  _rule,
  value: WebSocketClientHeaders | undefined
): WebSocketClientHeadersYAML | undefined => {
  if (value === undefined) return undefined
  return value.map((item) => ({ Ключ: item.Ключ, Значение: item.Значение }))
}

registerTypeRule("WebSocketClientHeaders", "exportToYAML", exportWebSocketClientHeadersToYAML)

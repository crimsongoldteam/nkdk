import { registerTypeRule } from "../../ruleRuntime/property/typeRuleRegistry"
import type { ExportToYAMLFunction } from "../../ruleRuntime/property/fn"
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

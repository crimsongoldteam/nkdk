import { definePropertyTypeRule } from "../../ruleRuntime/property/typeRuleRegistry"
import type { importFromYAMLFunction } from "../../ruleRuntime/property/fn"
import type { WebSocketClientHeaders, WebSocketClientHeadersYAML } from "./types"

export const importWebSocketClientHeadersFromYAML: importFromYAMLFunction = (
  _context,
  _rule,
  value: WebSocketClientHeadersYAML | undefined
): WebSocketClientHeaders | undefined => {
  if (value === undefined) return undefined
  return value.map((item) => ({ Ключ: item.Ключ, Значение: item.Значение }))
}

export const metadataPropertyRule000 = definePropertyTypeRule("WebSocketClientHeaders", "importFromYAML", importWebSocketClientHeadersFromYAML)

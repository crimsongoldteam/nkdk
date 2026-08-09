import { TSchema } from "typebox"
import { registerTypeRule } from "../../ruleRuntime/property/typeRuleRegistry"
import { ExportToJSONSchemaFn } from "../../ruleRuntime/property/fn"
import { WebSocketClientHeadersJSONSchema } from "./types"

export const exportWebSocketClientHeadersToJSONSchema: ExportToJSONSchemaFn = (): TSchema =>
  WebSocketClientHeadersJSONSchema

registerTypeRule("WebSocketClientHeaders", "exportToJSONSchema", exportWebSocketClientHeadersToJSONSchema)

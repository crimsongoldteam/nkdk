import { TSchema } from "typebox"
import { registerTypeRule } from "../../orchestration/property/typeRuleRegistry"
import { ExportToJSONSchemaFn } from "../../orchestration/property/fn"
import { WebSocketClientHeadersJSONSchema } from "./types"

export const exportWebSocketClientHeadersToJSONSchema: ExportToJSONSchemaFn = (): TSchema =>
  WebSocketClientHeadersJSONSchema

registerTypeRule("WebSocketClientHeaders", "exportToJSONSchema", exportWebSocketClientHeadersToJSONSchema)

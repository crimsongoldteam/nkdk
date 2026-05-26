import { TSchema } from "@sinclair/typebox"
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import { ExportToJSONSchemaFn } from "~/metadata/orchestration/property/fn"
import { WebSocketClientHeadersJSONSchema } from "./types"

export const exportWebSocketClientHeadersToJSONSchema: ExportToJSONSchemaFn = (): TSchema =>
  WebSocketClientHeadersJSONSchema

registerTypeRule("WebSocketClientHeaders", "exportToJSONSchema", exportWebSocketClientHeadersToJSONSchema)

import { TSchema } from "typebox"
import { definePropertyTypeRule } from "../../ruleRuntime/property/typeRuleRegistry"
import { ExportToJSONSchemaFn } from "@nkdk/runtime/rule-kit"
import { WebSocketClientHeadersJSONSchema } from "./types"

export const exportWebSocketClientHeadersToJSONSchema: ExportToJSONSchemaFn = (): TSchema =>
  WebSocketClientHeadersJSONSchema

export const metadataPropertyRule000 = definePropertyTypeRule("WebSocketClientHeaders", "exportToJSONSchema", exportWebSocketClientHeadersToJSONSchema)

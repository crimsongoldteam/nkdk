import {
  definePropertyRule as defineWidePropertyRule,
  type ExactRuleParams as WideExactRuleParams,
} from "~/metadata/commonObjects/ruleBuilder"
import type { PropertyRule as WidePropertyRuleBase } from "~/metadata/orchestration/property/types"
import { Type } from "@sinclair/typebox"
import type { Static } from "@sinclair/typebox"

export const WebSocketClientHeadersJSONSchema = Type.Array(
  Type.Object(
    {
      Ключ: Type.String(),
      Значение: Type.String(),
    },
    { additionalProperties: false }
  )
)

export type WebSocketClientHeaders = Static<typeof WebSocketClientHeadersJSONSchema>
export interface WebSocketClientHeaderYAML {
  Ключ: string
  Значение: string
}

export type WebSocketClientHeadersYAML = WebSocketClientHeaderYAML[]

export interface WebSocketClientHeaderXMLString {
  "_xsi:type": "xs:string"
  "#text"?: string
}

export interface WebSocketClientHeaderXMLItem {
  "xr:Presentation"?: ""
  "xr:CheckState": 0
  "xr:Value": {
    "_xsi:type": "v8:KeyAndValue"
    "v8:Key": WebSocketClientHeaderXMLString
    "v8:Value": WebSocketClientHeaderXMLString
  }
}

export interface WebSocketClientHeadersXML {
  "_xsi:type": "xr:ValueList"
  "xr:Item"?: WebSocketClientHeaderXMLItem | WebSocketClientHeaderXMLItem[]
}

export interface WebSocketClientHeadersWidePropertyRule extends WidePropertyRuleBase {
  type: "WebSocketClientHeaders"
}

export type WebSocketClientHeadersRuleParams = Omit<WebSocketClientHeadersWidePropertyRule, "type">

export function webSocketClientHeadersRule<const Params extends WebSocketClientHeadersRuleParams>(
  params: WideExactRuleParams<WebSocketClientHeadersRuleParams, Params>
): Readonly<{ type: "WebSocketClientHeaders" } & Params> {
  return defineWidePropertyRule("WebSocketClientHeaders", params)
}

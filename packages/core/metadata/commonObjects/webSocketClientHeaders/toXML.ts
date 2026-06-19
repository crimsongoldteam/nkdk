import { registerTypeRule } from "~/metadata/orchestration/property/typeRuleRegistry"
import type { ExportToXMLFunction } from "~/metadata/orchestration/property/fn"
import type { WebSocketClientHeaders, WebSocketClientHeadersXML } from "./types"

export const exportWebSocketClientHeadersToXML: ExportToXMLFunction = (
  context,
  _rule,
  value: WebSocketClientHeaders | undefined
): WebSocketClientHeadersXML | undefined => {
  if (!value) return undefined

  return {
    "_xsi:type": "xr:ValueList",
    ...(value.length > 0
      ? {
          "xr:Item": value.map((item) => ({
            ...(context.exportToXML ? { "xr:Presentation": "" } : undefined),
            "xr:CheckState": 0,
            "xr:Value": {
              "_xsi:type": "v8:KeyAndValue",
              "v8:Key": { "_xsi:type": "xs:string", "#text": item.Ключ },
              "v8:Value": { "_xsi:type": "xs:string", "#text": item.Значение },
            },
          })),
        }
      : undefined),
  }
}

registerTypeRule("WebSocketClientHeaders", "exportToXML", exportWebSocketClientHeadersToXML)

import { describe, expect, it } from "vitest"
import { mockContextFromXML, mockRule } from "~/tests/mockContext"
import { importWebSocketClientHeadersFromXML } from "./fromXML"
import type { WebSocketClientHeadersXML } from "./types"

describe("importWebSocketClientHeadersFromXML", () => {
  it("imports empty ValueList as empty array", () => {
    const xml: WebSocketClientHeadersXML = {
      "_xsi:type": "xr:ValueList",
    }

    const result = importWebSocketClientHeadersFromXML(mockContextFromXML(), mockRule, xml)

    expect(result).toEqual([])
  })

  it("preserves duplicate header keys", () => {
    const xml: WebSocketClientHeadersXML = {
      "_xsi:type": "xr:ValueList",
      "xr:Item": [
        {
          "xr:Presentation": "",
          "xr:CheckState": 0,
          "xr:Value": {
            "_xsi:type": "v8:KeyAndValue",
            "v8:Key": { "_xsi:type": "xs:string", "#text": "Authorization" },
            "v8:Value": { "_xsi:type": "xs:string", "#text": "first" },
          },
        },
        {
          "xr:Presentation": "",
          "xr:CheckState": 0,
          "xr:Value": {
            "_xsi:type": "v8:KeyAndValue",
            "v8:Key": { "_xsi:type": "xs:string", "#text": "Authorization" },
            "v8:Value": { "_xsi:type": "xs:string", "#text": "second" },
          },
        },
      ],
    }

    const result = importWebSocketClientHeadersFromXML(mockContextFromXML(), mockRule, xml)

    expect(result).toEqual([
      { Ключ: "Authorization", Значение: "first" },
      { Ключ: "Authorization", Значение: "second" },
    ])
  })
})
